'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { playTick, playAlarm } from '@/lib/audio';
import FloatingEmojis from '@/components/FloatingEmojis';

type Room = { id: string; status: string; timer_ends_at: string; settings: { timerMinutes: number; category: string } };

function formatTime(seconds: number) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function OnlineTimerPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isDanger, setIsDanger] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase
        .from('rooms').select('*').eq('code', code.toUpperCase()).single();
      if (data) setRoom(data);
    };
    fetchRoom();
  }, [code]);

  // Countdown from server timer_ends_at
  useEffect(() => {
    if (!room?.timer_ends_at) return;
    let ended = false;

    const update = () => {
      if (ended) return;
      const diff = Math.floor((new Date(room.timer_ends_at).getTime() - Date.now()) / 1000);
      setSeconds(diff);
      setIsDanger(diff <= 30 && diff > 0);
      
      // Play tick sound in the final 10 seconds
      if (diff <= 10 && diff > 0) {
        playTick();
      } else if (diff === 0) {
        playAlarm();
      }

      if (diff <= 0) {
        ended = true;
        // Add a delay to let the alarm finish before pushing if we actually hit zero here
        setTimeout(() => {
          supabase.from('rooms').update({ status: 'voting' }).eq('id', room.id).then(() => {
            router.push(`/online/vote/${code}`);
          });
        }, diff === 0 ? 1500 : 0);
      }
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [room, code, router]);

  // Watch for room status changes (e.g., host manually advancing)
  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel(`timer-room-${room.id}`);
    channel
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}`,
      }, (payload) => {
        const updated = payload.new as Room;
        if (updated.status === 'voting') router.push(`/online/vote/${code}`);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room, code, router]);

  const totalSeconds = (room?.settings.timerMinutes ?? 3) * 60;
  const progress = Math.max(0, Math.min(1, seconds / totalSeconds));
  const circumference = 2 * Math.PI * 90;
  const strokeDash = circumference * progress;

  return (
    <div className={`flex flex-col flex-1 relative overflow-hidden transition-colors duration-1000`}>

      {/* Floating Emojis Background */}
      {room && <FloatingEmojis categoryId={room.settings.category} />}

      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] transition-all duration-1000 opacity-30 ${isDanger ? 'blob-rose' : 'blob-purple'}`} />
      </div>

      {/* Header */}
      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-12 pb-4 gap-1 text-center">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">وقت النقاش المباشر</span>
        <h1 className="text-xl font-black text-white">ناقشوا واكشفوا الغريب!</h1>
      </div>

      {/* Timer circle */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="relative">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="110" cy="110" r="90" fill="none"
              stroke={isDanger ? '#F43F5E' : '#7C3AED'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className={`text-5xl font-black tabular-nums transition-colors duration-500 font-mono tracking-tight ${isDanger ? 'text-rose-400' : 'text-white'}`}>
              {formatTime(seconds)}
            </span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {isDanger ? 'ينتهي قريباً' : 'متبقي'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="relative z-10 px-6 pb-10 flex flex-col gap-2">
        <div className="glass-card rounded-[20px] py-3 px-5 text-center">
          <p className="text-slate-300 text-xs font-medium">ناقشوا بهدوء وذكاء — لا تكشفوا الكلمة صراحة</p>
        </div>
        <p className="text-center text-slate-500 text-[11px]">
          الانتقال التلقائي لصفحة التصويت فور انتهاء العداد
        </p>
      </div>
    </div>
  );
}
