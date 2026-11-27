import { PlayerSlot } from '../types/arcade';

/**
 * Paw Pals — pure tile-platformer physics + level data (no DOM / Preact).
 *
 * Grid is COLS × ROWS tiles (1 unit = 1 tile), origin top-left.
 * Legend:
 *   #  solid wall            .  air
 *   1  Splash spawn (p1)     2  Fluff spawn (p2)
 *   W  water  – hurts Fluff (p2), Splash swims through it
 *   Y  yarn   – hurts Splash (p1), Fluff walks through it
 *   T  thorns – hurts both
 *   ^  bouncy paw cushion – launches either cat high up (~4.75 tiles)
 *   E  cat bed (both cats must rest here together to clear the level)
 *   f  fish treat (shared)
 *   a b c  hold plates (open matching Gate/Lift/Bridge while pressed)
 *   k m    cat bells (permanently unlock matching Gate/Lift/Bridge once touched)
 *   A B C K M  gates
 * Lifts & co-op light bridges are listed per level and activate from their plate/bell letter.
 */

export const COLS = 16;
export const ROWS = 20;
export const CAT_W = 0.76;
export const CAT_H = 0.78;

const GRAVITY = 40;
const JUMP_V = 14;
const JUMP_CUT_V = 5;
const BOUNCE_V = 19.5;
const RUN_SPEED = 6.2;
const RUN_ACCEL = 70;
const MAX_FALL = 18;
const COYOTE = 0.08;
const JUMP_BUFFER = 0.12;
const LIFT_SPEED = 3.2;
const LIFT_THICK = 0.35;

export interface LiftDef {
  col: number;
  w: number;
  /** y of the lift surface when fully down */
  top: number;
  /** tiles it rises when its plate/bell is active */
  rise: number;
  plate: string;
}

export interface BridgeDef {
  col: number;
  /** y of the bridge walking surface when active */
  row: number;
  w: number;
  plate: string;
}

export interface LevelDef {
  name: string;
  hint: string;
  rows: string[];
  lifts: LiftDef[];
  bridges?: BridgeDef[];
}

const isHoldPlateChar = (ch: string) => ch >= 'a' && ch <= 'c';
const isBellChar = (ch: string) => ch === 'k' || ch === 'm';
const isGateChar = (ch: string) => (ch >= 'A' && ch <= 'C') || ch === 'K' || ch === 'M';

export const LEVELS: readonly LevelDef[] = [
  {
    name: 'Two Paths',
    hint: 'Splash swims water • Fluff crosses yarn',
    lifts: [],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#EEE....f......#',
      '#############..#',
      '#..............#',
      '#............###',
      '#..............#',
      '#..........##..#',
      '#.............f#',
      '#............###',
      '#..............#',
      '#...#########..#',
      '#....YYYYY.....#',
      '#.#########..###',
      '#12..WWWWW.f...#',
      '################',
    ],
  },
  {
    name: 'Pressure Paws',
    hint: 'Stand on yellow plate to open the gate',
    lifts: [],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..EEE..f......#',
      '#..##########..#',
      '#..............#',
      '#............###',
      '#..............#',
      '#..........##..#',
      '#.............f#',
      '#............###',
      '#..f...........#',
      '#############..#',
      '#......A.......#',
      '#......A.....###',
      '#12..a.Aa.TT...#',
      '################',
    ],
  },
  {
    name: 'Lift Off',
    hint: 'Hold purple plate to raise the lift',
    lifts: [{ col: 13, w: 2, top: 19, rise: 10, plate: 'b' }],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#......####....#',
      '#.......YYf....#',
      '#......#####...#',
      '#EEE.f.....b...#',
      '########WW###..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#..............#',
      '#..............#',
      '#..12.b..f.....#',
      '################',
    ],
  },
  {
    name: 'Helping Paws',
    hint: 'Hold plates to unlock each other’s gates',
    lifts: [],
    rows: [
      '################',
      '#....#.........#',
      '#....#.........#',
      '#....#.........#',
      '#....B.........#',
      '#....B.........#',
      '#EEb.B..b..f...#',
      '#############..#',
      '#..............#',
      '#............###',
      '#...........f..#',
      '#..........##..#',
      '#.............f#',
      '#............###',
      '#..............#',
      '#...#########..#',
      '#....YYYYY.A...#',
      '#.#########..###',
      '#12..WWWWW..a..#',
      '################',
    ],
  },
  {
    name: 'Cat-astrophe Castle',
    hint: 'Plates, gates & lifts — all together!',
    lifts: [{ col: 13, w: 2, top: 19, rise: 10, plate: 'b' }],
    rows: [
      '################',
      '#...#..........#',
      '#...#..........#',
      '#...#..........#',
      '#...#..........#',
      '#...#..####....#',
      '#...C...YYf....#',
      '#...C..#####...#',
      '#EEcC.cf...b...#',
      '########WW###..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#############..#',
      '#.....A...f....#',
      '#.....A........#',
      '#12.a.A.a.TTb..#',
      '################',
    ],
  },
  {
    name: 'Springy Paws',
    hint: 'Bounce on paw cushions to reach high ledges!',
    lifts: [],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..f....EEE...f#',
      '#..#############',
      '#.....#........#',
      '#.....B........#',
      '#^..b.B..b.....#',
      '#.########.....#',
      '#.....#........#',
      '#.....A........#',
      '#..f..A.YY.^a..#',
      '#..##########..#',
      '#..............#',
      '#..............#',
      '#^.21.WWWWWW..^#',
      '################',
    ],
  },
  {
    name: 'Bridge of Trust',
    hint: 'Hold plates to build dashed light bridges!',
    lifts: [],
    bridges: [
      { col: 4, row: 17, w: 6, plate: 'c' },
      { col: 4, row: 11, w: 6, plate: 'b' },
      { col: 4, row: 7, w: 6, plate: 'a' },
    ],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#......f.......#',
      '#.a........aEE.#',
      '####......######',
      '#....TTTTT.....#',
      '#...######.....#',
      '#.....f........#',
      '#.##......#....#',
      '#b..YYYYYY.....#',
      '############...#',
      '#..............#',
      '#..........###.#',
      '#......f.......#',
      '#..#......#..###',
      '#12.WWWWWW.c...#',
      '################',
    ],
  },
  {
    name: 'Ring the Cat Bell!',
    hint: 'Touch a hanging Cat Bell to unlock it forever!',
    lifts: [],
    bridges: [{ col: 5, row: 11, w: 5, plate: 'm' }],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#...f...f...EE.#',
      '#..#############',
      '#..............#',
      '#..............#',
      '#^.............#',
      '#####.....##...#',
      '#....#.........#',
      '#....K.........#',
      '#....K.WWWW.m^.#',
      '#..###########.#',
      '#..............#',
      '#.#...........##',
      '#12..YYYYY.f.k.#',
      '################',
    ],
  },
  {
    name: 'Skyward Springs',
    hint: 'Spring over thorns, ride the lift & ring the bell',
    lifts: [{ col: 13, w: 2, top: 19, rise: 6, plate: 'b' }],
    bridges: [
      { col: 6, row: 13, w: 3, plate: 'a' },
      { col: 6, row: 5, w: 4, plate: 'k' },
    ],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#....f....EEE..#',
      '#...##....###..#',
      '#..............#',
      '#..............#',
      '#.^...f.WWWWk.^#',
      '#..#############',
      '#..............#',
      '#..............#',
      '#^.a.f...ab....#',
      '######...####..#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#12..^.TT.b....#',
      '################',
    ],
  },
  {
    name: 'Grand Lovey Finale',
    hint: 'Final stage! Use every co-op skill to reunite',
    lifts: [{ col: 13, w: 2, top: 15, rise: 8, plate: 'b' }],
    bridges: [
      { col: 6, row: 15, w: 2, plate: 'c' },
      { col: 5, row: 5, w: 4, plate: 'a' },
    ],
    rows: [
      '################',
      '#..............#',
      '#..............#',
      '#..............#',
      '#....f.........#',
      '###......#.....#',
      '#EEKaWWWW.bf...#',
      '#############..#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..............#',
      '#..fk.....b.c..#',
      '#..###..#####..#',
      '#..............#',
      '#..............#',
      '#^.WWW.12.YYY.^#',
      '################',
    ],
  },
];

export interface Tile {
  col: number;
  row: number;
}

export interface ParsedLevel {
  name: string;
  hint: string;
  grid: string[][];
  spawns: Record<PlayerSlot, { x: number; y: number }>;
  plates: (Tile & { letter: string })[];
  bells: (Tile & { letter: string })[];
  gates: (Tile & { letter: string })[];
  cushions: (Tile & { id: number })[];
  treats: (Tile & { id: number })[];
  lifts: LiftDef[];
  bridges: BridgeDef[];
}

export function parseLevel(def: LevelDef): ParsedLevel {
  const grid = def.rows.map((r) => r.split(''));
  const spawns = { p1: { x: 1, y: 1 }, p2: { x: 2, y: 1 } } as ParsedLevel['spawns'];
  const plates: ParsedLevel['plates'] = [];
  const bells: ParsedLevel['bells'] = [];
  const gates: ParsedLevel['gates'] = [];
  const cushions: ParsedLevel['cushions'] = [];
  const treats: ParsedLevel['treats'] = [];
  grid.forEach((row, r) =>
    row.forEach((ch, c) => {
      const foot = { x: c + (1 - CAT_W) / 2, y: r + 1 - CAT_H };
      if (ch === '1') spawns.p1 = foot;
      else if (ch === '2') spawns.p2 = foot;
      else if (isHoldPlateChar(ch)) plates.push({ col: c, row: r, letter: ch.toUpperCase() });
      else if (isBellChar(ch)) bells.push({ col: c, row: r, letter: ch.toUpperCase() });
      else if (isGateChar(ch)) gates.push({ col: c, row: r, letter: ch });
      else if (ch === '^') cushions.push({ col: c, row: r, id: cushions.length });
      else if (ch === 'f') treats.push({ col: c, row: r, id: treats.length });
    })
  );
  return {
    name: def.name,
    hint: def.hint,
    grid,
    spawns,
    plates,
    bells,
    gates,
    cushions,
    treats,
    lifts: def.lifts,
    bridges: def.bridges ?? [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Runtime world                                                             */
/* -------------------------------------------------------------------------- */

export interface WorldState {
  /** gate/bridge/lift letter → open (includes held plates + latched bells) */
  open: Record<string, boolean>;
  /** permanently latched bells (uppercase letters) */
  latched: Record<string, boolean>;
  /** per lift: current rise offset (0..rise) */
  liftOffset: number[];
}

export interface CatBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  bounced: boolean;
  facing: 1 | -1;
  coyote: number;
  jumpBuffer: number;
  jumpWasDown: boolean;
  /** index of the lift the cat stands on, -1 if none */
  onLift: number;
}

export interface CatInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function createCat(spawn: { x: number; y: number }): CatBody {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    grounded: true,
    bounced: false,
    facing: 1,
    coyote: 0,
    jumpBuffer: 0,
    jumpWasDown: false,
    onLift: -1,
  };
}

export function createWorld(level: ParsedLevel): WorldState {
  return { open: {}, latched: {}, liftOffset: level.lifts.map(() => 0) };
}

export function liftSurface(level: ParsedLevel, world: WorldState, i: number): number {
  return level.lifts[i].top - world.liftOffset[i];
}

const overlaps = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

/** Plate letters pressed by any of the given cat boxes */
export function pressedPlates(level: ParsedLevel, cats: { x: number; y: number }[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const p of level.plates) {
    for (const c of cats) {
      if (overlaps(c.x, c.y, CAT_W, CAT_H, p.col, p.row + 0.55, 1, 0.45)) out[p.letter] = true;
    }
  }
  return out;
}

/** Bell letters touched by a cat (permanently latch open once touched) */
export function bellsTouched(cat: { x: number; y: number }, level: ParsedLevel): string[] {
  return level.bells
    .filter((b) => overlaps(cat.x, cat.y, CAT_W, CAT_H, b.col + 0.12, b.row + 0.08, 0.76, 0.85))
    .map((b) => b.letter);
}

/**
 * Advances lifts toward their targets. Returns per-lift surface y-delta (negative = moved up)
 * so the caller can carry a rider.
 */
export function updateWorld(
  level: ParsedLevel,
  world: WorldState,
  pressed: Record<string, boolean>,
  dt: number
): number[] {
  const combined: Record<string, boolean> = { ...world.latched };
  for (const k of Object.keys(pressed)) {
    if (pressed[k]) combined[k] = true;
  }
  world.open = combined;
  return level.lifts.map((l, i) => {
    const target = combined[l.plate.toUpperCase()] ? l.rise : 0;
    const cur = world.liftOffset[i];
    const step = LIFT_SPEED * dt;
    const next = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
    world.liftOffset[i] = next;
    return cur - next;
  });
}

function solidTile(level: ParsedLevel, world: WorldState, c: number, r: number, ghost: Set<number>): boolean {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return true;
  const ch = level.grid[r][c];
  if (ch === '#') return true;
  if (isGateChar(ch)) return !world.open[ch] && !ghost.has(r * COLS + c);
  return false;
}

export type StepOutcome = 'ok' | 'hurt' | 'bounce';

/**
 * One fixed physics step for a single cat. `slot` decides which liquid hurts it.
 * `carry` = surface delta from updateWorld for the lift the cat stands on.
 */
export function stepCat(
  cat: CatBody,
  input: CatInput,
  level: ParsedLevel,
  world: WorldState,
  slot: PlayerSlot,
  dt: number,
  carry: number[] = []
): StepOutcome {
  // Ride a moving lift
  if (cat.onLift >= 0 && carry[cat.onLift]) cat.y += carry[cat.onLift];

  // Gates the cat is already inside never trap it
  const ghost = new Set<number>();
  for (const g of level.gates) {
    if (overlaps(cat.x, cat.y, CAT_W, CAT_H, g.col, g.row, 1, 1)) ghost.add(g.row * COLS + g.col);
  }

  // Horizontal intent
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const target = dir * RUN_SPEED;
  const dv = RUN_ACCEL * dt;
  cat.vx = cat.vx < target ? Math.min(target, cat.vx + dv) : Math.max(target, cat.vx - dv);
  if (dir !== 0) cat.facing = dir as 1 | -1;

  // Jump (buffer + coyote time + variable height, unless cushion-bounced)
  if (input.jump && !cat.jumpWasDown) cat.jumpBuffer = JUMP_BUFFER;
  else cat.jumpBuffer = Math.max(0, cat.jumpBuffer - dt);
  cat.coyote = cat.grounded ? COYOTE : Math.max(0, cat.coyote - dt);
  if (cat.jumpBuffer > 0 && cat.coyote > 0) {
    cat.vy = -JUMP_V;
    cat.bounced = false;
    cat.jumpBuffer = 0;
    cat.coyote = 0;
    cat.grounded = false;
    cat.onLift = -1;
  }
  if (!cat.bounced && !input.jump && cat.vy < -JUMP_CUT_V) cat.vy = -JUMP_CUT_V;
  cat.jumpWasDown = input.jump;

  cat.vy = Math.min(MAX_FALL, cat.vy + GRAVITY * dt);
  if (cat.vy >= 0) cat.bounced = false;

  // Move X
  let nx = cat.x + cat.vx * dt;
  const top = Math.floor(cat.y + 0.001);
  const bottom = Math.floor(cat.y + CAT_H - 0.001);
  if (cat.vx > 0) {
    const c = Math.floor(nx + CAT_W);
    for (let r = top; r <= bottom; r++) {
      if (solidTile(level, world, c, r, ghost)) {
        nx = c - CAT_W;
        cat.vx = 0;
        break;
      }
    }
  } else if (cat.vx < 0) {
    const c = Math.floor(nx);
    for (let r = top; r <= bottom; r++) {
      if (solidTile(level, world, c, r, ghost)) {
        nx = c + 1;
        cat.vx = 0;
        break;
      }
    }
  }
  cat.x = nx;

  // Move Y
  const prevBottom = cat.y + CAT_H;
  let ny = cat.y + cat.vy * dt;
  const left = Math.floor(cat.x + 0.001);
  const right = Math.floor(cat.x + CAT_W - 0.001);
  cat.grounded = false;
  cat.onLift = -1;
  if (cat.vy > 0) {
    const r = Math.floor(ny + CAT_H);
    for (let c = left; c <= right; c++) {
      if (solidTile(level, world, c, r, ghost)) {
        ny = r - CAT_H;
        cat.vy = 0;
        cat.grounded = true;
        break;
      }
    }
    // Active co-op light bridges (one-way platforms flush with row `b.row`)
    for (const b of level.bridges) {
      if (!world.open[b.plate.toUpperCase()]) continue;
      const s = b.row;
      if (
        cat.x + CAT_W > b.col &&
        cat.x < b.col + b.w &&
        prevBottom <= s + 0.08 &&
        ny + CAT_H >= s &&
        ny + CAT_H <= s + 0.55
      ) {
        if (s - CAT_H <= ny) {
          ny = s - CAT_H;
          cat.vy = 0;
          cat.grounded = true;
        }
      }
    }
    // One-way lift platforms
    level.lifts.forEach((l, i) => {
      const s = liftSurface(level, world, i);
      if (
        cat.x + CAT_W > l.col &&
        cat.x < l.col + l.w &&
        prevBottom <= s + 0.05 &&
        ny + CAT_H >= s &&
        ny + CAT_H <= s + LIFT_THICK + 0.6
      ) {
        if (s - CAT_H <= ny) {
          ny = s - CAT_H;
          cat.vy = 0;
          cat.grounded = true;
          cat.onLift = i;
        }
      }
    });
  } else if (cat.vy < 0) {
    const r = Math.floor(ny);
    for (let c = left; c <= right; c++) {
      if (solidTile(level, world, c, r, ghost)) {
        ny = r + 1;
        cat.vy = 0;
        break;
      }
    }
  }
  cat.y = ny;

  // Bouncy paw cushions launch high (skip while already skyrocketing upward)
  if (!cat.bounced && cat.vy >= -2) {
    for (const cu of level.cushions) {
      if (overlaps(cat.x, cat.y, CAT_W, CAT_H, cu.col + 0.12, cu.row + 0.52, 0.76, 0.48)) {
        cat.vy = -BOUNCE_V;
        cat.grounded = false;
        cat.onLift = -1;
        cat.bounced = true;
        return 'bounce';
      }
    }
  }

  return isHurt(cat, level, slot) ? 'hurt' : 'ok';
}

export function isHurt(cat: { x: number; y: number }, level: ParsedLevel, slot: PlayerSlot): boolean {
  const x0 = cat.x + 0.08;
  const y0 = cat.y + 0.08;
  const w = CAT_W - 0.16;
  const h = CAT_H - 0.08;
  const c0 = Math.floor(x0);
  const c1 = Math.floor(x0 + w);
  const r0 = Math.floor(y0);
  const r1 = Math.floor(y0 + h);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const ch = level.grid[r]?.[c];
      const danger =
        (ch === 'W' && slot === 'p2') || (ch === 'Y' && slot === 'p1') || ch === 'T';
      if (danger && overlaps(x0, y0, w, h, c, r + 0.45, 1, 0.55)) return true;
    }
  }
  return false;
}

export function treatsTouched(cat: { x: number; y: number }, level: ParsedLevel): number[] {
  return level.treats
    .filter((t) => overlaps(cat.x, cat.y, CAT_W, CAT_H, t.col + 0.15, t.row + 0.15, 0.7, 0.7))
    .map((t) => t.id);
}

export function isInBed(cat: { x: number; y: number }, level: ParsedLevel): boolean {
  const cx = Math.floor(cat.x + CAT_W / 2);
  const cy = Math.floor(cat.y + CAT_H / 2);
  return level.grid[cy]?.[cx] === 'E';
}
