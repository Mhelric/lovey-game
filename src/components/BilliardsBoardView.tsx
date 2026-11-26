import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import {
  BALL_R,
  BilliardsGameState,
  BilliardsGroup,
  FOOT_SPOT_Y,
  HEAD_LINE_Y,
  PoolBall,
  TABLE_H,
  TABLE_W,
} from '../engines/billiardsSetup';
import {
  computeAimPreview,
  isStripe,
  performShot,
  placeCueBall,
  POCKETS,
  simulateShot,
} from '../engines/billiardsEngine';
import {
  playBallClack,
  playCueStrike,
  playPocketDrop,
  playRailThud,
  playTapPop,
  playTurnBannerPop,
  playVictoryFanfare,
} from '../services/soundEffects';
import { SparkleIcon } from './ArcadeIcons';
import { CatAvatarSvg } from './CatAvatarSvg';

interface BilliardsBoardViewProps {
  gameState: BilliardsGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay?: boolean;
  isPaused?: boolean;
  onCommitState: (next: BilliardsGameState) => void;
  onAnimatingChange?: (animating: boolean) => void;
}

const BALL_COLORS = ['#FFFDF5', '#F5C518', '#1E5BD6', '#E03131', '#7B3FB5', '#F76707', '#2B8A3E', '#8B1E1E', '#1A1A1A'];
const ballColor = (n: number) => BALL_COLORS[n > 8 ? n - 8 : n];

const RAIL = 3.6;
const FRAME_MS = 1000 / 60;
const POWER_CYCLE_MS = 1500;
const CAP_B = BALL_R * 0.55;
const CAP_A = Math.sqrt(BALL_R * BALL_R - CAP_B * CAP_B);
const STRIPE_TOP = `M ${-CAP_A} ${-CAP_B} A ${BALL_R} ${BALL_R} 0 0 1 ${CAP_A} ${-CAP_B} Z`;
const STRIPE_BOTTOM = `M ${-CAP_A} ${CAP_B} A ${BALL_R} ${BALL_R} 0 0 0 ${CAP_A} ${CAP_B} Z`;

/** Power swings 0 → 1 → 0 every POWER_CYCLE_MS, computed from the exact tap time (frame-rate independent) */
function powerAt(elapsedMs: number): number {
  const phase = (elapsedMs % POWER_CYCLE_MS) / POWER_CYCLE_MS;
  return phase < 0.5 ? phase * 2 : 2 - phase * 2;
}

function rotate(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
}

function defaultAim(balls: PoolBall[]) {
  const cue = balls.find((b) => b.n === 0)!;
  let best: PoolBall | null = null;
  let bestD = Infinity;
  for (const b of balls) {
    if (b.n === 0 || b.sunk) continue;
    const d = (b.x - cue.x) ** 2 + (b.y - cue.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  if (!best) return { x: 0, y: -1 };
  const l = Math.sqrt(bestD) || 1;
  return { x: (best.x - cue.x) / l, y: (best.y - cue.y) / l };
}

export function BilliardsBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay = false,
  isPaused = false,
  onCommitState,
  onAnimatingChange,
}: BilliardsBoardViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ballRefs = useRef<(SVGGElement | null)[]>([]);
  const cuePullRef = useRef<SVGGElement | null>(null);
  const powerFillRef = useRef<HTMLDivElement | null>(null);
  const draggingCueRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const chargeStartRef = useRef(0);

  const shotId = gameState.lastShot?.id ?? '';
  // Do not replay a shot that already happened before this board mounted (resume / rejoin)
  const [doneShotId, setDoneShotId] = useState(shotId);
  const isReplaying = Boolean(gameState.lastShot) && shotId !== doneShotId;

  const [placed, setPlaced] = useState<BilliardsGameState | null>(null);
  const [aim, setAim] = useState(() => defaultAim(gameState.balls));
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isMyTurn = passAndPlay || gameState.turn === mySlot;
  const canAct = isMyTurn && !isReplaying && !gameState.winner && !isPaused;
  const working = placed && placed.shotCount === gameState.shotCount ? placed : gameState;
  const renderBalls = isReplaying && gameState.lastShot ? gameState.lastShot.startBalls : working.balls;
  const cue = renderBalls.find((b) => b.n === 0)!;

  const nameOf = (s: PlayerSlot) => (s === 'p1' ? p1Avatar.name : p2Avatar.name);

  useEffect(() => {
    onAnimatingChange?.(isReplaying);
  }, [isReplaying]);

  useEffect(() => () => onAnimatingChange?.(false), []);

  // New turn / new layout → reset local placement + aim at the nearest ball
  useEffect(() => {
    if (isReplaying) return;
    setPlaced(null);
    setCharging(false);
    setAim(defaultAim(gameState.balls));
  }, [gameState.shotCount, gameState.matchSeed, isReplaying]);

  // Replay the shot on both phones from the same start layout
  useEffect(() => {
    const shot = gameState.lastShot;
    if (!shot || shot.id === doneShotId) return;
    const sim = simulateShot(shot.startBalls, shot.dirX, shot.dirY, shot.power);
    const finalBalls = gameState.balls;
    let start = 0;
    let lastFrame = -1;
    let soundIdx = 0;
    playCueStrike(shot.power);

    const applyFrame = (f: Float32Array) => {
      for (let i = 0; i < shot.startBalls.length; i++) {
        const el = ballRefs.current[i];
        if (!el) continue;
        const x = f[i * 2];
        if (x !== x) {
          el.setAttribute('visibility', 'hidden');
        } else {
          el.setAttribute('visibility', 'visible');
          el.setAttribute('transform', `translate(${x} ${f[i * 2 + 1]})`);
        }
      }
    };

    const finish = () => {
      finalBalls.forEach((b, i) => {
        const el = ballRefs.current[i];
        if (!el) return;
        el.setAttribute('visibility', b.sunk ? 'hidden' : 'visible');
        el.setAttribute('transform', `translate(${b.x} ${b.y})`);
      });
      rafRef.current = null;
      setDoneShotId(shot.id);
    };

    const tick = (now: number) => {
      if (!start) start = now;
      const fi = Math.min(sim.frames.length - 1, Math.floor((now - start) / FRAME_MS));
      if (fi !== lastFrame) {
        applyFrame(sim.frames[fi]);
        let clack = 0;
        let rail = 0;
        let pocket = false;
        while (soundIdx < sim.sounds.length && sim.sounds[soundIdx].f <= fi) {
          const s = sim.sounds[soundIdx++];
          if (s.k === 'clack') clack = Math.max(clack, s.v);
          else if (s.k === 'rail') rail = Math.max(rail, s.v);
          else pocket = true;
        }
        if (clack > 3) playBallClack(clack);
        if (rail > 6) playRailThud(rail);
        if (pocket) playPocketDrop();
        lastFrame = fi;
      }
      if (fi >= sim.frames.length - 1) finish();
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [shotId]);

  // Event toast once the balls have stopped
  useEffect(() => {
    const ev = gameState.lastEvent;
    if (isReplaying || !ev || ev.id !== doneShotId) return;
    const s = nameOf(ev.shooter);
    const o = nameOf(ev.shooter === 'p1' ? 'p2' : 'p1');
    const groupName = (g?: BilliardsGroup) => (g === 'solids' ? 'Solids' : 'Stripes');
    let msg = '';
    if (ev.kind === 'win') msg = `${s} sank the 8-ball!`;
    else if (ev.kind === 'lose8') msg = `Oops! ${s} sank the 8 too early — ${o} wins!`;
    else if (ev.kind === 'foul')
      msg =
        ev.foulReason === 'scratch'
          ? `Scratch! Ball in hand for ${o}`
          : ev.foulReason === 'no_hit'
          ? `No ball hit! Ball in hand for ${o}`
          : `Wrong ball first! Ball in hand for ${o}`;
    else if (ev.kind === 'group') msg = `${s} takes ${groupName(ev.group)}! Shoot again`;
    else if (ev.kind === 'break')
      msg = ev.potted > 0 ? `Great break! ${s} sank ${ev.potted} — shoot again` : `Break done — ${o}'s turn`;
    else if (ev.kind === 'pot') msg = `${s} sank ${ev.potted}! Shoot again`;
    else msg = `No ball sunk — ${o}'s turn`;
    setToast(msg);
    if (ev.kind === 'win' || ev.kind === 'lose8') playVictoryFanfare();
    else playTurnBannerPop();
    const t = window.setTimeout(() => setToast(null), 2300);
    return () => window.clearTimeout(t);
  }, [doneShotId, isReplaying]);

  // Power meter swing while charging
  useEffect(() => {
    if (!charging) {
      if (powerFillRef.current) powerFillRef.current.style.transform = 'scaleX(0)';
      if (cuePullRef.current) cuePullRef.current.setAttribute('transform', 'translate(0 0)');
      return;
    }
    let id = 0;
    const tick = () => {
      const p = powerAt(performance.now() - chargeStartRef.current);
      if (powerFillRef.current) powerFillRef.current.style.transform = `scaleX(${p})`;
      if (cuePullRef.current) cuePullRef.current.setAttribute('transform', `translate(${-p * 5} 0)`);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [charging]);

  useEffect(() => () => stopHold(), []);

  const toTable = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const aimAt = (x: number, y: number) => {
    const dx = x - cue.x;
    const dy = y - cue.y;
    const l = Math.sqrt(dx * dx + dy * dy);
    if (l < 0.6) return;
    setAim({ x: dx / l, y: dy / l });
  };

  const tryPlace = (x: number, y: number) => {
    const next = placeCueBall(working, x, y);
    if (next) setPlaced(next);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!canAct) return;
    const p = toTable(e.clientX, e.clientY);
    if (!p) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    if (charging) setCharging(false);
    if (working.ballInHand && (p.x - cue.x) ** 2 + (p.y - cue.y) ** 2 < 5.5 * 5.5) {
      draggingCueRef.current = true;
      return;
    }
    draggingCueRef.current = false;
    aimAt(p.x, p.y);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!canAct || e.buttons === 0) return;
    const p = toTable(e.clientX, e.clientY);
    if (!p) return;
    if (draggingCueRef.current) tryPlace(p.x, p.y);
    else aimAt(p.x, p.y);
  };

  const handlePointerUp = () => {
    draggingCueRef.current = false;
  };

  const nudge = (deg: number) => setAim((a) => rotate(a.x, a.y, deg));

  const stopHold = () => {
    if (holdTimerRef.current !== null) window.clearInterval(holdTimerRef.current);
    holdTimerRef.current = null;
  };

  const startHold = (deg: number) => {
    if (!canAct) return;
    stopHold();
    nudge(deg);
    holdTimerRef.current = window.setInterval(() => nudge(deg), 70);
  };

  const handleShootTap = () => {
    if (!canAct) return;
    if (!charging) {
      playTapPop();
      chargeStartRef.current = performance.now();
      setCharging(true);
      return;
    }
    const power = Math.max(0.03, powerAt(performance.now() - chargeStartRef.current));
    setCharging(false);
    const { next } = performShot(working, aim.x, aim.y, power);
    setPlaced(null);
    onCommitState(next);
  };

  const preview = useMemo(
    () => (canAct ? computeAimPreview(working.balls, cue.x, cue.y, aim.x, aim.y) : null),
    [canAct, working, cue.x, cue.y, aim.x, aim.y]
  );
  const aimDeg = (Math.atan2(aim.y, aim.x) * 180) / Math.PI;

  const groupFor = (s: PlayerSlot) => (s === 'p1' ? gameState.p1Group : gameState.p2Group);

  const renderGroupRack = (slot: PlayerSlot) => {
    const g = groupFor(slot);
    const av = slot === 'p1' ? p1Avatar : p2Avatar;
    const nums = g === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : g === 'stripes' ? [9, 10, 11, 12, 13, 14, 15] : [];
    const sunkSet = new Set(gameState.balls.filter((b) => b.sunk).map((b) => b.n));
    return (
      <div className={`billiards-player-chip ${gameState.turn === slot && !gameState.winner ? 'is-turn' : ''}`}>
        <CatAvatarSvg breed={av.breed} accessory={av.accessory} size={20} animateIdle={false} />
        <div className="billiards-chip-meta">
          <span className="billiards-chip-name">{av.name}</span>
          {g ? (
            <svg className="billiards-mini-rack" viewBox="0 0 70 10" aria-label={`${g} remaining`}>
              {nums.map((n, i) => (
                <circle
                  key={n}
                  cx={5 + i * 10}
                  cy={5}
                  r={4}
                  fill={sunkSet.has(n) ? '#E8DFE5' : ballColor(n)}
                  stroke={isStripe(n) && !sunkSet.has(n) ? '#ffffff' : '#5B2A4E'}
                  stroke-width={isStripe(n) && !sunkSet.has(n) ? 1.6 : 0.8}
                />
              ))}
            </svg>
          ) : (
            <span className="billiards-chip-sub">Open table</span>
          )}
        </div>
      </div>
    );
  };

  const hint = !isMyTurn
    ? `Waiting for ${nameOf(gameState.turn)} to shoot…`
    : charging
    ? 'Tap STRIKE to shoot!'
    : working.ballInHand
    ? working.isBreak
      ? 'Drag cue ball behind the line • Tap to aim'
      : 'Ball in hand! Drag the cue ball • Tap to aim'
    : 'Tap or slide on the table to aim';

  return (
    <div className="billiards-stage">
      <div className="billiards-players-bar">
        {renderGroupRack('p1')}
        <span className="billiards-vs">VS</span>
        {renderGroupRack('p2')}
      </div>

      <div className="billiards-table-wrap">
        <svg
          ref={svgRef}
          className="billiards-svg"
          viewBox={`${-RAIL} ${-RAIL} ${TABLE_W + RAIL * 2} ${TABLE_H + RAIL * 2}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={handlePointerDown as any}
          onPointerMove={handlePointerMove as any}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <radialGradient id="blShine" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75" />
              <stop offset="45%" stop-color="#ffffff" stop-opacity="0" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0.22" />
            </radialGradient>
            <radialGradient id="blFelt" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#2FAE7A" />
              <stop offset="100%" stop-color="#1B7F58" />
            </radialGradient>
          </defs>

          {/* Wooden rail + felt */}
          <rect
            x={-RAIL}
            y={-RAIL}
            width={TABLE_W + RAIL * 2}
            height={TABLE_H + RAIL * 2}
            rx={3.2}
            fill="#B9733F"
            stroke="#5B2A4E"
            stroke-width={0.8}
          />
          <rect x={0} y={0} width={TABLE_W} height={TABLE_H} fill="url(#blFelt)" stroke="#145C40" stroke-width={0.5} />

          {/* Rail diamonds */}
          {[0.25, 0.5, 0.75].map((t) => (
            <g key={t} fill="#FFE8C7">
              <circle cx={TABLE_W * t} cy={-RAIL / 2} r={0.45} />
              <circle cx={TABLE_W * t} cy={TABLE_H + RAIL / 2} r={0.45} />
            </g>
          ))}
          {[0.125, 0.25, 0.375, 0.625, 0.75, 0.875].map((t) => (
            <g key={t} fill="#FFE8C7">
              <circle cx={-RAIL / 2} cy={TABLE_H * t} r={0.45} />
              <circle cx={TABLE_W + RAIL / 2} cy={TABLE_H * t} r={0.45} />
            </g>
          ))}

          {/* Head line + foot spot */}
          <line
            x1={0}
            y1={HEAD_LINE_Y}
            x2={TABLE_W}
            y2={HEAD_LINE_Y}
            stroke="#ffffff"
            stroke-opacity={working.isBreak ? 0.55 : 0.18}
            stroke-width={0.3}
            stroke-dasharray="1 1"
          />
          <circle cx={TABLE_W / 2} cy={FOOT_SPOT_Y} r={0.4} fill="#ffffff" opacity={0.35} />

          {/* Pockets */}
          {POCKETS.map((p, i) => (
            <circle
              key={i}
              cx={Math.min(TABLE_W + 0.6, Math.max(-0.6, p.x))}
              cy={Math.min(TABLE_H + 0.6, Math.max(-0.6, p.y))}
              r={i === 2 || i === 3 ? 2.3 : 2.7}
              fill="#1B0F17"
              stroke="#5B2A4E"
              stroke-width={0.5}
            />
          ))}

          {/* Aim guide */}
          {preview && (
            <g pointer-events="none">
              <line
                x1={cue.x}
                y1={cue.y}
                x2={preview.endX}
                y2={preview.endY}
                stroke="#ffffff"
                stroke-opacity={0.75}
                stroke-width={0.32}
                stroke-dasharray="1.1 0.8"
              />
              <circle
                cx={preview.endX}
                cy={preview.endY}
                r={BALL_R}
                fill="none"
                stroke="#ffffff"
                stroke-opacity={0.85}
                stroke-width={0.3}
              />
              {preview.hitBall && (
                <line
                  x1={preview.hitBall.x}
                  y1={preview.hitBall.y}
                  x2={preview.hitBall.x + preview.objDirX * 7}
                  y2={preview.hitBall.y + preview.objDirY * 7}
                  stroke="#FFE08A"
                  stroke-width={0.35}
                  stroke-linecap="round"
                />
              )}
            </g>
          )}

          {/* Balls */}
          {renderBalls.map((b, i) => (
            <g
              key={b.n}
              ref={(el) => {
                ballRefs.current[i] = el as SVGGElement | null;
              }}
              transform={`translate(${b.x} ${b.y})`}
              visibility={b.sunk ? 'hidden' : 'visible'}
              pointer-events="none"
            >
              <circle r={BALL_R} fill={isStripe(b.n) ? '#FFFDF5' : ballColor(b.n)} stroke="#2E1D27" stroke-width={0.18} />
              {isStripe(b.n) && (
                <>
                  <rect x={-BALL_R} y={-CAP_B} width={BALL_R * 2} height={CAP_B * 2} fill={ballColor(b.n)} />
                  <path d={STRIPE_TOP} fill="#FFFDF5" />
                  <path d={STRIPE_BOTTOM} fill="#FFFDF5" />
                  <circle r={BALL_R} fill="none" stroke="#2E1D27" stroke-width={0.18} />
                </>
              )}
              {b.n !== 0 && (
                <>
                  <circle r={0.62} fill="#FFFDF5" />
                  <text
                    y={0.3}
                    text-anchor="middle"
                    font-size={b.n > 9 ? 0.72 : 0.85}
                    font-weight="800"
                    fill="#2E1D27"
                    font-family="system-ui, sans-serif"
                  >
                    {b.n}
                  </text>
                </>
              )}
              <circle r={BALL_R} fill="url(#blShine)" />
            </g>
          ))}

          {/* Cue stick */}
          {canAct && (
            <g transform={`translate(${cue.x} ${cue.y}) rotate(${aimDeg})`} pointer-events="none">
              <g ref={cuePullRef}>
                <rect x={-BALL_R - 0.8 - 34} y={-0.42} width={34} height={0.84} rx={0.4} fill="#E9C38C" stroke="#5B2A4E" stroke-width={0.18} />
                <rect x={-BALL_R - 0.8 - 34} y={-0.48} width={11} height={0.96} rx={0.45} fill="#5B2A4E" />
                <rect x={-BALL_R - 1.4} y={-0.42} width={0.6} height={0.84} fill="#BFE6FF" />
              </g>
            </g>
          )}
        </svg>

        {toast && (
          <div className="billiards-toast anim-fade-scale" aria-live="polite">
            <SparkleIcon size={14} />
            <span>{toast}</span>
          </div>
        )}
      </div>

      <div className="billiards-controls">
        <button
          type="button"
          className="billiards-nudge-btn sticker-press"
          disabled={!canAct}
          aria-label="Rotate aim left"
          onPointerDown={() => startHold(-0.35)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          ⟲
        </button>
        <div className="billiards-power-track" aria-hidden="true">
          <div ref={powerFillRef} className="billiards-power-fill" />
          <span className="billiards-power-hint">{hint}</span>
        </div>
        <button
          type="button"
          className="billiards-nudge-btn sticker-press"
          disabled={!canAct}
          aria-label="Rotate aim right"
          onPointerDown={() => startHold(0.35)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
        >
          ⟳
        </button>
        <button
          type="button"
          className={`billiards-shoot-btn sticker-press ${charging ? 'is-charging' : ''}`}
          disabled={!canAct}
          onClick={handleShootTap}
        >
          {charging ? 'STRIKE!' : 'SHOOT'}
        </button>
      </div>
    </div>
  );
}

