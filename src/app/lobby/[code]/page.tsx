'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';
import { CATEGORIES } from '@/data/words';

type Player = { id: string; name: string; device_id: string; role: string | null };
type Room = {
  id: string; code: string; host_id: string; status: string;
  settings: { playersCount: number; spiesCount: number; timerMinutes: number; category: string };
  word: string;
};

function assignRoles(players: Player[], spiesCount: number): Record<string, 'spy' | 'innocent'> {
  const ids = players.map(p => p.id);
  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const result: Record<string, 'spy' | 'innocent'> = {};
  ids.forEach((id, i) => { result[id] = i < spiesCount ? 'spy' : 'innocent'; });
  return result;
}

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deviceId] = useState(() => getDeviceId());
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [playerToKick, setPlayerToKick] = useState<Player | null>(null);
  const [isKicked, setIsKicked] = useState(false);

  const isHost = room?.host_id === deviceId;
  const expectedPlayers = room?.settings.playersCount ?? 0;
  const canStart = players.length >= 2 && players.length <= expectedPlayers;

  // Load room and subscribe to changes
  useEffect(() => {
    let mounted = true;
    let roomChannel: ReturnType<typeof supabase.channel> | null = null;
    let playerChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      // Fetch room
      const { data: roomData } = await supabase
        .from('rooms').select('*').eq('code', code.toUpperCase()).single();
      if (!mounted || !roomData) { if (!roomData) router.push('/'); return; }
      setRoom(roomData);

      // If game already started, redirect
      if (roomData.status !== 'waiting') {
        router.push(`/online/role-reveal/${code}`);
        return;
      }

      // Fetch players
      const { data: playersData } = await supabase
        .from('players').select('id, name, device_id, role').eq('room_id', roomData.id);
      if (mounted) setPlayers(playersData ?? []);

      // Only subscribe if still mounted
      if (!mounted) return;

      // Subscribe to players changes — create channel, add listener, THEN subscribe
      playerChannel = supabase.channel(`lobby-players-${roomData.id}`);
      playerChannel
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'players'
        }, async () => {
          if (!mounted) return;
          const { data } = await supabase
            .from('players').select('id, name, device_id, role').eq('room_id', roomData.id);
          
          if (mounted) {
            const currentPlayers = data ?? [];
            setPlayers(currentPlayers);
            // Kick detection
            if (currentPlayers.length > 0 && !currentPlayers.some(p => p.device_id === deviceId)) {
              setIsKicked(true);
            }
          }
        })
        .subscribe();

      // Subscribe to room status changes
      roomChannel = supabase.channel(`lobby-room-${roomData.id}`);
      roomChannel
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomData.id}`,
        }, (payload) => {
          if (!mounted) return;
          const updated = payload.new as Room;
          setRoom(updated);
          if (updated.status === 'revealing') {
            router.push(`/online/role-reveal/${code}`);
          }
        })
        .subscribe();
    };

    init();
    return () => {
      mounted = false;
      if (playerChannel) supabase.removeChannel(playerChannel);
      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [code, deviceId, router]);

  const handleStart = useCallback(async () => {
    if (!room) return;
    setStarting(true);
    setError('');

    const roleMap = assignRoles(players, room.settings.spiesCount);

    // Update each player's role
    await Promise.all(
      players.map(p =>
        supabase.from('players').update({ role: roleMap[p.id] }).eq('id', p.id)
      )
    );

    // Start game — update room status to 'revealing'
    const { error: startErr } = await supabase
      .from('rooms')
      .update({ status: 'revealing' })
      .eq('id', room.id);

    if (startErr) {
      setError('حدث خطأ أثناء بدء اللعبة');
      setStarting(false);
    }
  }, [room, players]);

  if (!room) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-slate-500 text-sm">جاري التحميل...</p>
      </div>
    );
  }

  const currentCat = CATEGORIES[room.settings.category];

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-12 pb-3 px-6 gap-1 text-center">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">كود الانضمام للغرفة</span>
        <div className="flex gap-1.5 mt-1.5" dir="ltr">
          {room.code.split('').map((char, i) => (
            <span key={i} className="w-10 h-12 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-lg font-black text-white shadow-inner">
              {char}
            </span>
          ))}
        </div>
        <button
          onClick={async () => {
             const url = `${window.location.origin}/join?code=${room.code}`;
             if (navigator.share) {
               try { await navigator.share({ title: 'مين الغريب؟', text: `انضم للغرفة للعب "مين الغريب؟"! الكود: ${room.code}`, url }); } catch {}
             } else {
               await navigator.clipboard.writeText(url);
               alert('تم نسخ رابط الدعوة!');
             }
          }}
          className="mt-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          مشاركة الرابط
        </button>
      </div>

      {/* Settings summary */}
      <div className="relative z-10 px-5 mb-3">
        <div className="glass-card rounded-[18px] px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>{room.settings.playersCount} لاعب</span>
          <span className="text-slate-600">·</span>
          <span>{room.settings.spiesCount} غريب</span>
          <span className="text-slate-600">·</span>
          <span>{room.settings.timerMinutes} د</span>
          <span className="text-slate-600">·</span>
          <span className="text-violet-300 font-bold">{currentCat?.name}</span>
        </div>
      </div>

      {/* Players list */}
      <div className="relative z-10 flex-1 flex flex-col px-5 gap-2.5 overflow-y-auto pb-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-slate-400 text-xs font-bold">اللاعبون في الغرفة</p>
          <span className="text-[11px] text-slate-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full font-bold">
            {players.length} / {expectedPlayers}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {players.map((p, i) => (
            <div key={p.id}
              className={`glass-card rounded-[16px] px-3.5 py-2.5 flex items-center gap-3 ${p.device_id === deviceId ? 'border-violet-500/30 bg-violet-500/5' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs font-bold text-slate-300">
                {i + 1}
              </div>
              <p className="text-white font-bold text-sm flex-1">{p.name}</p>
              {p.device_id === room.host_id && (
                <span className="text-[10px] bg-violet-500/15 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded-md font-bold">المستضيف</span>
              )}
              {p.device_id === deviceId && p.device_id !== room.host_id && (
                <span className="text-[10px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded-md">أنت</span>
              )}
              {isHost && p.device_id !== room.host_id && (
                <button
                  onClick={() => setPlayerToKick(p)}
                  className="w-7 h-7 flex-shrink-0 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center active:scale-95 transition-all text-xs"
                  title="استبعاد اللاعب"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, expectedPlayers - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-[16px] px-3.5 py-2.5 flex items-center gap-3 opacity-35 border border-dashed border-white/10">
              <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-xs text-slate-500">
                {players.length + i + 1}
              </div>
              <p className="text-slate-500 text-xs">بانتظار انضمام لاعب...</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-center text-rose-300 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">{error}</p>
        )}
      </div>

      {/* CTA — host only */}
      <div className="relative z-10 px-5 pb-8 pt-3">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || !canStart}
            className="btn-primary shimmer w-full py-4 rounded-2xl text-white font-bold text-base transition-transform disabled:opacity-40"
          >
            {starting ? 'جاري بدء اللعبة...' : 'ابدأ اللعبة وتوزيع الأدوار'}
          </button>
        ) : (
          <div className="glass-card rounded-2xl py-3.5 px-5 text-center">
            <p className="text-slate-400 text-xs font-medium">في انتظار المستضيف لبدء اللعبة...</p>
          </div>
        )}
      </div>

      {/* Host Action Modals */}

      {/* 1. Kick Confirmation Modal */}
      {playerToKick && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card flex flex-col items-center gap-2 rounded-[28px] p-6 w-full max-w-[300px] text-center border border-rose-500/20 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-1 text-lg font-bold">
              ✕
            </div>
            <h3 className="text-lg font-black text-white">استبعاد لاعب</h3>
            <p className="text-slate-300 text-xs mt-0.5">
              هل أنت متأكد من رغبتك في استبعاد اللاعب <span className="text-violet-300 font-bold">{playerToKick.name}</span> من الغرفة؟
            </p>
            <div className="flex w-full gap-2.5 mt-5">
              <button
                onClick={() => setPlayerToKick(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] font-bold text-xs text-white active:scale-95 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  const targetId = playerToKick.id;
                  setPlayerToKick(null);
                  setPlayers(prev => prev.filter(p => p.id !== targetId));
                  await supabase.from('players').delete().eq('id', targetId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white active:scale-95 transition-all shadow-md shadow-rose-900/40"
              >
                استبعاد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. You Got Kicked Modal */}
      {isKicked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card border border-rose-500/30 flex flex-col items-center gap-3 rounded-[28px] p-7 w-full max-w-[300px] text-center shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="text-4xl mb-1">🚪</div>
            <h3 className="text-xl font-black text-white">تم استبعادك</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              قام المستضيف بإنهاء مشاركتك لهذه الجولة.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white text-sm active:scale-95 transition-all"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
