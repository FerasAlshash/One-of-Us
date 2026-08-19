'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import { playTick, playAlarm } from '@/lib/audio';
import FloatingEmojis from '@/components/FloatingEmojis';

export default function TimerScreen() {
  const router = useRouter();
  const { state } = useGame();
  const total = state.timerMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(total);

  const pct = timeLeft / total;
  const isDanger = timeLeft <= 30 && timeLeft > 0;

  // 1. Countdown interval
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  // 2. Audio triggers and Navigation
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      playTick();
    } else if (timeLeft === 0) {
      playAlarm();
      setTimeout(() => {
        router.push('/vote');
      }, 1500);
    } else if (timeLeft < 0) {
      router.push('/vote');
    }
  }, [timeLeft, router]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  // SVG circle progress
  const R   = 70;
  const C   = 2 * Math.PI * R;
  const dash = C * pct;

  return (
    <div className="flex flex-col flex-1 items-center justify-between px-6 py-14 relative overflow-hidden">

      {/* Floating Emojis Background */}
      <FloatingEmojis categoryId={state.category} />

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={`absolute inset-0 transition-all duration-1000 ${isDanger ? 'blob-rose' : 'blob-purple'} opacity-25`} />
      </div>

      {/* Title */}
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <h2 className="text-3xl font-black text-white">وقت النقاش</h2>
        <p className="text-slate-500 text-sm">ناقشوا.. مين هو الغريب؟</p>
      </div>

      {/* Circular timer */}
      <div className="relative z-10 flex items-center justify-center">
        <svg width="200" height="200" className="-rotate-90">
          {/* Track */}
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          {/* Progress */}
          <circle
            cx="100" cy="100" r={R} fill="none"
            stroke={isDanger ? '#F43F5E' : '#7C3AED'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute flex flex-col items-center gap-1">
          <p className={`text-4xl font-black font-mono tracking-tight transition-colors duration-500 ${isDanger ? 'text-rose-400' : 'text-white'}`}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </p>
          {isDanger && <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">ينتهي قريباً</span>}
        </div>
      </div>

      {/* Bottom area */}
      <div className="relative z-10 w-full flex flex-col gap-3">
        <button
          onClick={() => router.push('/vote')}
          className="btn-primary shimmer w-full py-4 rounded-2xl text-white font-bold text-base transition-transform"
        >
          انتهى النقاش — الانتقال للتصويت
        </button>
      </div>

    </div>
  );
}
