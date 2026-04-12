'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';
import { CATEGORIES } from '@/data/words';

function Counter({
  icon, label, sublabel, value, min, max, onInc, onDec,
}: {
  icon: React.ReactNode; label: string; sublabel?: string;
  value: number; min: number; max: number;
  onInc: () => void; onDec: () => void;
}) {
  return (
    <div className="glass rounded-[22px] p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-[14px] bg-primary/15 border border-primary/20 flex items-center justify-center text-primary-light flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-none">{label}</p>
        {sublabel && <p className="text-slate-500 text-[11px] mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-2 bg-white/4 rounded-2xl p-1">
        <button onClick={onDec} disabled={value <= min}
          className="w-9 h-9 rounded-xl bg-white/6 hover:bg-white/12 active:scale-90 transition-all flex items-center justify-center text-slate-300 disabled:opacity-25 text-lg font-light"
        >−</button>
        <span className="text-xl font-black text-white w-7 text-center tabular-nums">{value}</span>
        <button onClick={onInc} disabled={value >= max}
          className="w-9 h-9 rounded-xl bg-primary/20 hover:bg-primary/35 active:scale-90 transition-all flex items-center justify-center text-primary-light disabled:opacity-25 text-lg"
        >+</button>
      </div>
    </div>
  );
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [playersCount, setPlayersCount] = useState(4);
  const [spiesCount, setSpiesCount] = useState(1);
  const [timerMinutes, setTimerMinutes] = useState(3);
  const [category, setCategory] = useState(Object.keys(CATEGORIES)[0]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryIds = Object.keys(CATEGORIES);
  const catIdx = categoryIds.indexOf(category);
  const currentCat = CATEGORIES[category];
  const maxSpies = Math.max(1, Math.floor(playersCount / 2));

  const handleCreate = async () => {
    setLoading(true);
    if (!name.trim()) {
      setError('يرجى إدخال اسمك أولاً');
      setLoading(false);
      return;
    }

    const deviceId = getDeviceId();

    // Pick a random word from the selected category
    const words = CATEGORIES[category]?.words ?? [];
    const word = words[Math.floor(Math.random() * words.length)];

    const code = generateCode();

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id: deviceId,
        status: 'waiting',
        settings: { playersCount, spiesCount, timerMinutes, category },
        word,
      })
      .select()
      .single();

    if (roomErr || !room) {
      setError('حدث خطأ أثناء إنشاء الغرفة، حاول مجدداً');
      setLoading(false);
      return;
    }

    // Add host as first player
    const { error: playerErr } = await supabase.from('players').insert({
      room_id: room.id,
      device_id: deviceId,
      name: name.trim(),
    });

    if (playerErr) {
      setError('حدث خطأ، حاول مجدداً');
      setLoading(false);
      return;
    }

    router.push(`/lobby/${code}`);
  };

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] blob-purple opacity-40" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] blob-rose opacity-25" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-5">
        <Link href="/"
          className="w-10 h-10 rounded-[14px] glass flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-lg font-black tracking-wide text-white">إنشاء غرفة</h1>
        <div className="w-10" />
      </div>

      {/* Settings */}
      <div className="relative z-10 flex-1 flex flex-col gap-3 px-5 overflow-y-auto pb-4">
        
        {/* Host Name Input */}
        <div className="glass rounded-[22px] p-4 flex flex-col gap-2 border-primary/20 bg-primary/5">
          <label className="text-primary-light text-[11px] font-bold uppercase tracking-wider px-1">اسمك (المضيف)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أدخل اسمك هنا..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 transition-colors"
            required
          />
        </div>

        <Counter
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
            </svg>
          }
          label="عدد اللاعبين أونلاين"
          sublabel="من 3 إلى 12 لاعب"
          value={playersCount} min={3} max={12}
          onInc={() => setPlayersCount(p => p + 1)}
          onDec={() => {
            setPlayersCount(p => p - 1);
            setSpiesCount(s => Math.min(s, Math.max(1, Math.floor((playersCount - 1) / 2))));
          }}
        />

        <Counter
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          label="عدد الغرباء"
          sublabel={`كحد أقصى ${maxSpies}`}
          value={spiesCount} min={1} max={maxSpies}
          onInc={() => setSpiesCount(s => s + 1)}
          onDec={() => setSpiesCount(s => s - 1)}
        />

        <Counter
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/>
            </svg>
          }
          label="مدة النقاش"
          sublabel="بالدقائق"
          value={timerMinutes} min={1} max={10}
          onInc={() => setTimerMinutes(t => t + 1)}
          onDec={() => setTimerMinutes(t => t - 1)}
        />

        {/* Category */}
        <button
          onClick={() => setCategory(categoryIds[(catIdx + 1) % categoryIds.length])}
          className="glass rounded-[22px] p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:bg-white/4 text-right"
        >
          <div className="w-11 h-11 rounded-[14px] bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
            {currentCat?.emoji ?? '🎭'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 text-[11px]">الفئة ({catIdx + 1}/{categoryIds.length})</p>
            <p className="text-accent font-black truncate">{currentCat?.name ?? '—'}</p>
          </div>
          <div className="text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/8">
            التالي ←
          </div>
        </button>

        {/* Summary */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 rounded-2xl bg-white/3 border border-white/5 text-[12px] text-slate-400">
          <span><span className="text-white font-bold">{playersCount}</span> لاعب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{spiesCount}</span> غريب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{timerMinutes}</span> دقيقة</span>
          <span>·</span>
          <span className="text-accent font-bold">{currentCat?.name}</span>
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm bg-red-500/10 rounded-2xl px-4 py-3">{error}</p>
        )}
      </div>

      {/* CTA */}
      <div className="relative z-10 px-5 pb-10 pt-4">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-xl glow-primary active:scale-[0.97] transition-transform duration-150 disabled:opacity-60"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء الغرفة 🏠'}
        </button>
      </div>

    </div>
  );
}
