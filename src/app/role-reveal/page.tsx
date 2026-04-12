'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient — always same colour regardless of role */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-purple opacity-35" />
      </div>

      {/* ── Progress dots ── */}
      <div className="relative z-10 flex justify-center gap-1.5 pt-14 pb-3">
        {Array.from({ length: state.playersCount }).map((_, i) => (
          <div key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === state.currentPlayerIndex ? 'w-6 bg-primary' :
              i < state.currentPlayerIndex   ? 'w-3 bg-primary/40' : 'w-3 bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 flex flex-col items-center py-4 px-8 gap-1">
        <p className="text-[11px] tracking-[0.25em] uppercase text-slate-500">دور اللاعب</p>
        <h2 className="text-4xl font-black text-white">{state.currentPlayerIndex + 1}</h2>
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <div className="glass rounded-[36px] w-full px-8 py-12 flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Subtle inner highlight */}
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />

          {!revealed ? (
            /* Lock state */
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative">
                <div className="pulse-ring w-20 h-20 rounded-full glass flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-slate-400">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-white mb-2">الشاشة مخفية</p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  تأكد أن أحداً لا ينظر، ثم اضغط لكشف دورك
                </p>
              </div>
            </div>
          ) : (
            /* Revealed state — identical neutral styling for spy & player */
            <div className="flex flex-col items-center gap-5 text-center w-full">
              {isSpy ? (
                <>
                  {/* Gharib logo — mysterious reveal */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl scale-150" />
                    <div className="float relative w-32 h-32 rounded-full overflow-hidden shadow-[0_0_60px_rgba(232,121,249,0.5)] border border-accent/30">
                      <Image
                        src="/gharib-logo-v2.png"
                        alt="الغريب"
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[13px] tracking-[0.3em] uppercase text-slate-500">تحذير سري</p>
                    <p
                      className="text-5xl font-black text-white"
                      style={{ textShadow: '0 0 40px rgba(232,121,249,0.5)' }}
                    >أنت الغريب</p>
                  </div>
                  <div className="glass rounded-2xl px-5 py-3 text-sm text-slate-400 leading-relaxed max-w-xs text-center">
                    استمع للنقاش 👂 اكتسب المعلومات، ولا تكشف نفسك أبداً
                  </div>
                </>
              ) : (
                <>
                  <div className="float text-5xl">🎯</div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">الكلمة السرية</p>
                    <p className="text-4xl font-black text-white">{state.word}</p>
                  </div>
                  <div className="glass rounded-2xl px-5 py-3 text-sm text-slate-400 leading-relaxed max-w-xs">
                    تحدث بذكاء 🧠 ساعد فريقك في كشف الغريب
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
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-xl glow-primary active:scale-[0.97] transition-transform"
          >
            اكشف دورك 👁
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full py-5 rounded-[24px] glass border border-white/10 text-white font-bold text-lg active:scale-[0.97] transition-transform hover:bg-white/6"
          >
            {isLast ? 'ابدأ النقاش →' : 'سلّم الهاتف للتالي →'}
          </button>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
