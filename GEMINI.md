# Cartoon Cat Couple's Arcade — Project Optimization & Architecture Rules

## 1. Target Hardware & Viewport Constraints

Every component, stylesheet, and game engine module MUST strictly support our dual-device baseline:

1. **Samsung Galaxy J2 Pro (Strict Baseline Constraint)**
   - **Viewport:** `360 × 640 px` CSS (`540 × 960` physical, 16:9, 60 Hz).
   - **Hardware:** `1.5 GB – 2 GB` RAM, Quad-core Cortex-A53 + Adreno 308 GPU.
   - **Hard Budgets:**
     - **Gzipped JS Bundle:** `< 45 KB` total (use lightweight Preact + modular Supabase usage; zero bloated UI or animation libraries).
     - **DOM Node Count:** `< 400` total nodes on screen at any time.
     - **Memory Footprint:** `< 50 MB` heap/raster memory (no large PNG/WebP sprite sheets, no WebGL/Canvas2D framebuffers).
     - **Zero Scrollbars:** Entire app fits inside `100dvh` (`overflow: hidden`) with a responsive square SVG board container (`min(100vw - 16px, 100dvh - 188px)`).

2. **Poco X7 Pro (High-Refresh Modern Target)**
   - **Viewport:** `393 × 873 px` CSS (`1220 × 2712` physical, 20:9 AMOLED, 120 Hz).
   - **Safe-Area Insets:** Respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for punch-hole camera and gesture navigation bar.
   - **High-DPI Vector Crispness:** All game boards, cat avatars, pieces, snakes, and ladders must be rendered as scalable inline `<svg>` vectors so they run at locked 120 FPS at native resolution.

---

## 2. Graphics & GPU Compositor Animation Rules

- **Compositor-Only Animations:** Animate ONLY `transform` (`translate3d`, `scale`, `rotate`) and `opacity`.
- **Forbidden CSS Properties on Animated Elements:** NEVER animate `top`, `left`, `width`, `height`, `margin`, `box-shadow`, or `filter`.
- **Forbidden Expensive Paint Effects:** NEVER use `backdrop-filter: blur()`, heavy multi-layered `drop-shadow` filters on moving nodes, or continuous CSS `infinite` animations on more than 4 elements simultaneously.
- **Touch Ergonomics:**
  - All interactive board tiles, cat pieces, dice boxes, and emoji triggers MUST maintain a minimum hit target of `42 × 42 px` (or equivalent SVG coordinate hit area).
  - Use **Tap-to-Select, Tap-to-Move** interaction (never drag-and-drop, which drops frames and misfires on small capacitive screens).
  - Apply `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` globally.

---

## 3. Architecture & Code Quality Guidelines

- **Pure Deterministic Game Engines:**
  - `src/engines/damaEngine.ts` (Filipino Dama) and `src/engines/snakesEngine.ts` (Seeded Snakes & Ladders) must be 100% pure TypeScript functions with zero DOM or Preact dependencies.
  - All random board generation in Snakes & Ladders must use the deterministic `Mulberry32` PRNG seeded by `boardSeed` so both phones generate identical boards with `0 KB` extra network payload.
- **Network Resilience:**
  - Ephemeral visual events (floating emoji reactions, quick chat bubbles, dice shake preview) use **Supabase Realtime Broadcast** (`< 50 ms`).
  - Authoritative turn states and match outcomes persist to **Supabase PostgreSQL** (`couple_rooms`, `active_matches`, `match_history`) so locking a phone or dropping mobile data recovers seamlessly on wake.
- **Verification & Git Checkpoints:**
  - Before every commit/checkpoint, run `npx.cmd tsc --noEmit` and `npm.cmd run build` to verify zero TypeScript errors and confirm the gzipped bundle stays `< 45 KB`.
