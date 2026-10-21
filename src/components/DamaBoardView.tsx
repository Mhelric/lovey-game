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
import { CatAvatarSvg, CoupleCatsSceneSvg } from './CatAvatarSvg';
import {
  CrownIcon,
  DoubleHeartIcon,
  SparkleIcon,
} from './ArcadeIcons';
import {
  playCatPounceCapture,
  playCatStep,
  playTapPop,
  playVictoryFanfare,
} from '../services/soundEffects';

interface DamaBoardViewProps {
  gameState: DamaGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay: boolean;
  onCommitState: (nextState: DamaGameState) => void;
  onResetMatch: () => void;
}

interface PoofEffect {
  id: string;
  r: number;
  c: number;
  victimOwner: PlayerSlot;
}

/**
 * Cat Dama Piece using the exact player CatAvatarSvg sprite (~80% of square)
 * on a light cream disc with 3px plum outline and colored bottom ring (P1 #FF6B9A, P2 #FFA94D).
 */
function DamaCatToken({
  piece,
  avatar,
  isSelected,
  isMandatory,
  isJustMoved,
  isGhostCaptured,
}: {
  piece: DamaPiece;
  avatar: CatAvatarConfig;
  isSelected: boolean;
  isMandatory: boolean;
  isJustMoved: boolean;
  isGhostCaptured: boolean;
}) {
  const isP1 = piece.owner === 'p1';
  const isKing = piece.kind === 'dama';
  const bottomRingColor = isP1 ? '#FF6B9A' : '#FFA94D';

  return (
    <g
      className={[
        'dama-cat-token',
        isSelected ? 'token-selected' : '',
        isJustMoved ? 'token-pounce-land' : '',
        isGhostCaptured ? 'token-eaten-spin' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <g transform={isKing ? 'scale(1.1)' : undefined}>
        {/* Mandatory Capture (Mayor) Pulsing Ring */}
        {isMandatory && !isSelected && (
          <circle
            cx="0"
            cy="0.2"
            r="5.6"
            fill="none"
            stroke="#E11D48"
            stroke-width="0.6"
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
            stroke-width="0.65"
          />
        )}

        {/* Colored Bottom Ring (P1 Pink #FF6B9A / P2 Orange #FFA94D) with Plum Outline */}
        <circle
          cx="0"
          cy="0.85"
          r="4.75"
          fill={bottomRingColor}
          stroke="#5B2A4E"
          stroke-width="0.52"
        />

        {/* Light Cream Disc with 3px-style Plum Outline */}
        <circle
          cx="0"
          cy="0"
          r="4.65"
          fill="#FFF8F2"
          stroke="#5B2A4E"
          stroke-width="0.52"
        />

        {/* Exact Player Avatar Cat Sprite (~80% of 12.5 square = 10x10 units, no accessory) */}
        <CatAvatarSvg
          breed={avatar.breed}
          accessory="none"
          x={-5}
          y={-5.2}
          size={10}
          animateIdle={false}
        />

        {/* Promoted (King) Gold Crown Badge at Top-Right */}
        {isKing && (
          <g transform="translate(3.2, -3.4)">
            <circle
              cx="0"
              cy="0"
              r="1.95"
              fill="#FFF8F2"
              stroke="#5B2A4E"
              stroke-width="0.4"
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
      </g>
    </g>
  );
}

/**
 * Valid Move Hint: Pulsing Cartoon Paw Print
 */
function PawTargetHintSvg({ isCapture }: { isCapture: boolean }) {
  const color = isCapture ? '#E11D48' : '#10B981';
  const bg = isCapture ? 'rgba(225, 29, 72, 0.22)' : 'rgba(16, 185, 129, 0.25)';

  return (
    <g className="target-dot-pulse">
      <circle
        r="3.8"
        fill={bg}
        stroke={color}
        stroke-width="0.55"
      />
      <ellipse cx="0" cy="0.65" rx="1.35" ry="1.05" fill={color} />
      <circle cx="-1.25" cy="-0.65" r="0.52" fill={color} />
      <circle cx="-0.42" cy="-1.2" r="0.52" fill={color} />
      <circle cx="0.42" cy="-1.2" r="0.52" fill={color} />
      <circle cx="1.25" cy="-0.65" r="0.52" fill={color} />
    </g>
  );
}

function PawSmackPoofSvg({ r, c }: { r: number; c: number }) {
  const cx = c * 12.5 + 6.25;
  const cy = r * 12.5 + 6.25;

  return (
    <g transform={`translate(${cx}, ${cy})`} className="paw-poof-group">
      <circle
        cx="-1.8"
        cy="-1.2"
        r="3.1"
        fill="#ffffff"
        stroke="#5B2A4E"
        stroke-width="0.4"
      />
      <circle
        cx="2.0"
        cy="-1.0"
        r="2.9"
        fill="#ffffff"
        stroke="#5B2A4E"
        stroke-width="0.4"
      />
      <circle
        cx="0"
        cy="1.6"
        r="3.2"
        fill="#ffffff"
        stroke="#5B2A4E"
        stroke-width="0.4"
      />
      {/* Bursting Stars */}
      <circle cx="-4.8" cy="-4.4" r="1.0" fill="#FFBE0B" />
      <circle cx="4.8" cy="-4.4" r="1.0" fill="#FF6B9A" />
      <circle cx="-4.8" cy="4.4" r="1.0" fill="#2EC4B6" />
      <circle cx="4.8" cy="4.4" r="1.0" fill="#FB923C" />
      {/* Tiny Comic "POOF!" Text */}
      <text
        x="0"
        y="0.8"
        text-anchor="middle"
        fill="#E11D48"
        style={{
          fontSize: '2.4px',
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
        }}
      >
        NYOOM!
      </text>
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
  onResetMatch,
}: DamaBoardViewProps) {
  const [selectedPos, setSelectedPos] = useState<BoardPos | null>(null);
  const [poofEffect, setPoofEffect] = useState<PoofEffect | null>(null);

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

  useEffect(() => {
    if (!gameState.lastAction) return;
    const cap: CapturedPieceInfo | null = gameState.lastAction.captured ?? null;
    if (gameState.winner) {
      playVictoryFanfare();
    } else if (cap) {
      playCatPounceCapture();
    } else {
      playCatStep();
    }
    if (!cap) return;
    const effectId = gameState.lastAction.id;
    setPoofEffect({
      id: effectId,
      r: cap.r,
      c: cap.c,
      victimOwner: cap.piece.owner,
    });
    const timer = window.setTimeout(() => {
      setPoofEffect((prev) => (prev?.id === effectId ? null : prev));
    }, 680);
    return () => clearTimeout(timer);
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

  return (
    <div className="dama-stage-container">
      {hasMandatoryCapture && !gameState.winner && (
        <div className="mayor-floating-alert">
          <SparkleIcon size={14} />
          <span>Mandatory Capture! Jump with the glowing cat</span>
        </div>
      )}

      {/* Cohesive Sticker-Cartoony 8x8 Dama Board with Plum Outline */}
      <div className="board-stage sticker-board-frame">
        <svg
          viewBox="0 0 100 100"
          className="board-svg"
          role="grid"
          aria-label="Cat Dama 8x8 Board"
        >
          {/* Warm Cream Base */}
          <rect x="0" y="0" width="100" height="100" fill="#FFF8F2" />

          {/* 64 Connected Checkerboard Squares (Deeper Pink Playable + Cream Non-Playable) */}
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

              let squareFill = playable ? '#FF9EBB' : '#FFF8F2';
              if (isSelected) squareFill = '#BFF0D8';
              else if (isTarget) squareFill = '#FFE08A';
              else if (isLastFrom || isLastTo) squareFill = '#FFC2D4';

              return (
                <rect
                  key={`sq-${r}-${c}`}
                  x={c * 12.5}
                  y={r * 12.5}
                  width="12.5"
                  height="12.5"
                  fill={squareFill}
                  stroke="rgba(91, 42, 78, 0.12)"
                  stroke-width="0.25"
                  onClick={() => playable && handleSquareTap(r, c)}
                  style={{ cursor: playable ? 'pointer' : 'default' }}
                />
              );
            })
          )}

          {/* Pulsing Paw Print Move Hints */}
          {stepsForSelected.map((step) => {
            const cx = step.to.c * 12.5 + 6.25;
            const cy = step.to.r * 12.5 + 6.25;
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

          {/* Render All Cat Pieces on the Board */}
          {gameState.board.map((row, r) =>
            row.map((piece, c) => {
              if (!piece) return null;
              const cx = c * 12.5 + 6.25;
              const cy = r * 12.5 + 6.25;
              const key = posKey(r, c);
              const isSelected = samePos(selectedPos, { r, c });
              const isMandatory = mandatoryOrigins.has(key);
              const isJustMoved = samePos(gameState.lastAction?.to ?? null, {
                r,
                c,
              });
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
                    isGhostCaptured={isGhostCaptured}
                  />
                </g>
              );
            })
          )}

          {/* Capture Puff of Stars + NYOOM! */}
          {poofEffect && <PawSmackPoofSvg r={poofEffect.r} c={poofEffect.c} />}
        </svg>
      </div>

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
              {gameState.winner === 'p1' ? p1Avatar.name : p2Avatar.name} Wins
              Cat Dama!
            </span>
          </div>
          <button
            type="button"
            className="victory-rematch-btn"
            onClick={onResetMatch}
          >
            <span>Play Rematch</span>
            <DoubleHeartIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
