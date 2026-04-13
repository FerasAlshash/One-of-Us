# One of Us? (مين الغريب؟) 🕵️‍♂️🎯

A fast-paced, highly interactive social deduction game built for modern web browsers. Inspired by popular hidden role games, *One of Us?* pits a team of regular players against hidden "strangers". The regular players must use a secret word to prove their innocence, while the strangers must bluff their way through undetected.

## 🚀 Tech Stack & Architecture

This project is built using a modern, scalable, and responsive technology stack focused on high performance and seamless UI/UX:

*   **Frontend Framework:** Next.js 16 (App Router paradigm)
*   **Language:** TypeScript for type safety and robust code maintainability.
*   **Styling:** Tailwind CSS, utilizing extensive custom utility classes for advanced "Glassmorphism" UI, dynamic ambient blur blobs, and fluid animations (`float`, `pulse-ring`, `shimmer`).
*   **State Management:** React Context API (`GameContext.tsx`) for local game states, and state-driven UI for multiplayer components.
*   **Database & Backend:** Supabase (PostgreSQL)
*   **Realtime Communication:** Supabase Realtime (WebSockets) for zero-latency multiplayer synchronization.

## 🛠️ Project Roadmap & Development Phases

The application was strategically developed through a structured 5-phase roadmap:

### Phase 1: Environment & UI Foundation ✅
*   Migrated from an earlier Python/Kivy prototype to a modern Next.js + Tailwind CSS architecture.
*   Implemented a comprehensive design system featuring custom Tailwind configurations (Primary Purple + Fuchsia Accent).
*   Established a mobile-first, constrained layout (`max-w-[430px]`) to simulate a native app experience on desktop browsers.
*   Integrated the Arabic "Tajawal" font with extensive support for RTL (`dir="rtl"`) layout rendering.

### Phase 2: Core Local Multiplayer ✅
*   Engineered the `GameContext.tsx` to handle all core local game logic (pass-and-play).
*   Implemented the Fisher-Yates shuffle algorithm for fair identity distribution.
*   Built the core local flow: Main Menu -> Setup -> Role Reveal -> Timer -> Voting -> Results.
*   Designed an SVG-based dynamic timer with a critical "danger" state.

### Phase 3: Content & Database Expansion ✅
*   Curated a massive, locally-stored word database comprising over 400 unique terms.
*   Categorized words logically (Places, Food, Professions, Arab Artists).
*   Built an interactive, grid-based Bottom Sheet category picker with a "Random Category" pseudo-random selector.

### Phase 4: Online Multiplayer Integration ✅
*   Transitioned the single-device local engine into a fully distributed online multiplayer experience.
*   Provisioned a Supabase PostgreSQL database handling `rooms` and `players` relations.
*   Developed a frictionless 4-character Room Code joining mechanism.
*   **Robust Synchronization Engine:** Implemented a fault-tolerant hybrid architecture combining Supabase Realtime WebSockets with intelligent polling fallbacks. This entirely eliminates desynchronization caused by mobile browser tab throttling.
*   Engineered a remote electronic voting system with live tallying.

### Phase 5: PWA, UX Polish & Deployment ✅
*   **PWA Transformation:** Integrated Progressive Web App capabilities (`manifest.json`, Service Workers) allowing the game to be installed on Android and iOS home screens with a native look and feel.
*   **Floating Emojis Background:** Dynamic category-specific emoji animations that float upward during the discussion phase.
*   **Tutorial System:** A polished, carousel-based "How to Play" guide implemented directly on the home screen.
*   **Host Management:** Added ability for room hosts to politely exclude (kick) players from the lobby with real-time syncing.
*   **Audio & Haptics:** Integrated immersive sound effects and haptic vibrations for timer alerts and game transitions.
*   **Production Deployment:** Successfully deployed to Vercel with automated CI/CD and optimized Webpack builds.

## ✨ Key Features
*   **Bilingual Identity:** Full support for Arabic (Primary) and English (Secondary).
*   **Real-time Sync:** Smooth multiplayer experience powered by Supabase.
*   **Modern Aesthetics:** Premium Glassmorphism UI with vibrant ambient animations.
*   **Privacy-First:** Unique Device ID system to prevent identity conflicts without requiring logins.

## 📖 Local Development Setup

To run this project locally, you will need Node.js and an active Supabase project instance.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FerasAlshash/One-of-Us.git
   cd One-of-Us
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.*
