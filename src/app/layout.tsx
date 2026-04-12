import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { Providers } from './Providers';
import './globals.css';

const font = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
};

export const metadata: Metadata = {
  title: 'مين الغريب؟ | One of Us?',
  description: 'لعبة خداع اجتماعي — اكتشف الغريب قبل أن يفلت!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'مين الغريب؟'
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body suppressHydrationWarning className={`${font.className} bg-[#07080F] text-slate-100 min-h-screen overflow-x-hidden antialiased`}>

        {/* ── Global ambient layer ── */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {/* Primary violet blob — top right */}
          <div className="absolute -top-48 -right-48 w-[700px] h-[700px] blob-purple opacity-70" />
          {/* Rose blob — bottom left */}
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] blob-rose opacity-60" />
          {/* Indigo blob — centre */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blob-indigo opacity-30" />
        </div>

        {/* ── Phone frame ── */}
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <main
            className="
              relative flex flex-col
              w-full max-w-[430px]
              min-h-screen sm:min-h-[812px] sm:max-h-[812px]
              sm:rounded-[52px] overflow-hidden
              glass
              sm:ring-1 sm:ring-white/10
            "
          >
            {/* Top highlight line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-light/60 to-transparent" />
            <Providers>{children}</Providers>
          </main>
        </div>

      </body>
    </html>
  );
}
