import { PlayerSlot } from '../types/arcade';

/**
 * Cat Billiards — shared state shape + rack setup.
 * Kept tiny on purpose: this file ships in the main bundle (App.tsx needs the
 * initial state). All physics & rules live in billiardsEngine.ts, which is only
 * loaded with the lazy BilliardsBoardView chunk.
 *
 * Table units: playfield is TABLE_W × TABLE_H (portrait), origin top-left.
 * The head (break) end is at the bottom, the rack sits at the top.
 */
export const TABLE_W = 50;
export const TABLE_H = 100;
export const BALL_R = 1.45;
export const HEAD_LINE_Y = 75;
export const FOOT_SPOT_Y = 25;

export type BilliardsGroup = 'solids' | 'stripes';

export interface PoolBall {
  /** 0 = cue ball, 1-7 solids, 8 = eight ball, 9-15 stripes */
  n: number;
  x: number;
  y: number;
  /** true once pocketed */
  sunk: boolean;
}

export type BilliardsEventKind =
  | 'break'
  | 'pot'
  | 'miss'
  | 'foul'
  | 'group'
  | 'win'
  | 'lose8';

export interface BilliardsShot {
  id: string;
  shooter: PlayerSlot;
  dirX: number;
  dirY: number;
  power: number;
  /** Ball layout right before the strike, so both phones replay the exact same roll */
  startBalls: PoolBall[];
}

export interface BilliardsEvent {
  id: string;
  kind: BilliardsEventKind;
  shooter: PlayerSlot;
  potted: number;
  foulReason?: 'scratch' | 'no_hit' | 'wrong_ball';
  group?: BilliardsGroup;
}

export interface BilliardsGameState {
  matchSeed: number;
  balls: PoolBall[];
  turn: PlayerSlot;
  p1Group: BilliardsGroup | null;
  p2Group: BilliardsGroup | null;
  /** Shooter may place the cue ball before shooting */
  ballInHand: boolean;
  /** Before the opening break (cue ball must stay behind the head line) */
  isBreak: boolean;
  shotCount: number;
  winner: PlayerSlot | null;
  lastShot: BilliardsShot | null;
  lastEvent: BilliardsEvent | null;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Standard 8-ball triangle: 8 in the middle, one solid + one stripe in the back corners */
export function buildRack(seed: number): PoolBall[] {
  const rand = mulberry32(seed);
  const solids = [1, 2, 3, 4, 5, 6, 7];
  const stripes = [9, 10, 11, 12, 13, 14, 15];
  const shuffle = (arr: number[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  shuffle(solids);
  shuffle(stripes);
  const leftCornerSolid = rand() < 0.5;
  const cornerA = leftCornerSolid ? solids.pop()! : stripes.pop()!;
  const cornerB = leftCornerSolid ? stripes.pop()! : solids.pop()!;
  const rest = shuffle([...solids, ...stripes]);

  // Row 0 = apex (closest to the cue ball), row 4 = back row
  const gap = BALL_R * 2 + 0.03;
  const rowDy = gap * 0.8660254;
  const balls: PoolBall[] = [];
  for (let row = 0; row < 5; row++) {
    for (let k = 0; k <= row; k++) {
      let n: number;
      if (row === 2 && k === 1) n = 8;
      else if (row === 4 && k === 0) n = cornerA;
      else if (row === 4 && k === 4) n = cornerB;
      else n = rest.pop()!;
      balls.push({
        n,
        x: r3(TABLE_W / 2 + (k - row / 2) * gap),
        y: r3(FOOT_SPOT_Y - row * rowDy),
        sunk: false,
      });
    }
  }
  balls.unshift({ n: 0, x: TABLE_W / 2, y: 82, sunk: false });
  return balls;
}

export function createInitialBilliardsState(
  seed = 202613,
  startingTurn: PlayerSlot = 'p1'
): BilliardsGameState {
  return {
    matchSeed: seed,
    balls: buildRack(seed),
    turn: startingTurn,
    p1Group: null,
    p2Group: null,
    ballInHand: true,
    isBreak: true,
    shotCount: 0,
    winner: null,
    lastShot: null,
    lastEvent: null,
  };
}

export function isBilliardsMatchActive(s: BilliardsGameState | null | undefined): boolean {
  return Boolean(s && Array.isArray(s.balls) && !s.winner && s.shotCount > 0);
}

/** Bottom-dock tag, e.g. "Solids • 5 left" */
export function billiardsPlayerTag(s: BilliardsGameState, slot: PlayerSlot): string {
  const g = slot === 'p1' ? s.p1Group : s.p2Group;
  if (!g) return 'Open table';
  const left = s.balls.filter(
    (b) => !b.sunk && (g === 'solids' ? b.n >= 1 && b.n <= 7 : b.n >= 9)
  ).length;
  return left === 0 ? `${g === 'solids' ? 'Solids' : 'Stripes'} • Sink 8!` : `${g === 'solids' ? 'Solids' : 'Stripes'} • ${left} left`;
}
