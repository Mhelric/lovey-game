import { PlayerSlot } from '../types/arcade';

export type TwistKind = 'boost' | 'swap' | 'shield' | 'extra_roll';

export interface BoardJumpLink {
  id: string;
  kind: 'ladder' | 'snake';
  from: number; // 2..99
  to: number; // 2..99
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
  ladders: BoardJumpLink[];
  snakes: BoardJumpLink[];
  twists: TwistTile[];
}

export interface SnakesTurnAnimation {
  id: string;
  roller: PlayerSlot;
  dice: number;
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
    | 'extra_roll';
  eventMessage: string;
}

export interface SnakesGameState {
  boardSeed: number;
  twistsEnabled: boolean;
  p1Tile: number; // 1..100
  p2Tile: number; // 1..100
  p1Shield: boolean;
  p2Shield: boolean;
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
 * Converts a tile number (1..100) into SVG center coordinates (x: 0..100, y: 0..100)
 * on a 10x10 Boustrophedon (zig-zag) grid where tile 1 is bottom-left and 100 is top-left.
 */
export function tileToSvgCenter(tile: number): {
  x: number;
  y: number;
  row: number;
  col: number;
} {
  const clamped = Math.max(1, Math.min(100, tile));
  const zeroBased = clamped - 1;
  const rowFromBottom = Math.floor(zeroBased / 10); // 0..9
  const colInRow = zeroBased % 10;
  const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  const row = 9 - rowFromBottom; // 0 is top row, 9 is bottom row

  return {
    x: col * 10 + 5,
    y: row * 10 + 5,
    row,
    col,
  };
}

/**
 * Returns true if segment AB and segment CD intersect or pass within `minDist` of each other.
 */
function segmentsConflict(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number
): boolean {
  const a1 = tileToSvgCenter(fromA);
  const a2 = tileToSvgCenter(toA);
  const b1 = tileToSvgCenter(fromB);
  const b2 = tileToSvgCenter(toB);

  const ccw = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) => (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);

  const intersects =
    ccw(a1, b1, b2) !== ccw(a2, b1, b2) &&
    ccw(a1, a2, b1) !== ccw(a1, a2, b2);
  if (intersects) return true;

  // Also check midpoint proximity so wavy snakes and ladders don't visually crowd
  const midAx = (a1.x + a2.x) * 0.5;
  const midAy = (a1.y + a2.y) * 0.5;
  const midBx = (b1.x + b2.x) * 0.5;
  const midBy = (b1.y + b2.y) * 0.5;
  if (Math.hypot(midAx - midBx, midAy - midBy) < 13) return true;

  return false;
}

/**
 * Procedurally generates a clean, non-crossing Snakes & Ladders board from `seed`.
 * Uses 5 ladders and 5 snakes, each spanning <= 3 rows and <= 3 columns horizontally.
 */
export function generateSnakesBoard(
  seed: number,
  includeTwists = true
): GeneratedSnakesBoard {
  const rng = createMulberry32(seed);
  const usedEndpoints = new Set<number>([1, 100]);
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
      if (segmentsConflict(from, to, existing.from, existing.to)) {
        return true;
      }
    }
    return false;
  };

  // 1. Generate 5 Non-Crossing Honey-Wood Ladders (each spanning 1..3 rows and <= 3 cols)
  const targetLadders = 5;
  let attempts = 0;
  while (ladders.length < targetLadders && attempts < 600) {
    attempts += 1;
    const from = randInt(3, 82);
    const fromCenter = tileToSvgCenter(from);
    const fromRowBottom = Math.floor((from - 1) / 10);
    const minToRow = fromRowBottom + 1;
    const maxToRow = Math.min(9, fromRowBottom + 3);
    if (minToRow > maxToRow) continue;

    const toRowBottom = randInt(minToRow, maxToRow);
    const to = toRowBottom * 10 + randInt(0, 9) + 1;
    const toCenter = tileToSvgCenter(to);

    if (to >= 99 || to <= from + 7) continue;
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

  // 2. Generate 5 Non-Crossing Chunky Cartoon Snakes (each spanning 1..3 rows and <= 3 cols)
  const targetSnakes = 5;
  attempts = 0;
  while (snakes.length < targetSnakes && attempts < 700) {
    attempts += 1;
    const hasHighSnake = snakes.some((s) => s.from >= 92);
    const maxFrom = hasHighSnake ? 91 : 98;
    const from = randInt(18, maxFrom);
    const fromCenter = tileToSvgCenter(from);
    const fromRowBottom = Math.floor((from - 1) / 10);
    if (fromRowBottom < 1) continue;

    const minToRow = Math.max(0, fromRowBottom - 3);
    const maxToRow = fromRowBottom - 1;
    const toRowBottom = randInt(minToRow, maxToRow);
    const to = toRowBottom * 10 + randInt(0, 9) + 1;
    const toCenter = tileToSvgCenter(to);

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

  // 3. Generate 4 Mystery Twist Tiles (if enabled)
  if (includeTwists) {
    const twistSpecs: readonly {
      kind: TwistKind;
      label: string;
      icon: string;
    }[] = [
      { kind: 'boost', label: 'Catnip Boost +3!', icon: '+3' },
      { kind: 'shield', label: 'Snake Shield!', icon: 'SHIELD' },
      { kind: 'extra_roll', label: 'Lucky Paw Extra Roll!', icon: 'ROLL' },
      { kind: 'swap', label: 'Switcheroo Swap!', icon: 'SWAP' },
    ];

    for (const spec of twistSpecs) {
      for (let tries = 0; tries < 80; tries++) {
        const tile = randInt(12, 88);
        if (usedEndpoints.has(tile) || createsThreeInARow(tile)) continue;
        usedEndpoints.add(tile);
        startTiles.add(tile);
        twists.push({
          tile,
          kind: spec.kind,
          label: spec.label,
          icon: spec.icon,
        });
        break;
      }
    }
  }

  return {
    seed,
    ladders,
    snakes,
    twists,
  };
}

export function createInitialSnakesState(
  boardSeed = Math.floor(100000 + Math.random() * 899999),
  twistsEnabled = true
): SnakesGameState {
  return {
    boardSeed,
    twistsEnabled,
    p1Tile: 1,
    p2Tile: 1,
    p1Shield: false,
    p2Shield: false,
    turn: 'p1',
    winner: null,
    lastAnimation: null,
  };
}

/**
 * Pure turn resolver for Snakes & Ladders.
 */
export function applySnakesDiceRoll(
  state: SnakesGameState,
  dice: number
): SnakesGameState {
  if (state.winner) return state;

  const board = generateSnakesBoard(state.boardSeed, state.twistsEnabled);
  const roller = state.turn;
  const startTile = roller === 'p1' ? state.p1Tile : state.p2Tile;
  const otherTile = roller === 'p1' ? state.p2Tile : state.p1Tile;
  let hasShield = roller === 'p1' ? state.p1Shield : state.p2Shield;

  let walkLandingTile = startTile + dice;
  if (walkLandingTile > 100) {
    walkLandingTile = 100 - (walkLandingTile - 100);
  }

  let finalTile = walkLandingTile;
  let nextOtherTile = otherTile;
  let eventKind: SnakesTurnAnimation['eventKind'] = 'normal';
  let eventMessage = `Rolled ${dice} → Tile ${walkLandingTile}`;
  let grantExtraRoll = dice === 6;

  const ladder = board.ladders.find((l) => l.from === walkLandingTile);
  const snake = board.snakes.find((s) => s.from === walkLandingTile);
  const twist = board.twists.find((t) => t.tile === walkLandingTile);

  if (ladder) {
    finalTile = ladder.to;
    eventKind = 'ladder';
    eventMessage = `Climbed Ladder ${ladder.from} → ${ladder.to}!`;
  } else if (snake) {
    if (hasShield) {
      hasShield = false;
      finalTile = walkLandingTile;
      eventKind = 'shield_saved';
      eventMessage = `Shield blocked Snake at ${snake.from}!`;
    } else {
      finalTile = snake.to;
      eventKind = 'snake';
      eventMessage = `Oh no! Slid down Snake ${snake.from} → ${snake.to}!`;
    }
  } else if (twist) {
    if (twist.kind === 'boost') {
      finalTile = Math.min(100, walkLandingTile + 3);
      eventKind = 'boost';
      eventMessage = `Catnip Boost! Jumped +3 → Tile ${finalTile}!`;
    } else if (twist.kind === 'shield') {
      hasShield = true;
      eventKind = 'shield_gain';
      eventMessage = `Picked up a Snake Shield!`;
    } else if (twist.kind === 'extra_roll') {
      grantExtraRoll = true;
      eventKind = 'extra_roll';
      eventMessage = `Lucky Paw! Earned an Extra Roll!`;
    } else if (twist.kind === 'swap') {
      if (otherTile !== walkLandingTile && otherTile > 1 && otherTile < 100) {
        finalTile = otherTile;
        nextOtherTile = walkLandingTile;
        eventKind = 'swap';
        eventMessage = `Switcheroo! Swapped tiles ${walkLandingTile} ↔ ${otherTile}!`;
      } else {
        finalTile = Math.min(100, walkLandingTile + 2);
        eventKind = 'boost';
        eventMessage = `Mystery Hop +2 → Tile ${finalTile}!`;
      }
    }
  }

  const nextP1Tile = roller === 'p1' ? finalTile : nextOtherTile;
  const nextP2Tile = roller === 'p2' ? finalTile : nextOtherTile;
  const nextP1Shield = roller === 'p1' ? hasShield : state.p1Shield;
  const nextP2Shield = roller === 'p2' ? hasShield : state.p2Shield;

  const winner: PlayerSlot | null =
    nextP1Tile === 100 ? 'p1' : nextP2Tile === 100 ? 'p2' : null;

  const nextTurn: PlayerSlot =
    winner || !grantExtraRoll ? (roller === 'p1' ? 'p2' : 'p1') : roller;

  if (!winner && dice === 6 && eventKind === 'normal') {
    eventMessage = `Rolled a 6! Tile ${finalTile} + Bonus Roll!`;
  }

  return {
    boardSeed: state.boardSeed,
    twistsEnabled: state.twistsEnabled,
    p1Tile: nextP1Tile,
    p2Tile: nextP2Tile,
    p1Shield: nextP1Shield,
    p2Shield: nextP2Shield,
    turn: nextTurn,
    winner,
    lastAnimation: {
      id: `${Date.now()}-${roller}-${dice}-${finalTile}`,
      roller,
      dice,
      startTile,
      walkLandingTile,
      finalTile,
      eventKind,
      eventMessage,
    },
  };
}
