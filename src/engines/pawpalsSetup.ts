import { PlayerSlot } from '../types/arcade';

/**
 * Paw Pals — 2-phone co-op platformer. Shared match state only (tiny, main bundle).
 * Level data + physics live in pawpalsEngine.ts (lazy-loaded with the board view).
 *
 * Only level progress is persisted / match-synced. Cat positions stream over the
 * realtime channel as ephemeral `pawpals_pos` broadcasts.
 */
export const PAWPALS_LEVEL_COUNT = 10;

export interface PawPalsLevelResult {
  treats: number;
}

export interface PawPalsState {
  matchSeed: number;
  /** Index of the level being played (0-based). Equals PAWPALS_LEVEL_COUNT when finished. */
  level: number;
  results: PawPalsLevelResult[];
  /** Co-op game has no turns; kept for App compatibility. */
  turn: PlayerSlot;
  /** 'draw' = both cats cleared every level together (co-op win). */
  winner: 'draw' | null;
}

export function createInitialPawPalsState(seed = 202614): PawPalsState {
  return { matchSeed: seed, level: 0, results: [], turn: 'p1', winner: null };
}

export function isPawPalsMatchActive(s: PawPalsState | null | undefined): boolean {
  return Boolean(s && typeof s.level === 'number' && !s.winner && s.level > 0);
}

export function pawPalsTag(s: PawPalsState, slot: PlayerSlot): string {
  const stars = s.results.reduce((sum, r) => sum + r.treats, 0);
  return slot === 'p1'
    ? `Splash • Lv ${Math.min(s.level + 1, PAWPALS_LEVEL_COUNT)}/${PAWPALS_LEVEL_COUNT}`
    : `Fluff • ${stars} 🐟`;
}
