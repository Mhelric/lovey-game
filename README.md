# Cartoon Cat Couple's Arcade (Lovey Game) 🐾👑🐍

A lightweight, real-time multiplayer couple's web game hub & native Android APK built for long-distance play—featuring **Traditional Filipino Dama**, **Seeded Randomized Snakes & Ladders**, **Cat Uno**, and **Doodle Clash**, customizable **Cartoon Cat Avatars** (8 breeds + accessories), 60/120 FPS GPU-compositor animations, floating emoji/chat bubbles, synthesized Web Audio SFX, and persistent Supabase scoreboards.

## Target Devices & Performance
- **Samsung Galaxy J2 Pro (`360 × 640 px` CSS, 60 Hz, Android 7.1.1):** `< 45 KB` gzipped JS bundle (`~44.4 KB`), zero scrollbars (`100dvh`), `>= 42 × 42 px` touch targets, and a compact signed Capacitor Android APK (`minifyEnabled` + `shrinkResources`) tailored for low-storage phones.
- **Poco X7 Pro (`393 × 873 px` CSS, 120 Hz):** `env(safe-area-inset-top/bottom)` support and razor-sharp inline `<svg>` vector rendering at 120 FPS.

## Features
1. **8 Cartoon Cat Breeds + 5 Accessories:** Strawberry Cat, Orange Tabby, Calico, Tuxedo, Siamese, Void Black Cat, Scottish Fold, and White Persian + Crown (`👑`), Ribbon (`🎀`), Sakura (`🌸`), and Shades (`🕶️`).
2. **Traditional Filipino Dama (`src/engines/damaEngine.ts`):**
   - `8×8` diagonal-line board, forward/backward *Tao* captures, flying *Dama* kings (with crown & cape), mandatory maximum capture (*Mayor*) highlighting, and **Cat Pounce** capture animations.
3. **Seeded Randomized Snakes & Ladders (`src/engines/snakesEngine.ts`):**
   - `Mulberry32` deterministic PRNG synced via `boardSeed` in Supabase.
   - Procedural wooden ladders, colorful cartoon snakes, and optional Mystery Twist tiles (`⚡ Boost +3`, `🛡️ Snake Shield`, `🎲 Extra Roll`, `🔄 Switcheroo Swap`).
4. **Cat Uno (`src/engines/unoEngine.ts`):**
   - Full card deck with `+2`/`+4` stacking, one-tap hand sorter, UNO call penalty, and 4-color diagonal felt arena.
5. **Doodle Clash (`src/engines/doodleEngine.ts`):**
   - 8-round draw & guess game with a 1,364-word non-repeating dictionary, live SVG stroke sync, and 3/5 guess lives.
6. **Android APK & In-App Self-Updater (`capacitor.config.ts`, `src/components/ApkUpdateModal.tsx`):**
   - Wrapped with Capacitor Android (`io.loveygames.app`) using the Cartoon Cat avatar as the app icon.
   - Automatically checks GitHub Releases on launch/resume and displays an in-app **Update Available** modal to install newer signed APKs seamlessly without losing room or avatar data.
   - Automated signed APK builds via `.github/workflows/release-apk.yml`.

## Couple Realtime Sync & Lifetime Scoreboard
- `< 50ms` Supabase Realtime Broadcast for floating stickers (`😻`, `😹`, `😿`, `🐾`, `🐟`, `❤️`) and quick chat notes.
- PostgreSQL persistence (`couple_rooms`, `active_matches`, `match_history`) for instant wake/reconnect recovery, plus 1-Phone Pass & Play mode.
