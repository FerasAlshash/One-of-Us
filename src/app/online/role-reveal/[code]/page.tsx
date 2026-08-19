'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Eye, Lock, KeyRound, ArrowLeft, Check } from 'lucide-react';
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
      roomChannel = supabase.channel(`reveal-${roomData.id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'players'
        }, async () => {
          if (!mounted) return;
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
    <div className="flex flex-col flex-1 h-full min-h-0 relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-4 sm:pt-6 pb-2 px-6 gap-0.5 safe-top">
        <span className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-bold">دورك في اللعبة</span>
        <p className="text-base sm:text-lg font-black text-white">{myPlayer?.name ?? '...'}</p>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-5 sm:px-6 gap-3 sm:gap-4 pb-4 sm:pb-6 safe-bottom">
        <div className="glass-card rounded-[28px] w-full px-6 py-6 sm:py-8 flex flex-col items-center gap-4 relative overflow-hidden border border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.5)]">

          {!revealed ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-white mb-1">الشاشة مخفية</p>
                <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed max-w-[220px]">تأكد أن أحداً لا ينظر، ثم اضغط لكشف دورك</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center w-full">
              {isSpy ? (
                <>
                  <div className="float relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-rose-500/30 shadow-[0_10px_28px_rgba(0,0,0,0.6)]">
                    <Image src="/gharib-logo-v2.png" alt="الغريب" fill sizes="112px" className="object-cover rounded-full" priority />
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-rose-300 font-bold">تحذير سري</span>
                    <p className="text-2xl sm:text-3xl font-black text-white">أنت الغريب</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-xs text-center">
                    استمع للنقاش بذكاء، وخمن الكلمة دون أن تُكشف
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">الكلمة السرية</span>
                    <p className="text-2xl sm:text-3xl font-black text-white">{room?.word}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-xs">
                    تحدث بذكاء مع اللاعبين لمساعدتهم في كشف الغريب
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
            className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform"
          >
            <Eye className="w-4 h-4" />
            <span>اكشف دورك الآن</span>
          </button>
        ) : !ready ? (
          <button
            onClick={handleReady}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 text-white font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>أنا جاهز</span>
            <Check className="w-4 h-4 mr-1" />
          </button>
        ) : isHost ? (
          /* Host sees the start button — active only when ALL players are ready */
          <div className="w-full flex flex-col gap-2">
            <div className="glass-card rounded-xl px-4 py-1.5 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">اللاعبون الجاهزون</span>
              <span className={`tabular-nums ${allReady ? 'text-emerald-400' : 'text-violet-300'}`}>
                {readyCount} / {totalPlayers}
              </span>
            </div>
            <button
              onClick={handleStartTimer}
              disabled={!allReady}
              className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{allReady ? 'بدء وقت النقاش' : 'في انتظار بقية اللاعبين...'}</span>
              {allReady && <ArrowLeft className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          /* Non-host players just see a waiting indicator */
          <div className="glass-card rounded-2xl py-3 px-5 text-center space-y-0.5">
            <p className="text-slate-400 text-xs font-medium">في انتظار المستضيف لبدء النقاش...</p>
            <p className="text-violet-300 text-xs font-bold">
              ({readyCount} / {totalPlayers}) جاهزون
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
