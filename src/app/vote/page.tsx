'use client';

import { useRouter } from 'next/navigation';
import { Vote, Search } from 'lucide-react';
import { useGame } from '@/context/GameContext';

export default function VotePage() {
  const router = useRouter();
  const { state } = useGame();

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 items-center justify-between px-5 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 safe-top safe-bottom relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-300 shadow-inner">
          <Vote className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">مرحلة التصويت</h1>
        <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
          انتهى وقت النقاش! صوّتوا الآن بينكم شفهياً لتحديد من تعتقدون أنه الغريب
        </p>
      </div>

      {/* Instructions card */}
      <div className="relative z-10 w-full glass-card rounded-[22px] p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3">
        <h3 className="text-white font-bold text-xs sm:text-sm">كيفية التصويت السريع:</h3>
        {[
          { n: '١', text: 'كل لاعب يحدد في ذهنه الشخص المشتبه به' },
          { n: '٢', text: 'عند العد: ١.. ٢.. ٣.. يشير الجميع معاً' },
          { n: '٣', text: 'صاحب أكثر عدد أصوات هو المتهم الرئيسي' },
          { n: '٤', text: 'اضغط على الزر أدناه لمعرفة هل كشفتم الغريب أم لا!' },
        ].map(step => (
          <div key={step.n} className="flex items-start gap-2.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-violet-300 font-black text-[10px] sm:text-[11px]">{step.n}</span>
            </div>
            <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="relative z-10 w-full">
        <button
          onClick={() => router.push('/results')}
          className="btn-primary shimmer w-full py-3.5 sm:py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform"
        >
          <Search className="w-4 h-4" />
          <span>كشف النتائج والأدوار</span>
        </button>
        <p className="text-center text-slate-500 text-[10px] sm:text-[11px] mt-2">
          {state.playersCount} لاعبين · {state.spiesCount} غريب
        </p>
      </div>

    </div>
  );
}
