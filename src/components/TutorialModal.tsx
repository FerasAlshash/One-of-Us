'use client';

import { useState } from 'react';
import { X, UserCheck, Target, Hourglass, Vote, Check, ArrowLeft } from 'lucide-react';

const TUTORIAL_SLIDES = [
  {
    title: 'القصة باختصار',
    description: 'أنتم مجموعة في جلسة واحدة، ولديكم جميعاً نفس "الكلمة السرية"... ما عدا شخص واحد بينكم سيستلم دور "الغريب" ولن يعرف ما هي الكلمة!',
    icon: UserCheck,
    badge: 'الأدوار'
  },
  {
    title: 'الهدف من اللعبة',
    description: 'إذا كنت تملك الكلمة: هدفك كشف الغريب وطرح تلميحات ذكية. أما إذا كنت الغريب: هدفك الاندماج وتخمين الكلمة دون أن تُكشف!',
    icon: Target,
    badge: 'الذكاء'
  },
  {
    title: 'وقت النقاش',
    description: 'يبدأ توقيت النقاش الحرج. صف الكلمة بذكاء دون ذكرها صراحة! الغريب سيعتمد على إجاباتكم ليخمن الكلمة ويتظاهر بمعرفتها.',
    icon: Hourglass,
    badge: 'التحدي'
  },
  {
    title: 'التصويت الحاسم',
    description: 'عند انتهاء الوقت، يصوت الجميع للإشارة إلى الغريب. يفوز الغريب إذا أفلت من التصويت، ويفوز البقية إذا تم كشفه بنجاح!',
    icon: Vote,
    badge: 'النتيجة'
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
      setTimeout(() => setCurrentSlide(0), 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = TUTORIAL_SLIDES[currentSlide];
  const IconComponent = slide.icon;
  const isLast = currentSlide === TUTORIAL_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm glass-card rounded-[32px] overflow-hidden flex flex-col border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200">

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-20 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="pt-12 pb-7 px-7 flex flex-col items-center text-center relative z-10 min-h-[360px] justify-between">
          
          <div className="flex flex-col items-center gap-3.5">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold">
              {slide.badge}
            </span>

            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-300 shadow-inner">
              <IconComponent className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-white">{slide.title}</h3>
            
            <p className="text-slate-300 text-xs leading-relaxed max-w-[260px]">
              {slide.description}
            </p>
          </div>

          <div className="flex flex-col w-full gap-4 mt-6">
            {/* Dots */}
            <div className="flex justify-center gap-1.5">
              {TUTORIAL_SLIDES.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? 'w-5 bg-violet-500' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2.5">
              {currentSlide > 0 && (
                <button 
                  onClick={prevSlide}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-bold text-xs active:scale-95 transition-all"
                >
                  السابق
                </button>
              )}
              
              <button 
                onClick={nextSlide}
                className={`flex-1 py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all ${
                  isLast 
                    ? 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30' 
                    : 'btn-primary'
                }`}
              >
                {isLast ? (
                  <>
                    <span>جاهز للعب!</span>
                    <Check className="w-4 h-4 mr-1" />
                  </>
                ) : (
                  <>
                    <span>التالي</span>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                  </>
                )}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
