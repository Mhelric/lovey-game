import { COLS, ParsedLevel, ROWS } from '../engines/pawpalsEngine';

/**
 * Paw Pals level art. Everything here is static per level and lives in its own
 * SVG layer, so it is painted once — only the small dynamic overlay repaints
 * while the cats move (important on low-end phones).
 */

export const INK = '#5B2A4E';
export const PLATE_COLORS: Record<string, { main: string; light: string; dark: string }> = {
  A: { main: '#FFC94A', light: '#FFE59A', dark: '#E09A12' },
  B: { main: '#B794F6', light: '#DCCBFF', dark: '#8B5CF6' },
  C: { main: '#4FD1A5', light: '#AEF0D6', dark: '#1FA67A' },
};
export const SPLASH_COLOR = '#38BDF8';
export const FLUFF_COLOR = '#FF7AA5';

const f = (n: number) => Math.round(n * 1000) / 1000;

/** Tiny deterministic hash → [0,1) so decorations don't shuffle between renders */
const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

interface Run {
  r: number;
  c0: number;
  c1: number;
}

function runs(grid: string[][], match: (ch: string, r: number, c: number) => boolean): Run[] {
  const out: Run[] = [];
  grid.forEach((row, r) => {
    let c = 0;
    while (c < COLS) {
      if (!match(row[c], r, c)) {
        c++;
        continue;
      }
      const c0 = c;
      while (c < COLS && match(row[c], r, c)) c++;
      out.push({ r, c0, c1: c });
    }
  });
  return out;
}

const rectPath = (x: number, y: number, w: number, h: number) =>
  `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;

/** Scalloped strip: flat top edge, wavy bottom edge (icing / water crest) */
function scallopPath(x0: number, x1: number, y: number, depth: number, bump: number, step = 0.25): string {
  const n = Math.max(1, Math.round((x1 - x0) / step));
  const w = (x1 - x0) / n;
  let d = `M${f(x0)} ${f(y)}H${f(x1)}v${f(depth)}`;
  for (let i = 0; i < n; i++) d += `q${f(-w / 2)} ${f(bump)} ${f(-w)} 0`;
  return d + 'Z';
}

/** Wave line across a run (used for water surfaces) */
export function wavePath(x0: number, x1: number, y: number, amp: number, step = 0.5): string {
  const n = Math.max(1, Math.round((x1 - x0) / step));
  const w = (x1 - x0) / n;
  let d = `M${f(x0)} ${f(y)}`;
  for (let i = 0; i < n; i++) d += `q${f(w / 2)} ${f(i % 2 ? amp : -amp)} ${f(w)} 0`;
  return d;
}

export function waterRuns(level: ParsedLevel): Run[] {
  return runs(level.grid, (ch) => ch === 'W');
}

export function bedRuns(level: ParsedLevel): Run[] {
  return runs(level.grid, (ch) => ch === 'E');
}

const circlePath = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/** Small paw print (pad + 4 toes) centred at (x, y) */
export function pawPath(x: number, y: number, s: number): string {
  return (
    circlePath(x, y + 0.18 * s, 0.26 * s) +
    circlePath(x - 0.3 * s, y - 0.12 * s, 0.11 * s) +
    circlePath(x - 0.11 * s, y - 0.3 * s, 0.11 * s) +
    circlePath(x + 0.11 * s, y - 0.3 * s, 0.11 * s) +
    circlePath(x + 0.3 * s, y - 0.12 * s, 0.11 * s)
  );
}

export function StaticLevelArt({ level, idPrefix }: { level: ParsedLevel; idPrefix: string }) {
  const g = level.grid;
  const isWall = (r: number, c: number) =>
    r < 0 || r >= ROWS || c < 0 || c >= COLS ? true : g[r][c] === '#';

  // ---- Walls: cookie blocks with strawberry icing ----
  const wallRuns = runs(g, (ch) => ch === '#');
  const wallFill = wallRuns.map((w) => rectPath(w.c0, w.r, w.c1 - w.c0, 1)).join('');
  let outline = '';
  let shade = '';
  g.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (ch !== '#') return;
      if (!isWall(r - 1, c)) outline += `M${c} ${r}h1`;
      if (!isWall(r + 1, c)) {
        outline += `M${c} ${r + 1}h1`;
        shade += rectPath(c, r + 0.84, 1, 0.16);
      }
      if (!isWall(r, c - 1)) outline += `M${c} ${r}v1`;
      if (!isWall(r, c + 1)) outline += `M${c + 1} ${r}v1`;
    })
  );
  const icingRuns = runs(g, (ch, r, c) => ch === '#' && r > 0 && !isWall(r - 1, c) && g[r - 1][c] !== 'W');
  const icing = icingRuns.map((w) => scallopPath(w.c0, w.c1, w.r - 0.03, 0.2, 0.17, 1 / 3)).join('');
  const sprinkleColors = ['#FFFFFF', '#FFE08A', '#8EDBFF'];
  const sprinkles = ['', '', ''];
  icingRuns.forEach((w) => {
    for (let c = w.c0; c < w.c1; c++) {
      const h = hash(c, w.r);
      const x = c + 0.18 + h * 0.6;
      const y = w.r + 0.06 + hash(w.r, c) * 0.05;
      const dir = h > 0.5 ? 0.1 : -0.1;
      sprinkles[Math.floor(h * 3) % 3] += `M${f(x)} ${f(y)}l${dir} 0.035`;
    }
  });

  // ---- Water pits ----
  const water = waterRuns(level);
  const waterBody = water.map((w) => rectPath(w.c0, w.r + 0.42, w.c1 - w.c0, 0.58)).join('');
  const bubbles = water
    .map((w) => {
      let d = '';
      for (let c = w.c0; c < w.c1; c++) {
        if (hash(c, w.r) > 0.45) d += circlePath(c + 0.3 + hash(w.r, c) * 0.4, w.r + 0.72 + hash(c, c) * 0.15, 0.05);
      }
      return d;
    })
    .join('');

  // ---- Yarn pits ----
  const yarnBalls = ['', ''];
  const yarnLines = ['', ''];
  g.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (ch !== 'Y') return;
      const k = c % 2;
      const cx = c + 0.5;
      const cy = r + 0.66;
      yarnBalls[k] += circlePath(cx, cy, 0.33);
      yarnLines[k] +=
        `M${f(cx - 0.28)} ${f(cy - 0.1)}Q${f(cx)} ${f(cy + 0.16)} ${f(cx + 0.29)} ${f(cy - 0.06)}` +
        `M${f(cx - 0.22)} ${f(cy + 0.2)}Q${f(cx + 0.04)} ${f(cy - 0.06)} ${f(cx + 0.2)} ${f(cy + 0.24)}` +
        `M${f(cx - 0.1)} ${f(cy - 0.3)}Q${f(cx - 0.02)} ${f(cy)} ${f(cx - 0.16)} ${f(cy + 0.3)}`;
    })
  );

  // ---- Thorns ----
  let thorns = '';
  let thornTips = '';
  g.forEach((row, r) =>
    row.forEach((ch, c) => {
      if (ch !== 'T') return;
      thorns += `M${c} ${r + 1}l0.17 -0.58l0.16 0.58l0.17 -0.68l0.16 0.68l0.17 -0.58l0.17 0.58Z`;
      thornTips += `M${c + 0.17} ${r + 0.42}l0.05 0.14h-0.1ZM${c + 0.5} ${r + 0.32}l0.05 0.14h-0.1ZM${c + 0.83} ${r + 0.42}l0.05 0.14h-0.1Z`;
    })
  );

  // ---- Lift rails ----
  const rails = level.lifts
    .map(
      (l) =>
        `M${f(l.col + 0.3)} ${f(l.top - l.rise - 0.1)}V${f(l.top + 0.4)}` +
        `M${f(l.col + l.w - 0.3)} ${f(l.top - l.rise - 0.1)}V${f(l.top + 0.4)}`
    )
    .join('');

  const P = idPrefix;
  return (
    <>
      <defs>
        <linearGradient id={`${P}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFEAF3" />
          <stop offset="55%" stop-color="#FFF6EE" />
          <stop offset="100%" stop-color="#E4F3FF" />
        </linearGradient>
        <pattern id={`${P}paws`} patternUnits="userSpaceOnUse" width="4" height="4">
          <path d={pawPath(1, 1.1, 0.55) + pawPath(3, 3.1, 0.55)} fill="#F7CFE0" opacity="0.6" />
        </pattern>
        <pattern id={`${P}chips`} patternUnits="userSpaceOnUse" width="2" height="2">
          <ellipse cx="0.42" cy="0.55" rx="0.09" ry="0.07" fill="#8A5235" opacity="0.55" />
          <ellipse cx="1.35" cy="0.32" rx="0.07" ry="0.06" fill="#8A5235" opacity="0.5" />
          <ellipse cx="1.62" cy="1.45" rx="0.09" ry="0.07" fill="#8A5235" opacity="0.55" />
          <ellipse cx="0.72" cy="1.62" rx="0.06" ry="0.05" fill="#8A5235" opacity="0.45" />
          <circle cx="1.05" cy="1.05" r="0.04" fill="#FFF1D6" opacity="0.7" />
          <circle cx="0.2" cy="1.25" r="0.03" fill="#FFF1D6" opacity="0.7" />
        </pattern>
        <linearGradient id={`${P}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9BE2FF" />
          <stop offset="100%" stop-color="#2FA4E7" />
        </linearGradient>
      </defs>

      {/* Room backdrop */}
      <rect x={0} y={0} width={COLS} height={ROWS} fill={`url(#${P}sky)`} />
      <rect x={0} y={0} width={COLS} height={ROWS} fill={`url(#${P}paws)`} />

      {/* Lift rails (behind everything) */}
      {rails && (
        <path d={rails} stroke="#D8C4EA" stroke-width={0.09} stroke-dasharray="0.18 0.14" stroke-linecap="round" fill="none" />
      )}

      {/* Water */}
      {waterBody && (
        <>
          <path d={waterBody} fill={`url(#${P}water)`} />
          <path d={bubbles} fill="#E6F8FF" opacity={0.8} />
        </>
      )}

      {/* Yarn */}
      {yarnBalls[0] && <path d={yarnBalls[0]} fill="#FF9EC0" stroke={INK} stroke-width={0.05} />}
      {yarnBalls[1] && <path d={yarnBalls[1]} fill="#C9A7FF" stroke={INK} stroke-width={0.05} />}
      {yarnLines[0] && <path d={yarnLines[0]} fill="none" stroke="#E2497F" stroke-width={0.04} stroke-linecap="round" />}
      {yarnLines[1] && <path d={yarnLines[1]} fill="none" stroke="#8B5CF6" stroke-width={0.04} stroke-linecap="round" />}

      {/* Thorns */}
      {thorns && (
        <>
          <path d={thorns} fill="#9B6B8E" stroke={INK} stroke-width={0.05} stroke-linejoin="round" />
          <path d={thornTips} fill="#F3D9EA" />
        </>
      )}

      {/* Cookie walls */}
      <path d={wallFill} fill="#E7B377" />
      <path d={wallFill} fill={`url(#${P}chips)`} />
      {shade && <path d={shade} fill="#C98B55" opacity={0.75} />}
      <path d={icing} fill="#FFB3CB" stroke={INK} stroke-width={0.045} stroke-linejoin="round" />
      {sprinkles.map((d, i) =>
        d ? <path key={i} d={d} stroke={sprinkleColors[i]} stroke-width={0.05} stroke-linecap="round" /> : null
      )}
      <path d={outline} stroke={INK} stroke-width={0.08} stroke-linecap="round" fill="none" />

      {/* Cat beds */}
      {bedRuns(level).map((b) => {
        const x0 = b.c0 + 0.06;
        const x1 = b.c1 - 0.06;
        const y = b.r;
        const mid = (x0 + x1) / 2;
        return (
          <g key={`bed-${b.r}-${b.c0}`}>
            <path
              d={`M${f(x0)} ${y + 1}V${f(y + 0.42)}Q${f(x0)} ${f(y + 0.08)} ${f(x0 + 0.34)} ${f(y + 0.08)}H${f(x1 - 0.34)}Q${f(x1)} ${f(y + 0.08)} ${f(x1)} ${f(y + 0.42)}V${y + 1}Z`}
              fill="#FF8FB1"
              stroke={INK}
              stroke-width={0.06}
            />
            <path
              d={`M${f(x0 + 0.12)} ${f(y + 0.4)}Q${f(x0 + 0.12)} ${f(y + 0.2)} ${f(x0 + 0.36)} ${f(y + 0.2)}H${f(x1 - 0.36)}`}
              stroke="#FFC4D6"
              stroke-width={0.07}
              stroke-linecap="round"
              fill="none"
            />
            <rect x={x0 + 0.22} y={y + 0.36} width={x1 - x0 - 0.44} height={0.42} rx={0.2} fill="#FFE9F1" stroke={INK} stroke-width={0.045} />
            <ellipse cx={x0 + 0.62} cy={y + 0.5} rx={0.3} ry={0.13} fill="#FFFFFF" stroke={INK} stroke-width={0.035} />
            <rect x={x0} y={y + 0.7} width={x1 - x0} height={0.3} rx={0.13} fill="#FF6F9C" stroke={INK} stroke-width={0.06} />
            <rect x={x0 + 0.18} y={y + 0.74} width={x1 - x0 - 0.9} height={0.06} rx={0.03} fill="#FFB3CB" />
            <path
              d={`M${f(mid)} ${f(y + 0.96)}c-0.2 -0.12 -0.16 -0.26 -0.06 -0.26c0.04 0 0.06 0.03 0.06 0.05c0 -0.02 0.02 -0.05 0.06 -0.05c0.1 0 0.14 0.14 -0.06 0.26Z`}
              fill="#ffffff"
            />
          </g>
        );
      })}
    </>
  );
}
