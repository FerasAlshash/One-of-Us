'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import { useGame } from '@/context/GameContext';

export default function RoleReveal() {
  const router = useRouter();
  const { state, nextPlayer } = useGame();
  const [revealed, setRevealed] = useState(false);

  const role = state.roles[state.currentPlayerIndex];
  const isSpy = role === 'spy';
  const isLast = state.currentPlayerIndex === state.playersCount - 1;

  const handleNext = () => {
    if (isLast) { router.push('/timer'); }
    else { nextPlayer(); setRevealed(false); }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative overflow-hidden">

      {/* ── Progress dots ── */}
      <div className="relative z-10 flex justify-center gap-1.5 pt-4 sm:pt-6 pb-1 safe-top">
        {Array.from({ length: state.playersCount }).map((_, i) => (
          <div key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === state.currentPlayerIndex ? 'w-6 bg-violet-500' :
              i < state.currentPlayerIndex   ? 'w-2 bg-violet-500/40' : 'w-1.5 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex flex-col items-center py-1.5 px-6 gap-0.5">
        <span className="text-[10px] tracking-[0.2em] uppercase text-slate-400 font-bold">اللاعب الحالي</span>
        <h2 className="text-2xl sm:text-3xl font-black text-white">{state.currentPlayerIndex + 1}</h2>
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-5 sm:px-6 gap-3 sm:gap-4 pb-4 sm:pb-6 safe-bottom">
        <div className="glass-card rounded-[28px] w-full px-6 py-6 sm:py-8 flex flex-col items-center gap-4 relative overflow-hidden border border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.5)]">

          {!revealed ? (
            /* Lock state */
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-white mb-1">الشاشة مخفية</p>
                <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed max-w-[220px]">
                  تأكد أن أحداً لا ينظر إلى الشاشة، ثم اضغط لكشف دورك
                </p>
              </div>
            </div>
          ) : (
            /* Revealed state */
            <div className="flex flex-col items-center gap-3 text-center w-full">
              {isSpy ? (
                <>
                  <div className="float relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-rose-500/30 shadow-[0_10px_28px_rgba(0,0,0,0.6)]">
                    <Image
                      src="/gharib-logo-v2.png"
                      alt="الغريب"
                      fill
                      sizes="112px"
                      className="object-cover rounded-full"
                      priority
                    />
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-rose-300 font-bold">تحذير سري</span>
                    <p className="text-2xl sm:text-3xl font-black text-white">أنت الغريب</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-xs text-center">
                    استمع للنقاش بذكاء، وخمن الكلمة دون أن تُكشف
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-0.5">الكلمة السرية</span>
                    <p className="text-2xl sm:text-3xl font-black text-white">{state.word}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-xs">
                    تحدث بذكاء مع اللاعبين لمساعدتهم في كشف الغريب
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform"
          >
            <Eye className="w-4 h-4" />
            <span>اكشف دورك الآن</span>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-3.5 sm:py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <span>{isLast ? 'بدء وقت النقاش' : 'تسليم الهاتف للتالي'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
