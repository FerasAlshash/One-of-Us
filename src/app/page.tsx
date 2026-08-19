'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, PlusCircle, LogIn, HelpCircle, ArrowLeft } from 'lucide-react';
import TutorialModal from '@/components/TutorialModal';

export default function Home() {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 relative overflow-hidden">
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {/* ── Hero ── */}
      <div className="flex flex-col items-center pt-6 sm:pt-10 pb-2 sm:pb-4 px-6 safe-top">
        {/* Logo */}
        <div className="float relative mb-3 sm:mb-5">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <Image
              src="/gharib-logo-v2.png"
              alt="الغريب"
              fill
              sizes="96px"
              className="object-cover rounded-full"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-violet-300 font-bold" dir="ltr">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>One of Us?</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight pt-0.5 leading-tight select-none">
            <span className="text-white drop-shadow-sm">مِـيـن </span>
            <span className="bg-gradient-to-b from-white via-violet-200 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
              الـغَـرِيـب؟
            </span>
          </h1>
          
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide">لعبة الخداع والذكاء الجماعي</p>
        </div>
      </div>

      {/* ── Main action card ── */}
      <div className="flex-1 min-h-0 flex flex-col justify-center px-5 sm:px-6 gap-3 sm:gap-4 pb-4 sm:pb-6 safe-bottom overflow-y-auto">

        {/* Local play hero card */}
        <div className="glass-card rounded-[22px] p-4 sm:p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-300 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white">اللعب المحلي</h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-bold">جهاز واحد</span>
                </div>
                <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5">مرر الهاتف بين اللاعبين واكشف الغريب</p>
              </div>
            </div>

            <Link
              href="/local-setup"
              className="btn-primary shimmer w-full flex items-center justify-center py-3 sm:py-3.5 rounded-2xl text-white font-bold text-sm sm:text-base transition-transform"
            >
              <span>ابدأ اللعبة الآن</span>
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-2 my-0.5">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold tracking-wider">اللعب أونلاين</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Online action cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <Link
            href="/create-room"
            className="glass-card rounded-[20px] p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white/[0.06] active:scale-[0.98] transition-all group text-center"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-300 group-hover:bg-violet-500/15 group-hover:border-violet-500/30 transition-colors">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">إنشاء غرفة</p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">استضف أصدقاءك</p>
            </div>
          </Link>

          <Link
            href="/join"
            className="glass-card rounded-[20px] p-3 sm:p-4 flex flex-col items-center gap-2 hover:bg-white/[0.06] active:scale-[0.98] transition-all group text-center"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:bg-violet-500/15 group-hover:border-violet-500/30 transition-colors">
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">انضمام لغرفة</p>
              <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">عبر كود الغرفة</p>
            </div>
          </Link>
        </div>

        {/* Tutorial button */}
        <div className="mt-2 sm:mt-3 flex justify-center">
          <button 
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white active:scale-95 transition-all text-[11px] sm:text-xs font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>كيف تلعب؟ شرح اللعبة والقواعد</span>
          </button>
        </div>

      </div>
    </div>
  );
}
