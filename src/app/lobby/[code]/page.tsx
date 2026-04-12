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
          event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomData.id}`,
        }, async () => {
          if (!mounted) return;
          const { data } = await supabase
            .from('players').select('id, name, device_id, role').eq('room_id', roomData.id);
          if (mounted) setPlayers(data ?? []);
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
  }, [code, router]);

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

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-purple opacity-30" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-14 pb-4 px-6 gap-1 text-center">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">كود الغرفة</p>
        <div className="flex gap-1.5 mt-1" dir="ltr">
          {room.code.split('').map((char, i) => (
            <span key={i} className="w-11 h-12 rounded-[14px] glass border border-white/10 flex items-center justify-center text-xl font-black text-primary-light">
              {char}
            </span>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-1">شارك الكود مع أصدقائك</p>
      </div>

      {/* Settings summary */}
      <div className="relative z-10 px-6 mb-3">
        <div className="glass rounded-[20px] px-5 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>👥 {room.settings.playersCount} لاعب</span>
          <span>·</span>
          <span>🕵️ {room.settings.spiesCount} غريب</span>
          <span>·</span>
          <span>⏱ {room.settings.timerMinutes} دقيقة</span>
          <span>·</span>
          <span>{currentCat?.emoji} {currentCat?.name}</span>
        </div>
      </div>

      {/* Players list */}
      <div className="relative z-10 flex-1 flex flex-col px-6 gap-3 overflow-y-auto pb-4">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-sm">اللاعبون المنضمون</p>
          <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">
            {players.length} / {expectedPlayers}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {players.map((p, i) => (
            <div key={p.id}
              className={`glass rounded-[18px] px-4 py-3 flex items-center gap-3 ${p.device_id === deviceId ? 'border border-primary/30 bg-primary/5' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-black text-white">
                {i + 1}
              </div>
              <p className="text-white font-bold flex-1">{p.name}</p>
              {p.device_id === room.host_id && (
                <span className="text-[10px] bg-primary/20 border border-primary/30 text-primary-light px-2 py-0.5 rounded-full">مضيف</span>
              )}
              {p.device_id === deviceId && p.device_id !== room.host_id && (
                <span className="text-[10px] text-slate-600">أنت</span>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, expectedPlayers - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="glass rounded-[18px] px-4 py-3 flex items-center gap-3 opacity-30 border border-dashed border-white/10">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-sm text-slate-600">
                {players.length + i + 1}
              </div>
              <p className="text-slate-600 text-sm">بانتظار اللاعب...</p>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm bg-red-500/10 rounded-2xl px-4 py-3">{error}</p>
        )}
      </div>

      {/* CTA — host only */}
      <div className="relative z-10 px-6 pb-10 pt-4">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || !canStart}
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-xl glow-primary active:scale-[0.97] transition-transform disabled:opacity-40"
          >
            {starting ? 'جاري البدء...' : `ابدأ اللعبة 🎮`}
          </button>
        ) : (
          <div className="glass rounded-[24px] py-4 px-6 text-center">
            <p className="text-slate-400 text-sm">⏳ في انتظار المضيف ليبدأ اللعبة</p>
          </div>
        )}
      </div>

    </div>
  );
}
