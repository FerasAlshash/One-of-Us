'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';

type Player = { id: string; name: string; device_id: string; role: string | null; is_ready: boolean };
type Room = {
  id: string; code: string; host_id: string; status: string;
  settings: { spiesCount: number; timerMinutes: number; playersCount: number };
  word: string;
};

export default function OnlineRoleRevealPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deviceId] = useState(() => getDeviceId());

  useEffect(() => {
    let mounted = true;
    let playerChannel: ReturnType<typeof supabase.channel> | null = null;
    let roomChannel: ReturnType<typeof supabase.channel> | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const init = async () => {
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms').select('*').eq('code', code.toUpperCase()).single();

      if (!mounted) return;

      // Only redirect home if there was a real error finding the room
      if (roomErr || !roomData) {
        console.error('Room not found:', roomErr);
        router.push('/');
        return;
      }

      setRoom(roomData);

      // If game already moved past revealing, redirect accordingly
      if (roomData.status === 'playing') {
        router.push(`/online/timer/${code}`);
        return;
      }
      if (roomData.status === 'voting') {
        router.push(`/online/vote/${code}`);
        return;
      }
      if (roomData.status === 'waiting') {
        router.push(`/lobby/${code}`);
        return;
      }

      const { data: playersData } = await supabase
        .from('players').select('*').eq('room_id', roomData.id);

      if (!mounted) return;
      const allPlayers = playersData ?? [];
      setPlayers(allPlayers);
      setMyPlayer(allPlayers.find(p => p.device_id === deviceId) || null);
      setLoading(false);

      // Realtime subscription (grouped)
      const channel = supabase.channel(`reveal-${roomData.id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'players'
        }, async (payload) => {
          if (!mounted) return;
          // We removed the room_id filter because of REPLICA IDENTITY limitations.
          // Just re-fetch players for this room on ANY player change.
          const { data } = await supabase.from('players').select('*').eq('room_id', roomData.id);
          if (mounted) setPlayers(data ?? []);
        })
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomData.id}`
        }, (payload) => {
          if (!mounted) return;
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === 'playing') {
            router.push(`/online/timer/${code}`);
          }
        })
        .subscribe();

      // Reliable polling fallback (every 2.5 seconds)
      pollInterval = setInterval(async () => {
        if (!mounted) return;
        
        // Check room status
        const { data: latestRoom } = await supabase
          .from('rooms').select('*').eq('id', roomData.id).single();
        
        if (latestRoom) {
          setRoom(latestRoom);
          if (latestRoom.status === 'playing') {
            router.push(`/online/timer/${code}`);
            return; // STOP execution
          }
        }

        // Check players
        const { data: latestPlayers } = await supabase
          .from('players').select('*').eq('room_id', roomData.id);
          
        if (latestPlayers && mounted) {
          setPlayers(latestPlayers);
        }
      }, 2500);

      roomChannel = channel; // Using roomChannel variable to store the single grouped channel
    };

    init();

    return () => {
      mounted = false;
      if (roomChannel) supabase.removeChannel(roomChannel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [code, deviceId, router]);

  // Effect to handle game start when everyone is ready (HOST only, via explicit button)
  const readyCount = players.filter(p => p.is_ready).length;
  const totalPlayers = players.length; // Use actual player count, not settings (more reliable)
  const allReady = totalPlayers > 0 && readyCount >= totalPlayers;
  const isHost = room?.host_id === deviceId;

  const handleStartTimer = async () => {
    if (!room || !allReady) return;
    const timerEndsAt = new Date(Date.now() + room.settings.timerMinutes * 60 * 1000).toISOString();
    await supabase.from('rooms')
      .update({ status: 'playing', timer_ends_at: timerEndsAt })
      .eq('id', room.id);
    // Redirect will be triggered by the room subscription for all players
  };

  const handleReady = async () => {
    if (!room || !myPlayer) return;
    setReady(true);

    // Mark current player as ready in DB
    await supabase.from('players')
      .update({ is_ready: true })
      .eq('id', myPlayer.id);

    // Redirect will be handled by the room status subscription
  };

  const isSpy = myPlayer?.role === 'spy';

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-slate-500 text-sm">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-purple opacity-35" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center py-10 px-8 gap-1">
        <p className="text-[11px] tracking-[0.25em] uppercase text-slate-500">دورك في اللعبة</p>
        <p className="text-base font-bold text-white">{myPlayer?.name ?? '...'}</p>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="glass rounded-[36px] w-full px-8 py-12 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {!revealed ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="pulse-ring w-20 h-20 rounded-full glass flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-slate-400">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-white mb-2">الشاشة مخفية</p>
                <p className="text-slate-500 text-sm leading-relaxed">تأكد أن أحداً لا ينظر، ثم اضغط لكشف دورك</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 text-center w-full">
              {isSpy ? (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl scale-150" />
                    <div className="float relative w-32 h-32 rounded-full overflow-hidden shadow-[0_0_60px_rgba(232,121,249,0.5)] border border-accent/30">
                      <Image src="/gharib-logo.png" alt="الغريب" fill sizes="128px" className="object-cover" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[13px] tracking-[0.3em] uppercase text-slate-500">تحذير سري</p>
                    <p className="text-5xl font-black text-white" style={{ textShadow: '0 0 40px rgba(232,121,249,0.5)' }}>
                      أنت الغريب
                    </p>
                  </div>
                  <div className="glass rounded-2xl px-5 py-3 text-sm text-slate-400 leading-relaxed max-w-xs text-center">
                    استمع للنقاش 👂 اكتسب المعلومات، ولا تكشف نفسك أبداً
                  </div>
                </>
              ) : (
                <>
                  <div className="float text-5xl">🎯</div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">الكلمة السرية</p>
                    <p className="text-4xl font-black text-white">{room?.word}</p>
                  </div>
                  <div className="glass rounded-2xl px-5 py-3 text-sm text-slate-400 leading-relaxed max-w-xs">
                    تحدث بذكاء 🧠 ساعد فريقك في كشف الغريب
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-xl glow-primary active:scale-[0.97] transition-transform"
          >
            اكشف دورك 👁
          </button>
        ) : !ready ? (
          <button
            onClick={handleReady}
            className="w-full py-5 rounded-[24px] glass border border-white/10 text-white font-bold text-lg active:scale-[0.97] transition-transform hover:bg-white/6"
          >
            جاهز ✅
          </button>
        ) : isHost ? (
          /* Host sees the start button — active only when ALL players are ready */
          <div className="w-full flex flex-col gap-3">
            <div className="glass rounded-2xl px-4 py-2 flex items-center justify-between text-sm">
              <span className="text-slate-400">اللاعبون الجاهزون</span>
              <span className={`font-black tabular-nums ${allReady ? 'text-green-400' : 'text-primary-light'}`}>
                {readyCount} / {totalPlayers}
              </span>
            </div>
            <button
              onClick={handleStartTimer}
              disabled={!allReady}
              className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-xl glow-primary active:scale-[0.97] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {allReady ? 'بدء التحقيق 🕵️' : '⏳ انتظار بقية اللاعبين...'}
            </button>
          </div>
        ) : (
          /* Non-host players just see a waiting indicator */
          <div className="glass rounded-[24px] py-4 px-6 text-center space-y-2">
            <p className="text-slate-400 text-sm italic">⏳ في انتظار المضيف ليبدأ...</p>
            <p className="text-primary-light text-xs font-bold">
              ({readyCount} / {totalPlayers}) جاهزون
            </p>
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
