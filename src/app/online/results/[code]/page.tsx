'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type Player = { id: string; name: string; role: string | null; voted_for: string | null };
type Room = {
  id: string; word: string; settings: { category: string; timerMinutes: number };
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

  if (!room) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
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

  const teamWon = eliminated.some(p => p.role === 'spy');

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blob-purple opacity-30" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-rose opacity-25" />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center pt-12 pb-5 px-6 gap-3 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl scale-150" />
          <div className="float relative w-24 h-24 rounded-full overflow-hidden shadow-[0_0_50px_rgba(232,121,249,0.5)] border border-accent/30">
            <Image src="/gharib-logo.png" alt="الغريب" fill sizes="96px" className="object-cover" />
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500">انكشف السر</p>
        <h1 className="text-3xl font-black text-white">
          {teamWon ? '🎉 فاز الفريق!' : '😈 فاز الغريب!'}
        </h1>
        <p className="text-slate-400 text-sm">
          {teamWon ? 'تم اكتشاف الغريب!' : 'لم يتمكن الفريق من كشفه'}
        </p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 gap-4 pb-6 overflow-y-auto">

        {/* Who was eliminated */}
        {eliminated.length > 0 && (
          <div className="glass rounded-[24px] px-5 py-4 flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">من تم تصفيته</p>
            {eliminated.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-base font-black text-primary-light">
                  {p.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">{p.name}</p>
                  <p className={`text-xs mt-0.5 ${p.role === 'spy' ? 'text-accent' : 'text-green-400'}`}>
                    {p.role === 'spy' ? '✅ غريب — أصبتم!' : '❌ بريء — أخطأتم!'}
                  </p>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">{voteTally[p.id] ?? 0} 🗳️</span>
              </div>
            ))}
          </div>
        )}

        {/* The Strangers */}
        <div className="glass rounded-[24px] px-5 py-4 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">
            {spies.length > 1 ? 'الغرباء كانوا' : 'الغريب كان'}
          </p>
          {spies.map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-base font-black text-accent">
                {p.name[0]}
              </div>
              <p className="text-white font-bold flex-1">{p.name}</p>
              <span className="text-[11px] bg-accent/15 border border-accent/25 text-accent px-2 py-0.5 rounded-full">غريب</span>
            </div>
          ))}
        </div>

        {/* Word reveal */}
        <div className="glass rounded-[24px] py-6 px-6 flex flex-col items-center gap-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">الكلمة السرية</p>
          <p className="text-5xl font-black text-accent mt-1" style={{ textShadow: '0 0 30px rgba(232,121,249,0.6)' }}>
            {room.word}
          </p>
          <p className="text-slate-600 text-xs mt-1">{CATEGORY_NAMES[room.settings.category] ?? room.settings.category}</p>
        </div>

        {/* All players votes */}
        <div className="glass rounded-[24px] px-5 py-4 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-1">نتائج التصويت</p>
          {players
            .sort((a, b) => (voteTally[b.id] ?? 0) - (voteTally[a.id] ?? 0))
            .map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="text-white font-bold flex-1">{p.name}</span>
                <span className="text-slate-400 tabular-nums">{voteTally[p.id] ?? 0} صوت</span>
                {p.role === 'spy' && <span className="text-accent text-xs">👤 غريب</span>}
              </div>
            ))}
        </div>

        {/* Reset: go back home */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={() => router.push('/create-room')}
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-lg glow-primary active:scale-[0.97] transition-transform"
          >
            جولة جديدة 🔄
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-[24px] glass border border-white/10 text-slate-300 font-bold text-base active:scale-[0.97] transition-transform hover:bg-white/5"
          >
            القائمة الرئيسية 🏠
          </button>
        </div>

      </div>
    </div>
  );
}
