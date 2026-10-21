import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  BoardJumpLink,
  SnakesGameState,
  applySnakesDiceRoll,
  generateSnakesBoard,
  tileToSvgCenter,
} from '../engines/snakesEngine';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import { CatAvatarSvg, CoupleCatsSceneSvg } from './CatAvatarSvg';
import {
  CrownIcon,
  DiceFaceSvg,
  DoubleHeartIcon,
} from './ArcadeIcons';
import {
  playCatPounceCapture,
  playCatStep,
  playDiceRattle,
  playDizzySlide,
  playVictoryFanfare,
} from '../services/soundEffects';

interface SnakesBoardViewProps {
  gameState: SnakesGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay: boolean;
  onCommitState: (nextState: SnakesGameState) => void;
  onNewSeedMatch: (twistsEnabled: boolean) => void;
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
function WoodenLadderSvg({ link }: { link: BoardJumpLink }) {
  const start = tileToSvgCenter(link.from);
  const end = tileToSvgCenter(link.to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 1.75;
  const ny = (dx / len) * 1.75;

  const rungsCount = Math.max(3, Math.floor(len / 5.2));
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
          stroke-width="1.35"
          stroke-linecap="round"
        />
        <line
          x1={cx - nx}
          y1={cy - ny}
          x2={cx + nx}
          y2={cy + ny}
          stroke="#FBBF24"
          stroke-width="0.7"
          stroke-linecap="round"
        />
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      <line
        x1={start.x - nx}
        y1={start.y - ny}
        x2={end.x - nx}
        y2={end.y - ny}
        stroke="#5B2A4E"
        stroke-width="1.65"
        stroke-linecap="round"
      />
      <line
        x1={start.x + nx}
        y1={start.y + ny}
        x2={end.x + nx}
        y2={end.y + ny}
        stroke="#5B2A4E"
        stroke-width="1.65"
        stroke-linecap="round"
      />
      {rungs}
      <line
        x1={start.x - nx}
        y1={start.y - ny}
        x2={end.x - nx}
        y2={end.y - ny}
        stroke="#F59E0B"
        stroke-width="0.9"
        stroke-linecap="round"
      />
      <line
        x1={start.x + nx}
        y1={start.y + ny}
        x2={end.x + nx}
        y2={end.y + ny}
        stroke="#F59E0B"
        stroke-width="0.9"
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
}: {
  link: BoardJumpLink;
  index: number;
}) {
  const head = tileToSvgCenter(link.from);
  const tail = tileToSvgCenter(link.to);
  const bodyColor = SNAKE_PALETTE[index % SNAKE_PALETTE.length];
  const amp = 3.0; // ~0.3 tile in 100x100 viewBox
  const waves = 3;
  const pathD = snakePath(head, tail, amp, waves, 32);

  // First segment direction from head -> p1, then +180deg so head faces away from body
  const dx = tail.x - head.x;
  const dy = tail.y - head.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const t1 = 1 / 32;
  const off1 =
    Math.sin(t1 * Math.PI * 2 * waves) * amp * Math.min(1, t1 * 4, (1 - t1) * 4);
  const segDx = dx * t1 + nx * off1;
  const segDy = dy * t1 + ny * off1;
  const headAngleDeg = (Math.atan2(-segDy, -segDx) * 180) / Math.PI;

  return (
    <g pointerEvents="none">
      {/* Tapered Tail Tip (~0.12 tile) */}
      <circle
        cx={tail.x}
        cy={tail.y}
        r="0.95"
        fill={bodyColor}
        stroke="#5B2A4E"
        stroke-width="0.5"
      />

      {/* 1. Plum Outline (~0.34 tile = 3.4) */}
      <path
        d={pathD}
        fill="none"
        stroke="#5B2A4E"
        stroke-width="3.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {/* 2. Solid Saturated Body Color (~0.24 tile = 2.4) */}
      <path
        d={pathD}
        fill="none"
        stroke={bodyColor}
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {/* 3. Lighter Dashed Scale/Spot Overlay (~0.12 tile = 1.2) */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.65)"
        stroke-width="1.2"
        stroke-dasharray="0.35 2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      {/* Snake Head (~0.5 tile rounded oval facing away from body) */}
      <g
        transform={`translate(${head.x.toFixed(1)}, ${head.y.toFixed(
          1
        )}) rotate(${headAngleDeg.toFixed(1)})`}
      >
        {/* Small Forked Red Tongue */}
        <path
          d="M 2.1 0 L 3.4 0 M 3.1 0 L 3.95 -0.65 M 3.1 0 L 3.95 0.65"
          fill="none"
          stroke="#E11D48"
          stroke-width="0.42"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        {/* Rounded Oval Head in Body Color with Plum Outline */}
        <ellipse
          cx="0"
          cy="0"
          rx="2.65"
          ry="2.2"
          fill={bodyColor}
          stroke="#5B2A4E"
          stroke-width="0.55"
        />
        {/* Pink Cheeks */}
        <ellipse cx="0.1" cy="-1.45" rx="0.38" ry="0.55" fill="#FF6B9A" />
        <ellipse cx="0.1" cy="1.45" rx="0.38" ry="0.55" fill="#FF6B9A" />
        {/* Two Big White Eyes with Plum Pupils & Tiny Highlight */}
        <circle
          cx="0.65"
          cy="-0.92"
          r="0.82"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.28"
        />
        <circle
          cx="0.65"
          cy="0.92"
          r="0.82"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.28"
        />
        <circle cx="0.82" cy="-0.92" r="0.44" fill="#5B2A4E" />
        <circle cx="0.82" cy="0.92" r="0.44" fill="#5B2A4E" />
        <circle cx="0.64" cy="-1.08" r="0.18" fill="#ffffff" />
        <circle cx="0.64" cy="0.76" r="0.18" fill="#ffffff" />
      </g>
    </g>
  );
}

function BoardCatPlayerToken({
  tile,
  slot,
  avatar,
  hasShield,
  isHopping,
  isDizzy,
  offsetX,
  offsetY,
}: {
  tile: number;
  slot: PlayerSlot;
  avatar: CatAvatarConfig;
  hasShield: boolean;
  isHopping: boolean;
  isDizzy: boolean;
  offsetX: number;
  offsetY: number;
}) {
  const pos = tileToSvgCenter(tile);
  const ringColor = slot === 'p1' ? '#FF6B9A' : '#FFA94D';

  return (
    <g
      transform={`translate(${pos.x + offsetX}, ${pos.y + offsetY})`}
      className="snakes-cat-positioner"
      pointerEvents="none"
    >
      {/* Ground Shadow Ellipse Under Token */}
      <ellipse
        cx="0"
        cy="3.9"
        rx="3.3"
        ry="1.1"
        fill="rgba(91, 42, 78, 0.28)"
      />

      <g className={isHopping ? 'snakes-cat-hop' : undefined}>
        {hasShield && (
          <circle
            cx="0"
            cy="0"
            r="4.6"
            fill="rgba(46, 196, 182, 0.25)"
            stroke="#2EC4B6"
            stroke-width="0.55"
            stroke-dasharray="1.2 0.8"
          />
        )}

        {/* Colored Bottom Ring + Light Cream Disc with Plum Outline */}
        <circle
          cx="0"
          cy="0.55"
          r="3.75"
          fill={ringColor}
          stroke="#5B2A4E"
          stroke-width="0.5"
        />
        <circle
          cx="0"
          cy="0"
          r="3.65"
          fill="#FFF8F2"
          stroke="#5B2A4E"
          stroke-width="0.48"
        />

        {/* Exact Player Cat Avatar Sprite */}
        <CatAvatarSvg
          breed={avatar.breed}
          accessory="none"
          x={-3.5}
          y={-3.7}
          size={7}
          animateIdle={false}
          dizzy={isDizzy}
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
  const [rolling, setRolling] = useState(false);
  const [previewDice, setPreviewDice] = useState<number>(
    gameState.lastAnimation?.dice ?? 6
  );
  const [displayP1Tile, setDisplayP1Tile] = useState(gameState.p1Tile);
  const [displayP2Tile, setDisplayP2Tile] = useState(gameState.p2Tile);
  const [hoppingSlot, setHoppingSlot] = useState<PlayerSlot | null>(null);
  const [dizzySlot, setDizzySlot] = useState<PlayerSlot | null>(null);

  const generatedBoard = useMemo(
    () => generateSnakesBoard(gameState.boardSeed, gameState.twistsEnabled),
    [gameState.boardSeed, gameState.twistsEnabled]
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
      setPreviewDice(gameState.lastAnimation.dice);
    }
  }, [gameState.lastAnimation?.id, gameState.lastAnimation?.dice]);

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
    const stepMs = 180;
    setHoppingSlot(anim.roller);

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
        const clearDizzy = window.setTimeout(() => setDizzySlot(null), 1700);
        timers.push(clearDizzy);
      } else if (anim.eventKind === 'ladder' || anim.eventKind === 'boost') {
        playCatPounceCapture();
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

  const handleRollDice = () => {
    if (!canRoll) return;
    playDiceRattle();
    setRolling(true);

    const finalDice = Math.floor(Math.random() * 6) + 1;
    const cycleInterval = window.setInterval(() => {
      setPreviewDice((prev) => ((prev % 6) + 1));
    }, 85);

    window.setTimeout(() => {
      window.clearInterval(cycleInterval);
      setPreviewDice(finalDice);
      const nextState = applySnakesDiceRoll(gameState, finalDice);
      setRolling(false);
      onCommitState(nextState);
    }, 600);
  };

  const activeTurnName =
    gameState.turn === 'p1' ? p1Avatar.name : p2Avatar.name;
  const sameTile = displayP1Tile === displayP2Tile;

  return (
    <div className="dama-stage-container">
      {/* Main 10x10 Sticker-Cartoony Snakes & Ladders Vector Board */}
      <div className="board-stage sticker-board-frame">
        <svg
          viewBox="0 0 100 100"
          className="board-svg"
          role="img"
          aria-label="Snakes and Ladders 10x10 Board"
        >
          {/* Board Background */}
          <rect x="0" y="0" width="100" height="100" fill="#5B2A4E" />
          <rect
            x="0.6"
            y="0.6"
            width="98.8"
            height="98.8"
            rx="3.5"
            fill="#FFF8F2"
          />

          {/* LAYER 1: Tile Backgrounds */}
          {Array.from({ length: 100 }).map((_, idx) => {
            const tileNum = idx + 1;
            const center = tileToSvgCenter(tileNum);
            const x = center.col * 10;
            const y = center.row * 10;
            const isEven = (center.row + center.col) % 2 === 0;
            const twist = generatedBoard.twists.find((t) => t.tile === tileNum);
            const isLadderBase = ladderBaseSet.has(tileNum);
            const isSnakeHead = snakeHeadSet.has(tileNum);

            let tileFill = isEven ? '#FFF8F2' : '#FFD6E4';
            if (tileNum === 100) tileFill = '#FFE08A';
            else if (tileNum === 1) tileFill = '#BFF0D8';
            else if (isLadderBase) tileFill = '#D8F3DC';
            else if (isSnakeHead) tileFill = '#FECDD3';
            else if (twist) tileFill = '#E9D5FF';

            return (
              <g key={`bg-${tileNum}`}>
                <rect
                  x={x + 0.35}
                  y={y + 0.35}
                  width="9.3"
                  height="9.3"
                  rx="1.6"
                  fill={tileFill}
                  stroke="rgba(91, 42, 78, 0.14)"
                  stroke-width="0.22"
                />

                {/* START Tile (1) Paw Print Emblem */}
                {tileNum === 1 && (
                  <g
                    transform={`translate(${x + 5.8}, ${y + 6.4})`}
                    fill="#10B981"
                    opacity="0.55"
                  >
                    <ellipse cx="0" cy="0.6" rx="1.2" ry="0.95" />
                    <circle cx="-1.1" cy="-0.6" r="0.48" />
                    <circle cx="-0.35" cy="-1.1" r="0.48" />
                    <circle cx="0.4" cy="-1.1" r="0.48" />
                    <circle cx="1.15" cy="-0.6" r="0.48" />
                  </g>
                )}

                {/* FINISH Tile (100) Golden Crown */}
                {tileNum === 100 && (
                  <polygon
                    points={`${x + 3.0},${y + 7.8} ${x + 3.5},${y + 4.5} ${x + 5.0},${y + 6.0} ${x + 6.5},${y + 4.5} ${x + 7.0},${y + 7.8}`}
                    fill="#F59E0B"
                    stroke="#5B2A4E"
                    stroke-width="0.35"
                    stroke-linejoin="round"
                  />
                )}

                {/* Mystery Twist Star */}
                {twist && (
                  <path
                    d={`M ${x + 6.5} ${y + 4.6} L ${x + 7.0} ${y + 6.0} L ${x + 8.4} ${y + 6.5} L ${x + 7.0} ${y + 7.0} L ${x + 6.5} ${y + 8.4} L ${x + 6.0} ${y + 7.0} L ${x + 4.6} ${y + 6.5} L ${x + 6.0} ${y + 6.0} Z`}
                    fill="#A855F7"
                  />
                )}
              </g>
            );
          })}

          {/* LAYER 2: Snakes and Ladders */}
          {generatedBoard.ladders.map((ladder) => (
            <WoodenLadderSvg key={ladder.id} link={ladder} />
          ))}
          {generatedBoard.snakes.map((snake, idx) => (
            <CartoonSnakeSvg key={snake.id} link={snake} index={idx} />
          ))}

          {/* LAYER 3: Tile Numbers (Above Snakes & Ladders so numbers stay readable) */}
          {Array.from({ length: 100 }).map((_, idx) => {
            const tileNum = idx + 1;
            const center = tileToSvgCenter(tileNum);
            const x = center.col * 10;
            const y = center.row * 10;
            return (
              <text
                key={`num-${tileNum}`}
                x={x + 1.05}
                y={y + 2.45}
                fill="#5B2A4E"
                opacity="0.62"
                pointerEvents="none"
                style={{
                  fontSize: '2.05px',
                  fontFamily: "'Fredoka', sans-serif",
                  fontWeight: 700,
                }}
              >
                {tileNum}
              </text>
            );
          })}

          {/* LAYER 4: Player Tokens */}
          <BoardCatPlayerToken
            tile={displayP2Tile}
            slot="p2"
            avatar={p2Avatar}
            hasShield={gameState.p2Shield}
            isHopping={hoppingSlot === 'p2'}
            isDizzy={dizzySlot === 'p2'}
            offsetX={sameTile ? 2.2 : 0}
            offsetY={sameTile ? -1.1 : 0}
          />
          <BoardCatPlayerToken
            tile={displayP1Tile}
            slot="p1"
            avatar={p1Avatar}
            hasShield={gameState.p1Shield}
            isHopping={hoppingSlot === 'p1'}
            isDizzy={dizzySlot === 'p1'}
            offsetX={sameTile ? -2.2 : 0}
            offsetY={sameTile ? 1.1 : 0}
          />
        </svg>

        {/* Victory Celebration Sticker Card */}
        {gameState.winner && (
          <div className="victory-overlay-card">
            <CoupleCatsSceneSvg
              p1Breed={p1Avatar.breed}
              p2Breed={p2Avatar.breed}
              showTrophy
              size={140}
            />
            <div className="victory-title">
              <CrownIcon size={20} />
              <span>
                {gameState.winner === 'p1' ? p1Avatar.name : p2Avatar.name}{' '}
                Reached 100!
              </span>
            </div>
            <button
              type="button"
              className="victory-rematch-btn"
              onClick={() => onNewSeedMatch(gameState.twistsEnabled)}
            >
              <span>Play New Board</span>
              <DoubleHeartIcon size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Pink Sticker Roll Button with Real Dice Face on Left (Below Board) */}
      <div className="snakes-top-roll-wrap">
        <button
          type="button"
          className={`sticker-dice-hero-btn ${
            canRoll ? 'can-roll-pulse' : 'disabled-roll'
          }`}
          onClick={handleRollDice}
          disabled={!canRoll}
          title={canRoll ? 'Tap to Roll Dice' : `Waiting for ${activeTurnName}…`}
        >
          <span className={`dice-cube-badge ${rolling ? 'dice-shaking' : ''}`}>
            <DiceFaceSvg value={previewDice} size={26} />
          </span>
          <span className="dice-btn-label">
            {rolling
              ? 'Rolling…'
              : canRoll
              ? `Roll Dice • ${activeTurnName}`
              : `Waiting for ${activeTurnName}…`}
          </span>
        </button>
      </div>
    </div>
  );
}
