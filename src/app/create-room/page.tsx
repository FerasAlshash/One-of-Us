'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, UserX, Clock, ArrowRight, ArrowLeft, Plus, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';
import { CATEGORIES } from '@/data/words';

function Counter({
  icon, label, sublabel, value, min, max, onInc, onDec,
}: {
  icon: React.ReactNode; label: string; sublabel?: string;
  value: number; min: number; max: number;
  onInc: () => void; onDec: () => void;
}) {
  return (
    <div className="glass-card rounded-[22px] p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-violet-300 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight">{label}</p>
        {sublabel && <p className="text-slate-400 text-[11px] mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        <button 
          onClick={onDec} 
          disabled={value <= min}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] active:scale-90 transition-all flex items-center justify-center text-slate-300 disabled:opacity-20 text-sm font-medium"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-lg font-black text-white w-6 text-center tabular-nums">{value}</span>
        <button 
          onClick={onInc} 
          disabled={value >= max}
          className="w-8 h-8 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 active:scale-90 transition-all flex items-center justify-center disabled:opacity-20 text-sm font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [playersCount, setPlayersCount] = useState(4);
  const [spiesCount, setSpiesCount] = useState(1);
  const [timerMinutes, setTimerMinutes] = useState(3);
  const [category, setCategory] = useState(Object.keys(CATEGORIES)[0]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryIds = Object.keys(CATEGORIES);
  const catIdx = categoryIds.indexOf(category);
  const currentCat = CATEGORIES[category];
  const maxSpies = Math.max(1, Math.floor(playersCount / 2));

  const handleCreate = async () => {
    setLoading(true);
    if (!name.trim()) {
      setError('يرجى إدخال اسمك أولاً');
      setLoading(false);
      return;
    }

    const deviceId = getDeviceId();

    // Pick a random word from the selected category
    const words = CATEGORIES[category]?.words ?? [];
    const word = words[Math.floor(Math.random() * words.length)];

    const code = generateCode();

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id: deviceId,
        status: 'waiting',
        settings: { playersCount, spiesCount, timerMinutes, category },
        word,
      })
      .select()
      .single();

    if (roomErr || !room) {
      setError('حدث خطأ أثناء إنشاء الغرفة، حاول مجدداً');
      setLoading(false);
      return;
    }

    // Add host as first player
    const { error: playerErr } = await supabase.from('players').insert({
      room_id: room.id,
      device_id: deviceId,
      name: name.trim(),
    });

    if (playerErr) {
      setError('حدث خطأ، حاول مجدداً');
      setLoading(false);
      return;
    }

    router.push(`/lobby/${code}`);
  };

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <Link href="/"
          className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-black tracking-wide text-white">إعداد غرفة جديدة</h1>
        <div className="w-9" />
      </div>

      {/* Settings */}
      <div className="relative z-10 flex-1 flex flex-col gap-3 px-5 overflow-y-auto pb-4">
        
        {/* Host Name Input */}
        <div className="glass-card rounded-[22px] p-4 flex flex-col gap-2">
          <label className="text-violet-300 text-[11px] font-bold uppercase tracking-wider px-1">اسمك (المستضيف)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أدخل اسمك هنا..."
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            required
          />
        </div>

        <Counter
          icon={<Users className="w-4 h-4" />}
          label="عدد اللاعبين أونلاين"
          sublabel="من 3 إلى 12 لاعب"
          value={playersCount} min={3} max={12}
          onInc={() => setPlayersCount(p => p + 1)}
          onDec={() => {
            setPlayersCount(p => p - 1);
            setSpiesCount(s => Math.min(s, Math.max(1, Math.floor((playersCount - 1) / 2))));
          }}
        />

        <Counter
          icon={<UserX className="w-4 h-4" />}
          label="عدد الغرباء"
          sublabel={`كحد أقصى ${maxSpies}`}
          value={spiesCount} min={1} max={maxSpies}
          onInc={() => setSpiesCount(s => s + 1)}
          onDec={() => setSpiesCount(s => s - 1)}
        />

        <Counter
          icon={<Clock className="w-4 h-4" />}
          label="مدة النقاش"
          sublabel="بالدقائق"
          value={timerMinutes} min={1} max={10}
          onInc={() => setTimerMinutes(t => t + 1)}
          onDec={() => setTimerMinutes(t => t - 1)}
        />

        {/* Category Picker */}
        <button
          onClick={() => setCategory(categoryIds[(catIdx + 1) % categoryIds.length])}
          className="glass-card rounded-[22px] p-3.5 flex items-center gap-3 active:scale-[0.98] transition-all hover:bg-white/[0.04] text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-xl flex-shrink-0">
            {currentCat?.emoji ?? '🎭'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[11px]">الفئة ({catIdx + 1}/{categoryIds.length})</p>
            <p className="text-white font-bold text-sm truncate">{currentCat?.name ?? '—'}</p>
          </div>
          <div className="text-xs text-slate-400 bg-white/[0.04] px-3 py-1 rounded-lg border border-white/[0.06] flex items-center gap-1">
            <span>تغيير</span>
            <ArrowLeft className="w-3 h-3" />
          </div>
        </button>

        {/* Summary Chips */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-400">
          <span><span className="text-white font-bold">{playersCount}</span> لاعب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{spiesCount}</span> غريب</span>
          <span>·</span>
          <span><span className="text-white font-bold">{timerMinutes}</span> دقيقة</span>
          <span>·</span>
          <span className="text-violet-300 font-bold">{currentCat?.name}</span>
        </div>

        {error && (
          <p className="text-center text-rose-300 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">{error}</p>
        )}
      </div>

      {/* CTA */}
      <div className="relative z-10 px-5 pb-8 pt-3">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-primary shimmer w-full py-4 rounded-2xl text-white font-bold text-base transition-transform disabled:opacity-50"
        >
          {loading ? 'جاري إنشاء الغرفة...' : 'إنشاء الغرفة والدخول'}
        </button>
      </div>

    </div>
  );
}
