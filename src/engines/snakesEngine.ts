import { PlayerSlot } from '../types/arcade';

export type TwistKind =
  | 'boost'
  | 'swap'
  | 'shield'
  | 'extra_roll'
  | 'double_dice';

export type SnakesMaxTile = 100 | 150;

export interface BoardJumpLink {
  id: string;
  kind: 'ladder' | 'snake';
  from: number;
  to: number;
  color: string;
}

export interface TwistTile {
  tile: number;
  kind: TwistKind;
  label: string;
  icon: string;
}

export interface GeneratedSnakesBoard {
  seed: number;
  maxTile: SnakesMaxTile;
  ladders: BoardJumpLink[];
  snakes: BoardJumpLink[];
  twists: TwistTile[];
}

export interface SnakesTurnAnimation {
  id: string;
  roller: PlayerSlot;
  dice: number;
  dice1?: number;
  dice2?: number;
  startTile: number;
  walkLandingTile: number;
  finalTile: number;
  eventKind:
    | 'normal'
    | 'ladder'
    | 'snake'
    | 'shield_saved'
    | 'boost'
    | 'swap'
    | 'shield_gain'
    | 'extra_roll'
    | 'double_dice';
  eventMessage: string;
}

export interface SnakesGameState {
  boardSeed: number;
  twistsEnabled: boolean;
  maxTile?: SnakesMaxTile; // 100 or 150 (default 100 for backwards-compatibility)
  p1Tile: number;
  p2Tile: number;
  p1Shield: boolean;
  p2Shield: boolean;
  p1DoubleDiceTurns?: number;
  p2DoubleDiceTurns?: number;
  turn: PlayerSlot;
  winner: PlayerSlot | null;
  lastAnimation: SnakesTurnAnimation | null;
}

const SNAKE_COLORS = [
  '#6BCB77',
  '#4FC3C9',
  '#A78BFA',
  '#FF8A80',
  '#FFD166',
  '#74B9FF',
] as const;

const ALL_RANDOM_TWISTS: readonly TwistKind[] = [
  'double_dice',
  'boost',
  'shield',
  'extra_roll',
  'swap',
] as const;

/**
 * Deterministic 32-bit PRNG (Mulberry32).
 * Guarantees identical board layouts across both phones from a single integer seed.
 */
export function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a tile number (1..maxTile) into SVG center coordinates (x: 0..100, y: 0..100)
 * on a 10x10 (100 tiles) or 10x15 (150 tiles) Boustrophedon (zig-zag) grid.
 */
export function tileToSvgCenter(
  tile: number,
  maxTile: SnakesMaxTile = 100
): {
  x: number;
  y: number;
  row: number;
  col: number;
  rowHeight: number;
} {
  const totalRows = maxTile === 150 ? 15 : 10;
  const rowHeight = 100 / totalRows;
  const clamped = Math.max(1, Math.min(maxTile, tile));
  const zeroBased = clamped - 1;
  const rowFromBottom = Math.floor(zeroBased / 10);
  const colInRow = zeroBased % 10;
  const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  const row = totalRows - 1 - rowFromBottom;

  return {
    x: col * 10 + 5,
    y: row * rowHeight + rowHeight * 0.5,
    row,
    col,
    rowHeight,
  };
}

function segmentsConflict(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number,
  maxTile: SnakesMaxTile
): boolean {
  const a1 = tileToSvgCenter(fromA, maxTile);
  const a2 = tileToSvgCenter(toA, maxTile);
  const b1 = tileToSvgCenter(fromB, maxTile);
  const b2 = tileToSvgCenter(toB, maxTile);

  const ccw = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) => (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);

  const intersects =
    ccw(a1, b1, b2) !== ccw(a2, b1, b2) &&
    ccw(a1, a2, b1) !== ccw(a1, a2, b2);
  if (intersects) return true;

  const midAx = (a1.x + a2.x) * 0.5;
  const midAy = (a1.y + a2.y) * 0.5;
  const midBx = (b1.x + b2.x) * 0.5;
  const midBy = (b1.y + b2.y) * 0.5;
  const minMidDist = maxTile === 150 ? 9.5 : 12.5;
  if (Math.hypot(midAx - midBx, midAy - midBy) < minMidDist) return true;

  return false;
}

/**
 * Procedurally generates a clean, non-crossing Snakes & Ladders board from `seed`.
 * Supports 100-tile mode (5 ladders, 5 snakes, 8 mystery tiles)
 * and 150-tile mode (8 ladders, 9 snakes, 12 mystery tiles).
 */
export function generateSnakesBoard(
  seed: number,
  includeTwists = true,
  maxTile: SnakesMaxTile = 100
): GeneratedSnakesBoard {
  const rng = createMulberry32(seed + (maxTile === 150 ? 15000 : 0));
  const totalRows = maxTile === 150 ? 15 : 10;
  const usedEndpoints = new Set<number>([1, maxTile]);
  const startTiles = new Set<number>();

  const randInt = (min: number, max: number): number =>
    Math.floor(rng() * (max - min + 1)) + min;

  const createsThreeInARow = (tile: number): boolean => {
    return (
      (startTiles.has(tile - 1) && startTiles.has(tile - 2)) ||
      (startTiles.has(tile - 1) && startTiles.has(tile + 1)) ||
      (startTiles.has(tile + 1) && startTiles.has(tile + 2))
    );
  };

  const ladders: BoardJumpLink[] = [];
  const snakes: BoardJumpLink[] = [];
  const twists: TwistTile[] = [];
  const allLinks: { from: number; to: number }[] = [];

  const hasConflictWithExisting = (from: number, to: number): boolean => {
    for (const existing of allLinks) {
      if (segmentsConflict(from, to, existing.from, existing.to, maxTile)) {
        return true;
      }
    }
    return false;
  };

  // 1. Generate Honey-Wood Ladders
  const targetLadders = maxTile === 150 ? 8 : 5;
  let attempts = 0;
  while (ladders.length < targetLadders && attempts < 900) {
    attempts += 1;
    const from = randInt(3, maxTile - 18);
    const fromCenter = tileToSvgCenter(from, maxTile);
    const fromRowBottom = Math.floor((from - 1) / 10);
    const minToRow = fromRowBottom + 1;
    const maxToRow = Math.min(totalRows - 1, fromRowBottom + 3);
    if (minToRow > maxToRow) continue;

    const toRowBottom = randInt(minToRow, maxToRow);
    const to = toRowBottom * 10 + randInt(0, 9) + 1;
    const toCenter = tileToSvgCenter(to, maxTile);

    if (to >= maxTile - 1 || to <= from + 7) continue;
    if (Math.abs(toCenter.col - fromCenter.col) > 3) continue;
    if (usedEndpoints.has(from) || usedEndpoints.has(to)) continue;
    if (createsThreeInARow(from)) continue;
    if (hasConflictWithExisting(from, to)) continue;

    usedEndpoints.add(from);
    usedEndpoints.add(to);
    startTiles.add(from);
    allLinks.push({ from, to });

    ladders.push({
      id: `ladder-${ladders.length + 1}`,
      kind: 'ladder',
      from,
      to,
      color: '#F59E0B',
    });
  }

  // 2. Generate Chunky Cartoon Snakes
  const targetSnakes = maxTile === 150 ? 9 : 5;
  attempts = 0;
  while (snakes.length < targetSnakes && attempts < 1000) {
    attempts += 1;
    const hasHighSnake = snakes.some((s) => s.from >= maxTile - 8);
    const maxFrom = hasHighSnake ? maxTile - 9 : maxTile - 2;
    const from = randInt(16, maxFrom);
    const fromCenter = tileToSvgCenter(from, maxTile);
    const fromRowBottom = Math.floor((from - 1) / 10);
    if (fromRowBottom < 1) continue;

    const minToRow = Math.max(0, fromRowBottom - 3);
    const maxToRow = fromRowBottom - 1;
    const toRowBottom = randInt(minToRow, maxToRow);
    const to = toRowBottom * 10 + randInt(0, 9) + 1;
    const toCenter = tileToSvgCenter(to, maxTile);

    if (to <= 2 || from <= to + 7) continue;
    if (Math.abs(toCenter.col - fromCenter.col) > 3) continue;
    if (usedEndpoints.has(from) || usedEndpoints.has(to)) continue;
    if (createsThreeInARow(from)) continue;
    if (hasConflictWithExisting(from, to)) continue;

    usedEndpoints.add(from);
    usedEndpoints.add(to);
    startTiles.add(from);
    allLinks.push({ from, to });

    snakes.push({
      id: `snake-${snakes.length + 1}`,
      kind: 'snake',
      from,
      to,
      color: SNAKE_COLORS[snakes.length % SNAKE_COLORS.length],
    });
  }

  // 3. Generate Mystery Powerup Tiles (8 on 100-tile board, 12 on 150-tile board)
  // Note: Powerup granted on step is RANDOM, not predetermined!
  if (includeTwists) {
    const targetTwists = maxTile === 150 ? 12 : 8;
    for (let i = 0; i < targetTwists; i++) {
      for (let tries = 0; tries < 120; tries++) {
        const tile = randInt(6, maxTile - 5);
        if (usedEndpoints.has(tile) || createsThreeInARow(tile)) continue;
        usedEndpoints.add(tile);
        startTiles.add(tile);
        twists.push({
          tile,
          kind: ALL_RANDOM_TWISTS[i % ALL_RANDOM_TWISTS.length],
          label: 'Mystery Powerup!',
          icon: '?',
        });
        break;
      }
    }
  }

  return {
    seed,
    maxTile,
    ladders,
    snakes,
    twists,
  };
}

export function createInitialSnakesState(
  boardSeed = Math.floor(100000 + Math.random() * 899999),
  twistsEnabled = true,
  maxTile: SnakesMaxTile = 100,
  startingTurn?: PlayerSlot
): SnakesGameState {
  const turnRng = createMulberry32(boardSeed ^ 0x9e3779b9);
  const resolvedTurn: PlayerSlot =
    startingTurn ?? (turnRng() < 0.5 ? 'p1' : 'p2');
  return {
    boardSeed,
    twistsEnabled,
    maxTile,
    p1Tile: 1,
    p2Tile: 1,
    p1Shield: false,
    p2Shield: false,
    p1DoubleDiceTurns: 0,
    p2DoubleDiceTurns: 0,
    turn: resolvedTurn,
    winner: null,
    lastAnimation: null,
  };
}

/**
 * Pure turn resolver for Snakes & Ladders (100% symmetric & unbiased for both players).
 * - No bonus roll on hitting a 6.
 * - Supports 2-dice rolls when active player has `doubleDiceTurns > 0`.
 * - Reaching or passing `maxTile` wins immediately for whichever player arrives first.
 * - Landing on a Mystery Powerup tile grants a RANDOM powerup that never penalizes the leader.
 */
export function applySnakesDiceRoll(
  state: SnakesGameState,
  dice1: number,
  dice2?: number,
  randomEntropy = Math.floor(Math.random() * 100000)
): SnakesGameState {
  if (state.winner) return state;

  const maxTile: SnakesMaxTile = state.maxTile === 150 ? 150 : 100;
  const board = generateSnakesBoard(
    state.boardSeed,
    state.twistsEnabled,
    maxTile
  );
  const roller = state.turn;
  const startTile = roller === 'p1' ? state.p1Tile : state.p2Tile;
  const otherTile = roller === 'p1' ? state.p2Tile : state.p1Tile;
  let hasShield = roller === 'p1' ? state.p1Shield : state.p2Shield;
  let myDoubleDiceTurns =
    (roller === 'p1' ? state.p1DoubleDiceTurns : state.p2DoubleDiceTurns) ?? 0;

  const usedTwoDice = myDoubleDiceTurns > 0 && typeof dice2 === 'number';
  const totalDice = usedTwoDice ? dice1 + (dice2 ?? 0) : dice1;

  if (myDoubleDiceTurns > 0) {
    myDoubleDiceTurns = Math.max(0, myDoubleDiceTurns - 1);
  }

  const walkLandingTile = Math.min(maxTile, startTile + totalDice);

  let finalTile = walkLandingTile;
  let nextOtherTile = otherTile;
  let eventKind: SnakesTurnAnimation['eventKind'] = 'normal';
  let eventMessage = usedTwoDice
    ? `Rolled ${dice1} + ${dice2} = ${totalDice} → Tile ${walkLandingTile}`
    : `Rolled ${totalDice} → Tile ${walkLandingTile}`;
  let grantExtraRoll = false;

  const ladder = board.ladders.find((l) => l.from === walkLandingTile);
  const snake = board.snakes.find((s) => s.from === walkLandingTile);
  const isPowerupTile = board.twists.some((t) => t.tile === walkLandingTile);

  if (walkLandingTile < maxTile) {
    if (ladder) {
      finalTile = ladder.to;
      eventKind = 'ladder';
      eventMessage = `Climbed Ladder ${ladder.from} → ${ladder.to}!`;
    } else if (snake) {
      if (hasShield) {
        hasShield = false;
        finalTile = walkLandingTile;
        eventKind = 'shield_saved';
        eventMessage = `Bubble Shield blocked Snake at ${snake.from}!`;
      } else {
        finalTile = snake.to;
        eventKind = 'snake';
        eventMessage = `Oh no! Eaten by Snake ${snake.from} → ${snake.to}!`;
      }
    } else if (isPowerupTile) {
      // Pick a RANDOM powerup using symmetric entropy (identical distribution for p1 and p2)
      const rng = createMulberry32(
        state.boardSeed ^ (walkLandingTile * 7919) ^ randomEntropy
      );
      const chosenKind =
        ALL_RANDOM_TWISTS[Math.floor(rng() * ALL_RANDOM_TWISTS.length)];

      if (chosenKind === 'double_dice') {
        myDoubleDiceTurns += 2;
        eventKind = 'double_dice';
        eventMessage = `Twin Paw Dice! Roll 2 dice at once for 2 turns!`;
      } else if (chosenKind === 'boost') {
        finalTile = Math.min(maxTile, walkLandingTile + 4);
        eventKind = 'boost';
        eventMessage = `Catnip Zoomies! Jumped +4 → Tile ${finalTile}!`;
      } else if (chosenKind === 'shield') {
        hasShield = true;
        eventKind = 'shield_gain';
        eventMessage = `Bubble Purr Shield! Blocks your next snake bite!`;
      } else if (chosenKind === 'extra_roll') {
        grantExtraRoll = true;
        eventKind = 'extra_roll';
        eventMessage = `Lucky Golden Paw! Roll again right now!`;
      } else if (chosenKind === 'swap') {
        // Fair Switcheroo: only swaps when trailing within a fair 24-tile gap (never punishes the leader or steals a huge endgame lead!)
        const trailingGap = otherTile - walkLandingTile;
        if (
          trailingGap > 0 &&
          trailingGap <= 24 &&
          otherTile > 1 &&
          otherTile < maxTile - 6
        ) {
          finalTile = otherTile;
          nextOtherTile = walkLandingTile;
          eventKind = 'swap';
          eventMessage = `Switcheroo! Swapped tiles ${walkLandingTile} ↔ ${otherTile}!`;
        } else {
          finalTile = Math.min(maxTile, walkLandingTile + 4);
          eventKind = 'boost';
          eventMessage = `Catnip Zoomies! Jumped +4 → Tile ${finalTile}!`;
        }
      }
    }
  }

  const nextP1Tile = roller === 'p1' ? finalTile : nextOtherTile;
  const nextP2Tile = roller === 'p2' ? finalTile : nextOtherTile;
  const nextP1Shield = roller === 'p1' ? hasShield : state.p1Shield;
  const nextP2Shield = roller === 'p2' ? hasShield : state.p2Shield;
  const nextP1Double =
    roller === 'p1' ? myDoubleDiceTurns : state.p1DoubleDiceTurns ?? 0;
  const nextP2Double =
    roller === 'p2' ? myDoubleDiceTurns : state.p2DoubleDiceTurns ?? 0;

  // Symmetric winner check: evaluate the active roller first
  const winner: PlayerSlot | null =
    finalTile >= maxTile
      ? roller
      : nextOtherTile >= maxTile
      ? roller === 'p1'
        ? 'p2'
        : 'p1'
      : null;

  // Strictly NO bonus roll on hitting a 6 — only Lucky Paw ('extra_roll') grants an extra roll
  const nextTurn: PlayerSlot =
    winner || !grantExtraRoll ? (roller === 'p1' ? 'p2' : 'p1') : roller;

  return {
    boardSeed: state.boardSeed,
    twistsEnabled: state.twistsEnabled,
    maxTile,
    p1Tile: nextP1Tile,
    p2Tile: nextP2Tile,
    p1Shield: nextP1Shield,
    p2Shield: nextP2Shield,
    p1DoubleDiceTurns: nextP1Double,
    p2DoubleDiceTurns: nextP2Double,
    turn: nextTurn,
    winner,
    lastAnimation: {
      id: `${Date.now()}-${roller}-${totalDice}-${finalTile}`,
      roller,
      dice: totalDice,
      dice1: usedTwoDice ? dice1 : undefined,
      dice2: usedTwoDice ? dice2 : undefined,
      startTile,
      walkLandingTile,
      finalTile,
      eventKind,
      eventMessage,
    },
  };
}
