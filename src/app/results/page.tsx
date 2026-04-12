'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blob-purple opacity-30" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-rose opacity-25" />
      </div>

      {/* ── Hero — logo here ── */}
      <div className="relative z-10 flex flex-col items-center pt-14 pb-5 px-6 gap-3 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl scale-150" />
          <div className="float relative w-24 h-24 rounded-full overflow-hidden shadow-[0_0_50px_rgba(232,121,249,0.5)] border border-accent/30">
            <Image
              src="/gharib-logo.png"
              alt="الغريب"
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500">انكشف السر</p>
        <h1 className="text-4xl font-black text-white leading-tight">
          {spyIndices.length > 1 ? 'الغرباء هم' : 'الغريب هو'}
        </h1>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col px-6 gap-4 pb-6 overflow-y-auto">

        {/* Spy reveal — no emoji, just a clean badge list */}
        <div className="glass rounded-[24px] px-6 py-5 flex flex-col gap-3">
          {spyIndices.map(idx => (
            <div key={idx} className="flex items-center gap-4">
              {/* Number badge */}
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/35 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-black text-primary-light">{idx + 1}</span>
              </div>
              <div>
                <p className="text-white font-black text-lg leading-none">اللاعب {idx + 1}</p>
                <p className="text-accent text-xs mt-1 tracking-widest uppercase">غريب</p>
              </div>
              {/* Right side tag */}
              <div className="mr-auto">
                <span className="text-[11px] bg-primary/15 border border-primary/25 text-primary-light px-3 py-1 rounded-full">
                  مكشوف
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Word reveal — plain text, no box-shadow on inline element */}
        <div className="glass rounded-[24px] py-6 px-6 flex flex-col items-center gap-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">الكلمة السرية</p>
          <p
            className="text-5xl font-black text-accent mt-1"
            style={{ textShadow: '0 0 30px rgba(232,121,249,0.6)' }}
          >
            {state.word}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
          <span>{state.playersCount} لاعب</span>
          <span>·</span>
          <span>{state.spiesCount} غريب</span>
          <span>·</span>
          <span>{CATEGORY_NAMES[state.category] ?? state.category}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={() => router.push('/local-setup')}
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-lg glow-primary active:scale-[0.97] transition-transform"
          >
            جولة جديدة 🔄
          </button>
          <button
            onClick={() => { resetGame(); router.push('/'); }}
            className="w-full py-4 rounded-[24px] glass border border-white/10 text-slate-300 font-bold text-base active:scale-[0.97] transition-transform hover:bg-white/5"
          >
            القائمة الرئيسية 🏠
          </button>
        </div>

      </div>
    </div>
  );
}
