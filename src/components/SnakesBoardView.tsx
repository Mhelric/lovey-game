import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  BoardJumpLink,
  SnakesGameState,
  applySnakesDiceRoll,
  generateSnakesBoard,
  tileToSvgCenter,
} from '../engines/snakesEngine';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import { CatAvatarSvg, getCatBreedMeta } from './CatAvatarSvg';
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
  muted: boolean;
  onToggleMute: () => void;
  onTogglePassAndPlay: () => void;
  onCommitState: (nextState: SnakesGameState) => void;
  onNewSeedMatch: (twistsEnabled: boolean) => void;
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'] as const;

function WoodenLadderSvg({ link }: { link: BoardJumpLink }) {
  const start = tileToSvgCenter(link.from);
  const end = tileToSvgCenter(link.to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular unit vector for ladder rail width
  const nx = (-dy / len) * 1.45;
  const ny = (dx / len) * 1.45;

  const rungsCount = Math.max(3, Math.floor(len / 5.5));
  const rungs = [];
  for (let i = 1; i < rungsCount; i++) {
    const t = i / rungsCount;
    const cx = start.x + dx * t;
    const cy = start.y + dy * t;
    rungs.push(
      <line
        key={i}
        x1={cx - nx}
        y1={cy - ny}
        x2={cx + nx}
        y2={cy + ny}
        stroke="#b07d4f"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    );
  }

  return (
    <g opacity="0.92" pointerEvents="none">
      <line
        x1={start.x - nx}
        y1={start.y - ny}
        x2={end.x - nx}
        y2={end.y - ny}
        stroke="#7f4f24"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      <line
        x1={start.x + nx}
        y1={start.y + ny}
        x2={end.x + nx}
        y2={end.y + ny}
        stroke="#7f4f24"
        strokeWidth="0.95"
        strokeLinecap="round"
      />
      {rungs}
    </g>
  );
}

function CartoonSnakeSvg({ link }: { link: BoardJumpLink }) {
  const head = tileToSvgCenter(link.from); // Top of snake (mouth)
  const tail = tileToSvgCenter(link.to);   // Bottom of snake (tail)
  const dx = tail.x - head.x;
  const dy = tail.y - head.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 6.5;
  const ny = (dx / len) * 6.5;

  const c1x = head.x + dx * 0.33 + nx;
  const c1y = head.y + dy * 0.33 + ny;
  const c2x = head.x + dx * 0.66 - nx;
  const c2y = head.y + dy * 0.66 - ny;

  const pathD = `M ${head.x} ${head.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tail.x} ${tail.y}`;

  return (
    <g opacity="0.94" pointerEvents="none">
      {/* Snake Body Outline & Inner Stripe */}
      <path
        d={pathD}
        fill="none"
        stroke="#2b1810"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke={link.color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.6"
        strokeDasharray="1.2 1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Cute Cartoon Snake Head at `from` */}
      <circle
        cx={head.x}
        cy={head.y}
        r="2.3"
        fill={link.color}
        stroke="#2b1810"
        strokeWidth="0.45"
      />
      <circle cx={head.x - 0.8} cy={head.y - 0.5} r="0.55" fill="#fff" />
      <circle cx={head.x + 0.8} cy={head.y - 0.5} r="0.55" fill="#fff" />
      <circle cx={head.x - 0.8} cy={head.y - 0.5} r="0.28" fill="#111" />
      <circle cx={head.x + 0.8} cy={head.y - 0.5} r="0.28" fill="#111" />
      {/* Tiny Forked Tongue */}
      <path
        d={`M ${head.x} ${head.y + 2.1} L ${head.x - 0.6} ${head.y + 3.1} M ${head.x} ${head.y + 2.1} L ${head.x + 0.6} ${head.y + 3.1}`}
        stroke="#ef4444"
        strokeWidth="0.35"
        strokeLinecap="round"
      />
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
  const meta = getCatBreedMeta(avatar.breed);
  const ringColor = slot === 'p1' ? '#ff4d6d' : '#f59e0b';

  return (
    <g
      transform={`translate(${pos.x + offsetX}, ${pos.y + offsetY})`}
      className="snakes-cat-positioner"
      pointerEvents="none"
    >
      <g className={isHopping ? 'snakes-cat-hop' : undefined}>
        {/* Optional Snake Shield Bubble */}
        {hasShield && (
          <circle
            cx="0"
            cy="0"
            r="4.7"
            fill="rgba(46, 196, 182, 0.22)"
            stroke="#2ec4b6"
            strokeWidth="0.55"
            strokeDasharray="1.2 0.8"
          />
        )}

        {/* Player Token Ring */}
        <circle
          cx="0"
          cy="0.2"
          r="3.8"
          fill="#ffffff"
          stroke={ringColor}
          strokeWidth="0.8"
        />

        {/* Cat Ears */}
        <polygon
          points="-2.8,-1.2 -2.1,-3.8 -0.5,-2.1"
          fill={meta.fur}
          stroke="#432818"
          strokeWidth="0.3"
        />
        <polygon
          points="2.8,-1.2 2.1,-3.8 0.5,-2.1"
          fill={meta.fur}
          stroke="#432818"
          strokeWidth="0.3"
        />

        {/* Cat Head */}
        <circle
          cx="0"
          cy="0.4"
          r="2.65"
          fill={meta.fur}
          stroke="#432818"
          strokeWidth="0.35"
        />

        {/* Eyes: Dizzy @_@ on Snake Slide vs Normal Eyes */}
        {isDizzy ? (
          <g stroke="#e63946" strokeWidth="0.4" fill="none">
            <circle cx="-0.95" cy="0.1" r="0.65" />
            <circle cx="0.95" cy="0.1" r="0.65" />
          </g>
        ) : (
          <>
            <circle cx="-0.95" cy="0.1" r="0.45" fill={meta.eyeColor} />
            <circle cx="0.95" cy="0.1" r="0.45" fill={meta.eyeColor} />
          </>
        )}

        {/* Nose */}
        <polygon points="0,0.5 -0.45,1.0 0.45,1.0" fill={meta.noseColor} />
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
  muted,
  onToggleMute,
  onTogglePassAndPlay,
  onCommitState,
  onNewSeedMatch,
}: SnakesBoardViewProps) {
  const [rolling, setRolling] = useState(false);
  const [displayP1Tile, setDisplayP1Tile] = useState(gameState.p1Tile);
  const [displayP2Tile, setDisplayP2Tile] = useState(gameState.p2Tile);
  const [hoppingSlot, setHoppingSlot] = useState<PlayerSlot | null>(null);
  const [dizzySlot, setDizzySlot] = useState<PlayerSlot | null>(null);

  const generatedBoard = useMemo(
    () => generateSnakesBoard(gameState.boardSeed, gameState.twistsEnabled),
    [gameState.boardSeed, gameState.twistsEnabled]
  );

  // Animate step-by-step tile hopping ("boing-boing") + ladder climb / snake slide when `lastAnimation` changes
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
    const totalWalkSteps = Math.max(1, Math.abs(anim.walkLandingTile - anim.startTile));
    setHoppingSlot(anim.roller);

    for (let step = 1; step <= totalWalkSteps; step++) {
      const t = window.setTimeout(() => {
        const nextTile =
          anim.walkLandingTile >= anim.startTile
            ? anim.startTile + step
            : anim.startTile - step;
        playCatStep();
        setRollerTile(nextTile);
      }, step * 125);
      timers.push(t);
    }

    // After walking to `walkLandingTile`, slide down snake / climb ladder / trigger twist
    const finishWalkDelay = (totalWalkSteps + 1) * 130;
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

    // Ensure non-rolling player's tile is synced prior to swap
    if (anim.eventKind !== 'swap') {
      setOtherTile(anim.roller === 'p1' ? gameState.p2Tile : gameState.p1Tile);
    }

    return () => {
      timers.forEach((id) => clearTimeout(id));
    };
  }, [gameState.lastAnimation?.id, gameState.p1Tile, gameState.p2Tile]);

  const canRoll =
    !gameState.winner &&
    !rolling &&
    hoppingSlot === null &&
    (passAndPlay || gameState.turn === mySlot);

  const handleRollDice = () => {
    if (!canRoll) return;
    playDiceRattle();
    setRolling(true);

    window.setTimeout(() => {
      const dice = Math.floor(Math.random() * 6) + 1;
      const nextState = applySnakesDiceRoll(gameState, dice);
      setRolling(false);
      onCommitState(nextState);
    }, 320);
  };

  const activeTurnName =
    gameState.turn === 'p1' ? p1Avatar.name : p2Avatar.name;
  const lastDice = gameState.lastAnimation?.dice ?? 6;
  const sameTile = displayP1Tile === displayP2Tile;

  return (
    <div className="dama-stage-container">
      {/* Compact Top HUD Strip with Cat Paw Dice Box & Controls */}
      <div className="board-hud-bar">
        <button
          type="button"
          className={`paw-dice-btn ${rolling ? 'dice-shaking' : ''} ${
            canRoll ? 'can-roll' : 'disabled-roll'
          }`}
          onClick={handleRollDice}
          disabled={!canRoll}
          title="Tap to Roll Cat Paw Dice"
        >
          <span className="dice-face-icon">{DICE_FACES[lastDice - 1]}</span>
          <span className="dice-btn-label">
            {rolling
              ? 'Rolling...'
              : canRoll
              ? `🐾 Roll (${activeTurnName})`
              : `${activeTurnName}'s Roll`}
          </span>
        </button>

        <div className="hud-actions">
          <button
            type="button"
            className="hud-mini-btn"
            onClick={onToggleMute}
            title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            className={`hud-mini-btn ${gameState.twistsEnabled ? 'active-solo' : ''}`}
            onClick={() => onNewSeedMatch(!gameState.twistsEnabled)}
            title="Toggle Mystery Twist Tiles & New Seed"
          >
            {gameState.twistsEnabled ? '✨ Twists' : '🎲 Classic'}
          </button>
          <button
            type="button"
            className={`hud-mini-btn ${passAndPlay ? 'active-solo' : ''}`}
            onClick={onTogglePassAndPlay}
            title="Toggle 1-Phone Pass & Play vs Online Turn"
          >
            {passAndPlay ? '📱 2P' : '🌐 Live'}
          </button>
          <button
            type="button"
            className="hud-mini-btn"
            onClick={() => onNewSeedMatch(gameState.twistsEnabled)}
            title="Generate New Randomized Board Seed"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main 10x10 Boustrophedon Snakes & Ladders Vector Board */}
      <div className="board-stage">
        <svg
          viewBox="0 0 100 100"
          className="board-svg"
          role="img"
          aria-label="Randomized Snakes and Ladders 10x10 Board"
        >
          {/* 100 Grid Tiles */}
          {Array.from({ length: 100 }).map((_, idx) => {
            const tileNum = idx + 1;
            const center = tileToSvgCenter(tileNum);
            const x = center.col * 10;
            const y = center.row * 10;
            const isEven = (center.row + center.col) % 2 === 0;
            const twist = generatedBoard.twists.find((t) => t.tile === tileNum);

            let tileFill = isEven ? '#fffbf5' : '#fde2e4';
            if (tileNum === 100) tileFill = '#fef08a';
            else if (tileNum === 1) tileFill = '#d1fae5';
            else if (twist) tileFill = '#ede9fe';

            return (
              <g key={tileNum}>
                <rect
                  x={x}
                  y={y}
                  width="10"
                  height="10"
                  fill={tileFill}
                  stroke="#ead2ac"
                  strokeWidth="0.25"
                />
                <text
                  x={x + 1.1}
                  y={y + 2.8}
                  fontSize="2.1"
                  fontWeight="800"
                  fill="#8c6249"
                >
                  {tileNum}
                </text>
                {tileNum === 100 && (
                  <text x={x + 5.2} y={y + 7.2} fontSize="3.8" textAnchor="middle">
                    👑
                  </text>
                )}
                {twist && (
                  <text x={x + 6.8} y={y + 7.8} fontSize="3.3" textAnchor="middle">
                    {twist.icon}
                  </text>
                )}
              </g>
            );
          })}

          {/* Procedural Classic Wooden Ladders */}
          {generatedBoard.ladders.map((ladder) => (
            <WoodenLadderSvg key={ladder.id} link={ladder} />
          ))}

          {/* Procedural Classic Colorful Cartoon Snakes */}
          {generatedBoard.snakes.map((snake) => (
            <CartoonSnakeSvg key={snake.id} link={snake} />
          ))}

          {/* Player 1 & Player 2 Cartoon Cat Tokens */}
          <BoardCatPlayerToken
            tile={displayP2Tile}
            slot="p2"
            avatar={p2Avatar}
            hasShield={gameState.p2Shield}
            isHopping={hoppingSlot === 'p2'}
            isDizzy={dizzySlot === 'p2'}
            offsetX={sameTile ? 1.8 : 0}
            offsetY={sameTile ? -1.4 : 0}
          />
          <BoardCatPlayerToken
            tile={displayP1Tile}
            slot="p1"
            avatar={p1Avatar}
            hasShield={gameState.p1Shield}
            isHopping={hoppingSlot === 'p1'}
            isDizzy={dizzySlot === 'p1'}
            offsetX={sameTile ? -1.8 : 0}
            offsetY={sameTile ? 1.4 : 0}
          />
        </svg>

        {/* Bottom Event Status Pill Inside Board */}
        <div className="shell-overlay-banner">
          {gameState.lastAnimation
            ? gameState.lastAnimation.eventMessage
            : `Seed #${gameState.boardSeed} • Tap 🐾 Roll above!`}
        </div>

        {/* Victory Celebration Overlay */}
        {gameState.winner && (
          <div className="victory-overlay-card">
            <div className="victory-cat-dance">
              <CatAvatarSvg
                breed={
                  gameState.winner === 'p1' ? p1Avatar.breed : p2Avatar.breed
                }
                accessory="crown"
                size={54}
              />
            </div>
            <div className="victory-title">
              👑{' '}
              {gameState.winner === 'p1' ? p1Avatar.name : p2Avatar.name}{' '}
              Reached Tile 100! 🎉
            </div>
            <button
              type="button"
              className="victory-rematch-btn"
              onClick={() => onNewSeedMatch(gameState.twistsEnabled)}
            >
              New Randomized Board 🎲
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
