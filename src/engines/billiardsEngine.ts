import { PlayerSlot } from '../types/arcade';
import {
  BALL_R,
  BilliardsEvent,
  BilliardsGameState,
  BilliardsGroup,
  FOOT_SPOT_Y,
  HEAD_LINE_Y,
  PoolBall,
  TABLE_H,
  TABLE_W,
} from './billiardsSetup';

/**
 * Cat Billiards — pure, deterministic fixed-step physics + 8-ball rules.
 * No DOM, no Preact. Only +, -, *, / and Math.sqrt are used inside the
 * simulation so both phones replay a shot to the same result from the same
 * start layout + cue direction + power.
 */

const DT = 1 / 240;
const SAMPLE_EVERY = 4; // 60 fps playback frames
const MAX_STEPS = 240 * 14;
const ROLL_DECEL = 16; // units / s²
const DAMPING = 0.3; // proportional drag / s
const STOP_SPEED = 0.6;
const BALL_E = 0.95;
const RAIL_E = 0.78;
const MIN_SPEED = 8;
const MAX_SPEED = 230;

const CORNER_MOUTH = 3.4;
const SIDE_MOUTH = 2.6;
const CORNER_CAPTURE = 2.9;
const SIDE_CAPTURE = 2.3;
const D2 = BALL_R * 2;

export const POCKETS: readonly { x: number; y: number; r: number }[] = [
  { x: -0.8, y: -0.8, r: CORNER_CAPTURE },
  { x: TABLE_W + 0.8, y: -0.8, r: CORNER_CAPTURE },
  { x: -1, y: TABLE_H / 2, r: SIDE_CAPTURE },
  { x: TABLE_W + 1, y: TABLE_H / 2, r: SIDE_CAPTURE },
  { x: -0.8, y: TABLE_H + 0.8, r: CORNER_CAPTURE },
  { x: TABLE_W + 0.8, y: TABLE_H + 0.8, r: CORNER_CAPTURE },
];

export type SoundKind = 'clack' | 'rail' | 'pocket';

export interface ShotSimResult {
  /** frames[f][i*2], frames[f][i*2+1] = position of balls[i]; NaN once sunk */
  frames: Float32Array[];
  balls: PoolBall[];
  firstHit: number | null;
  sunkOrder: number[];
  sounds: { f: number; k: SoundKind; v: number }[];
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;

export const isSolid = (n: number) => n >= 1 && n <= 7;
export const isStripe = (n: number) => n >= 9 && n <= 15;
const inGroup = (n: number, g: BilliardsGroup) => (g === 'solids' ? isSolid(n) : isStripe(n));

export function shotSpeed(power: number): number {
  const p = Math.max(0, Math.min(1, power));
  // Quadratic curve: finer control for soft shots, full power still breaks hard
  return MIN_SPEED + p * p * (MAX_SPEED - MIN_SPEED);
}

function inLeftRightMouth(y: number): boolean {
  return y < CORNER_MOUTH || y > TABLE_H - CORNER_MOUTH || Math.abs(y - TABLE_H / 2) < SIDE_MOUTH;
}

function inTopBottomMouth(x: number): boolean {
  return x < CORNER_MOUTH || x > TABLE_W - CORNER_MOUTH;
}

export function simulateShot(
  start: PoolBall[],
  dirX: number,
  dirY: number,
  power: number
): ShotSimResult {
  const count = start.length;
  const px = new Float64Array(count);
  const py = new Float64Array(count);
  const vx = new Float64Array(count);
  const vy = new Float64Array(count);
  const sunk: boolean[] = [];
  let cueIdx = -1;
  for (let i = 0; i < count; i++) {
    px[i] = start[i].x;
    py[i] = start[i].y;
    sunk.push(start[i].sunk);
    if (start[i].n === 0) cueIdx = i;
  }
  const speed = shotSpeed(power);
  if (cueIdx >= 0 && !sunk[cueIdx]) {
    vx[cueIdx] = dirX * speed;
    vy[cueIdx] = dirY * speed;
  }

  const frames: Float32Array[] = [];
  const sounds: ShotSimResult['sounds'] = [];
  const sunkOrder: number[] = [];
  let firstHit: number | null = null;

  const snap = () => {
    const f = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      f[i * 2] = sunk[i] ? NaN : px[i];
      f[i * 2 + 1] = sunk[i] ? NaN : py[i];
    }
    frames.push(f);
  };
  snap();

  for (let step = 1; step <= MAX_STEPS; step++) {
    const frameIdx = Math.floor(step / SAMPLE_EVERY);
    let moving = false;

    // 1. Integrate + friction
    for (let i = 0; i < count; i++) {
      if (sunk[i]) continue;
      const sx = vx[i];
      const sy = vy[i];
      const sp = Math.sqrt(sx * sx + sy * sy);
      if (sp === 0) continue;
      const nextSp = sp - (ROLL_DECEL + DAMPING * sp) * DT;
      if (nextSp <= STOP_SPEED) {
        vx[i] = 0;
        vy[i] = 0;
        continue;
      }
      const k = nextSp / sp;
      vx[i] = sx * k;
      vy[i] = sy * k;
      px[i] += vx[i] * DT;
      py[i] += vy[i] * DT;
      moving = true;

      // 2. Cushions (open where a pocket mouth is)
      if (px[i] < BALL_R && !inLeftRightMouth(py[i])) {
        px[i] = BALL_R * 2 - px[i];
        vx[i] = -vx[i] * RAIL_E;
        sounds.push({ f: frameIdx, k: 'rail', v: Math.abs(vx[i]) });
      } else if (px[i] > TABLE_W - BALL_R && !inLeftRightMouth(py[i])) {
        px[i] = (TABLE_W - BALL_R) * 2 - px[i];
        vx[i] = -vx[i] * RAIL_E;
        sounds.push({ f: frameIdx, k: 'rail', v: Math.abs(vx[i]) });
      }
      if (py[i] < BALL_R && !inTopBottomMouth(px[i])) {
        py[i] = BALL_R * 2 - py[i];
        vy[i] = -vy[i] * RAIL_E;
        sounds.push({ f: frameIdx, k: 'rail', v: Math.abs(vy[i]) });
      } else if (py[i] > TABLE_H - BALL_R && !inTopBottomMouth(px[i])) {
        py[i] = (TABLE_H - BALL_R) * 2 - py[i];
        vy[i] = -vy[i] * RAIL_E;
        sounds.push({ f: frameIdx, k: 'rail', v: Math.abs(vy[i]) });
      }

      // 3. Pockets
      let drop =
        px[i] < -BALL_R || px[i] > TABLE_W + BALL_R || py[i] < -BALL_R || py[i] > TABLE_H + BALL_R;
      if (!drop) {
        for (const p of POCKETS) {
          const dx = px[i] - p.x;
          const dy = py[i] - p.y;
          if (dx * dx + dy * dy < p.r * p.r) {
            drop = true;
            break;
          }
        }
      }
      if (drop) {
        sunk[i] = true;
        vx[i] = 0;
        vy[i] = 0;
        sunkOrder.push(start[i].n);
        sounds.push({ f: frameIdx, k: 'pocket', v: 1 });
      }
    }

    // 4. Ball-ball collisions (equal mass, slightly inelastic)
    for (let i = 0; i < count; i++) {
      if (sunk[i]) continue;
      for (let j = i + 1; j < count; j++) {
        if (sunk[j]) continue;
        const dx = px[j] - px[i];
        const dy = py[j] - py[i];
        const d2 = dx * dx + dy * dy;
        if (d2 >= D2 * D2) continue;
        const d = Math.sqrt(d2);
        const nx = d > 0 ? dx / d : 1;
        const ny = d > 0 ? dy / d : 0;
        const push = (D2 - d) / 2;
        px[i] -= nx * push;
        py[i] -= ny * push;
        px[j] += nx * push;
        py[j] += ny * push;
        const rel = (vx[i] - vx[j]) * nx + (vy[i] - vy[j]) * ny;
        if (rel > 0) {
          const imp = ((1 + BALL_E) / 2) * rel;
          vx[i] -= imp * nx;
          vy[i] -= imp * ny;
          vx[j] += imp * nx;
          vy[j] += imp * ny;
          moving = true;
          sounds.push({ f: frameIdx, k: 'clack', v: rel });
          if (firstHit === null && (i === cueIdx || j === cueIdx)) {
            firstHit = start[i === cueIdx ? j : i].n;
          }
        }
      }
    }

    if (step % SAMPLE_EVERY === 0) snap();
    if (!moving) break;
  }

  const balls: PoolBall[] = start.map((b, i) => ({
    n: b.n,
    x: sunk[i] ? b.x : r3(px[i]),
    y: sunk[i] ? b.y : r3(py[i]),
    sunk: sunk[i],
  }));
  const last = new Float32Array(count * 2);
  balls.forEach((b, i) => {
    last[i * 2] = b.sunk ? NaN : b.x;
    last[i * 2 + 1] = b.sunk ? NaN : b.y;
  });
  frames.push(last);

  return { frames, balls, firstHit, sunkOrder, sounds };
}

/* -------------------------------------------------------------------------- */
/*  Cue ball placement                                                        */
/* -------------------------------------------------------------------------- */

export function isCueSpotFree(balls: PoolBall[], x: number, y: number, isBreak: boolean): boolean {
  if (x < BALL_R || x > TABLE_W - BALL_R || y < BALL_R || y > TABLE_H - BALL_R) return false;
  if (isBreak && y < HEAD_LINE_Y) return false;
  return balls.every((b) => b.n === 0 || b.sunk || (b.x - x) ** 2 + (b.y - y) ** 2 >= (D2 + 0.05) ** 2);
}

function findFreeSpot(balls: PoolBall[], x: number, y: number, dir: 1 | -1): { x: number; y: number } {
  for (let k = 0; k < 400; k++) {
    const ty = y + dir * k * 0.25;
    if (ty < BALL_R || ty > TABLE_H - BALL_R) break;
    const free = balls.every(
      (b) => b.sunk || b.n === 0 || (b.x - x) ** 2 + (b.y - ty) ** 2 >= (D2 + 0.05) ** 2
    );
    if (free) return { x, y: r3(ty) };
  }
  return { x: r3(BALL_R + 1), y: r3(TABLE_H - BALL_R - 1) };
}

export function placeCueBall(state: BilliardsGameState, x: number, y: number): BilliardsGameState | null {
  if (!state.ballInHand || state.winner) return null;
  const cx = r3(x);
  const cy = r3(y);
  if (!isCueSpotFree(state.balls, cx, cy, state.isBreak)) return null;
  return {
    ...state,
    balls: state.balls.map((b) => (b.n === 0 ? { ...b, x: cx, y: cy, sunk: false } : b)),
  };
}

/* -------------------------------------------------------------------------- */
/*  Rules                                                                     */
/* -------------------------------------------------------------------------- */

const other = (s: PlayerSlot): PlayerSlot => (s === 'p1' ? 'p2' : 'p1');

function groupCleared(balls: PoolBall[], g: BilliardsGroup | null): boolean {
  return Boolean(g) && balls.every((b) => !inGroup(b.n, g as BilliardsGroup) || b.sunk);
}

export function performShot(
  state: BilliardsGameState,
  dirX: number,
  dirY: number,
  power: number
): { next: BilliardsGameState; sim: ShotSimResult } {
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const dx = r6(dirX / len);
  const dy = r6(dirY / len);
  const pw = r3(Math.max(0, Math.min(1, power)));
  const shooter = state.turn;
  const sim = simulateShot(state.balls, dx, dy, pw);

  const myGroup = shooter === 'p1' ? state.p1Group : state.p2Group;
  const clearedBefore = groupCleared(state.balls, myGroup);
  const objectSunk = sim.sunkOrder.filter((n) => n !== 0 && n !== 8);
  const scratch = sim.sunkOrder.includes(0);
  const eightIn = sim.sunkOrder.includes(8);

  let foulReason: BilliardsEvent['foulReason'];
  if (scratch) foulReason = 'scratch';
  else if (sim.firstHit === null) foulReason = 'no_hit';
  else if (!state.isBreak) {
    if (myGroup) {
      const legal = clearedBefore ? sim.firstHit === 8 : inGroup(sim.firstHit, myGroup);
      if (!legal) foulReason = 'wrong_ball';
    } else if (sim.firstHit === 8) {
      foulReason = 'wrong_ball';
    }
  }
  const foul = Boolean(foulReason);

  let balls = sim.balls;
  let p1Group = state.p1Group;
  let p2Group = state.p2Group;
  let winner: PlayerSlot | null = null;
  let kind: BilliardsEvent['kind'];
  let assigned: BilliardsGroup | undefined;

  // Eight ball outcome
  if (eightIn && state.isBreak) {
    const spot = findFreeSpot(balls, TABLE_W / 2, FOOT_SPOT_Y, -1);
    balls = balls.map((b) => (b.n === 8 ? { ...b, ...spot, sunk: false } : b));
  } else if (eightIn) {
    winner = clearedBefore && !foul ? shooter : other(shooter);
  }

  // Group assignment on an open table (never on the break)
  if (!winner && !foul && !myGroup && !state.isBreak && objectSunk.length > 0) {
    assigned = isSolid(objectSunk[0]) ? 'solids' : 'stripes';
    const opp: BilliardsGroup = assigned === 'solids' ? 'stripes' : 'solids';
    if (shooter === 'p1') {
      p1Group = assigned;
      p2Group = opp;
    } else {
      p2Group = assigned;
      p1Group = opp;
    }
  }

  const groupNow = shooter === 'p1' ? p1Group : p2Group;
  const pottedOwn = groupNow
    ? objectSunk.filter((n) => inGroup(n, groupNow)).length
    : objectSunk.length;
  const keepsTurn = !winner && !foul && pottedOwn > 0;

  // Respawn the cue ball for ball-in-hand after a scratch
  if (scratch && !winner) {
    const spot = findFreeSpot(balls, TABLE_W / 2, 82, -1);
    balls = balls.map((b) => (b.n === 0 ? { ...b, ...spot, sunk: false } : b));
  }

  if (winner) kind = winner === shooter ? 'win' : 'lose8';
  else if (foul) kind = 'foul';
  else if (assigned) kind = 'group';
  else if (state.isBreak) kind = 'break';
  else if (pottedOwn > 0) kind = 'pot';
  else kind = 'miss';

  const id = `bl-${state.matchSeed}-${state.shotCount + 1}`;
  const next: BilliardsGameState = {
    ...state,
    balls,
    p1Group,
    p2Group,
    turn: winner ? state.turn : keepsTurn ? shooter : other(shooter),
    ballInHand: !winner && foul,
    isBreak: false,
    shotCount: state.shotCount + 1,
    winner,
    lastShot: { id, shooter, dirX: dx, dirY: dy, power: pw, startBalls: state.balls },
    lastEvent: {
      id,
      kind,
      shooter,
      potted: objectSunk.length + (eightIn && !state.isBreak ? 1 : 0),
      foulReason,
      group: assigned,
    },
  };
  return { next, sim };
}

/* -------------------------------------------------------------------------- */
/*  Aim preview                                                               */
/* -------------------------------------------------------------------------- */

export interface AimPreview {
  endX: number;
  endY: number;
  hitBall: PoolBall | null;
  objDirX: number;
  objDirY: number;
}

export function computeAimPreview(
  balls: PoolBall[],
  cx: number,
  cy: number,
  dx: number,
  dy: number
): AimPreview {
  let tMin = Infinity;
  if (dx < 0) tMin = Math.min(tMin, (BALL_R - cx) / dx);
  if (dx > 0) tMin = Math.min(tMin, (TABLE_W - BALL_R - cx) / dx);
  if (dy < 0) tMin = Math.min(tMin, (BALL_R - cy) / dy);
  if (dy > 0) tMin = Math.min(tMin, (TABLE_H - BALL_R - cy) / dy);
  let hit: PoolBall | null = null;
  for (const b of balls) {
    if (b.n === 0 || b.sunk) continue;
    const fx = cx - b.x;
    const fy = cy - b.y;
    const bdot = fx * dx + fy * dy;
    const c = fx * fx + fy * fy - D2 * D2;
    const disc = bdot * bdot - c;
    if (disc < 0) continue;
    const t = -bdot - Math.sqrt(disc);
    if (t > 0 && t < tMin) {
      tMin = t;
      hit = b;
    }
  }
  if (!isFinite(tMin)) tMin = 0;
  const endX = cx + dx * tMin;
  const endY = cy + dy * tMin;
  let objDirX = 0;
  let objDirY = 0;
  if (hit) {
    const ox = hit.x - endX;
    const oy = hit.y - endY;
    const ol = Math.sqrt(ox * ox + oy * oy) || 1;
    objDirX = ox / ol;
    objDirY = oy / ol;
  }
  return { endX, endY, hitBall: hit, objDirX, objDirY };
}

/* -------------------------------------------------------------------------- */
/*  Auto-move (turn timer ran out)                                            */
/* -------------------------------------------------------------------------- */

export function performAutoShot(state: BilliardsGameState): BilliardsGameState {
  const cue = state.balls.find((b) => b.n === 0)!;
  const g = state.turn === 'p1' ? state.p1Group : state.p2Group;
  const cleared = groupCleared(state.balls, g);
  const targets = state.balls.filter(
    (b) =>
      !b.sunk &&
      b.n !== 0 &&
      (cleared ? b.n === 8 : g ? inGroup(b.n, g) : b.n !== 8)
  );
  const t = targets.length
    ? targets[Math.floor(Math.random() * targets.length)]
    : { x: TABLE_W / 2, y: FOOT_SPOT_Y };
  return performShot(state, t.x - cue.x, t.y - cue.y, state.isBreak ? 0.85 : 0.45).next;
}
