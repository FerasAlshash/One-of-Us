'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fullCode = code.join('');

  const handleCodeChange = (val: string, idx: number) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newCode = [...code];
    newCode[idx] = upper.slice(-1);
    setCode(newCode);
    if (upper && idx < 4) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('أدخل اسمك أولاً'); return; }
    if (fullCode.length !== 5) { setError('الكود يجب أن يكون 5 أحرف'); return; }

    setLoading(true);
    setError('');
    const deviceId = getDeviceId();

    // Find the room
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, status, settings')
      .eq('code', fullCode)
      .single();

    if (roomErr || !room) {
      setError('الغرفة غير موجودة، تحقق من الكود');
      setLoading(false);
      return;
    }

    if (room.status !== 'waiting') {
      setError('اللعبة بدأت بالفعل، لا يمكن الانضمام');
      setLoading(false);
      return;
    }

    // Check current player count
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id);

    const maxPlayers = room.settings?.playersCount ?? 12;
    if ((count ?? 0) >= maxPlayers) {
      setError('الغرفة ممتلئة');
      setLoading(false);
      return;
    }

    // Upsert player (in case they rejoin)
    const { error: insertErr } = await supabase
      .from('players')
      .upsert(
        { room_id: room.id, device_id: deviceId, name: name.trim() },
        { onConflict: 'room_id,device_id' }
      );

    if (insertErr) {
      setError('حدث خطأ أثناء الانضمام');
      setLoading(false);
      return;
    }

    router.push(`/lobby/${fullCode}`);
  };

  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blob-purple opacity-30" />
        <div className="absolute -bottom-20 right-0 w-[300px] h-[300px] blob-rose opacity-20" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-5">
        <Link href="/"
          className="w-10 h-10 rounded-[14px] glass flex items-center justify-center text-slate-400 hover:text-white active:scale-90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <h1 className="text-lg font-black tracking-wide text-white">الانضمام لغرفة</h1>
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 gap-8 pt-4 pb-10">

        {/* Code input */}
        <div className="flex flex-col gap-3">
          <p className="text-slate-400 text-sm text-center">أدخل كود الغرفة</p>
          <div className="flex gap-2 justify-center" dir="ltr">
            {code.map((char, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                value={char}
                onChange={e => handleCodeChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                maxLength={1}
                inputMode="text"
                className="w-14 h-16 rounded-[18px] glass border border-white/10 text-center text-2xl font-black text-white caret-primary focus:border-primary/60 focus:bg-primary/5 outline-none transition-all uppercase"
              />
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-2">
          <p className="text-slate-400 text-sm">اسمك في اللعبة</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="مثال: أبو خالد 😄"
            maxLength={20}
            className="w-full px-5 py-4 rounded-[20px] glass border border-white/10 text-white placeholder-slate-600 text-base font-bold focus:border-primary/50 focus:bg-primary/5 outline-none transition-all"
          />
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm bg-red-500/10 rounded-2xl px-4 py-3">{error}</p>
        )}

        <div className="mt-auto">
          <button
            onClick={handleJoin}
            disabled={loading || fullCode.length !== 5 || !name.trim()}
            className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-accent to-accent-hover text-white font-black text-xl glow-accent active:scale-[0.97] transition-transform disabled:opacity-40"
          >
            {loading ? 'جاري الانضمام...' : 'انضم! 🔗'}
          </button>
        </div>

      </div>
    </div>
  );
}
