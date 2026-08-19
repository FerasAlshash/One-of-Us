'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';
import { Vote, Check } from 'lucide-react';

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

      const { data: playersData } = await supabase
        .from('players').select('id, name, device_id, voted_for').eq('room_id', roomId);
      
      if (playersData) {
        setPlayers(playersData);
        const tally: Record<string, number> = {};
        playersData.forEach(p => { if (p.voted_for) tally[p.voted_for] = (tally[p.voted_for] ?? 0) + 1; });
        setVoteCounts(tally);

        const voted = playersData.filter(p => p.voted_for).length;
        if (voted >= playersData.length && playersData.length > 0) {
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
  }, [room, code, router]);

  const handleVote = async () => {
    if (!selected || !myPlayer || hasVoted) return;
    setHasVoted(true);

    await supabase.from('players')
      .update({ voted_for: selected })
      .eq('id', myPlayer.id);
  };

  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-2 pt-12 pb-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-300 shadow-inner">
          <Vote className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black text-white">التصويت المباشر</h1>
        <p className="text-slate-400 text-xs">
          {hasVoted ? 'تم تسجيل صوتك بنجاح — بانتظار بقية اللاعبين' : 'اختر اللاعب الذي تشك أنه الغريب'}
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
              className={`glass-card rounded-[20px] px-4 py-3 flex items-center gap-3 transition-all relative overflow-hidden text-right active:scale-[0.98]
                ${isSelected && !hasVoted ? 'border-violet-500/50 bg-violet-500/10' : ''}
                ${hasVoted && selected === p.id ? 'border-violet-500/30 bg-violet-500/5' : ''}
                ${isMe ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/[0.04]'}
              `}
            >
              {/* Vote bar background */}
              {hasVoted && count > 0 && (
                <div
                  className="absolute inset-0 bg-violet-500/15 rounded-[20px] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {p.name[0]}
              </div>
              <div className="relative flex-1 text-right">
                <p className="text-white font-bold text-sm">{p.name}</p>
                {isMe && <p className="text-slate-500 text-[10px]">أنت</p>}
              </div>
              {hasVoted && count > 0 && (
                <span className="relative text-violet-300 font-black text-xs tabular-nums">{count} صوت</span>
              )}
              {!hasVoted && !isMe && (
                <div className={`relative w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${isSelected ? 'border-violet-500 bg-violet-500' : 'border-white/20'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Vote count summary */}
      {hasVoted && (
        <div className="relative z-10 px-6 py-1">
          <p className="text-center text-slate-400 text-xs">
            {totalVotes} من {players.length} صوّتوا
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="relative z-10 px-6 pb-8 pt-2">
        {!hasVoted ? (
          <button
            onClick={handleVote}
            disabled={!selected}
            className="btn-primary shimmer w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform disabled:opacity-40"
          >
            <span>تأكيد صوتي</span>
            <Check className="w-4 h-4" />
          </button>
        ) : (
          <div className="glass-card rounded-2xl py-3.5 px-6 text-center">
            <p className="text-slate-300 text-xs font-medium">صوتك مسجّل — جاري احتساب الأصوات فور اكتمالها</p>
          </div>
        )}
      </div>

    </div>
  );
}
