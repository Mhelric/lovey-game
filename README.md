# Cartoon Cat Couple's Arcade 🐾👑🐍

A lightweight, real-time multiplayer couple's web game hub built for long-distance play—featuring **Traditional Filipino Dama** and **Seeded Randomized Snakes & Ladders**, customizable **Cartoon Cat Avatars** (8 breeds + accessories), 60/120 FPS GPU-compositor animations, floating emoji/chat bubbles, synthesized Web Audio SFX, and persistent Supabase scoreboards.

## Target Devices & Performance
- **Samsung Galaxy J2 Pro (`360 × 640 px` CSS, 60 Hz):** `< 22 KB` gzipped JS bundle (`< 45 KB` budget), zero scrollbars (`100dvh`), `>= 42 × 42 px` touch targets.
- **Poco X7 Pro (`393 × 873 px` CSS, 120 Hz):** `env(safe-area-inset-top/bottom)` support and razor-sharp inline `<svg>` vector rendering at 120 FPS.

## Features
1. **8 Cartoon Cat Breeds + 5 Accessories:** Strawberry Cat, Orange Tabby, Calico, Tuxedo, Siamese, Void Black Cat, Scottish Fold, and White Persian + Crown (`👑`), Ribbon (`🎀`), Sakura (`🌸`), and Shades (`🕶️`).
2. **Traditional Filipino Dama (`src/engines/damaEngine.ts`):**
   - `8×8` diagonal-line board, forward/backward *Tao* captures, flying *Dama* kings (with crown & cape), mandatory maximum capture (*Mayor*) highlighting, and **Cat Pounce + Paw Smack Cloud Poof** capture animations.
3. **Seeded Randomized Snakes & Ladders (`src/engines/snakesEngine.ts`):**
   - `Mulberry32` deterministic PRNG synced via `boardSeed` in Supabase.
   - Procedural wooden ladders, colorful cartoon snakes, and optional Mystery Twist tiles (`⚡ Boost +3`, `🛡️ Snake Shield`, `🎲 Extra Roll`, `🔄 Switcheroo Swap`).
   - Cat Paw Dice Box roll, `boing-boing` tile hopping, and dizzy spiral eyes (`@_@`) on snake slides.
4. **Couple Realtime Sync & Lifetime Scoreboard:**
   - `< 50ms` Supabase Realtime Broadcast for floating emojis (`😻`, `😹`, `😿`, `🐾`, `🐟`, `❤️`) and quick chat notes.
   - PostgreSQL persistence (`couple_rooms`, `active_matches`, `match_history`) for instant wake/reconnect recovery.
