import { PlayerSlot } from '../types/arcade';

export type TwistKind = 'boost' | 'swap' | 'shield' | 'extra_roll';

export interface BoardJumpLink {
  id: string;
  kind: 'ladder' | 'snake';
  from: number; // 2..99
  to: number;   // 2..99
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
  '#2ec4b6',
  '#ff595e',
  '#8ac926',
  '#9b5de5',
  '#ff9f1c',
  '#00bbf9',
  '#f15bb5',
  '#fb5607',
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
export function tileToSvgCenter(tile: number): { x: number; y: number; row: number; col: number } {
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
 * Procedurally generates a balanced, fair Snakes & Ladders board from `seed`.
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

  // Avoid placing 3 consecutive start obstacles in a row
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

  // 1. Generate 8 Balanced Wooden Ladders (climbing up at least 1 row, delta 11..42)
  const targetLadders = 8;
  let attempts = 0;
  while (ladders.length < targetLadders && attempts < 400) {
    attempts += 1;
    const from = randInt(3, 84);
    const fromRow = Math.floor((from - 1) / 10);
    const minToRow = fromRow + 1;
    const maxToRow = Math.min(9, fromRow + 4);
    if (minToRow > maxToRow) continue;

    const toRow = randInt(minToRow, maxToRow);
    const toColOffset = randInt(0, 9);
    const to = toRow * 10 + toColOffset + 1;

    if (to >= 99 || to <= from + 8) continue;
    if (usedEndpoints.has(from) || usedEndpoints.has(to)) continue;
    if (createsThreeInARow(from)) continue;

    usedEndpoints.add(from);
    usedEndpoints.add(to);
    startTiles.add(from);

    ladders.push({
      id: `ladder-${ladders.length + 1}`,
      kind: 'ladder',
      from,
      to,
      color: '#9c6644',
    });
  }

  // 2. Generate 8 Classic Colorful Cartoon Snakes (sliding down at least 1 row, from 16..98)
  const targetSnakes = 8;
  attempts = 0;
  while (snakes.length < targetSnakes && attempts < 450) {
    attempts += 1;
    // Allow at most 1 high-tension snake between 92..98
    const hasHighSnake = snakes.some((s) => s.from >= 92);
    const maxFrom = hasHighSnake ? 91 : 98;
    const from = randInt(17, maxFrom);
    const fromRow = Math.floor((from - 1) / 10);
    if (fromRow < 1) continue;

    const minToRow = Math.max(0, fromRow - 4);
    const maxToRow = fromRow - 1;
    const toRow = randInt(minToRow, maxToRow);
    const to = toRow * 10 + randInt(0, 9) + 1;

    if (to <= 2 || from <= to + 8) continue;
    if (usedEndpoints.has(from) || usedEndpoints.has(to)) continue;
    if (createsThreeInARow(from)) continue;

    usedEndpoints.add(from);
    usedEndpoints.add(to);
    startTiles.add(from);

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
    const twistSpecs: readonly { kind: TwistKind; label: string; icon: string }[] = [
      { kind: 'boost', label: 'Catnip Boost +3!', icon: '⚡' },
      { kind: 'shield', label: 'Snake Shield!', icon: '🛡️' },
      { kind: 'extra_roll', label: 'Lucky Paw Extra Roll!', icon: '🎲' },
      { kind: 'swap', label: 'Switcheroo Swap!', icon: '🔄' },
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
 * Handles dice roll (1..6), bounce-back on 100, ladders, snakes (with shield protection),
 * and Mystery Twist tiles.
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

  // Step 1: Walk forward by `dice` (bounce back if exceeding 100)
  let walkLandingTile = startTile + dice;
  if (walkLandingTile > 100) {
    walkLandingTile = 100 - (walkLandingTile - 100);
  }

  let finalTile = walkLandingTile;
  let nextOtherTile = otherTile;
  let eventKind: SnakesTurnAnimation['eventKind'] = 'normal';
  let eventMessage = `Rolled ${dice} → Tile ${walkLandingTile}`;
  let grantExtraRoll = dice === 6;

  // Step 2: Check Ladder at `walkLandingTile`
  const ladder = board.ladders.find((l) => l.from === walkLandingTile);
  const snake = board.snakes.find((s) => s.from === walkLandingTile);
  const twist = board.twists.find((t) => t.tile === walkLandingTile);

  if (ladder) {
    finalTile = ladder.to;
    eventKind = 'ladder';
    eventMessage = `🪜 Climbed Ladder ${ladder.from} → ${ladder.to}!`;
  } else if (snake) {
    if (hasShield) {
      hasShield = false;
      finalTile = walkLandingTile;
      eventKind = 'shield_saved';
      eventMessage = `🛡️ Shield blocked Snake at ${snake.from}!`;
    } else {
      finalTile = snake.to;
      eventKind = 'snake';
      eventMessage = `🐍 Oh no! Slid down Snake ${snake.from} → ${snake.to} (@_@)`;
    }
  } else if (twist) {
    if (twist.kind === 'boost') {
      finalTile = Math.min(100, walkLandingTile + 3);
      eventKind = 'boost';
      eventMessage = `⚡ Catnip Boost! Jumped +3 to Tile ${finalTile}!`;
    } else if (twist.kind === 'shield') {
      hasShield = true;
      eventKind = 'shield_gain';
      eventMessage = `🛡️ Picked up a Snake Shield!`;
    } else if (twist.kind === 'extra_roll') {
      grantExtraRoll = true;
      eventKind = 'extra_roll';
      eventMessage = `🎲 Lucky Paw! Earned an Extra Roll!`;
    } else if (twist.kind === 'swap') {
      if (otherTile !== walkLandingTile && otherTile > 1 && otherTile < 100) {
        finalTile = otherTile;
        nextOtherTile = walkLandingTile;
        eventKind = 'swap';
        eventMessage = `🔄 Switcheroo! Swapped tiles (${walkLandingTile} ↔ ${otherTile})!`;
      } else {
        finalTile = Math.min(100, walkLandingTile + 2);
        eventKind = 'boost';
        eventMessage = `🔄 Mystery Hop +2 to Tile ${finalTile}!`;
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
    eventMessage = `🎲 Rolled a 6! Tile ${finalTile} + Bonus Roll!`;
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
