import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import { RealtimeBroadcastEvent } from '../services/supabaseService';
import { PAWPALS_LEVEL_COUNT, PawPalsState } from '../engines/pawpalsSetup';
import {
  bellsTouched,
  CAT_H,
  CAT_W,
  CatBody,
  CatInput,
  COLS,
  createCat,
  createWorld,
  isHurt,
  isInBed,
  LEVELS,
  liftSurface,
  ParsedLevel,
  parseLevel,
  pressedPlates,
  ROWS,
  stepCat,
  treatsTouched,
  updateWorld,
} from '../engines/pawpalsEngine';
import {
  playAscensionChime,
  playCatMeow,
  playDizzySlide,
  playPowerupReveal,
  playTapPop,
  playVictoryFanfare,
} from '../services/soundEffects';
import { CatAvatarSvg } from './CatAvatarSvg';
import {
  bedRuns,
  FLUFF_COLOR,
  INK,
  PLATE_COLORS,
  SPLASH_COLOR,
  StaticLevelArt,
  waterRuns,
  wavePath,
} from './PawPalsArt';

interface PawPalsBoardViewProps {
  gameState: PawPalsState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  isPaused?: boolean;
  onCommitState: (next: PawPalsState) => void;
  sendRealtime: (ev: RealtimeBroadcastEvent) => void;
  subscribeRealtime: (cb: (ev: RealtimeBroadcastEvent) => void) => () => void;
}

const STEP = 1 / 120;
const SEND_MS = 66;
const INTERP_DELAY_MS = 110;
const CAT_DRAW = 1.3;
const LAND_SQUASH = 0.16;
const CLEAR_DELAY_MS = 1500;

interface Snap {
  at: number;
  x: number;
  y: number;
  f: number;
  ol?: number;
  lo?: number[];
}

type FxKind = 'dust' | 'poof' | 'spark';
interface Fx {
  id: number;
  kind: FxKind;
  x: number;
  y: number;
}

const slotColor = (s: PlayerSlot) => (s === 'p1' ? SPLASH_COLOR : FLUFF_COLOR);
const n3 = (v: number) => Math.round(v * 1000) / 1000;

/** Gate tiles stacked in one column become a single gate */
function gateColumns(level: ParsedLevel) {
  const out: { col: number; row: number; h: number; letter: string }[] = [];
  const sorted = [...level.gates].sort((a, b) => a.col - b.col || a.row - b.row);
  for (const g of sorted) {
    const prev = out[out.length - 1];
    if (prev && prev.col === g.col && prev.letter === g.letter && prev.row + prev.h === g.row) prev.h++;
    else out.push({ col: g.col, row: g.row, h: 1, letter: g.letter });
  }
  return out;
}

function FishSvg({ size = 16, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg viewBox="-0.6 -0.4 1.2 0.8" width={size} height={size * 0.67} aria-hidden="true">
      <path
        d="M-0.32 0c0-0.17 0.17-0.26 0.32-0.26c0.16 0 0.26 0.1 0.3 0.26c-0.04 0.16-0.14 0.26-0.3 0.26c-0.15 0-0.32-0.09-0.32-0.26ZM-0.3 0l-0.22-0.2v0.4Z"
        fill={filled ? '#FF9F68' : '#F4E3EC'}
        stroke={filled ? INK : '#D9B8CB'}
        stroke-width={0.06}
        stroke-linejoin="round"
      />
      {filled && <circle cx={0.14} cy={-0.05} r={0.045} fill={INK} />}
    </svg>
  );
}

export function PawPalsBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  isPaused = false,
  onCommitState,
  sendRealtime,
  subscribeRealtime,
}: PawPalsBoardViewProps) {
  const levelIdx = Math.min(gameState.level, PAWPALS_LEVEL_COUNT - 1);
  const finished = gameState.level >= PAWPALS_LEVEL_COUNT || gameState.winner === 'draw';
  const level = useMemo(() => parseLevel(LEVELS[levelIdx]), [levelIdx]);
  const partnerSlot: PlayerSlot = mySlot === 'p1' ? 'p2' : 'p1';

  const catRef = useRef<CatBody>(createCat(level.spawns[mySlot]));
  const worldRef = useRef(createWorld(level));
  const inputRef = useRef<CatInput>({ left: false, right: false, jump: false });
  const snapsRef = useRef<Snap[]>([]);
  const collectedRef = useRef<Set<number>>(new Set());
  const clearedRef = useRef(-1);
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const finishedRef = useRef(finished);
  finishedRef.current = finished;
  const commitRef = useRef(onCommitState);
  commitRef.current = onCommitState;
  const commitTimerRef = useRef<number | null>(null);
  const introTimerRef = useRef<number | null>(null);
  const resetKeyRef = useRef<string>('');

  const myElRef = useRef<SVGGElement | null>(null);
  const myBodyRef = useRef<SVGGElement | null>(null);
  const myShadowRef = useRef<SVGEllipseElement | null>(null);
  const partnerElRef = useRef<SVGGElement | null>(null);
  const partnerBodyRef = useRef<SVGGElement | null>(null);
  const partnerShadowRef = useRef<SVGEllipseElement | null>(null);
  const liftElRefs = useRef<(SVGGElement | null)[]>([]);

  const [openKey, setOpenKey] = useState('');
  const [collected, setCollected] = useState<number[]>([]);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [intro, setIntro] = useState<number | null>(null);
  const [partnerSeen, setPartnerSeen] = useState(false);
  const [bedStatus, setBedStatus] = useState<{ me: boolean; partner: boolean }>({ me: false, partner: false });
  const [fx, setFx] = useState<Fx[]>([]);
  const fxIdRef = useRef(1);

  const avatarOf = (s: PlayerSlot) => (s === 'p1' ? p1Avatar : p2Avatar);
  const showToast = (msg: string, ms = 1800) => {
    const id = Date.now();
    setToast({ id, msg });
    window.setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), ms);
  };
  const spawnFx = (kind: FxKind, x: number, y: number) => {
    const id = fxIdRef.current++;
    setFx((list) => [...list.slice(-6), { id, kind, x, y }]);
    window.setTimeout(() => setFx((list) => list.filter((e) => e.id !== id)), 700);
  };
  const spawnFxRef = useRef(spawnFx);
  spawnFxRef.current = spawnFx;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    if (finished) playVictoryFanfare();
  }, [finished]);

  useEffect(
    () => () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current);
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
    },
    []
  );

  // Partner stream
  useEffect(
    () =>
      subscribeRealtime((ev) => {
        if (ev.type === 'pawpals_pos') {
          if (ev.slot === mySlot || ev.lv !== stateRef.current.level) {
            return;
          }
          if (ev.la && ev.la.length) {
            let added = false;
            for (const letter of ev.la) {
              if (!worldRef.current.latched[letter]) {
                worldRef.current.latched[letter] = true;
                added = true;
              }
            }
            if (added) playPowerupReveal();
          }
          const buf = snapsRef.current;
          buf.push({
            at: performance.now(),
            x: ev.x,
            y: ev.y,
            f: ev.f,
            ol: ev.ol,
            lo: ev.lo,
          });
          if (buf.length > 30) buf.splice(0, buf.length - 30);
          setPartnerSeen(true);
        } else if (ev.type === 'pawpals_treat') {
          if (ev.lv !== stateRef.current.level || collectedRef.current.has(ev.id)) {
            return;
          }
          collectedRef.current.add(ev.id);
          setCollected([...collectedRef.current]);
          playCatMeow();
        } else if (ev.type === 'pawpals_latch') {
          if (ev.lv !== stateRef.current.level || worldRef.current.latched[ev.letter]) {
            return;
          }
          worldRef.current.latched[ev.letter] = true;
          playPowerupReveal();
          showToastRef.current('🔔 Cat Bell unlocked!');
        }
      }),
    [mySlot]
  );

  // Synchronous layout reset + fixed-step simulation loop per level/seed so stale rAF frames
  // can never fire across level transitions or rematches.
  useLayoutEffect(() => {
    const resetKey = `${levelIdx}:${gameState.matchSeed}:${mySlot}`;
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
      if (introTimerRef.current !== null) {
        window.clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }

      catRef.current = createCat(level.spawns[mySlot]);
      worldRef.current = createWorld(level);
      snapsRef.current = [];
      collectedRef.current = new Set();
      clearedRef.current = -1;
      setCollected([]);
      setOpenKey('');
      setPartnerSeen(false);
      setBedStatus({ me: false, partner: false });
      setFx([]);

      const mySp = level.spawns[mySlot];
      const pSp = level.spawns[partnerSlot];
      myElRef.current?.setAttribute('transform', `translate(${n3(mySp.x + CAT_W / 2)} ${n3(mySp.y + CAT_H)})`);
      partnerElRef.current?.setAttribute('transform', `translate(${n3(pSp.x + CAT_W / 2)} ${n3(pSp.y + CAT_H)})`);
      level.lifts.forEach((_, i) => {
        liftElRefs.current[i]?.setAttribute('transform', 'translate(0 0)');
      });

      if (!finished) {
        setIntro(levelIdx);
        introTimerRef.current = window.setTimeout(() => {
          introTimerRef.current = null;
          setIntro((v) => (v === levelIdx ? null : v));
        }, 2300);
        if (gameState.level > 0) playPowerupReveal();
      } else {
        setIntro(null);
      }
    }

    if (finished) return undefined;

    let disposed = false;
    const simLevel = gameState.level;
    const simSeed = gameState.matchSeed;
    let effectCleared = false;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastSend = 0;
    let seq = 0;
    let lastBed = '';
    let landT = 0;
    // Partner motion estimate (for squash & stretch + lift-relative alignment)
    let pPrev: { x: number; y: number } | null = null;
    let pVy = 0;
    let pVx = 0;
    let pLandT = 0;
    let pRideLift = -1;
    let pLastDelta = 0;

    const snapAt = (now: number): { a: Snap; b: Snap; k: number } | null => {
      const buf = snapsRef.current;
      if (!buf.length) return null;
      const t = now - INTERP_DELAY_MS;
      for (let i = buf.length - 1; i > 0; i--) {
        const a = buf[i - 1];
        const b = buf[i];
        if (a.at <= t && t <= b.at) {
          const k = b.at === a.at ? 1 : (t - a.at) / (b.at - a.at);
          return { a, b, k };
        }
      }
      const edge = t < buf[0].at ? buf[0] : buf[buf.length - 1];
      return { a: edge, b: edge, k: 1 };
    };

    const resolvePartner = (
      pair: { a: Snap; b: Snap; k: number } | null,
      dtReal: number
    ): (Snap & { onAnyLift: boolean }) | null => {
      if (!pair) return null;
      const { a, b, k } = pair;
      // Avoid interpolating a long streak through walls when partner respawns at spawn
      const teleported = Math.hypot(b.x - a.x, b.y - a.y) > 2.5;
      const rx = teleported ? b.x : a.x + (b.x - a.x) * k;
      const ryRaw = teleported ? b.y : a.y + (b.y - a.y) * k;

      if (teleported) {
        pRideLift = -1;
        pLastDelta = 0;
      }

      if (level.lifts.length === 0) {
        return { at: a.at + (b.at - a.at) * k, x: rx, y: ryRaw, f: b.f, onAnyLift: false };
      }

      const overLiftCol = (x: number, idx: number): boolean => {
        const lift = level.lifts[idx];
        return Boolean(lift && x + CAT_W > lift.col - 0.15 && x < lift.col + lift.w + 0.15);
      };

      const snapY = (s: Snap, rideIdx: number): number => {
        if (s.ol !== undefined && s.ol >= 0 && level.lifts[s.ol]) {
          return liftSurface(level, worldRef.current, s.ol) - CAT_H;
        }
        if (rideIdx >= 0 && overLiftCol(s.x, rideIdx) && level.lifts[rideIdx]) {
          const lift = level.lifts[rideIdx];
          const remoteY = lift.top - (s.lo?.[rideIdx] ?? worldRef.current.liftOffset[rideIdx]);
          if (s.y + CAT_H <= remoteY + 0.25) {
            return s.y + (liftSurface(level, worldRef.current, rideIdx) - remoteY);
          }
        }
        return s.y;
      };

      const aLift = !teleported && a.ol !== undefined && a.ol >= 0 ? a.ol : -1;
      const bLift = b.ol !== undefined && b.ol >= 0 ? b.ol : -1;

      if (bLift >= 0) {
        pRideLift = bLift;
      } else if (aLift >= 0) {
        pRideLift = aLift;
      } else if (pRideLift >= 0) {
        const lift = level.lifts[pRideLift];
        const bRemoteY = lift ? lift.top - (b.lo?.[pRideLift] ?? worldRef.current.liftOffset[pRideLift]) : 0;
        if (!lift || !overLiftCol(rx, pRideLift) || b.y + CAT_H > bRemoteY + 0.25) {
          pRideLift = -1;
        }
      }

      let ry: number;
      if (aLift >= 0 || bLift >= 0 || pRideLift >= 0) {
        const ay = teleported ? snapY(b, pRideLift) : snapY(a, pRideLift);
        const by = snapY(b, pRideLift);
        ry = teleported ? by : ay + (by - ay) * k;
        pLastDelta = ry - ryRaw;
      } else {
        if (pLastDelta !== 0 && dtReal > 0) {
          const decay = 6 * dtReal;
          pLastDelta = Math.abs(pLastDelta) <= decay ? 0 : pLastDelta - Math.sign(pLastDelta) * decay;
        }
        ry = ryRaw + pLastDelta;
      }

      const onAnyLift = bLift >= 0 || (!teleported && k < 0.99 && aLift >= 0 && bLift === aLift);
      return { at: a.at + (b.at - a.at) * k, x: rx, y: ry, f: b.f, onAnyLift };
    };

    const bodyTransform = (
      facing: number,
      grounded: boolean,
      vx: number,
      vy: number,
      land: number,
      t: number
    ) => {
      let sx = 1;
      let sy = 1;
      let rot = 0;
      if (land > 0) {
        const k = land / LAND_SQUASH;
        sx = 1 + 0.18 * k;
        sy = 1 - 0.22 * k;
      } else if (!grounded) {
        const s = Math.min(0.13, Math.abs(vy) * 0.01);
        sx = 1 - s * 0.6;
        sy = 1 + s;
      } else if (Math.abs(vx) > 1) {
        const w = Math.sin(t * 19);
        rot = w * 5;
        sy = 1 + Math.abs(w) * 0.05;
      } else {
        sy = 1 + Math.sin(t * 3) * 0.015;
      }
      return `scale(${facing} 1) rotate(${n3(rot)}) scale(${n3(sx)} ${n3(sy)})`;
    };

    const frame = (now: number) => {
      if (disposed) return;
      const st = stateRef.current;
      if (st.level !== simLevel || st.matchSeed !== simSeed || finishedRef.current) return;

      const dtReal = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const playing = !pausedRef.current && !effectCleared && clearedRef.current !== st.level;
      const interpPair = snapAt(now);
      const latestPartner = snapsRef.current.length ? snapsRef.current[snapsRef.current.length - 1] : null;
      const cat = catRef.current;

      if (playing) {
        acc += dtReal;
        let steps = 0;
        while (acc >= STEP - 1e-6 && steps < 10) {
          acc -= STEP;
          steps++;
          const wasAir = !cat.grounded;
          const vyBefore = cat.vy;
          const pressed = pressedPlates(level, latestPartner ? [cat, latestPartner] : [cat]);
          const carry = updateWorld(level, worldRef.current, pressed, STEP);
          const outcome = stepCat(cat, inputRef.current, level, worldRef.current, mySlot, STEP, carry);
          if (outcome === 'hurt') {
            playDizzySlide();
            spawnFxRef.current('poof', cat.x + CAT_W / 2, cat.y + CAT_H / 2);
            showToastRef.current(
              isHurt(cat, level, partnerSlot)
                ? 'Ouch, thorns! Try again'
                : mySlot === 'p1'
                ? 'Splash got tangled in yarn!'
                : 'Fluff hates water!'
            );
            catRef.current = createCat(level.spawns[mySlot]);
            const sp = level.spawns[mySlot];
            spawnFxRef.current('spark', sp.x + CAT_W / 2, sp.y + CAT_H / 2);
            break;
          }
          if (outcome === 'bounce') {
            playTapPop();
            spawnFxRef.current('dust', cat.x + CAT_W / 2, cat.y + CAT_H);
          }
          if (wasAir && cat.grounded && vyBefore > 7) {
            landT = LAND_SQUASH;
            if (vyBefore > 11) spawnFxRef.current('dust', cat.x + CAT_W / 2, cat.y + CAT_H);
          }
          for (const letter of bellsTouched(cat, level)) {
            if (worldRef.current.latched[letter]) continue;
            worldRef.current.latched[letter] = true;
            worldRef.current.open[letter] = true;
            playPowerupReveal();
            spawnFxRef.current('spark', cat.x + CAT_W / 2, cat.y + CAT_H / 2);
            showToastRef.current('🔔 Cat Bell unlocked!');
            sendRealtime({ type: 'pawpals_latch', slot: mySlot, lv: st.level, letter });
          }
          for (const id of treatsTouched(cat, level)) {
            if (collectedRef.current.has(id)) continue;
            collectedRef.current.add(id);
            setCollected([...collectedRef.current]);
            playCatMeow();
            sendRealtime({ type: 'pawpals_treat', slot: mySlot, lv: st.level, seed: st.matchSeed, id });
          }
        }
        if (steps >= 10) acc = 0;
      } else {
        acc = 0;
      }

      const partner = resolvePartner(interpPair, dtReal);
      const c = catRef.current;
      // ---- Visuals (direct DOM writes — no re-render per frame) ----
      const combinedOpen: Record<string, boolean> = {
        ...worldRef.current.open,
        ...worldRef.current.latched,
      };
      const key = Object.keys(combinedOpen)
        .filter((k) => combinedOpen[k])
        .sort()
        .join('');
      setOpenKey((prev) => (prev === key ? prev : key));

      landT = Math.max(0, landT - dtReal);
      myElRef.current?.setAttribute('transform', `translate(${n3(c.x + CAT_W / 2)} ${n3(c.y + CAT_H)})`);
      myBodyRef.current?.setAttribute('transform', bodyTransform(c.facing, c.grounded, c.vx, c.vy, landT, t));
      myShadowRef.current?.setAttribute('opacity', c.grounded ? '0.22' : '0.08');

      if (partner) {
        if (pPrev && dtReal > 0) {
          const vy = (partner.y - pPrev.y) / dtReal;
          const vx = (partner.x - pPrev.x) / dtReal;
          if (pVy > 6 && (partner.onAnyLift || Math.abs(vy) < 1)) pLandT = LAND_SQUASH;
          pVy = pVy * 0.5 + vy * 0.5;
          pVx = pVx * 0.5 + vx * 0.5;
        }
        pPrev = { x: partner.x, y: partner.y };
        pLandT = Math.max(0, pLandT - dtReal);
        const pGrounded = partner.onAnyLift || Math.abs(pVy) < 1.2;
        partnerElRef.current?.setAttribute(
          'transform',
          `translate(${n3(partner.x + CAT_W / 2)} ${n3(partner.y + CAT_H)})`
        );
        partnerBodyRef.current?.setAttribute(
          'transform',
          bodyTransform(partner.f, pGrounded, pVx, pVy, pLandT, t + 0.7)
        );
        partnerShadowRef.current?.setAttribute('opacity', pGrounded ? '0.22' : '0.08');
      }
      level.lifts.forEach((_, i) => {
        liftElRefs.current[i]?.setAttribute(
          'transform',
          `translate(0 ${n3(liftSurface(level, worldRef.current, i) - level.lifts[i].top)})`
        );
      });

      // Bed check: both cats resting in the bed clears the level (host commits)
      const meIn = isInBed(c, level) && c.grounded;
      const partnerIn = Boolean(partner && isInBed(partner, level));
      const bedKey = `${meIn}-${partnerIn}`;
      if (bedKey !== lastBed) {
        lastBed = bedKey;
        setBedStatus({ me: meIn, partner: partnerIn });
        if (meIn && partnerIn && !finishedRef.current) playAscensionChime();
      }
      if (meIn && partnerIn && playing && !effectCleared && mySlot === 'p1' && clearedRef.current !== st.level) {
        effectCleared = true;
        clearedRef.current = st.level;
        const results = [...st.results, { treats: collectedRef.current.size }];
        const nextLevel = st.level + 1;
        const snapshot = st;
        commitTimerRef.current = window.setTimeout(() => {
          commitTimerRef.current = null;
          commitRef.current({
            ...snapshot,
            level: nextLevel,
            results,
            winner: nextLevel >= PAWPALS_LEVEL_COUNT ? 'draw' : null,
          });
        }, CLEAR_DELAY_MS);
      }

      // Stream my position (~15 Hz)
      if (now - lastSend >= SEND_MS && !finishedRef.current) {
        lastSend = now;
        const latches = Object.keys(worldRef.current.latched).filter((k) => worldRef.current.latched[k]);
        sendRealtime({
          type: 'pawpals_pos',
          slot: mySlot,
          lv: st.level,
          seed: st.matchSeed,
          x: Math.round(c.x * 100) / 100,
          y: Math.round(c.y * 100) / 100,
          f: c.facing,
          seq: seq++,
          ...(level.lifts.length > 0
            ? {
                ol: c.onLift,
                lo: worldRef.current.liftOffset.map((v) => Math.round(v * 100) / 100),
              }
            : {}),
          ...(latches.length > 0 ? { la: latches } : {}),
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
    };
  }, [level, levelIdx, gameState.level, gameState.matchSeed, finished, mySlot, partnerSlot]);

  // Keyboard (desktop / testing)
  useEffect(() => {
    const map = (k: string): keyof CatInput | null =>
      k === 'ArrowLeft' || k === 'a' || k === 'A'
        ? 'left'
        : k === 'ArrowRight' || k === 'd' || k === 'D'
        ? 'right'
        : k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' '
        ? 'jump'
        : null;
    const down = (e: KeyboardEvent) => {
      const m = map(e.key);
      if (!m) return;
      e.preventDefault();
      inputRef.current = { ...inputRef.current, [m]: true };
    };
    const up = (e: KeyboardEvent) => {
      const m = map(e.key);
      if (!m) return;
      inputRef.current = { ...inputRef.current, [m]: false };
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const hold = (k: keyof CatInput, v: boolean) => (e: PointerEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    if (v) {
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        // Synthetic / already-released pointer — ignore
      }
    }
    el.classList.toggle('is-down', v);
    if (v && k === 'jump') playTapPop();
    inputRef.current = { ...inputRef.current, [k]: v };
  };
  const holdProps = (k: keyof CatInput) => ({
    onPointerDown: hold(k, true) as any,
    onPointerUp: hold(k, false) as any,
    onPointerCancel: hold(k, false) as any,
    onPointerLeave: hold(k, false) as any,
  });

  const idPrefix = `pp${levelIdx}-`;
  const staticArt = useMemo(() => <StaticLevelArt level={level} idPrefix={idPrefix} />, [level]);
  const gates = useMemo(() => gateColumns(level), [level]);
  const waters = useMemo(() => waterRuns(level), [level]);
  const beds = useMemo(() => bedRuns(level), [level]);

  const open = new Set(openKey.split(''));
  const partnerAv = avatarOf(partnerSlot);
  const myAv = avatarOf(mySlot);
  const partnerSpawn = level.spawns[partnerSlot];
  const clearing = bedStatus.me && bedStatus.partner && !finished;
  const treatsTotal = level.treats.length;

  const emblem = (s: PlayerSlot) =>
    s === 'p1' ? (
      <path
        d="M0.5 -1.22c0.1 0.13 0.15 0.22 0.15 0.3a0.15 0.15 0 0 1 -0.3 0c0 -0.08 0.05 -0.17 0.15 -0.3Z"
        fill={SPLASH_COLOR}
        stroke="#ffffff"
        stroke-width={0.05}
      />
    ) : (
      <g>
        <circle cx={0.5} cy={-1.0} r={0.15} fill={FLUFF_COLOR} stroke="#ffffff" stroke-width={0.05} />
        <path d="M0.38 -1.05q0.12 0.08 0.24 -0.02M0.4 -0.94q0.1 -0.06 0.2 0.02" stroke="#ffffff" stroke-width={0.03} fill="none" />
      </g>
    );

  const renderCatBody = (
    s: PlayerSlot,
    av: CatAvatarConfig,
    bodyRef: { current: SVGGElement | null },
    shadowRef: { current: SVGEllipseElement | null }
  ) => (
    <>
      <ellipse ref={shadowRef} cx={0} cy={-0.02} rx={0.42} ry={0.09} fill="#2E1D27" opacity={0.22} />
      <g ref={bodyRef}>
        <CatAvatarSvg
          breed={av.breed}
          accessory={av.accessory}
          size={CAT_DRAW}
          x={-CAT_DRAW / 2}
          y={-CAT_DRAW + 0.14}
          animateIdle={false}
        />
      </g>
      {emblem(s)}
    </>
  );

  const nameTag = (label: string, color: string) => {
    const w = Math.min(3.2, 0.45 + label.length * 0.2);
    return (
      <g transform="translate(0 -1.62)">
        <rect x={-w / 2} y={-0.24} width={w} height={0.44} rx={0.22} fill={color} stroke={INK} stroke-width={0.04} />
        <text
          x={0}
          y={0.08}
          text-anchor="middle"
          font-size={0.3}
          font-weight={800}
          fill="#ffffff"
          font-family="'Baloo 2', system-ui, sans-serif"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="pawpals-stage">
      {/* HUD */}
      <div className="pawpals-hud">
        <div className="pawpals-level-chip">
          <span className="pawpals-level-num">{levelIdx + 1}</span>
          <div className="pawpals-level-meta">
            <span className="pawpals-level-name">{level.name}</span>
            <span className="pawpals-level-pips">
              {Array.from({ length: PAWPALS_LEVEL_COUNT }, (_, i) => (
                <i
                  key={i}
                  className={i < gameState.level ? 'done' : i === levelIdx && !finished ? 'now' : ''}
                />
              ))}
            </span>
          </div>
        </div>
        <div className="pawpals-fish-chip" aria-label={`${collected.length} of ${treatsTotal} treats`}>
          {level.treats.map((t, i) => (
            <span key={t.id} className={i < collected.length ? 'got' : ''}>
              <FishSvg size={20} filled={i < collected.length} />
            </span>
          ))}
        </div>
      </div>

      <div className="pawpals-board-wrap">
        <div className="pawpals-frame">
          {/* Static layer: painted once per level */}
          <svg className="pawpals-svg" viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {staticArt}
          </svg>

          {/* Dynamic layer: cats, gates, plates, lifts, treats, effects */}
          <svg
            className="pawpals-svg pawpals-live"
            viewBox={`0 0 ${COLS} ${ROWS}`}
            preserveAspectRatio="xMidYMid meet"
            aria-label={`Paw Pals level ${levelIdx + 1}`}
          >
            {/* Water crests */}
            {waters.map((w) => (
              <g key={`w-${w.r}-${w.c0}`} className="pp-wave">
                <path d={wavePath(w.c0, w.c1, w.r + 0.43, 0.07, 0.5)} stroke="#E8FAFF" stroke-width={0.1} fill="none" stroke-linecap="round" />
              </g>
            ))}

            {/* Sleepy Zzz over each bed */}
            {beds.map((b) => (
              <g key={`z-${b.r}-${b.c0}`} transform={`translate(${(b.c0 + b.c1) / 2 + 0.2} ${b.r + 0.3})`}>
                <text className="pp-zzz" font-size={0.42} font-weight={800} fill="#B77CE0" font-family="'Baloo 2', system-ui, sans-serif">
                  z
                </text>
                <text className="pp-zzz pp-zzz-2" font-size={0.32} font-weight={800} fill="#B77CE0" font-family="'Baloo 2', system-ui, sans-serif">
                  z
                </text>
              </g>
            ))}

            {/* Gates */}
            {gates.map((g) => {
              const col = PLATE_COLORS[g.letter];
              const isOpen = open.has(g.letter);
              const bars = [0.3, 0.5, 0.7];
              return (
                <g key={`g-${g.col}-${g.row}`} className={`pp-gate ${isOpen ? 'open' : ''}`} transform={`translate(${g.col} ${g.row})`}>
                  <rect x={0.05} y={-0.06} width={0.9} height={0.14} rx={0.07} fill={col.dark} stroke={INK} stroke-width={0.05} />
                  <g className="pp-gate-body">
                    <rect x={0.14} y={0.04} width={0.72} height={g.h - 0.04} rx={0.12} fill={col.main} stroke={INK} stroke-width={0.06} />
                    {bars.map((x) => (
                      <line key={x} x1={x + 0.0} y1={0.18} x2={x} y2={g.h - 0.16} stroke={col.light} stroke-width={0.07} stroke-linecap="round" />
                    ))}
                    <circle cx={0.5} cy={g.h / 2} r={0.2} fill="#FFFDF5" stroke={INK} stroke-width={0.05} />
                    <path d={`M0.5 ${g.h / 2 - 0.09}a0.05 0.05 0 0 1 0.04 0.09l0.03 0.09h-0.14l0.03 -0.09a0.05 0.05 0 0 1 0.04 -0.09Z`} fill={INK} />
                  </g>
                </g>
              );
            })}

            {/* Bridges (dashed outline when inactive, solid walkway when active) */}
            {level.bridges.map((br, i) => {
              const letter = br.plate.toUpperCase();
              const col = PLATE_COLORS[letter];
              const isActive = open.has(letter);
              const dots = Math.max(1, Math.floor(br.w));
              return (
                <g key={`br-${i}`} className={`pp-bridge ${isActive ? 'on' : ''}`}>
                  <rect
                    x={br.col + 0.04}
                    y={br.row + 0.02}
                    width={br.w - 0.08}
                    height={0.32}
                    rx={0.14}
                    fill={col.main}
                    stroke={INK}
                    stroke-width={0.055}
                    className="pp-bridge-solid"
                  />
                  {isActive && (
                    <>
                      <rect x={br.col + 0.16} y={br.row + 0.07} width={br.w - 0.32} height={0.06} rx={0.03} fill={col.light} />
                      {Array.from({ length: dots }, (_, k) => (
                        <circle key={k} cx={br.col + 0.5 + k} cy={br.row + 0.22} r={0.055} fill={col.dark} />
                      ))}
                    </>
                  )}
                  {!isActive && (
                    <rect
                      x={br.col + 0.06}
                      y={br.row + 0.04}
                      width={br.w - 0.12}
                      height={0.28}
                      rx={0.12}
                      fill={col.light}
                      fill-opacity={0.18}
                      stroke={col.dark}
                      stroke-width={0.06}
                      stroke-dasharray="0.22 0.16"
                    />
                  )}
                </g>
              );
            })}

            {/* Bouncy paw cushions */}
            {level.cushions.map((cu) => (
              <g key={`cu-${cu.id}`} className="pp-cushion" transform={`translate(${cu.col} ${cu.row})`}>
                <path d="M0.26 0.96L0.74 0.84M0.74 0.96L0.26 0.84" stroke="#B794F6" stroke-width={0.07} stroke-linecap="round" />
                <rect x={0.12} y={0.56} width={0.76} height={0.32} rx={0.14} fill="#FF8FB1" stroke={INK} stroke-width={0.055} />
                <rect x={0.22} y={0.61} width={0.56} height={0.07} rx={0.035} fill="#FFC4D6" />
                <path d="M0.5 0.65l0.14 0.14h-0.28Z" fill="#FFFDF5" />
              </g>
            ))}

            {/* Hanging Cat Bells (permanent latch once touched) */}
            {level.bells.map((b) => {
              const col = PLATE_COLORS[b.letter];
              const isRung = open.has(b.letter);
              return (
                <g
                  key={`bl-${b.col}-${b.row}`}
                  className={`pp-bell ${isRung ? 'on' : ''}`}
                  transform={`translate(${b.col + 0.5} ${b.row + 0.48})`}
                >
                  {isRung && <circle r={0.44} fill="#FFF3B0" opacity={0.75} />}
                  <line x1={0} y1={-0.48} x2={0} y2={-0.25} stroke={INK} stroke-width={0.05} />
                  <path
                    d="M-0.22 -0.14l0.06 -0.15l0.1 0.09h0.12l0.1 -0.09l0.06 0.15c0.09 0.08 0.12 0.24 0.14 0.34h-0.72c0.02 -0.1 0.05 -0.26 0.14 -0.34Z"
                    fill={isRung ? col.main : '#FFFDF5'}
                    stroke={INK}
                    stroke-width={0.055}
                    stroke-linejoin="round"
                  />
                  <circle cx={0} cy={0.26} r={0.075} fill={col.dark} stroke={INK} stroke-width={0.04} />
                  <circle cx={-0.08} cy={0.01} r={0.032} fill={INK} />
                  <circle cx={0.08} cy={0.01} r={0.032} fill={INK} />
                </g>
              );
            })}

            {/* Pressure plates */}
            {level.plates.map((p) => {
              const col = PLATE_COLORS[p.letter];
              return (
                <g
                  key={`p-${p.col}-${p.row}`}
                  className={`pp-plate ${open.has(p.letter) ? 'on' : ''}`}
                  transform={`translate(${p.col} ${p.row})`}
                >
                  <rect x={0.04} y={0.86} width={0.92} height={0.14} rx={0.05} fill="#8E5B7B" stroke={INK} stroke-width={0.05} />
                  <g className="pp-plate-btn">
                    <rect x={0.14} y={0.68} width={0.72} height={0.22} rx={0.09} fill={col.main} stroke={INK} stroke-width={0.05} />
                    <rect x={0.24} y={0.71} width={0.36} height={0.05} rx={0.025} fill={col.light} />
                  </g>
                </g>
              );
            })}

            {/* Lifts */}
            {level.lifts.map((l, i) => {
              const col = PLATE_COLORS[l.plate.toUpperCase()];
              return (
                <g
                  key={`l-${i}`}
                  ref={(el) => {
                    liftElRefs.current[i] = el as SVGGElement | null;
                  }}
                >
                  <rect x={l.col + 0.04} y={l.top} width={l.w - 0.08} height={0.4} rx={0.13} fill={col.main} stroke={INK} stroke-width={0.06} />
                  <rect x={l.col + 0.18} y={l.top + 0.06} width={l.w - 0.6} height={0.07} rx={0.035} fill={col.light} />
                  <circle cx={l.col + 0.26} cy={l.top + 0.26} r={0.05} fill={col.dark} />
                  <circle cx={l.col + l.w - 0.26} cy={l.top + 0.26} r={0.05} fill={col.dark} />
                  <path d={`M${l.col + l.w / 2} ${l.top + 0.12}l0.12 0.16h-0.24Z`} fill="#FFFDF5" />
                </g>
              );
            })}

            {/* Fish treats */}
            {level.treats.map((t) => (
              <g key={`t-${t.id}`} transform={`translate(${t.col + 0.5} ${t.row + 0.5}) scale(1.2)`}>
                <g
                  className={`pp-treat ${collected.includes(t.id) ? 'got' : ''}`}
                  style={{ animationDelay: `${(t.id * 0.37) % 1.2}s` }}
                >
                  <circle r={0.4} fill="#FFF3B0" opacity={0.6} />
                  <circle r={0.28} fill="#FFFBE0" opacity={0.7} />
                  <path
                    d="M-0.24 0c0-0.15 0.15-0.23 0.28-0.23c0.14 0 0.23 0.09 0.27 0.23c-0.04 0.14-0.13 0.23-0.27 0.23c-0.13 0-0.28-0.08-0.28-0.23ZM-0.22 0l-0.2-0.18v0.36Z"
                    fill="#FF9F68"
                    stroke={INK}
                    stroke-width={0.05}
                    stroke-linejoin="round"
                  />
                  <circle cx={0.15} cy={-0.05} r={0.04} fill={INK} />
                  <path d="M-0.02 -0.12q0.06 0.12 0 0.24" stroke="#FFD2B8" stroke-width={0.04} fill="none" />
                </g>
              </g>
            ))}

            {/* Partner cat (interpolated) */}
            <g
              ref={partnerElRef}
              className={partnerSeen ? '' : 'pp-ghost'}
              transform={`translate(${partnerSpawn.x + CAT_W / 2} ${partnerSpawn.y + CAT_H})`}
            >
              {renderCatBody(partnerSlot, partnerAv, partnerBodyRef, partnerShadowRef)}
              {nameTag(partnerSeen ? partnerAv.name || 'Partner' : 'Waiting…', slotColor(partnerSlot))}
            </g>

            {/* My cat */}
            <g ref={myElRef} transform={`translate(${level.spawns[mySlot].x + CAT_W / 2} ${level.spawns[mySlot].y + CAT_H})`}>
              {renderCatBody(mySlot, myAv, myBodyRef, myShadowRef)}
              <g transform="translate(0 -1.55)">
                <path className="pp-you" d="M-0.18 -0.14h0.36l-0.18 0.2Z" fill={slotColor(mySlot)} stroke={INK} stroke-width={0.04} stroke-linejoin="round" />
              </g>
            </g>

            {/* Effects */}
            {fx.map((e) => (
              <g key={e.id} transform={`translate(${n3(e.x)} ${n3(e.y)})`}>
                {e.kind === 'dust' ? (
                  <g className="pp-fx pp-fx-dust">
                    <circle cx={-0.32} cy={-0.08} r={0.13} fill="#FFFFFF" stroke="#E8CFDF" stroke-width={0.03} />
                    <circle cx={0.32} cy={-0.08} r={0.13} fill="#FFFFFF" stroke="#E8CFDF" stroke-width={0.03} />
                    <circle cx={0} cy={-0.14} r={0.1} fill="#FFFFFF" stroke="#E8CFDF" stroke-width={0.03} />
                  </g>
                ) : e.kind === 'poof' ? (
                  <g className="pp-fx pp-fx-poof">
                    <circle r={0.5} fill="#FFFFFF" opacity={0.9} />
                    <circle cx={-0.4} cy={0.1} r={0.3} fill="#FFFFFF" />
                    <circle cx={0.42} cy={0.05} r={0.32} fill="#FFFFFF" />
                    <circle cx={0} cy={-0.4} r={0.28} fill="#FFFFFF" />
                    <path d="M-0.15 -0.05l0.1 0.1M-0.05 -0.05l-0.1 0.1M0.07 -0.05l0.1 0.1M0.17 -0.05l-0.1 0.1" stroke={INK} stroke-width={0.04} />
                  </g>
                ) : (
                  <g className="pp-fx pp-fx-spark">
                    <path
                      d="M0 -0.6l0.12 0.42l0.42 0.12l-0.42 0.12l-0.12 0.42l-0.12 -0.42l-0.42 -0.12l0.42 -0.12Z"
                      fill="#FFE08A"
                      stroke={INK}
                      stroke-width={0.04}
                    />
                  </g>
                )}
              </g>
            ))}
          </svg>

          {/* Level intro card */}
          {intro !== null && !finished && (
            <div className="pawpals-intro" key={`intro-${intro}`}>
              <span className="pawpals-intro-kicker">Level {intro + 1} of {PAWPALS_LEVEL_COUNT}</span>
              <span className="pawpals-intro-title">{level.name}</span>
              <span className="pawpals-intro-hint">{level.hint}</span>
            </div>
          )}

          {/* Level clear celebration */}
          {clearing && (
            <div className="pawpals-clear">
              <div className="pawpals-clear-card">
                <span className="pawpals-clear-title">Snuggle time! 💞</span>
                <span className="pawpals-clear-fish">
                  {level.treats.map((t, i) => (
                    <FishSvg key={t.id} size={22} filled={i < collected.length} />
                  ))}
                </span>
              </div>
              <span className="pp-heart h1">❤</span>
              <span className="pp-heart h2">❤</span>
              <span className="pp-heart h3">❤</span>
            </div>
          )}

          {toast && (
            <div className="pawpals-toast" key={toast.id} aria-live="polite">
              {toast.msg}
            </div>
          )}
          {(bedStatus.me || bedStatus.partner) && !clearing && !finished && (
            <div className="pawpals-bed-hint">
              {bedStatus.me ? `Waiting for ${partnerAv.name} in the bed…` : `${partnerAv.name} is waiting in the bed!`}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="pawpals-controls">
        <div className="pawpals-dpad">
          <button type="button" className="pawpals-btn" aria-label="Move left" {...holdProps('left')}>
            <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
              <path d="M15 5L8 12l7 7" fill="none" stroke="currentColor" stroke-width={3.4} stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button type="button" className="pawpals-btn" aria-label="Move right" {...holdProps('right')}>
            <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width={3.4} stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <div className={`pawpals-role ${mySlot}`}>
          <span className="pawpals-role-name">{mySlot === 'p1' ? '💧 Splash' : '🧶 Fluff'}</span>
          <span className="pawpals-role-hint">{mySlot === 'p1' ? 'can swim • no yarn!' : 'yarn-proof • no water!'}</span>
        </div>
        <button type="button" className="pawpals-btn pawpals-jump" aria-label="Jump" {...holdProps('jump')}>
          <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
            <path d="M12 19V6M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width={3.4} stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
}
