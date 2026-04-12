'use client';

import { CATEGORIES } from '@/data/words';

interface CategoryPickerProps {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const RANDOM_ID = '__random__';

export default function CategoryPicker({ selected, onSelect, onClose }: CategoryPickerProps) {
  const categories = Object.values(CATEGORIES);

  const handleSelect = (id: string) => {
    if (id === RANDOM_ID) {
      const ids = Object.keys(CATEGORIES);
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      onSelect(randomId);
    } else {
      onSelect(id);
    }
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Bottom sheet */}
      <div
        className="relative z-10 w-full max-w-[430px] rounded-t-[36px] bg-[#0E1020] border-t border-white/10 p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

        <h2 className="text-xl font-black text-white mb-5 text-center">اختر الفئة</h2>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3">

          {/* Random tile */}
          <button
            onClick={() => handleSelect(RANDOM_ID)}
            className={`
              flex flex-col items-center justify-center gap-2 py-5 rounded-[22px] border transition-all duration-200 active:scale-95
              bg-gradient-to-br from-primary/20 to-accent/10 border-primary/40
              hover:from-primary/30 hover:to-accent/20
            `}
          >
            <span className="text-3xl">🎲</span>
            <span className="text-sm font-black text-primary-light">عشوائي</span>
          </button>

          {/* Category tiles */}
          {categories.map(cat => {
            const isSelected = selected === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={`
                  flex flex-col items-center justify-center gap-2 py-5 rounded-[22px] border
                  transition-all duration-200 active:scale-95
                  ${isSelected
                    ? 'bg-primary/20 border-primary/60 shadow-[0_0_16px_rgba(139,92,246,0.2)]'
                    : 'bg-white/4 border-white/8 hover:bg-white/8'}
                `}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className={`text-sm font-bold ${isSelected ? 'text-primary-light' : 'text-slate-300'}`}>
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-600">{cat.words.length} كلمة</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
