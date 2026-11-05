import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  BoardJumpLink,
  SnakesGameState,
  SnakesMaxTile,
  applySnakesDiceRoll,
  generateSnakesBoard,
  tileToSvgCenter,
} from '../engines/snakesEngine';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import {
  CatActionAnim,
  CatAvatarSvg,
  CoupleCatsSceneSvg,
} from './CatAvatarSvg';
import {
  ConfettiCelebrationOverlay,
  CrownIcon,
  DiceFaceSvg,
  DoubleHeartIcon,
  PowerupIllustrationSvg,
} from './ArcadeIcons';
import {
  playCatPounceCapture,
  playCatStep,
  playDiceRattle,
  playDizzySlide,
  playPowerupReveal,
  playTurnBannerPop,
  playVictoryFanfare,
} from '../services/soundEffects';

interface SnakesBoardViewProps {
  gameState: SnakesGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay: boolean;
  onCommitState: (nextState: SnakesGameState) => void;
  onNewSeedMatch: (twistsEnabled: boolean, maxTile?: SnakesMaxTile) => void;
}

const SNAKE_PALETTE = [
  '#6BCB77',
  '#4FC3C9',
  '#A78BFA',
  '#FF8A80',
  '#FFD166',
  '#74B9FF',
] as const;

function snakePath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  amp: number,
  waves = 3,
  n = 32
): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off =
      Math.sin(t * Math.PI * 2 * waves) * amp * Math.min(1, t * 4, (1 - t) * 4);
    d +=
      (i ? ' L' : 'M') +
      (a.x + dx * t + nx * off).toFixed(1) +
      ' ' +
      (a.y + dy * t + ny * off).toFixed(1);
  }
  return d;
}

/**
 * Honey-Wood Ladder with Plum (#5B2A4E) Outlines & Rungs
 */
function WoodenLadderSvg({
  link,
  maxTile,
}: {
  link: BoardJumpLink;
  maxTile: SnakesMaxTile;
}) {
  const start = tileToSvgCenter(link.from, maxTile);
  const end = tileToSvgCenter(link.to, maxTile);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const scale = maxTile === 150 ? 0.82 : 1;
  const railSpread = 1.65 * scale;
  const nx = (-dy / len) * railSpread;
  const ny = (dx / len) * railSpread;

  const rungsCount = Math.max(3, Math.floor(len / (5.0 * scale)));
  const rungs = [];
  for (let i = 1; i < rungsCount; i++) {
    const t = i / rungsCount;
    const cx = start.x + dx * t;
    const cy = start.y + dy * t;
    rungs.push(
      <g key={i}>
        <line
          x1={cx - nx}
          y1={cy - ny}
          x2={cx + nx}
          y2={cy + ny}
          stroke="#5B2A4E"
          stroke-width={1.3 * scale}
          stroke-linecap="round"
        />
        <line
          x1={cx - nx}
          y1={cy - ny}
          x2={cx + nx}
          y2={cy + ny}
          stroke="#FDE68A"
          stroke-width={0.68 * scale}
          stroke-linecap="round"
        />
      </g>
    );
  }

  return (
    <g pointer-events="none">
      {/* Rail Outlines */}
      <line
        x1={start.x - nx}
        y1={start.y - ny}
        x2={end.x - nx}
        y2={end.y - ny}
        stroke="#5B2A4E"
        stroke-width={1.6 * scale}
        stroke-linecap="round"
      />
      <line
        x1={start.x + nx}
        y1={start.y + ny}
        x2={end.x + nx}
        y2={end.y + ny}
        stroke="#5B2A4E"
        stroke-width={1.6 * scale}
        stroke-linecap="round"
      />
      {rungs}
      {/* Honey-Wood Inner Rails */}
      <line
        x1={start.x - nx}
        y1={start.y - ny}
        x2={end.x - nx}
        y2={end.y - ny}
        stroke="#F59E0B"
        stroke-width={0.88 * scale}
        stroke-linecap="round"
      />
      <line
        x1={start.x + nx}
        y1={start.y + ny}
        x2={end.x + nx}
        y2={end.y + ny}
        stroke="#F59E0B"
        stroke-width={0.88 * scale}
        stroke-linecap="round"
      />
    </g>
  );
}

/**
 * Wavy Cartoon Snake with 3 Stacked Strokes, Saturated Body Color, Oval Head, Big White Eyes & Forked Tongue
 */
function CartoonSnakeSvg({
  link,
  index,
  maxTile,
}: {
  link: BoardJumpLink;
  index: number;
  maxTile: SnakesMaxTile;
}) {
  const head = tileToSvgCenter(link.from, maxTile);
  const tail = tileToSvgCenter(link.to, maxTile);
  const bodyColor = SNAKE_PALETTE[index % SNAKE_PALETTE.length];
  const scale = maxTile === 150 ? 0.82 : 1;
  const amp = 2.8 * scale;
  const waves = 2.5;
  const pathD = snakePath(head, tail, amp, waves, 36);

  const dx = tail.x - head.x;
  const dy = tail.y - head.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const t1 = 1 / 36;
  const off1 =
    Math.sin(t1 * Math.PI * 2 * waves) * amp * Math.min(1, t1 * 4, (1 - t1) * 4);
  const segDx = dx * t1 + nx * off1;
  const segDy = dy * t1 + ny * off1;
  const headAngleDeg = (Math.atan2(-segDy, -segDx) * 180) / Math.PI;

  return (
    <g pointer-events="none">
      {/* Tapered Tail Tip */}
      <circle
        cx={tail.x}
        cy={tail.y}
        r={0.9 * scale}
        fill={bodyColor}
        stroke="#5B2A4E"
        stroke-width={0.45 * scale}
      />
      {/* 1. Plum Outline */}
      <path
        d={pathD}
        fill="none"
        stroke="#5B2A4E"
        stroke-width={3.25 * scale}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {/* 2. Solid Saturated Body Color */}
      <path
        d={pathD}
        fill="none"
        stroke={bodyColor}
        stroke-width={2.25 * scale}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {/* 3. Lighter Dashed Scale/Spot Overlay */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.7)"
        stroke-width={1.05 * scale}
        stroke-dasharray={`${0.35 * scale} ${2.3 * scale}`}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {/* Cute Snake Head Facing Away from Body */}
      <g
        transform={`translate(${head.x.toFixed(1)}, ${head.y.toFixed(
          1
        )}) rotate(${headAngleDeg.toFixed(1)}) scale(${scale})`}
      >
        {/* Forked Red Tongue */}
        <path
          d="M 2.1 0 L 3.35 0 M 3.05 0 L 3.85 -0.6 M 3.05 0 L 3.85 0.6"
          fill="none"
          stroke="#E11D48"
          stroke-width="0.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        {/* Rounded Oval Head */}
        <ellipse
          cx="0"
          cy="0"
          rx="2.6"
          ry="2.15"
          fill={bodyColor}
          stroke="#5B2A4E"
          stroke-width="0.5"
        />
        {/* Rosy Cheeks */}
        <ellipse cx="0.1" cy="-1.4" rx="0.38" ry="0.52" fill="#FF6B9A" />
        <ellipse cx="0.1" cy="1.4" rx="0.38" ry="0.52" fill="#FF6B9A" />
        {/* Big White Eyes + Plum Pupils */}
        <circle
          cx="0.65"
          cy="-0.9"
          r="0.8"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.26"
        />
        <circle
          cx="0.65"
          cy="0.9"
          r="0.8"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.26"
        />
        <circle cx="0.82" cy="-0.9" r="0.42" fill="#5B2A4E" />
        <circle cx="0.82" cy="0.9" r="0.42" fill="#5B2A4E" />
        <circle cx="0.64" cy="-1.05" r="0.17" fill="#ffffff" />
        <circle cx="0.64" cy="0.75" r="0.17" fill="#ffffff" />
      </g>
    </g>
  );
}

function BoardCatPlayerToken({
  tile,
  maxTile,
  slot,
  avatar,
  hasShield,
  doubleDiceTurns,
  isHopping,
  isDizzy,
  actionAnim,
  offsetX,
  offsetY,
}: {
  tile: number;
  maxTile: SnakesMaxTile;
  slot: PlayerSlot;
  avatar: CatAvatarConfig;
  hasShield: boolean;
  doubleDiceTurns: number;
  isHopping: boolean;
  isDizzy: boolean;
  actionAnim: CatActionAnim;
  offsetX: number;
  offsetY: number;
}) {
  const pos = tileToSvgCenter(tile, maxTile);
  const ringColor = slot === 'p1' ? '#FF6B9A' : '#38BDF8';
  const tokenScale = maxTile === 150 ? 0.84 : 1;

  return (
    <g
      transform={`translate(${pos.x + offsetX}, ${
        pos.y + offsetY
      }) scale(${tokenScale})`}
      className="snakes-cat-positioner"
      pointerEvents="none"
    >
      {/* Ground Shadow Ellipse Under Token */}
      <ellipse
        cx="0"
        cy="3.9"
        rx="3.4"
        ry="1.15"
        fill="rgba(91, 42, 78, 0.28)"
      />

      <g className={isHopping ? 'snakes-cat-hop' : undefined}>
        {hasShield && (
          <circle
            cx="0"
            cy="0"
            r="4.7"
            fill="rgba(46, 196, 182, 0.28)"
            stroke="#2EC4B6"
            strokeWidth="0.55"
            strokeDasharray="1.2 0.8"
          />
        )}

        {doubleDiceTurns > 0 && (
          <circle
            cx="0"
            cy="0"
            r="5.1"
            fill="none"
            stroke="#FFBE0B"
            strokeWidth="0.5"
            strokeDasharray="1 0.8"
          />
        )}

        {/* 3D Puck Base + Light Cream Disc with Plum Outline */}
        <circle
          cx="0"
          cy="0.65"
          r="3.8"
          fill={ringColor}
          stroke="#5B2A4E"
          strokeWidth="0.52"
        />
        <circle
          cx="0"
          cy="0"
          r="3.7"
          fill="#FFF8F2"
          stroke="#5B2A4E"
          strokeWidth="0.48"
        />

        {/* Exact Player Cat Avatar Sprite WITH Outfit Accessory & Action Anim */}
        <CatAvatarSvg
          breed={avatar.breed}
          accessory={avatar.accessory}
          x={-3.6}
          y={-3.9}
          size={7.2}
          animateIdle={false}
          dizzy={isDizzy}
          actionAnim={actionAnim}
        />
      </g>
    </g>
  );
}

export function SnakesBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay,
  onCommitState,
  onNewSeedMatch,
}: SnakesBoardViewProps) {
  const maxTile: SnakesMaxTile = gameState.maxTile === 150 ? 150 : 100;
  const totalRows = maxTile === 150 ? 15 : 10;
  const rowHeight = 100 / totalRows;

  const [rolling, setRolling] = useState(false);
  const [previewDice1, setPreviewDice1] = useState<number>(
    gameState.lastAnimation?.dice1 ?? gameState.lastAnimation?.dice ?? 6
  );
  const [previewDice2, setPreviewDice2] = useState<number>(
    gameState.lastAnimation?.dice2 ?? 6
  );
  const [displayP1Tile, setDisplayP1Tile] = useState(gameState.p1Tile);
  const [displayP2Tile, setDisplayP2Tile] = useState(gameState.p2Tile);
  const [hoppingSlot, setHoppingSlot] = useState<PlayerSlot | null>(null);
  const [dizzySlot, setDizzySlot] = useState<PlayerSlot | null>(null);
  const [actionSlotAnim, setActionSlotAnim] = useState<{
    slot: PlayerSlot;
    anim: CatActionAnim;
  } | null>(null);
  const [diceLanded, setDiceLanded] = useState<{
    d1: number;
    d2?: number;
    total: number;
  } | null>(null);
  const [twistPopup, setTwistPopup] = useState<{
    id: string;
    kind:
      | 'double_dice'
      | 'boost'
      | 'shield_gain'
      | 'shield_saved'
      | 'extra_roll'
      | 'swap';
    title: string;
    desc: string;
  } | null>(null);

  // Turn Indicator Popup Window ("[CAT AVATAR] Player Name's Turn!")
  const [turnPopup, setTurnPopup] = useState<{
    id: string;
    slot: PlayerSlot;
    avatar: CatAvatarConfig;
  } | null>(null);

  useEffect(() => {
    if (gameState.winner || !gameState.lastAnimation) return;
    const avatar = gameState.turn === 'p1' ? p1Avatar : p2Avatar;
    const popId = `turn-${gameState.turn}-${Date.now()}`;
    playTurnBannerPop();
    setTurnPopup({ id: popId, slot: gameState.turn, avatar });
    const t = window.setTimeout(() => {
      setTurnPopup((prev) => (prev?.id === popId ? null : prev));
    }, 1350);
    return () => clearTimeout(t);
  }, [
    gameState.turn,
    gameState.winner,
    Boolean(gameState.lastAnimation),
    p1Avatar.name,
    p2Avatar.name,
  ]);

  const generatedBoard = useMemo(
    () =>
      generateSnakesBoard(
        gameState.boardSeed,
        gameState.twistsEnabled,
        maxTile
      ),
    [gameState.boardSeed, gameState.twistsEnabled, maxTile]
  );

  const ladderBaseSet = useMemo(
    () => new Set(generatedBoard.ladders.map((l) => l.from)),
    [generatedBoard.ladders]
  );
  const snakeHeadSet = useMemo(
    () => new Set(generatedBoard.snakes.map((s) => s.from)),
    [generatedBoard.snakes]
  );

  useEffect(() => {
    if (gameState.lastAnimation?.dice) {
      setPreviewDice1(
        gameState.lastAnimation.dice1 ?? gameState.lastAnimation.dice
      );
      if (gameState.lastAnimation.dice2) {
        setPreviewDice2(gameState.lastAnimation.dice2);
      }
    }
  }, [gameState.lastAnimation?.id]);

  useEffect(() => {
    const anim = gameState.lastAnimation;
    if (!anim) {
      setDisplayP1Tile(gameState.p1Tile);
      setDisplayP2Tile(gameState.p2Tile);
      return;
    }

    const setRollerTile =
      anim.roller === 'p1' ? setDisplayP1Tile : setDisplayP2Tile;
    const setOtherTile =
      anim.roller === 'p1' ? setDisplayP2Tile : setDisplayP1Tile;

    const timers: number[] = [];
    const totalWalkSteps = Math.max(
      1,
      Math.abs(anim.walkLandingTile - anim.startTile)
    );
    const stepMs = totalWalkSteps > 7 ? 135 : 175;
    setHoppingSlot(anim.roller);

    // Center dice "landed" pop
    setDiceLanded({
      d1: anim.dice1 ?? anim.dice,
      d2: anim.dice2,
      total: anim.dice,
    });
    timers.push(window.setTimeout(() => setDiceLanded(null), 820));

    for (let step = 1; step <= totalWalkSteps; step++) {
      const t = window.setTimeout(() => {
        const nextTile =
          anim.walkLandingTile >= anim.startTile
            ? anim.startTile + step
            : anim.startTile - step;
        playCatStep();
        setRollerTile(nextTile);
      }, step * stepMs);
      timers.push(t);
    }

    const finishWalkDelay = totalWalkSteps * stepMs + 140;
    const slideOrClimbTimer = window.setTimeout(() => {
      setDisplayP1Tile(gameState.p1Tile);
      setDisplayP2Tile(gameState.p2Tile);
      setHoppingSlot(null);

      if (gameState.winner) {
        playVictoryFanfare();
      } else if (anim.eventKind === 'snake') {
        playDizzySlide();
        setDizzySlot(anim.roller);
        setActionSlotAnim({ slot: anim.roller, anim: 'eaten' });
        const clearDizzy = window.setTimeout(() => {
          setDizzySlot(null);
          setActionSlotAnim(null);
        }, 1700);
        timers.push(clearDizzy);
      } else if (anim.eventKind === 'ladder') {
        playCatPounceCapture();
        setActionSlotAnim({ slot: anim.roller, anim: 'climb' });
        timers.push(
          window.setTimeout(() => setActionSlotAnim(null), 1300)
        );
      } else if (
        anim.eventKind === 'double_dice' ||
        anim.eventKind === 'boost' ||
        anim.eventKind === 'shield_gain' ||
        anim.eventKind === 'shield_saved' ||
        anim.eventKind === 'extra_roll' ||
        anim.eventKind === 'swap'
      ) {
        playPowerupReveal();
        setActionSlotAnim({ slot: anim.roller, anim: 'powerup' });
        timers.push(
          window.setTimeout(() => setActionSlotAnim(null), 1500)
        );
      }

      const twistTitles: Partial<
        Record<
          typeof anim.eventKind,
          {
            kind:
              | 'double_dice'
              | 'boost'
              | 'shield_gain'
              | 'shield_saved'
              | 'extra_roll'
              | 'swap';
            title: string;
          }
        >
      > = {
        double_dice: { kind: 'double_dice', title: 'Twin Paw 2x Dice!' },
        boost: { kind: 'boost', title: 'Catnip Zoomies!' },
        shield_gain: { kind: 'shield_gain', title: 'Bubble Purr Shield!' },
        shield_saved: { kind: 'shield_saved', title: 'Shield Saved You!' },
        extra_roll: { kind: 'extra_roll', title: 'Lucky Golden Paw!' },
        swap: { kind: 'swap', title: 'Catnap Switcheroo!' },
      };
      const meta = twistTitles[anim.eventKind];
      if (meta && !gameState.winner) {
        setTwistPopup({
          id: anim.id,
          kind: meta.kind,
          title: meta.title,
          desc: anim.eventMessage,
        });
        timers.push(
          window.setTimeout(
            () =>
              setTwistPopup((prev) => (prev?.id === anim.id ? null : prev)),
            2300
          )
        );
      }
    }, finishWalkDelay);
    timers.push(slideOrClimbTimer);

    if (anim.eventKind !== 'swap') {
      setOtherTile(anim.roller === 'p1' ? gameState.p2Tile : gameState.p1Tile);
    }

    return () => {
      timers.forEach((id) => clearTimeout(id));
    };
  }, [gameState.lastAnimation?.id, gameState.p1Tile, gameState.p2Tile]);

  const isMyTurn = passAndPlay || gameState.turn === mySlot;
  const canRoll =
    !gameState.winner && !rolling && hoppingSlot === null && isMyTurn;

  const activeDoubleDiceTurns =
    (gameState.turn === 'p1'
      ? gameState.p1DoubleDiceTurns
      : gameState.p2DoubleDiceTurns) ?? 0;
  const hasDoubleDiceActive = activeDoubleDiceTurns > 0;

  const handleRollDice = () => {
    if (!canRoll) return;
    playDiceRattle();
    setRolling(true);

    const rollFairDie = (): number => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return (buf[0] % 6) + 1;
      }
      return Math.floor(Math.random() * 6) + 1;
    };

    const getFairEntropy = (): number => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] % 1000000;
      }
      return Math.floor(Math.random() * 1000000);
    };

    const d1 = rollFairDie();
    const d2 = hasDoubleDiceActive ? rollFairDie() : undefined;
    const entropy = getFairEntropy();

    const cycleInterval = window.setInterval(() => {
      setPreviewDice1((prev) => (prev % 6) + 1);
      if (hasDoubleDiceActive) {
        setPreviewDice2((prev) => ((prev + 2) % 6) + 1);
      }
    }, 85);

    window.setTimeout(() => {
      window.clearInterval(cycleInterval);
      setPreviewDice1(d1);
      if (d2) setPreviewDice2(d2);
      const nextState = applySnakesDiceRoll(gameState, d1, d2, entropy);
      setRolling(false);
      onCommitState(nextState);
    }, 600);
  };

  const activeTurnName =
    gameState.turn === 'p1' ? p1Avatar.name : p2Avatar.name;
  const sameTile = displayP1Tile === displayP2Tile;

  return (
    <div className="dama-stage-container">
      {/* Main 100-Tile or 150-Tile Sticker-Cartoony Snakes & Ladders Vector Board */}
      <div className="board-stage sticker-board-frame">
        <svg
          viewBox="0 0 100 100"
          className="board-svg"
          role="img"
          aria-label={`Snakes and Ladders ${maxTile}-Tile Board`}
        >
          {/* Board Background */}
          <rect x="0" y="0" width="100" height="100" fill="#5B2A4E" />
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            rx="3.2"
            fill="#F8E8EE"
          />

          {/* LAYER 1: Clean 3D Cushion Tile Backgrounds */}
          {Array.from({ length: maxTile }).map((_, idx) => {
            const tileNum = idx + 1;
            const center = tileToSvgCenter(tileNum, maxTile);
            const x = center.col * 10;
            const y = center.row * rowHeight;
            const isEven = (center.row + center.col) % 2 === 0;
            const twist = generatedBoard.twists.find((t) => t.tile === tileNum);
            const isLadderBase = ladderBaseSet.has(tileNum);
            const isSnakeHead = snakeHeadSet.has(tileNum);

            let tileFill = isEven ? '#FFFDF9' : '#FFE4EE';
            let tileLip = isEven ? '#F3E1E8' : '#F9BFD4';
            if (tileNum === maxTile) {
              tileFill = '#FFE58F';
              tileLip = '#F59E0B';
            } else if (tileNum === 1) {
              tileFill = '#C6F6D5';
              tileLip = '#34D399';
            } else if (isLadderBase) {
              tileFill = '#DCFCE7';
              tileLip = '#86EFAC';
            } else if (isSnakeHead) {
              tileFill = '#FFE4E6';
              tileLip = '#FDA4AF';
            } else if (twist) {
              tileFill = '#F3E8FF';
              tileLip = '#C084FC';
            }

            const tileRx = maxTile === 150 ? '1.15' : '1.65';
            const tileH = rowHeight - 0.52;

            return (
              <g key={`bg-${tileNum}`}>
                {/* Subtle 3D Tile Bottom Lip */}
                <rect
                  x={x + 0.28}
                  y={y + 0.42}
                  width="9.44"
                  height={tileH}
                  rx={tileRx}
                  fill={tileLip}
                />
                {/* Crisp Top Tile Surface */}
                <rect
                  x={x + 0.28}
                  y={y + 0.2}
                  width="9.44"
                  height={tileH - 0.18}
                  rx={tileRx}
                  fill={tileFill}
                  stroke="rgba(91, 42, 78, 0.16)"
                  stroke-width="0.18"
                />

                {/* START Tile (1) Paw Print Emblem */}
                {tileNum === 1 && (
                  <g
                    transform={`translate(${x + 6.4}, ${
                      y + rowHeight * 0.6
                    }) scale(${maxTile === 150 ? 0.76 : 0.96})`}
                    fill="#059669"
                    opacity="0.65"
                  >
                    <ellipse cx="0" cy="0.6" rx="1.2" ry="0.95" />
                    <circle cx="-1.1" cy="-0.6" r="0.48" />
                    <circle cx="-0.35" cy="-1.1" r="0.48" />
                    <circle cx="0.4" cy="-1.1" r="0.48" />
                    <circle cx="1.15" cy="-0.6" r="0.48" />
                  </g>
                )}

                {/* FINISH Tile (100 or 150) Golden Crown */}
                {tileNum === maxTile && (
                  <polygon
                    points={`${x + 3.1},${y + rowHeight * 0.8} ${x + 3.5},${
                      y + rowHeight * 0.44
                    } ${x + 5.0},${y + rowHeight * 0.6} ${x + 6.5},${
                      y + rowHeight * 0.44
                    } ${x + 6.9},${y + rowHeight * 0.8}`}
                    fill="#F59E0B"
                    stroke="#5B2A4E"
                    stroke-width="0.32"
                    stroke-linejoin="round"
                  />
                )}

                {/* Random Mystery Powerup Star Badge */}
                {twist && (
                  <g
                    transform={`translate(${x + 6.6}, ${
                      y + rowHeight * 0.6
                    }) scale(${maxTile === 150 ? 0.72 : 0.92})`}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="1.95"
                      fill="#FAF5FF"
                      stroke="#A855F7"
                      stroke-width="0.28"
                    />
                    <path
                      d="M 0 -1.55 L 0.45 -0.45 L 1.55 0 L 0.45 0.45 L 0 1.55 L -0.45 0.45 L -1.55 0 L -0.45 -0.45 Z"
                      fill="#A855F7"
                    />
                    <circle cx="0" cy="0" r="0.45" fill="#FFBE0B" />
                  </g>
                )}
              </g>
            );
          })}

          {/* LAYER 2: Snakes and Ladders */}
          {generatedBoard.ladders.map((ladder) => (
            <WoodenLadderSvg
              key={ladder.id}
              link={ladder}
              maxTile={maxTile}
            />
          ))}
          {generatedBoard.snakes.map((snake, idx) => (
            <CartoonSnakeSvg
              key={snake.id}
              link={snake}
              index={idx}
              maxTile={maxTile}
            />
          ))}

          {/* LAYER 3: Tile Numbers */}
          {Array.from({ length: maxTile }).map((_, idx) => {
            const tileNum = idx + 1;
            const center = tileToSvgCenter(tileNum, maxTile);
            const x = center.col * 10;
            const y = center.row * rowHeight;
            return (
              <text
                key={`num-${tileNum}`}
                x={x + 0.95}
                y={y + (maxTile === 150 ? 1.95 : 2.4)}
                fill="#5B2A4E"
                opacity="0.68"
                pointerEvents="none"
                style={{
                  fontSize: maxTile === 150 ? '1.65px' : '2.05px',
                  fontFamily: "var(--font-display, 'Baloo 2', sans-serif)",
                  fontWeight: 800,
                }}
              >
                {tileNum}
              </text>
            );
          })}

          {/* LAYER 4: Player Tokens */}
          <BoardCatPlayerToken
            tile={displayP2Tile}
            maxTile={maxTile}
            slot="p2"
            avatar={p2Avatar}
            hasShield={gameState.p2Shield}
            doubleDiceTurns={gameState.p2DoubleDiceTurns ?? 0}
            isHopping={hoppingSlot === 'p2'}
            isDizzy={dizzySlot === 'p2'}
            actionAnim={
              actionSlotAnim?.slot === 'p2' ? actionSlotAnim.anim : 'none'
            }
            offsetX={sameTile ? 2.1 : 0}
            offsetY={sameTile ? -0.9 : 0}
          />
          <BoardCatPlayerToken
            tile={displayP1Tile}
            maxTile={maxTile}
            slot="p1"
            avatar={p1Avatar}
            hasShield={gameState.p1Shield}
            doubleDiceTurns={gameState.p1DoubleDiceTurns ?? 0}
            isHopping={hoppingSlot === 'p1'}
            isDizzy={dizzySlot === 'p1'}
            actionAnim={
              actionSlotAnim?.slot === 'p1' ? actionSlotAnim.anim : 'none'
            }
            offsetX={sameTile ? -2.1 : 0}
            offsetY={sameTile ? 0.9 : 0}
          />
        </svg>

        {/* Center Turn Indicator Popup: "[CAT AVATAR] Player Name's Turn!" */}
        {turnPopup && !rolling && diceLanded === null && !twistPopup && (
          <div className="turn-popup-overlay" aria-live="polite">
            <div key={turnPopup.id} className="turn-popup-card">
              <div className="turn-popup-avatar">
                <CatAvatarSvg
                  breed={turnPopup.avatar.breed}
                  accessory={turnPopup.avatar.accessory}
                  size={42}
                  happySquint
                />
              </div>
              <div className="turn-popup-meta">
                <span className="turn-popup-role">
                  {turnPopup.slot === 'p1' ? 'P-1 (Host)' : 'P-2 (Invited)'}
                </span>
                <span className="turn-popup-title">
                  {turnPopup.avatar.name}&apos;s Turn!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Center Rolling / Landed 1-Dice or 2-Dice Animation */}
        {(rolling || diceLanded !== null) && (
          <div className="center-dice-overlay" aria-hidden="true">
            <div
              key={rolling ? 'rolling' : `landed-${diceLanded?.total}`}
              className={`center-dice-pair ${
                rolling ? 'center-dice-tumble' : 'center-dice-land'
              }`}
            >
              <DiceFaceSvg
                value={rolling ? previewDice1 : diceLanded?.d1 ?? previewDice1}
                size={hasDoubleDiceActive || diceLanded?.d2 ? 72 : 86}
                tint={
                  hasDoubleDiceActive || diceLanded?.d2 ? '#FFE08A' : '#ffffff'
                }
              />
              {(hasDoubleDiceActive || diceLanded?.d2) && (
                <DiceFaceSvg
                  value={rolling ? previewDice2 : diceLanded?.d2 ?? previewDice2}
                  size={72}
                  tint="#FFD6E4"
                />
              )}
            </div>
          </div>
        )}

        {/* Center Custom Animated Mystery Powerup Reveal Window */}
        {twistPopup && (
          <div className="twist-popup-overlay" aria-live="polite">
            <div key={twistPopup.id} className="twist-popup-card powerup-modal">
              <span className="powerup-kicker-pill">MYSTERY POWERUP!</span>
              <div className="twist-popup-art">
                <PowerupIllustrationSvg kind={twistPopup.kind} size={58} />
              </div>
              <span className="twist-popup-title">{twistPopup.title}</span>
              <span className="twist-popup-desc">{twistPopup.desc}</span>
            </div>
          </div>
        )}

        {/* Victory Celebration Sticker Card with Confetti */}
        {gameState.winner && (
          <div className="victory-overlay-card">
            <ConfettiCelebrationOverlay />
            <CoupleCatsSceneSvg
              p1Breed={p1Avatar.breed}
              p2Breed={p2Avatar.breed}
              p1Accessory={p1Avatar.accessory}
              p2Accessory={p2Avatar.accessory}
              showTrophy
              size={140}
            />
            <div className="victory-title">
              <CrownIcon size={20} />
              <span>
                {gameState.winner === 'p1' ? p1Avatar.name : p2Avatar.name}{' '}
                Reached {maxTile}!
              </span>
            </div>
            <button
              type="button"
              className="victory-rematch-btn"
              onClick={() => onNewSeedMatch(gameState.twistsEnabled, maxTile)}
            >
              <span>Play New Board</span>
              <DoubleHeartIcon size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Pink Sticker Roll Button with Single or Double Dice Badges */}
      <div className="snakes-top-roll-wrap">
        <button
          type="button"
          className={`sticker-dice-hero-btn ${
            canRoll ? 'can-roll-pulse' : 'disabled-roll'
          } ${hasDoubleDiceActive ? 'double-dice-active' : ''}`}
          onClick={handleRollDice}
          disabled={!canRoll}
          title={canRoll ? 'Tap to Roll Dice' : `Waiting for ${activeTurnName}…`}
        >
          <span className={`dice-cube-badge ${rolling ? 'dice-shaking' : ''}`}>
            <DiceFaceSvg
              value={previewDice1}
              size={25}
              tint={hasDoubleDiceActive ? '#FFE08A' : '#ffffff'}
            />
            {hasDoubleDiceActive && (
              <DiceFaceSvg value={previewDice2} size={25} tint="#FFD6E4" />
            )}
          </span>
          <span className="dice-btn-label">
            {rolling
              ? hasDoubleDiceActive
                ? 'Rolling 2x Dice…'
                : 'Rolling…'
              : canRoll
              ? hasDoubleDiceActive
                ? `Roll 2x Dice (${activeDoubleDiceTurns}) • ${activeTurnName}`
                : `Roll Dice • ${activeTurnName}`
              : `Waiting for ${activeTurnName}…`}
          </span>
        </button>
      </div>
    </div>
  );
}
