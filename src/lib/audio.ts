'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // A very fast, clean digital pip/tick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    
    // Sharp click envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);

    // Subtle vibration (only supported on some mobile browsers)
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  } catch (e) {
    // Ignore silently if blocked
  }
}

export function playAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // A harsh alarm sound
    osc.type = 'square';
    
    // Alternating frequencies for the alarm
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.4);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.6);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.8);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 1.0);
    
    // Fade out volume
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);

    // Strong vibrating alarm pattern
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch (e) {
    // Ignore silently if blocked
  }
}
