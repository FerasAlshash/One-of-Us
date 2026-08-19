'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LogIn, KeyRound, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device-id';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qCode = params.get('code');
      if (qCode) {
        const u = qCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
        const initial = ['', '', '', '', ''];
        for (let i = 0; i < u.length; i++) initial[i] = u[i];
        return initial;
      }
    }
    return ['', '', '', '', ''];
  });
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
    if (!name.trim()) { setError('يرجى إدخال اسمك أولاً'); return; }
    if (fullCode.length !== 5) { setError('كود الغرفة يتكون من 5 خانات'); return; }

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
      setError('الغرفة غير موجودة، يرجى التأكد من الكود');
      setLoading(false);
      return;
    }

    if (room.status !== 'waiting') {
      setError('اللعبة بدأت بالفعل في هذه الغرفة');
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
      setError('الغرفة ممتلئة بالكامل');
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
      setError('حدث خطأ أثناء الانضمام للغرفة');
      setLoading(false);
      return;
    }

    router.push(`/lobby/${fullCode}`);
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
        <h1 className="text-base font-black tracking-wide text-white">الانضمام لغرفة</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 gap-6 pt-4 pb-8">

        {/* Code input */}
        <div className="glass-card rounded-[24px] p-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-violet-300 text-xs font-bold">
            <KeyRound className="w-4 h-4" />
            <span>أدخل كود الغرفة (5 خانات)</span>
          </div>
          <div className="flex gap-2 justify-center w-full mt-1" dir="ltr">
            {code.map((char, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                value={char}
                onChange={e => handleCodeChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                maxLength={1}
                inputMode="text"
                className="w-12 h-14 rounded-xl bg-white/[0.04] border border-white/[0.1] text-center text-xl font-black text-white focus:border-violet-500/60 focus:bg-violet-500/10 outline-none transition-all uppercase"
              />
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="glass-card rounded-[24px] p-5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
            <User className="w-4 h-4 text-violet-300" />
            <span>اسمك المستعار في اللعبة</span>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="مثال: أحمد"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-slate-500 text-sm font-semibold focus:border-violet-500/50 outline-none transition-all"
          />
        </div>

        {error && (
          <p className="text-center text-rose-300 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <div className="mt-auto">
          <button
            onClick={handleJoin}
            disabled={loading || fullCode.length !== 5 || !name.trim()}
            className="btn-primary shimmer w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-transform disabled:opacity-40"
          >
            {loading ? (
              <span>جاري الانضمام...</span>
            ) : (
              <>
                <span>الدخول إلى الغرفة</span>
                <LogIn className="w-4 h-4 mr-1" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
