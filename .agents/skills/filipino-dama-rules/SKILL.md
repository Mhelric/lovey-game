---
name: filipino-dama-rules
description: >-
  Authoritative ruleset and implementation specification for Traditional Filipino Dama,
  including the 8x8 diagonal-line board, forward and backward captures for normal pieces (Tao),
  flying king (Dama) movement and captures, and mandatory maximum capture (Mayor).
  Activate this skill whenever implementing, testing, or modifying Filipino Dama logic or UI.
---

# Traditional Filipino Dama Ruleset & Engine Specification

Use this reference whenever working on `src/engines/damaEngine.ts` or the Filipino Dama board UI.

## 1. Board Geometry & Initial Setup

- **Grid:** `8 × 8` board (`row: 0..7`, `col: 0..7`).
- **Playable Squares:** Only squares where `(row + col) % 2 === 1` (the 32 dark/diagonal-intersection squares) are playable.
- **Traditional Diagonal Lines:** Filipino Dama boards feature explicit diagonal guide lines connecting all playable squares along the `NE–SW` and `NW–SE` axes.
- **Starting Pieces (`12` per player):**
  - **Player 1 (Bottom, `"p1"`):** Occupies playable squares on rows `5, 6, 7`. Moves forward toward row `0` (`dRow = -1`).
  - **Player 2 (Top, `"p2"`):** Occupies playable squares on rows `0, 1, 2`. Moves forward toward row `7` (`dRow = +1`).
  - Rows `3` and `4` start empty.

## 2. Piece Types

1. **`"tao"` (Normal Cat Piece):**
   - **Non-Capturing Move:** Steps `1` square diagonally **forward only** (`dRow = -1` for P1, `dRow = +1` for P2) to an adjacent empty playable square.
   - **Capturing Move (*Kain*):** Can jump over an adjacent opponent piece to an immediately empty square directly beyond it (`2` squares away diagonally) in **ANY of the 4 diagonal directions (both forward AND backward)**.
   - **Multi-Jump Chain:** If after landing from a capture, another capture is available from the new square (forward or backward), the *Tao* MUST continue jumping in the same turn.

2. **`"dama"` (Flying Cat King — Crown & Cape):**
   - **Non-Capturing Move:** Slides any number of unobstructed diagonal squares **forward or backward** along any of the 4 diagonal rays.
   - **Flying Capture:** Can jump over a single opponent piece located at any distance along an unobstructed diagonal ray (forward or backward) and land on **any empty square beyond** that opponent piece along the same ray (until blocked by another piece or the board edge).
   - **Multi-Jump Chain:** If landing on a particular square beyond the captured piece enables a subsequent capture along any diagonal ray (including 90-degree turns), the *Dama* must continue capturing.

## 3. Mandatory Maximum Capture (*Mayor* Rule)

1. **Capture is Mandatory:** If any legal capture exists on the board for the active player, non-capturing moves are illegal.
2. **Maximum Capture Count (*Mayor*):**
   - Among all possible legal capture sequences across all of the player's pieces, the player **MUST** choose a capture sequence that captures the **maximum possible number of opponent pieces** (`maxCapturedCount`).
   - Example: If Piece A can capture `1` piece, and Piece B can capture `2` pieces in a chain, ONLY Piece B's 2-piece capture sequence is legal.
   - When a *Dama* jumps an opponent piece and has multiple empty landing squares beyond it, if some landing squares allow continuing a multi-jump of length `N` while others stop at `N - 1`, the *Dama* **must** land on one of the squares that achieves the maximum total captures `N`.
3. **Captured Piece Removal Timing (Turkish Strike Rule):**
   - During a multi-jump sequence, jumped opponent pieces remain as obstacles on the board until the entire capture sequence finishes, and **cannot be jumped a second time** in the same turn. They are removed upon completion of the move sequence (or visually poofed as each jump completes while still blocking re-jumps).

## 4. Promotion to *Dama* (King)

- A `"tao"` promotes to `"dama"` **only when its turn ends** on the opponent's back rank (`row === 0` for P1, `row === 7` for P2).
- **Mid-Capture Pass-Through Rule:** If a `"tao"` reaches the back rank during a capture, and from that back-rank square it can immediately make another backward capture as a `"tao"`, it **must** continue capturing as a `"tao"` and does **not** promote to `"dama"` if it leaves the back rank before its turn ends.

## 5. Win & Draw Conditions

- A player wins when the opponent has `0` pieces remaining or has `0` legal moves on their turn.
