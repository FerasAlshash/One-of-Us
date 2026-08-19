'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RotateCcw, Home, KeyRound } from 'lucide-react';
import { useGame } from '@/context/GameContext';

const CATEGORY_NAMES: Record<string, string> = {
  places: 'أماكن', artists: 'فنانين', jobs: 'مهن', food: 'طعام',
};

export default function ResultsScreen() {
  const router = useRouter();
  const { state, resetGame } = useGame();

  const spyIndices = state.roles
    .map((r, i) => (r === 'spy' ? i : -1))
    .filter(i => i !== -1);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative overflow-hidden">

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center pt-4 sm:pt-6 pb-2 px-6 gap-1.5 text-center safe-top">
        <div className="float relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
          <Image
            src="/gharib-logo-v2.png"
            alt="الغريب"
            fill
            sizes="96px"
            className="object-cover rounded-full"
            priority
          />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">انكشفت الحقيقة</span>
        <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
          {spyIndices.length > 1 ? 'الغرباء في الجولة' : 'الغريب في الجولة'}
        </h1>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col px-5 sm:px-6 gap-3 pb-4 sm:pb-6 safe-bottom overflow-y-auto">

        {/* Spy reveal */}
        <div className="glass-card rounded-[22px] px-4 py-3 flex flex-col gap-2">
          {spyIndices.map(idx => (
            <div key={idx} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center flex-shrink-0">
                <span className="text-sm sm:text-base font-black text-rose-300">{idx + 1}</span>
              </div>
              <div>
                <p className="text-white font-bold text-xs sm:text-sm">اللاعب رقم {idx + 1}</p>
                <p className="text-rose-400 text-[10px] sm:text-[11px] font-semibold">هو الغريب</p>
              </div>
              <div className="mr-auto">
                <span className="text-[9px] sm:text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-bold">
                  كُشف
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Word reveal */}
        <div className="glass-card rounded-[22px] py-3.5 px-5 flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
            <KeyRound className="w-3.5 h-3.5 text-violet-300" />
            <span>الكلمة السرية للجولة</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {state.word}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-400">
          <span>{state.playersCount} لاعب</span>
          <span>·</span>
          <span>{state.spiesCount} غريب</span>
          <span>·</span>
          <span className="text-violet-300 font-bold">{CATEGORY_NAMES[state.category] ?? state.category}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-auto pt-2">
          <button
            onClick={() => router.push('/local-setup')}
            className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بدء جولة جديدة</span>
          </button>
          <button
            onClick={() => { resetGame(); router.push('/'); }}
            className="w-full py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </button>
        </div>

      </div>

    </div>
  );
}
