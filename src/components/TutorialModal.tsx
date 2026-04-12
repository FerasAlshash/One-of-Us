'use client';

import { useState } from 'react';
import Image from 'next/image';

const TUTORIAL_SLIDES = [
  {
    title: 'القصة باختصار 🕵️',
    description: 'أنتم مجموعة في رحلة أو جلسة، ولديكم جميعاً نفس "الكلمة السرية"... ما عدا شخص واحد بينكم سيستلم رسالة "أنت الغريب" ولن يعرف ما هي الكلمة!',
    icon: '🔮'
  },
  {
    title: 'الهدف من اللعبة 🎯',
    description: 'إذا كنت تملك الكلمة السرية: هدفك كشف الغريب وطرح أسئلة غير واضحة جداً. أما إذا كنت الغريب: هدفك الاندماج، تمييع إجاباتك، ومحاولة استنتاج الكلمة!',
    icon: '🎭'
  },
  {
    title: 'وقت النقاش ⏳',
    description: 'بمجرد كشف الأدوار يبدأ توقيت النقاش الحرج. لا تقل الكلمة أبداً، بل صفها بذكاء! الغريب سيعتمد على ردودكم ليخمن الكلمة بأقرب شكل.',
    icon: '🗣️'
  },
  {
    title: 'التصويت الحاسم 🗳️',
    description: 'عند انتهاء الوقت.. كل لاعب سيشير لمن يظن أنه الغريب. الغريب يربح إذا هرب من التصويت، والاعبون يربحون إذا تم كشفه بنجاح!',
    icon: '⚖️'
  }
];

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const nextSlide = () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
      // Reset slide after closing to start fresh next time
      setTimeout(() => setCurrentSlide(0), 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = TUTORIAL_SLIDES[currentSlide];
  const isLast = currentSlide === TUTORIAL_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm glass rounded-[36px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow ambient background inside modal */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 blob-purple opacity-30 pointer-events-none" />

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-white/50 hover:text-white/80 transition-colors z-20 bg-white/5 rounded-full"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="pt-14 pb-8 px-8 flex flex-col items-center text-center relative z-10 min-h-[340px] justify-between">
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center bg-white/5 shadow-inner">
              <span className="text-5xl drop-shadow-md">{slide.icon}</span>
            </div>
            
            <h3 className="text-2xl font-black text-white">{slide.title}</h3>
            
            <p className="text-slate-300 text-sm leading-relaxed max-w-[250px]">
              {slide.description}
            </p>
          </div>

          <div className="flex flex-col w-full gap-5 mt-8">
            {/* Dots */}
            <div className="flex justify-center gap-2">
              {TUTORIAL_SLIDES.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentSlide > 0 && (
                <button 
                  onClick={prevSlide}
                  className="px-5 py-3 rounded-2xl glass text-white font-bold active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/50"
                >
                  السابق
                </button>
              )}
              
              <button 
                onClick={nextSlide}
                className={`flex-1 py-3 rounded-2xl text-white font-black active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/50
                  ${isLast ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                           : 'bg-primary shadow-lg'}`}
              >
                {isLast ? 'جاهز للعب! 🚀' : 'التالي →'}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
