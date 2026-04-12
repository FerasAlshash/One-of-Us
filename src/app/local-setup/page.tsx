'use client';

import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { CATEGORIES } from '@/data/words';
import Link from 'next/link';

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
        <button
          onClick={onDec} disabled={value <= min}
          className="w-9 h-9 rounded-xl bg-white/6 hover:bg-white/12 active:scale-90 transition-all flex items-center justify-center text-slate-300 disabled:opacity-25 text-lg leading-none font-light"
        >−</button>
        <span className="text-xl font-black text-white w-7 text-center tabular-nums">{value}</span>
        <button
          onClick={onInc} disabled={value >= max}
          className="w-9 h-9 rounded-xl bg-primary/20 hover:bg-primary/35 active:scale-90 transition-all flex items-center justify-center text-primary-light disabled:opacity-25 text-lg leading-none"
        >+</button>
      </div>
    </div>
  );
}

export default function LocalSetup() {
  const router = useRouter();
  const { state, updateSetup, startGame } = useGame();

  const categoryIds = Object.keys(CATEGORIES);
  const catIdx = categoryIds.indexOf(state.category);
  const cycleCategory = () => updateSetup({ category: categoryIds[(catIdx + 1) % categoryIds.length] });

  const handleStart = () => { startGame(); router.push('/role-reveal'); };
  const maxSpies = Math.max(1, Math.floor(state.playersCount / 2));
  const currentCat = CATEGORIES[state.category];

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-5">
        <Link href="/"
          className="w-10 h-10 rounded-[14px] glass flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-lg font-black tracking-wide text-white">إعداد اللعبة</h1>
        <div className="w-10" />
      </div>

      {/* Settings */}
      <div className="flex-1 flex flex-col gap-3 px-5 overflow-y-auto pb-4">

        <Counter
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
            </svg>
          }
          label="عدد اللاعبين"
          sublabel="من 3 إلى 15 لاعب"
          value={state.playersCount} min={3} max={15}
          onInc={() => updateSetup({ playersCount: state.playersCount + 1 })}
          onDec={() => updateSetup({
            playersCount: state.playersCount - 1,
            spiesCount: Math.min(state.spiesCount, Math.floor((state.playersCount - 1) / 2) || 1),
          })}
        />

        <Counter
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          label="عدد الغرباء"
          sublabel={`كحد أقصى ${maxSpies}`}
          value={state.spiesCount} min={1} max={maxSpies}
          onInc={() => updateSetup({ spiesCount: state.spiesCount + 1 })}
          onDec={() => updateSetup({ spiesCount: state.spiesCount - 1 })}
        />

        <Counter
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2" strokeLinecap="round"/>
            </svg>
          }
          label="مدة النقاش"
          sublabel="بالدقائق"
          value={state.timerMinutes} min={1} max={10}
          onInc={() => updateSetup({ timerMinutes: state.timerMinutes + 1 })}
          onDec={() => updateSetup({ timerMinutes: state.timerMinutes - 1 })}
        />

        {/* Category — tap to cycle */}
        <button
          onClick={cycleCategory}
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

        {/* Summary pill */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 rounded-2xl bg-white/3 border border-white/5 text-[12px] text-slate-400">
          <span><span className="text-white font-bold">{state.playersCount}</span> لاعب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{state.spiesCount}</span> غريب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{state.timerMinutes}</span> دقيقة</span>
          <span>·</span>
          <span className="text-accent font-bold">{currentCat?.name}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={handleStart}
          className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-xl glow-primary active:scale-[0.97] transition-transform duration-150 relative"
        >
          بدء اللعبة 🎮
        </button>
      </div>

    </div>
  );
}
