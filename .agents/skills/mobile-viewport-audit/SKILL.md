---
name: mobile-viewport-audit
description: >-
  Checklist and verification protocol for auditing the Cartoon Cat Couple's Arcade
  on Samsung Galaxy J2 Pro (360x640) and Poco X7 Pro (393x873) viewports, bundle size,
  and 60/120 FPS compositor performance before Git checkpoints.
---

# Mobile Viewport & Performance Audit Skill

Run this audit checklist before completing each phase checkpoint.

## 1. Build & Bundle Size Verification

1. Run TypeScript typechecking:
   `npx.cmd tsc --noEmit`
2. Run production build:
   `npm.cmd run build`
3. Verify that the total gzipped JS output in `dist/assets/` is **`< 45 KB`**.

## 2. Dual-Device Viewport Checklist

- **Samsung Galaxy J2 Pro (`360 × 640 px` CSS viewport):**
  - `document.documentElement.scrollHeight <= 640` and `scrollWidth <= 360` (Zero vertical or horizontal scrollbars).
  - Top Couple Header + Square Game Board + Bottom Emoji/Chat Bar all remain visible simultaneously without clipping.
  - All interactive targets (board cells, dice button, emoji buttons) are `>= 42 × 42 px`.
- **Poco X7 Pro (`393 × 873 px` CSS viewport):**
  - Safe-area padding (`env(safe-area-inset-top/bottom)`) prevents clipping near the punch-hole camera and bottom gesture bar.
  - Inline SVG vectors scale cleanly with zero pixelation.
