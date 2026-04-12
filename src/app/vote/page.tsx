'use client';

import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';

export default function VotePage() {
  const router = useRouter();
  const { state } = useGame();

  return (
    <div className="flex flex-col flex-1 items-center justify-between px-6 py-14 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blob-purple opacity-30" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blob-rose opacity-20" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div className="float text-7xl">🗳️</div>
        <h1 className="text-4xl font-black text-white">التصويت</h1>
        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
          انتهى وقت النقاش! صوّتوا الآن بينكم شفهياً على من تعتقدون أنه الغريب
        </p>
      </div>

      {/* Instructions card */}
      <div className="relative z-10 w-full glass rounded-[28px] p-6 flex flex-col gap-4">
        <h3 className="text-white font-black text-base">كيف يعمل التصويت؟</h3>
        {[
          { n: '١', text: 'كل لاعب يختار اسم شخص يظن أنه الغريب' },
          { n: '٢', text: 'بعد العد: ١، ٢، ٣ — الجميع يشير بإصبعه في نفس الوقت' },
          { n: '٣', text: 'اللاعب الذي يحصل على أكبر عدد أصوات يُقصى' },
          { n: '٤', text: 'اضغط الزر أدناه لكشف الحقيقة!' },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary font-black text-xs">{step.n}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative z-10 w-full">
        <button
          onClick={() => router.push('/results')}
          className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-accent to-accent-hover text-white font-black text-xl glow-accent active:scale-[0.97] transition-transform"
          style={{ color: '#fff' }}
        >
          اكشف الحقيقة! 🔍
        </button>
        <p className="text-center text-slate-600 text-xs mt-3">
          {state.playersCount} لاعب · {state.spiesCount} غريب
        </p>
      </div>

    </div>
  );
}
