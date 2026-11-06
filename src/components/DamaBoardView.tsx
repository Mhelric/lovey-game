import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  BoardPos,
  CapturedPieceInfo,
  DamaGameState,
  DamaPiece,
  applyDamaStep,
  getLegalStepsForState,
  getMandatoryCaptureOrigins,
  isPlayableSquare,
  posKey,
  samePos,
} from '../engines/damaEngine';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import { CatAvatarSvg } from './CatAvatarSvg';
import { SparkleIcon } from './ArcadeIcons';
import {
  playAscensionChime,
  playCatPounceCapture,
  playCatStep,
  playComboFanfare,
  playTapPop,
  playTurnBannerPop,
  playVictoryFanfare,
} from '../services/soundEffects';

interface DamaBoardViewProps {
  gameState: DamaGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay: boolean;
  onCommitState: (nextState: DamaGameState) => void;
}

interface PoofEffect {
  id: string;
  r: number;
  c: number;
  victimOwner: PlayerSlot;
  victimBreed: CatAvatarConfig['breed'];
}

/**
 * Clean 3D Tactile Stacked Dama Piece with 2D Illustrated Cat Avatar & Outfit
 * - P1: Strawberry Rose (#FF6B9A) 3D cylinder + Warm Cream (#FFF8F2) top face
 * - P2: Sky Berry (#38BDF8) 3D cylinder + Soft Ice-Cream (#F4FAFF) top face (high contrast for all cat breeds!)
 * - Promoted Dama King: Double-Decker Royal Golden 3D Disc + Top-Right Golden Crown Badge!
 */
function DamaCatToken({
  piece,
  avatar,
  isSelected,
  isMandatory,
  isJustMoved,
  isJustPromoted,
  isGhostCaptured,
}: {
  piece: DamaPiece;
  avatar: CatAvatarConfig;
  isSelected: boolean;
  isMandatory: boolean;
  isJustMoved: boolean;
  isJustPromoted: boolean;
  isGhostCaptured: boolean;
}) {
  const isP1 = piece.owner === 'p1';
  const isKing = piece.kind === 'dama';

  const baseWallColor = isP1 ? '#FF6B9A' : '#38BDF8';
  const topDiscColor = isKing ? '#FFFBEB' : isP1 ? '#FFF8F2' : '#F4FAFF';
  const innerRimColor = isKing ? '#F59E0B' : isP1 ? '#FFC2D4' : '#BAE6FD';

  return (
    <g
      className={[
        'dama-cat-token',
        isSelected ? 'token-selected' : '',
        isJustMoved ? 'token-pounce-land' : '',
        isJustPromoted ? 'token-ascend-burst' : '',
        isGhostCaptured ? 'token-eaten-spin' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 3D Ground Contact Drop Shadow */}
      <ellipse
        cx="0"
        cy={isSelected ? '2.1' : '1.45'}
        rx={isKing ? '5.1' : '4.75'}
        ry={isKing ? '4.4' : '4.1'}
        fill="rgba(91, 42, 78, 0.24)"
      />

      <g transform={isKing ? 'scale(1.06)' : undefined}>
        {/* Mandatory Capture (Mayor) Pulsing Ring */}
        {isMandatory && !isSelected && (
          <circle
            cx="0"
            cy="0.2"
            r="5.6"
            fill="none"
            stroke="#E11D48"
            stroke-width="0.58"
            stroke-dasharray="1.6 1.1"
            className="mayor-pulse-ring"
          />
        )}

        {/* Selected Lift Halo */}
        {isSelected && (
          <circle
            cx="0"
            cy="0.2"
            r="5.7"
            fill="rgba(16, 185, 129, 0.22)"
            stroke="#10B981"
            stroke-width="0.62"
          />
        )}

        {/* Last Moved Piece Highlight Ring */}
        {isJustMoved && (
          <circle
            cx="0"
            cy="0.2"
            r={isKing ? '5.7' : '5.3'}
            fill="none"
            stroke={isP1 ? '#FF4B72' : '#0284C7'}
            stroke-width="0.68"
            stroke-dasharray="1.4 0.9"
            className="last-moved-ring"
          />
        )}

        {isKing ? (
          /* DAMA KING: Double-Decker Golden Royal Pedestal */
          <>
            <circle
              cx="0"
              cy="0.25"
              r="5.35"
              fill="none"
              stroke="#F59E0B"
              stroke-width="0.42"
              stroke-dasharray="1.2 0.8"
            />
            {/* Bottom Tier: Deep Amber Gold */}
            <circle
              cx="0"
              cy="1.15"
              r="4.85"
              fill="#D97706"
              stroke="#5B2A4E"
              stroke-width="0.48"
            />
            {/* Middle Tier: Player Team Ribbon Ridge */}
            <circle
              cx="0"
              cy="0.55"
              r="4.8"
              fill={baseWallColor}
              stroke="#5B2A4E"
              stroke-width="0.45"
            />
            {/* Upper Gold Rim */}
            <circle
              cx="0"
              cy="0"
              r="4.7"
              fill="#FBBF24"
              stroke="#5B2A4E"
              stroke-width="0.48"
            />
            {/* Top Cream-Gold Face */}
            <circle
              cx="0"
              cy="-0.15"
              r="4.25"
              fill={topDiscColor}
              stroke={innerRimColor}
              stroke-width="0.38"
            />
          </>
        ) : (
          /* REGULAR TAO PIECE: Clean 3D Stacked Checker Puck */
          <>
            {/* 3D Colored Cylinder Base */}
            <circle
              cx="0"
              cy="0.82"
              r="4.72"
              fill={baseWallColor}
              stroke="#5B2A4E"
              stroke-width="0.5"
            />
            {/* Light Top Beveled Disc */}
            <circle
              cx="0"
              cy="0"
              r="4.62"
              fill={topDiscColor}
              stroke="#5B2A4E"
              stroke-width="0.5"
            />
            {/* Subtle Inner Colored Dish Ring */}
            <circle
              cx="0"
              cy="0"
              r="3.85"
              fill="none"
              stroke={innerRimColor}
              stroke-width="0.35"
            />
          </>
        )}

        {/* 2D Illustrated Player Cat Avatar WITH Outfit Accessory */}
        <CatAvatarSvg
          breed={avatar.breed}
          accessory={avatar.accessory}
          x={-4.7}
          y={-5.1}
          size={9.4}
          animateIdle={false}
          happySquint={isKing}
          actionAnim={isJustPromoted ? 'ascend' : 'none'}
        />

        {/* Promoted Dama King Golden Crown Badge at Top-Right */}
        {isKing && (
          <g transform="translate(3.3, -3.4)">
            <circle
              cx="0"
              cy="0"
              r="2.05"
              fill="#FFF8F2"
              stroke="#5B2A4E"
              stroke-width="0.42"
            />
            <path
              d="M -1.15 0.65 L -1.35 -0.65 L -0.45 0.05 L 0 -0.95 L 0.45 0.05 L 1.35 -0.65 L 1.15 0.65 Z"
              fill="#FFBE0B"
              stroke="#5B2A4E"
              stroke-width="0.28"
              stroke-linejoin="round"
            />
          </g>
        )}

        {/* Persistent Cute Paw Marker Badge on the Piece That Just Moved */}
        {isJustMoved && (
          <g
            transform={isKing ? 'translate(-3.3, -3.4)' : 'translate(3.3, -3.4)'}
            className="last-moved-badge-group"
          >
            <circle
              cx="0"
              cy="0"
              r="2.05"
              fill="#FFFFFF"
              stroke="#5B2A4E"
              stroke-width="0.42"
            />
            <circle
              cx="0"
              cy="0"
              r="1.48"
              fill={isP1 ? '#FF4B72' : '#0284C7'}
            />
            {/* Cute White Paw Silhouette */}
            <ellipse cx="0" cy="0.32" rx="0.55" ry="0.42" fill="#FFFFFF" />
            <circle cx="-0.45" cy="-0.28" r="0.2" fill="#FFFFFF" />
            <circle cx="0" cy="-0.5" r="0.2" fill="#FFFFFF" />
            <circle cx="0.45" cy="-0.28" r="0.2" fill="#FFFFFF" />
          </g>
        )}
      </g>
    </g>
  );
}

/**
 * Valid Move Hint: 3D Pulsing Cartoon Paw Print Target
 */
function PawTargetHintSvg({ isCapture }: { isCapture: boolean }) {
  const color = isCapture ? '#E11D48' : '#10B981';
  const bg = isCapture
    ? 'rgba(225, 29, 72, 0.24)'
    : 'rgba(16, 185, 129, 0.25)';

  return (
    <g className="target-dot-pulse">
      <circle r="3.75" fill={bg} stroke={color} stroke-width="0.52" />
      <ellipse cx="0" cy="0.65" rx="1.35" ry="1.05" fill={color} />
      <circle cx="-1.25" cy="-0.65" r="0.52" fill={color} />
      <circle cx="-0.42" cy="-1.2" r="0.52" fill={color} />
      <circle cx="0.42" cy="-1.2" r="0.52" fill={color} />
      <circle cx="1.25" cy="-0.65" r="0.52" fill={color} />
    </g>
  );
}

/**
 * Cute Capture Animation at Exact Captured Square (cx, cy):
 * Outer <g> holds translate(cx, cy) so CSS animation on inner <g> NEVER resets position to (0,0)!
 */
function PawSmackPoofSvg({
  r,
  c,
  victimBreed,
}: {
  r: number;
  c: number;
  victimBreed: CatAvatarConfig['breed'];
}) {
  const cx = c * 12.5 + 6.25;
  const cy = r * 12.5 + 6.25;

  return (
    <g transform={`translate(${cx}, ${cy})`} pointer-events="none">
      {/* Eaten Cat Spinning/Popping Out on the Captured Tile */}
      <g className="captured-victim-pop">
        <CatAvatarSvg
          breed={victimBreed}
          accessory="none"
          x={-4.5}
          y={-4.5}
          size={9}
          animateIdle={false}
          dizzy={true}
        />
      </g>

      {/* Animated Cloud Puff + Claw Slash + Stars */}
      <g className="paw-poof-group">
        <circle
          cx="0"
          cy="0"
          r="5.4"
          fill="none"
          stroke="#FFBE0B"
          stroke-width="0.55"
          stroke-dasharray="1.3 0.9"
        />
        <circle
          cx="-1.9"
          cy="-1.0"
          r="3.0"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.42"
        />
        <circle
          cx="2.0"
          cy="-0.8"
          r="2.8"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.42"
        />
        <circle
          cx="0"
          cy="1.5"
          r="3.1"
          fill="#ffffff"
          stroke="#5B2A4E"
          stroke-width="0.42"
        />
        <path
          d="M -3.0 -2.4 Q 0 -0.2 3.0 2.2 M -1.6 -3.2 Q 1.2 -0.8 3.6 1.2"
          fill="none"
          stroke="#FF4D6D"
          stroke-width="0.55"
          stroke-linecap="round"
        />
        <circle cx="-4.8" cy="-4.4" r="1.0" fill="#FFBE0B" />
        <circle cx="4.8" cy="-4.4" r="1.0" fill="#FF6B9A" />
        <circle cx="-4.8" cy="4.4" r="1.0" fill="#2EC4B6" />
        <circle cx="4.8" cy="4.4" r="1.0" fill="#FB923C" />
        <text
          x="0"
          y="0.8"
          text-anchor="middle"
          fill="#E11D48"
          style={{
            fontSize: '2.35px',
            fontFamily: "var(--font-display, 'Baloo 2', sans-serif)",
            fontWeight: 800,
          }}
        >
          POUNCE!
        </text>
      </g>
    </g>
  );
}

export function DamaBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay,
  onCommitState,
}: DamaBoardViewProps) {
  const [selectedPos, setSelectedPos] = useState<BoardPos | null>(null);
  const [poofEffect, setPoofEffect] = useState<PoofEffect | null>(null);
  const [comboPopup, setComboPopup] = useState<{
    id: string;
    count: number;
    moverName: string;
  } | null>(null);
  const [ascendPopup, setAscendPopup] = useState<{
    id: string;
    avatar: CatAvatarConfig;
  } | null>(null);
  const [turnPopup, setTurnPopup] = useState<{
    id: string;
    slot: PlayerSlot;
    avatar: CatAvatarConfig;
  } | null>(null);

  const canControlCurrentTurn = passAndPlay || gameState.turn === mySlot;

  const legalSteps = useMemo(
    () => getLegalStepsForState(gameState),
    [gameState]
  );

  const mandatoryOrigins = useMemo(
    () => getMandatoryCaptureOrigins(gameState),
    [gameState]
  );

  useEffect(() => {
    if (gameState.chainPos) {
      setSelectedPos(gameState.chainPos);
    } else {
      setSelectedPos(null);
    }
  }, [gameState.chainPos, gameState.turn]);

  // Turn Indicator Popup Window ("[CAT AVATAR] Player Name's Turn!")
  // Turn Indicator Popup on Every Turn Change (Turn 0 uses the First-Turn Shuffle Ceremony)
  useEffect(() => {
    if (gameState.winner || !gameState.lastAction) return;
    const avatar = gameState.turn === 'p1' ? p1Avatar : p2Avatar;
    const popId = `dama-turn-${gameState.turn}-${Date.now()}`;
    playTurnBannerPop();
    setTurnPopup({ id: popId, slot: gameState.turn, avatar });
    const t = window.setTimeout(() => {
      setTurnPopup((prev) => (prev?.id === popId ? null : prev));
    }, 1300);
    return () => clearTimeout(t);
  }, [
    gameState.turn,
    gameState.winner,
    Boolean(gameState.lastAction),
    p1Avatar.name,
    p2Avatar.name,
  ]);

  // Capture Poof, Multi-Capture Combo Popup, & Dama Ascension Popup
  useEffect(() => {
    if (!gameState.lastAction) return;
    const action = gameState.lastAction;
    const cap: CapturedPieceInfo | null = action.captured ?? null;
    const comboCount = action.comboCount ?? (cap ? 1 : 0);
    const timers: number[] = [];

    if (gameState.winner) {
      playVictoryFanfare();
    } else if (action.promoted) {
      playAscensionChime();
    } else if (comboCount >= 2) {
      playComboFanfare(comboCount);
    } else if (cap) {
      playCatPounceCapture();
    } else {
      playCatStep();
    }

    if (cap) {
      const victimAvatar = cap.piece.owner === 'p1' ? p1Avatar : p2Avatar;
      setPoofEffect({
        id: action.id,
        r: cap.r,
        c: cap.c,
        victimOwner: cap.piece.owner,
        victimBreed: victimAvatar.breed,
      });
      timers.push(
        window.setTimeout(() => {
          setPoofEffect((prev) => (prev?.id === action.id ? null : prev));
        }, 760)
      );
    }

    if (comboCount >= 2 && !gameState.winner) {
      const moverName =
        action.mover === 'p1' ? p1Avatar.name : p2Avatar.name;
      setComboPopup({
        id: action.id,
        count: comboCount,
        moverName,
      });
      timers.push(
        window.setTimeout(() => {
          setComboPopup((prev) => (prev?.id === action.id ? null : prev));
        }, 1850)
      );
    }

    if (action.promoted && !gameState.winner) {
      const promotedAvatar =
        action.mover === 'p1' ? p1Avatar : p2Avatar;
      setAscendPopup({
        id: action.id,
        avatar: promotedAvatar,
      });
      timers.push(
        window.setTimeout(() => {
          setAscendPopup((prev) => (prev?.id === action.id ? null : prev));
        }, 2150)
      );
    }

    return () => {
      timers.forEach((id) => clearTimeout(id));
    };
  }, [gameState.lastAction?.id, gameState.winner]);

  const stepsForSelected = useMemo(() => {
    if (!selectedPos) return [];
    return legalSteps.filter((s) => samePos(s.from, selectedPos));
  }, [legalSteps, selectedPos]);

  const handleSquareTap = (r: number, c: number) => {
    if (gameState.winner || !canControlCurrentTurn) return;

    const tappedPos: BoardPos = { r, c };

    const matchingStep = stepsForSelected.find((s) => samePos(s.to, tappedPos));
    if (selectedPos && matchingStep) {
      const nextState = applyDamaStep(gameState, selectedPos, tappedPos);
      onCommitState(nextState);
      return;
    }

    if (gameState.chainPos) {
      setSelectedPos(gameState.chainPos);
      return;
    }

    const cellPiece = gameState.board[r][c];
    if (cellPiece && cellPiece.owner === gameState.turn) {
      const hasMoves = legalSteps.some((s) => samePos(s.from, tappedPos));
      if (hasMoves) {
        playTapPop();
        setSelectedPos(tappedPos);
      } else if (mandatoryOrigins.size > 0) {
        const firstKey = Array.from(mandatoryOrigins)[0];
        if (firstKey) {
          playTapPop();
          const [mr, mc] = firstKey.split(',').map(Number);
          setSelectedPos({ r: mr, c: mc });
        }
      }
    } else {
      setSelectedPos(null);
    }
  };

  const hasMandatoryCapture = mandatoryOrigins.size > 0;
  const ghostCapturedSet = new Set(gameState.capturedInChain);
  const lastMoverName =
    gameState.lastAction?.mover === 'p1' ? p1Avatar.name : p2Avatar.name;

  // Mirrored POV: P1 sees White/Pearl pieces at bottom & Dark/Plum pieces at top;
  // P2 sees Dark/Plum pieces at bottom & White/Pearl pieces at top!
  const flip = passAndPlay ? gameState.turn === 'p2' : mySlot === 'p2';

  return (
    <div className="dama-stage-container">
      {hasMandatoryCapture && !gameState.winner ? (
        <div className="mayor-floating-alert">
          <SparkleIcon size={14} />
          <span>Mayor Rule! Jump with the glowing cat for max capture</span>
        </div>
      ) : gameState.lastAction && !gameState.winner ? (
        <div className="dama-last-move-chip">
          <span className="last-move-paw" aria-hidden="true">🐾</span>
          <span>
            <strong>{lastMoverName}</strong> moved tao
            {gameState.lastAction.captured ? ' (captured!)' : ''}
          </span>
        </div>
      ) : null}

      {/* Clean 8x8 Filipino Dama Board Frame (No horizontal lines!) */}
      <div className="board-stage sticker-board-frame dama-3d-board">
        <svg
          viewBox="0 0 100 100"
          className="board-svg"
          role="grid"
          aria-label="Cat Dama 8x8 Board"
        >
          {/* Warm Cream Base */}
          <rect x="0" y="0" width="100" height="100" fill="#FFFDF9" />

          {/* 64 Clean Cushion Checkerboard Squares */}
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 8 }).map((__, c) => {
              const playable = isPlayableSquare(r, c);
              const isSelected = samePos(selectedPos, { r, c });
              const isTarget = stepsForSelected.some((s) =>
                samePos(s.to, { r, c })
              );
              const isLastFrom = samePos(gameState.lastAction?.from ?? null, {
                r,
                c,
              });
              const isLastTo = samePos(gameState.lastAction?.to ?? null, {
                r,
                c,
              });

              let squareFill = playable ? '#FF9EBB' : '#FFFDF9';
              let innerPadFill = 'rgba(255, 255, 255, 0.26)';
              if (isSelected) {
                squareFill = '#A7F3D0';
                innerPadFill = 'rgba(255, 255, 255, 0.42)';
              } else if (isTarget) {
                squareFill = '#FDE68A';
                innerPadFill = 'rgba(255, 255, 255, 0.45)';
              } else if (isLastFrom || isLastTo) {
                squareFill = '#FFC2D4';
                innerPadFill = 'rgba(255, 255, 255, 0.34)';
              }

              const renderR = flip ? 7 - r : r;
              const renderC = flip ? 7 - c : c;
              const sx = renderC * 12.5;
              const sy = renderR * 12.5;

              return (
                <g
                  key={`sq-${r}-${c}`}
                  onClick={() => playable && handleSquareTap(r, c)}
                  style={{ cursor: playable ? 'pointer' : 'default' }}
                >
                  <rect
                    x={sx}
                    y={sy}
                    width="12.5"
                    height="12.5"
                    fill={squareFill}
                  />
                  {/* Soft Rounded Cushion Pad on Playable Squares (No horizontal lines) */}
                  {playable && (
                    <rect
                      x={sx + 0.9}
                      y={sy + 0.9}
                      width="10.7"
                      height="10.7"
                      rx="2.3"
                      fill={innerPadFill}
                      pointer-events="none"
                    />
                  )}

                  {/* Subtle Paw Footprint Marking the Square Moved From */}
                  {isLastFrom && (
                    <g
                      transform={`translate(${sx + 6.25}, ${sy + 6.25})`}
                      opacity="0.45"
                      pointerEvents="none"
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="3.2"
                        fill="none"
                        stroke="#5B2A4E"
                        strokeWidth="0.45"
                        strokeDasharray="1.2 0.8"
                      />
                      <ellipse cx="0" cy="0.4" rx="0.8" ry="0.6" fill="#5B2A4E" />
                      <circle cx="-0.65" cy="-0.4" r="0.28" fill="#5B2A4E" />
                      <circle cx="0" cy="-0.75" r="0.28" fill="#5B2A4E" />
                      <circle cx="0.65" cy="-0.4" r="0.28" fill="#5B2A4E" />
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Pulsing Paw Print Move Hints */}
          {stepsForSelected.map((step) => {
            const renderR = flip ? 7 - step.to.r : step.to.r;
            const renderC = flip ? 7 - step.to.c : step.to.c;
            const cx = renderC * 12.5 + 6.25;
            const cy = renderR * 12.5 + 6.25;
            const isCaptureTarget = Boolean(step.captured);
            return (
              <g
                key={`target-${step.to.r}-${step.to.c}`}
                transform={`translate(${cx}, ${cy})`}
                onClick={() => handleSquareTap(step.to.r, step.to.c)}
                style={{ cursor: 'pointer' }}
              >
                <PawTargetHintSvg isCapture={isCaptureTarget} />
              </g>
            );
          })}

          {/* Render All 3D Cat Pieces on the Board */}
          {gameState.board.map((row, r) =>
            row.map((piece, c) => {
              if (!piece) return null;
              const renderR = flip ? 7 - r : r;
              const renderC = flip ? 7 - c : c;
              const cx = renderC * 12.5 + 6.25;
              const cy = renderR * 12.5 + 6.25;
              const key = posKey(r, c);
              const isSelected = samePos(selectedPos, { r, c });
              const isMandatory = mandatoryOrigins.has(key);
              const isJustMoved = samePos(gameState.lastAction?.to ?? null, {
                r,
                c,
              });
              const isJustPromoted =
                isJustMoved && Boolean(gameState.lastAction?.promoted);
              const isGhostCaptured = ghostCapturedSet.has(key);

              return (
                <g
                  key={piece.id}
                  transform={`translate(${cx}, ${cy})`}
                  onClick={() => handleSquareTap(r, c)}
                  style={{
                    cursor: canControlCurrentTurn ? 'pointer' : 'default',
                  }}
                >
                  <DamaCatToken
                    piece={piece}
                    avatar={piece.owner === 'p1' ? p1Avatar : p2Avatar}
                    isSelected={isSelected}
                    isMandatory={isMandatory}
                    isJustMoved={isJustMoved}
                    isJustPromoted={isJustPromoted}
                    isGhostCaptured={isGhostCaptured}
                  />
                </g>
              );
            })
          )}

          {/* Capture Slash & Star Poof at Exact Eaten Square */}
          {poofEffect && (
            <PawSmackPoofSvg
              r={flip ? 7 - poofEffect.r : poofEffect.r}
              c={flip ? 7 - poofEffect.c : poofEffect.c}
              victimBreed={poofEffect.victimBreed}
            />
          )}
        </svg>

        {/* Center Turn Indicator Popup: "[CAT AVATAR] Player Name's Turn!" */}
        {turnPopup && !comboPopup && !ascendPopup && (
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
                  {turnPopup.slot === 'p1'
                    ? 'P-1 (Strawberry Rose)'
                    : 'P-2 (Sky Berry)'}
                </span>
                <span className="turn-popup-title">
                  {turnPopup.avatar.name}&apos;s Turn!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Jump Combo Capture Popup */}
        {comboPopup && (
          <div className="twist-popup-overlay" aria-live="polite">
            <div key={comboPopup.id} className="twist-popup-card combo-modal">
              <span className="combo-badge-pill">
                🔥 {comboPopup.count}x CAT COMBO!
              </span>
              <span className="twist-popup-title">
                {comboPopup.count >= 3
                  ? 'ULTRA MAYOR POUNCE!'
                  : 'DOUBLE POUNCE!'}
              </span>
              <span className="twist-popup-desc">
                {comboPopup.moverName} gobbled {comboPopup.count} pieces in a
                row!
              </span>
            </div>
          </div>
        )}

        {/* Dama Ascension Evolution Popup */}
        {ascendPopup && (
          <div className="twist-popup-overlay" aria-live="polite">
            <div
              key={ascendPopup.id}
              className="twist-popup-card ascend-modal"
            >
              <span className="ascend-kicker-pill">✨ ROYAL EVOLUTION ✨</span>
              <div className="ascend-avatar-stage">
                <CatAvatarSvg
                  breed={ascendPopup.avatar.breed}
                  accessory={ascendPopup.avatar.accessory}
                  size={56}
                  happySquint
                />
              </div>
              <span className="twist-popup-title">Ascended to Dama!</span>
              <span className="twist-popup-desc">
                {ascendPopup.avatar.name} unlocked Flying Royal Wings!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
