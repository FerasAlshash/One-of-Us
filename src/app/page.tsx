import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">

      {/* ── Hero ── */}
      <div className="flex flex-col items-center pt-20 pb-8 px-8">
        {/* Floating logo */}
        <div className="float relative mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-2xl scale-110" />
          <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.5)]">
            <Image
              src="/gharib-logo.png"
              alt="الغريب"
              fill
              sizes="112px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-[11px] tracking-[0.35em] uppercase text-accent/80 font-bold" dir="ltr">
            One of Us?
          </p>
          <h1 className="text-[52px] leading-tight pb-3 pt-1 font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-primary-light drop-shadow-[0_0_30px_rgba(139,92,246,0.6)]">
            مين الغريب؟
          </h1>
        </div>
      </div>

      {/* ── Main action card ── */}
      <div className="flex-1 flex flex-col justify-center px-6 gap-4 pb-10">

        {/* Local play hero card */}
        <div className="glass rounded-[30px] p-6 relative overflow-hidden group">
          {/* Background spy silhouette */}
          <div aria-hidden className="absolute -left-2 -bottom-3 text-[110px] opacity-[0.06] select-none pointer-events-none leading-none">🫥</div>
          {/* Accent glow in top-right */}
          <div className="absolute -top-8 -right-8 w-32 h-32 blob-rose opacity-40 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                {/* Users icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-primary-light">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" strokeLinecap="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">اللعب المحلي</h2>
                <p className="text-slate-400 text-xs">هاتف واحد · كشف الغريب معاً</p>
              </div>
            </div>

            <Link
              href="/local-setup"
              className="shimmer w-full flex items-center justify-center py-4 rounded-[20px] bg-gradient-to-r from-primary to-primary-hover text-white font-black text-lg glow-primary active:scale-95 transition-transform duration-150"
            >
              ابدأ اللعبة الآن
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 mr-2">
                <path d="M13 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[11px] text-slate-600 uppercase tracking-widest">أونلاين</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Online stubs */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/create-room"
            className="glass rounded-[22px] p-4 flex flex-col items-center gap-2 hover:bg-white/5 active:scale-95 transition-all"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-sm font-bold text-slate-300">إنشاء غرفة</span>
          </Link>

          <Link
            href="/join"
            className="glass rounded-[22px] p-4 flex flex-col items-center gap-2 hover:bg-white/5 active:scale-95 transition-all text-center"
          >
            <span className="text-2xl">🔗</span>
            <span className="text-sm font-bold text-slate-300">الانضمام</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
