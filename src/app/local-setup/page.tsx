'use client';

import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { CATEGORIES } from '@/data/words';
import Link from 'next/link';
import { Users, UserX, Clock, ArrowRight, ArrowLeft, Plus, Minus } from 'lucide-react';

function Counter({
  icon, label, sublabel, value, min, max, onInc, onDec,
}: {
  icon: React.ReactNode; label: string; sublabel?: string;
  value: number; min: number; max: number;
  onInc: () => void; onDec: () => void;
}) {
  return (
    <div className="glass-card rounded-[20px] p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-300 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">{label}</p>
        {sublabel && <p className="text-slate-400 text-[10px] mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        <button
          onClick={onDec} disabled={value <= min}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 transition-all flex items-center justify-center text-slate-300 disabled:opacity-20 text-xs font-medium"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-base font-black text-white w-6 text-center tabular-nums">{value}</span>
        <button
          onClick={onInc} disabled={value >= max}
          className="w-7 h-7 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 active:scale-90 transition-all flex items-center justify-center disabled:opacity-20 text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
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
    <div className="flex flex-col flex-1 h-full min-h-0 relative overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 sm:pt-6 pb-2 safe-top">
        <Link href="/"
          className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-black tracking-wide text-white">إعداد اللعبة المحلية</h1>
        <div className="w-9" />
      </div>

      {/* Settings */}
      <div className="flex-1 min-h-0 flex flex-col gap-2.5 px-5 overflow-y-auto pb-2">

        <Counter
          icon={<Users className="w-4 h-4" />}
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
          icon={<UserX className="w-4 h-4" />}
          label="عدد الغرباء"
          sublabel={`كحد أقصى ${maxSpies}`}
          value={state.spiesCount} min={1} max={maxSpies}
          onInc={() => updateSetup({ spiesCount: state.spiesCount + 1 })}
          onDec={() => updateSetup({ spiesCount: state.spiesCount - 1 })}
        />

        <Counter
          icon={<Clock className="w-4 h-4" />}
          label="مدة النقاش"
          sublabel="بالدقائق"
          value={state.timerMinutes} min={1} max={10}
          onInc={() => updateSetup({ timerMinutes: state.timerMinutes + 1 })}
          onDec={() => updateSetup({ timerMinutes: state.timerMinutes - 1 })}
        />

        {/* Category — tap to cycle */}
        <button
          onClick={cycleCategory}
          className="glass-card rounded-[20px] p-3 flex items-center gap-3 active:scale-[0.98] transition-all hover:bg-white/[0.04] text-right"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg flex-shrink-0">
            {currentCat?.emoji ?? '🎭'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[10px]">الفئة ({catIdx + 1}/{categoryIds.length})</p>
            <p className="text-white font-bold text-sm truncate">{currentCat?.name ?? '—'}</p>
          </div>
          <div className="text-xs text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06] flex items-center gap-1">
            <span>تغيير</span>
            <ArrowLeft className="w-3 h-3" />
          </div>
        </button>

        {/* Summary pill */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400">
          <span><span className="text-white font-bold">{state.playersCount}</span> لاعب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{state.spiesCount}</span> غريب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{state.timerMinutes}</span> دقيقة</span>
          <span>·</span>
          <span className="text-violet-300 font-bold">{currentCat?.name}</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-2 pb-4 sm:pb-6 safe-bottom">
        <button
          onClick={handleStart}
          className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform"
        >
          <span>بدء اللعبة وتوزيع الأدوار</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
