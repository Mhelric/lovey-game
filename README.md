<div align="center">

<img src="./public/cat-icon.svg" alt="Lovey Game Cat Avatar Logo" width="110" />

# 🐾 Lovey Game — Cartoon Cat Couple's Arcade 👑

**A cozy, real-time multiplayer couple's game hub built for long-distance play & local pass-and-play.**  
*Crafted to run smoothly on both entry-level phones (`Samsung Galaxy J2 Pro`) and modern 120 Hz flagships (`Poco X7 Pro`).*

<p>
  <a href="https://lovey-games.vercel.app/">
    <img src="https://img.shields.io/badge/Play%20Web%20App-lovey--games.vercel.app-ff758f?style=for-the-badge&logo=vercel&logoColor=white" alt="Play Web App" />
  </a>
  <a href="https://github.com/Mhelric/lovey-game/releases/latest/download/LoveyGame.apk">
    <img src="https://img.shields.io/badge/Download%20Android%20APK-LoveyGame.apk%20(~1.9%20MB)-3ddc84?style=for-the-badge&logo=android&logoColor=white" alt="Download Android APK" />
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Bundle-%3C%2045%20KB%20gzipped-ffbe0b?style=flat-square" alt="Bundle Budget" />
  <img src="https://img.shields.io/badge/Android-6.0%2B%20(J2%20Pro%20Ready)-80ed99?style=flat-square" alt="Android 6.0+" />
  <img src="https://img.shields.io/badge/Sync-Supabase%20Realtime-3ecf8e?style=flat-square" alt="Supabase Realtime" />
  <img src="https://img.shields.io/badge/Games-4%20Multiplayer%20Modes-ff8fab?style=flat-square" alt="4 Game Modes" />
</p>

</div>

---

## 📱 Download & Install

| Platform | Link | Notes |
| :--- | :--- | :--- |
| **Android APK** | **[Download `LoveyGame.apk` (Latest Release)](https://github.com/Mhelric/lovey-game/releases/latest/download/LoveyGame.apk)** | `~1.86 MB` signed APK (`io.loveygames.app`), Android 6.0+, Cat Avatar icon, and automatic in-app update popups. |
| **Web App (PWA)** | **[lovey-games.vercel.app](https://lovey-games.vercel.app/)** | Instant play in any mobile or desktop browser, plus a quick APK download button in the top-right corner. |

> **Seamless Updates:** Every APK release is signed with the same persistent keystore and monotonically incremented `versionCode`. Whenever a new version is published on GitHub Releases, the Android app shows a **"Update Available!"** popup modal so you can install right over your existing app without losing your room code or Cat Avatar.

---

## 🎮 Arcade Games

1. **👑 Cat Dama (Traditional Filipino Dama)** — [`src/engines/damaEngine.ts`](src/engines/damaEngine.ts)
   - Authentic `8×8` diagonal-line board with forward/backward *Tao* captures, flying *Dama* kings (crown & cape), mandatory maximum capture (*Mayor*) highlighting, and **Cat Pounce** animations.
   - Automatic board perspective mirroring for Player 2 in 2-phone live mode.
2. **🐍 Seeded Snakes & Ladders** — [`src/engines/snakesEngine.ts`](src/engines/snakesEngine.ts)
   - Deterministic `Mulberry32` PRNG synced via `boardSeed` (`0 KB` extra payload).
   - Procedural wooden ladders, cartoon snakes, Mystery Twist tiles (`⚡ Boost +3`, `🛡️ Snake Shield`, `🎲 Extra Roll`, `🔄 Switcheroo`), Cat Paw Dice Box, and dizzy `@_@` snake-slide expressions.
3. **🃏 Cat Uno** — [`src/engines/unoEngine.ts`](src/engines/unoEngine.ts)
   - Full card deck with `+2` / `+4` stacking, one-tap hand sorter, UNO call penalty indicator, flying deal animations, and a 4-color diagonal felt arena.
4. **🎨 Doodle Clash** — [`src/engines/doodleEngine.ts`](src/engines/doodleEngine.ts)
   - 8-round draw & guess showdown (`2 Easy → 2 Medium → 2 Hard → 2 Final`) powered by a **1,364-word non-repeating dictionary**.
   - Live SVG stroke sync, 60-second timer, and 3/5 guess lives.

---

## 🐱 Couple Features & Hardware Optimization

- **8 Cartoon Cat Breeds + 5 Accessories:** Strawberry Cat, Orange Tabby, Calico, Tuxedo, Siamese, Void Black Cat, Scottish Fold, and White Persian + Crown (`👑`), Ribbon (`🎀`), Sakura (`🌸`), and Shades (`🕶️`).
- **Two Play Modes:**
  - **2-Phone Live Mode:** `< 50 ms` Supabase Realtime Broadcast for floating stickers (`😻`, `😹`, `😿`, `🐾`, `🐟`, `❤️`) and quick chat + PostgreSQL persistence (`couple_rooms`, `active_matches`, `match_history`) for instant wake/reconnect recovery.
  - **1-Phone Pass & Play:** Local hotseat mode with private handover prompts and separate Player 2 customization.
- **Dual-Device Baseline:**
  - **Samsung Galaxy J2 Pro (`360 × 640 px`, 60 Hz, Android 7.1.1):** `< 45 KB` gzipped JS entry bundle, zero scrollbars (`100dvh`), `>= 42 × 42 px` touch targets, and a `~1.86 MB` APK (`minifyEnabled` + `shrinkResources`).
  - **Poco X7 Pro (`393 × 873 px`, 120 Hz):** `env(safe-area-inset-top/bottom)` safe areas and crisp inline `<svg>` vector rendering at 120 FPS.

---

## 📝 Update Logs

### `v1.0.1` — Lightweight Android APK & In-App Self-Updater
- Wrapped Lovey Game as a compact **`1.86 MB`** signed Capacitor Android APK (`io.loveygames.app`) tailored for low-storage devices like the Samsung Galaxy J2 Pro.
- Added the Hugging Cartoon Cat Avatars as the Android launcher & adaptive app icon.
- Added lazy-loaded in-app **Update Available** popup modal on Android (`ApkUpdateModal`) and **Get Lovey Game App** download modal + top-right APK button on the web app (`WebApkDownloadModal`).
- Configured automated signed APK builds & GitHub Releases via `.github/workflows/release-apk.yml`.

### Earlier Milestones
- **Strict Left-Right Avatar Alignment & Instant Match Rejoin:** Guaranteed consistent couple positioning, match pause/timer freeze on disconnect, and game switch confirmation alerts.
- **Cat Uno Polish:** Restructured 5-tier symmetrical felt arena, one-tap card sorter, flying deal animation, and removed card-7 hand swap clutter.
- **Doodle Clash Expansion:** Added 1,364-word random non-repeating dictionary and 5 lives on Hard/Final rounds.
- **Samsung J2 Pro Viewport Tuning:** Anchored shell to `100dvh` with compositor-only (`transform` / `opacity`) animations.
