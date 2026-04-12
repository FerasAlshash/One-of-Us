'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';

export default function TimerScreen() {
  const router = useRouter();
  const { state } = useGame();
  const total = state.timerMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(total);

  const pct     = timeLeft / total;
  const isDanger = timeLeft <= 30 && timeLeft > 0;
  const isDone   = timeLeft <= 0;

  useEffect(() => {
    if (isDone) { router.push('/vote'); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [isDone, router]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  // SVG circle progress
  const R   = 70;
  const C   = 2 * Math.PI * R;
  const dash = C * pct;

  return (
    <div className="flex flex-col flex-1 items-center justify-between px-6 py-14 relative overflow-hidden">

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
        {/* Outer glow */}
        <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 scale-75 ${isDanger ? 'bg-accent/25' : 'bg-primary/20'}`} />

        <svg width="180" height="180" className="-rotate-90">
          {/* Track */}
          <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          {/* Progress */}
          <circle
            cx="90" cy="90" r={R} fill="none"
            stroke={isDanger ? '#E879F9' : '#8B5CF6'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ filter: `drop-shadow(0 0 ${isDanger ? '8px #E879F9' : '6px #8B5CF6'})`, transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
          />
        </svg>

        {/* Centre text */}
        <div className="absolute flex flex-col items-center gap-1">
          <p className={`text-5xl font-black font-mono tracking-tighter transition-colors duration-700 ${isDanger ? 'text-accent' : 'text-white'}`}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </p>
          {isDanger && <p className="text-[11px] text-accent/80 uppercase tracking-widest animate-pulse">ينتهي قريباً!</p>}
        </div>
      </div>

      {/* Bottom area */}
      <div className="relative z-10 w-full flex flex-col gap-3">
        <button
          onClick={() => router.push('/vote')}
          className="shimmer w-full py-5 rounded-[24px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-lg glow-primary active:scale-[0.97] transition-transform"
        >
          انتهى النقاش — التصويت الآن 🗳️
        </button>
      </div>

    </div>
  );
}
