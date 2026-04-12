'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';

type Player = { id: string; name: string; device_id: string; voted_for: string | null };
type Room = { id: string; status: string; settings: { spiesCount: number } };

export default function OnlineVotePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deviceId] = useState(() => getDeviceId());
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const init = async () => {
      const { data: roomData } = await supabase
        .from('rooms').select('*').eq('code', code.toUpperCase()).single();
      if (!roomData) { router.push('/'); return; }
      setRoom(roomData);

      const { data: playersData } = await supabase
        .from('players').select('id, name, device_id, voted_for').eq('room_id', roomData.id);
      const pList = playersData ?? [];
      setPlayers(pList);

      const me = pList.find(p => p.device_id === deviceId);
      setMyPlayer(me ?? null);
      if (me?.voted_for) { setHasVoted(true); setSelected(me.voted_for); }

      // Tally votes
      const tally: Record<string, number> = {};
      pList.forEach(p => { if (p.voted_for) tally[p.voted_for] = (tally[p.voted_for] ?? 0) + 1; });
      setVoteCounts(tally);
    };
    init();
  }, [code, deviceId, router]);

  // Subscribe to player changes (votes coming in) and room status changes
  useEffect(() => {
    if (!room?.id) return;
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;
    const roomId = room.id;

    // Realtime subscription (grouped)
    const channel = supabase.channel(`vote-${roomId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'players'
      }, async () => {
        if (!mounted) return;
        const { data } = await supabase
          .from('players').select('id, name, device_id, voted_for').eq('room_id', roomId);
        const pList = data ?? [];
        if (mounted) {
          setPlayers(pList);
          const tally: Record<string, number> = {};
          pList.forEach(p => { if (p.voted_for) tally[p.voted_for] = (tally[p.voted_for] ?? 0) + 1; });
          setVoteCounts(tally);

          const voted = pList.filter(p => p.voted_for).length;
          if (voted >= pList.length && pList.length > 0) {
            await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId);
            router.push(`/online/results/${code}`);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}`
      }, (payload) => {
        if (!mounted) return;
        const updated = payload.new as Room;
        setRoom(updated);
        if (updated.status === 'finished') {
          router.push(`/online/results/${code}`);
        }
      })
      .subscribe();

    // Reliable polling fallback
    pollInterval = setInterval(async () => {
      if (!mounted) return;
      
      const { data: latestRoom } = await supabase
        .from('rooms').select('*').eq('id', roomId).single();
      
      if (latestRoom) {
        setRoom(latestRoom);
        if (latestRoom.status === 'finished') {
          router.push(`/online/results/${code}`);
          return;
        }
      }

      const { data } = await supabase
        .from('players').select('id, name, device_id, voted_for').eq('room_id', roomId);
        
      if (data && mounted) {
        const tally: Record<string, number> = {};
        data.forEach(p => { if (p.voted_for) tally[p.voted_for] = (tally[p.voted_for] ?? 0) + 1; });
        setPlayers(data);
        setVoteCounts(tally);

        const voted = data.filter(p => p.voted_for).length;
        if (voted >= data.length && data.length > 0) {
          await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId);
          router.push(`/online/results/${code}`);
        }
      }
    }, 2500);

    return () => { 
      mounted = false;
      supabase.removeChannel(channel); 
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [room?.id, code, router]);

  const handleVote = async () => {
    if (!selected || !myPlayer || !room || hasVoted) return;
    setHasVoted(true);

    await supabase.from('players')
      .update({ voted_for: selected })
      .eq('id', myPlayer.id);
  };

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blob-purple opacity-30" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-rose opacity-20" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-3 pt-14 pb-6 text-center px-6">
        <div className="float text-5xl">🗳️</div>
        <h1 className="text-3xl font-black text-white">التصويت</h1>
        <p className="text-slate-400 text-sm">
          {hasVoted ? 'تم تسجيل صوتك — في انتظار الآخرين' : 'من تعتقد أنه الغريب؟'}
        </p>
      </div>

      {/* Players to vote on */}
      <div className="relative z-10 flex-1 flex flex-col px-6 gap-2 overflow-y-auto pb-4">
        {players.map(p => {
          const count = voteCounts[p.id] ?? 0;
          const pct = players.length > 0 ? (count / players.length) * 100 : 0;
          const isMe = p.device_id === deviceId;
          const isSelected = selected === p.id;

          return (
            <button
              key={p.id}
              onClick={() => { if (!hasVoted && !isMe) setSelected(p.id); }}
              disabled={hasVoted || isMe}
              className={`glass rounded-[20px] px-4 py-4 flex items-center gap-3 transition-all relative overflow-hidden text-right active:scale-[0.98]
                ${isSelected && !hasVoted ? 'border border-accent/50 bg-accent/8' : ''}
                ${hasVoted && selected === p.id ? 'border border-accent/30 bg-accent/5' : ''}
                ${isMe ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/4'}
              `}
            >
              {/* Vote bar background */}
              {hasVoted && count > 0 && (
                <div
                  className="absolute inset-0 bg-primary/10 rounded-[20px] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="relative flex-1 text-right">
                <p className="text-white font-bold">{p.name}</p>
                {isMe && <p className="text-slate-600 text-xs">أنت</p>}
              </div>
              {hasVoted && count > 0 && (
                <span className="relative text-primary-light font-black text-sm">{count} 🗳️</span>
              )}
              {!hasVoted && !isMe && (
                <div className={`relative w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${isSelected ? 'border-accent bg-accent' : 'border-white/20'}`}>
                  {isSelected && <div className="absolute inset-1 rounded-full bg-white" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Vote count summary */}
      {hasVoted && (
        <div className="relative z-10 px-6 py-2">
          <p className="text-center text-slate-500 text-xs">
            {totalVotes} / {players.length} صوّتوا
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="relative z-10 px-6 pb-10 pt-2">
        {!hasVoted ? (
          <button
            onClick={handleVote}
            disabled={!selected}
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-accent to-accent-hover text-white font-black text-xl glow-accent active:scale-[0.97] transition-transform disabled:opacity-40"
          >
            سجّل صوتي 🗳️
          </button>
        ) : (
          <div className="glass rounded-[24px] py-4 px-6 text-center">
            <p className="text-slate-400 text-sm">✅ صوتك سُجِّل — انتظر نتيجة التصويت</p>
          </div>
        )}
      </div>

    </div>
  );
}
