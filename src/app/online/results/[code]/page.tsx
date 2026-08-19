'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { RotateCcw, PlusCircle, Home, KeyRound } from 'lucide-react';
import { getDeviceId } from '@/lib/device-id';
import { CATEGORIES } from '@/data/words';
import { supabase } from '@/lib/supabase';

type Player = { id: string; name: string; role: string | null; voted_for: string | null };
type Room = {
  id: string; host_id: string; word: string; settings: { category: string; timerMinutes: number };
};

const CATEGORY_NAMES: Record<string, string> = {
  places: 'أماكن', artists: 'فنانين', jobs: 'مهن', food: 'طعام',
};

export default function OnlineResultsPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [deviceId] = useState(() => getDeviceId());
  const [restarting, setRestarting] = useState(false);

  const isHost = room?.host_id === deviceId;

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      const { data: roomData } = await supabase
        .from('rooms').select('*').eq('code', code.toUpperCase()).single();
      if (!roomData) { router.push('/'); return; }
      setRoom(roomData);

      const { data: playersData } = await supabase
        .from('players').select('id, name, role, voted_for').eq('room_id', roomData.id);
      setPlayers(playersData ?? []);
    };
    init();
  }, [code, router]);

  // Listen for room reset to go back to Lobby
  useEffect(() => {
    if (!room) return;
    let mounted = true;

    // Realtime channel
    const channel = supabase.channel(`results-room-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        if (mounted && payload.new.status === 'waiting') {
          router.push(`/lobby/${code}`);
        }
      }).subscribe();

    // Polling fallback
    const timer = setInterval(async () => {
      if (!mounted) return;
      const { data } = await supabase.from('rooms').select('status').eq('id', room.id).single();
      if (data?.status === 'waiting' && mounted) router.push(`/lobby/${code}`);
    }, 2500);

    return () => { mounted = false; clearInterval(timer); supabase.removeChannel(channel); };
  }, [room, code, router]);

  const handlePlayAgain = async () => {
    if (!room) return;
    setRestarting(true);

    const words = CATEGORIES[room.settings.category]?.words ?? [];
    const newWord = words[Math.floor(Math.random() * words.length)];

    // Reset all players
    await supabase.from('players').update({ role: null, voted_for: null, is_ready: false }).eq('room_id', room.id);

    // Reset room
    await supabase.from('rooms').update({ status: 'waiting', word: newWord, timer_ends_at: null }).eq('id', room.id);
  };

  if (!room) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const spies = players.filter(p => p.role === 'spy');

  // Tally votes to find who was eliminated
  const voteTally: Record<string, number> = {};
  players.forEach(p => { if (p.voted_for) voteTally[p.voted_for] = (voteTally[p.voted_for] ?? 0) + 1; });
  const maxVotes = Math.max(0, ...Object.values(voteTally));
  const eliminated = maxVotes > 0
    ? players.filter(p => (voteTally[p.id] ?? 0) === maxVotes)
    : [];

  const isTie = eliminated.length > 1;
  const teamWon = !isTie && eliminated.some(p => p.role === 'spy');

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative overflow-hidden">

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center pt-4 sm:pt-6 pb-2 px-6 gap-1.5 text-center safe-top">
        <div className="float relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <Image src="/gharib-logo-v2.png" alt="الغريب" fill sizes="96px" className="object-cover rounded-full" priority />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">انكشفت النتيجة</span>
        <h1 className="text-xl sm:text-2xl font-black text-white">
          {teamWon ? 'فوز الفريق' : 'فوز الغريب'}
        </h1>
        <p className="text-slate-400 text-xs">
          {teamWon 
            ? 'تمكن الفريق من كشف الغريب بنجاح!' 
            : isTie 
              ? 'تشتتت الأصوات ولم يتم الوصول لإجماع!' 
              : 'نجح الغريب في التخفي ولم يُكشف'}
        </p>
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex flex-col px-5 sm:px-6 gap-3 pb-4 sm:pb-6 safe-bottom overflow-y-auto">

        {/* Who was eliminated */}
        {eliminated.length > 0 && (
          <div className="glass-card rounded-[22px] px-4 py-3 flex flex-col gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">المشتبه به الأكثر تصويتاً</span>
            {eliminated.map(p => (
              <div key={p.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xs sm:text-sm font-black text-white">
                  {p.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-xs sm:text-sm">{p.name}</p>
                  <p className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 ${p.role === 'spy' ? 'text-violet-300' : 'text-rose-400'}`}>
                    {p.role === 'spy' ? 'هو الغريب — أصاب الفريق!' : 'بريء — أخطأ الفريق!'}
                  </p>
                </div>
                <span className="text-xs text-slate-400 tabular-nums font-semibold">{voteTally[p.id] ?? 0} أصوات</span>
              </div>
            ))}
          </div>
        )}

        {/* The Strangers */}
        <div className="glass-card rounded-[22px] px-4 py-3 flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            {spies.length > 1 ? 'الغرباء في الجولة' : 'الغريب الحقيقي'}
          </span>
          {spies.map(p => (
            <div key={p.id} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-xs sm:text-sm font-black text-rose-300">
                {p.name[0]}
              </div>
              <p className="text-white font-bold text-xs sm:text-sm flex-1">{p.name}</p>
              <span className="text-[9px] sm:text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-bold">غريب</span>
            </div>
          ))}
        </div>

        {/* Word reveal */}
        <div className="glass-card rounded-[22px] py-3.5 px-5 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
            <KeyRound className="w-3.5 h-3.5 text-violet-300" />
            <span>الكلمة السرية</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {room.word}
          </p>
          <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium">{CATEGORY_NAMES[room.settings.category] ?? room.settings.category}</span>
        </div>

        {/* All players votes */}
        <div className="glass-card rounded-[22px] px-4 py-3 flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">توزيع أصوات اللاعبين</span>
          {players
            .sort((a, b) => (voteTally[b.id] ?? 0) - (voteTally[a.id] ?? 0))
            .map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0">
                <span className="text-white font-bold">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 tabular-nums">{voteTally[p.id] ?? 0} صوت</span>
                  {p.role === 'spy' && <span className="text-rose-400 text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">غريب</span>}
                </div>
              </div>
            ))}
        </div>

        {/* Reset: go back home */}
        <div className="flex flex-col gap-2 mt-auto pt-2">
          {isHost ? (
            <>
              <button
                onClick={handlePlayAgain}
                disabled={restarting}
                className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-transform disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{restarting ? 'جاري التجهيز...' : 'بدء جولة جديدة'}</span>
              </button>
              <button
                onClick={() => router.push('/create-room')}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء غرفة جديدة</span>
              </button>
            </>
          ) : (
            <>
              <div className="glass-card rounded-2xl py-3 px-5 text-center">
                <p className="text-slate-300 text-xs font-medium">في انتظار المستضيف لتجهيز جولة جديدة...</p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>العودة للرئيسية</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
