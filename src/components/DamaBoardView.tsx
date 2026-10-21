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
import { getCatBreedMeta } from './CatAvatarSvg';

interface DamaBoardViewProps {
  gameState: DamaGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay: boolean;
  onTogglePassAndPlay: () => void;
  onCommitState: (nextState: DamaGameState) => void;
  onResetMatch: () => void;
}

interface PoofEffect {
  id: string;
  r: number;
  c: number;
  victimOwner: PlayerSlot;
}

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
  const breedMeta = getCatBreedMeta(avatar.breed);
  const isP1 = piece.owner === 'p1';
  const ringColor = isP1 ? '#ff4d6d' : '#f59e0b';
  const ringBg = isP1 ? '#fff0f3' : '#fffbeb';

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
      {/* Mandatory Capture (Mayor) Pulsing Ring */}
      {isMandatory && !isSelected && (
        <circle
          cx="0"
          cy="0"
          r="5.6"
          fill="none"
          stroke="#ef4444"
          strokeWidth="0.7"
          strokeDasharray="1.8 1.2"
          className="mayor-pulse-ring"
        />
      )}

      {/* Selected Highlight Halo */}
      {isSelected && (
        <circle
          cx="0"
          cy="0"
          r="5.7"
          fill="none"
          stroke="#10b981"
          strokeWidth="0.85"
        />
      )}

      {/* Dama King Royal Cape */}
      {piece.kind === 'dama' && (
        <path
          d="M -4.2 1.2 L -5.5 4.8 L 0 3.8 L 5.5 4.8 L 4.2 1.2 Z"
          fill="#e63946"
          stroke="#800f2f"
          strokeWidth="0.4"
        />
      )}

      {/* Token Base Disc */}
      <circle
        cx="0"
        cy="0.3"
        r="4.7"
        fill={ringBg}
        stroke={ringColor}
        strokeWidth="0.85"
      />

      {/* Cat Ears */}
      <polygon
        points="-3.4,-1.5 -2.5,-4.5 -0.7,-2.6"
        fill={breedMeta.fur}
        stroke="#432818"
        strokeWidth="0.35"
      />
      <polygon
        points="3.4,-1.5 2.5,-4.5 0.7,-2.6"
        fill={breedMeta.fur}
        stroke="#432818"
        strokeWidth="0.35"
      />

      {/* Cat Head */}
      <circle
        cx="0"
        cy="0.5"
        r="3.2"
        fill={breedMeta.fur}
        stroke="#432818"
        strokeWidth="0.4"
      />

      {/* Eyes */}
      <circle cx="-1.15" cy="0.1" r="0.52" fill={breedMeta.eyeColor} />
      <circle cx="1.15" cy="0.1" r="0.52" fill={breedMeta.eyeColor} />

      {/* Cute Nose & Cheeks */}
      <ellipse cx="-1.9" cy="0.9" rx="0.6" ry="0.32" fill="#ff758f" opacity="0.65" />
      <ellipse cx="1.9" cy="0.9" rx="0.6" ry="0.32" fill="#ff758f" opacity="0.65" />
      <polygon points="0,0.6 -0.5,1.2 0.5,1.2" fill={breedMeta.noseColor} />

      {/* Flying Dama King Golden Crown */}
      {piece.kind === 'dama' && (
        <g transform="translate(0, -3.5)">
          <polygon
            points="-2.4,1.2 -1.8,-1.4 0,0.1 1.8,-1.4 2.4,1.2"
            fill="#ffbe0b"
            stroke="#9a6700"
            strokeWidth="0.35"
          />
          <circle cx="0" cy="0.3" r="0.45" fill="#e63946" />
        </g>
      )}
    </g>
  );
}

function PawSmackPoofSvg({ r, c }: { r: number; c: number }) {
  const cx = c * 12.5 + 6.25;
  const cy = r * 12.5 + 6.25;

  return (
    <g transform={`translate(${cx}, ${cy})`} className="paw-poof-group">
      {/* Cartoon Cloud Puff */}
      <circle cx="-1.8" cy="-1.2" r="2.8" fill="#ffffff" opacity="0.92" />
      <circle cx="2.0" cy="-1.0" r="2.6" fill="#ffffff" opacity="0.92" />
      <circle cx="0" cy="1.6" r="2.9" fill="#ffffff" opacity="0.92" />
      {/* 4 Mini Stars / Paws Bursting Outward */}
      <circle cx="-4.5" cy="-4.2" r="0.9" fill="#ffbe0b" />
      <circle cx="4.5" cy="-4.2" r="0.9" fill="#ff758f" />
      <circle cx="-4.5" cy="4.2" r="0.9" fill="#2ec4b6" />
      <circle cx="4.5" cy="4.2" r="0.9" fill="#ff9f1c" />
      {/* Central Paw Pad Smack */}
      <circle cx="0" cy="0.3" r="1.4" fill="#ff4d6d" />
      <circle cx="-1.3" cy="-1.2" r="0.55" fill="#ff4d6d" />
      <circle cx="0" cy="-1.6" r="0.55" fill="#ff4d6d" />
      <circle cx="1.3" cy="-1.2" r="0.55" fill="#ff4d6d" />
    </g>
  );
}

export function DamaBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay,
  onTogglePassAndPlay,
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

  // Auto-select piece if we are in the middle of a multi-jump chain
  useEffect(() => {
    if (gameState.chainPos) {
      setSelectedPos(gameState.chainPos);
    } else {
      setSelectedPos(null);
    }
  }, [gameState.chainPos, gameState.turn]);

  // Trigger Cat Pounce + Paw Smack Cloud Poof when a capture occurs
  useEffect(() => {
    const cap: CapturedPieceInfo | null = gameState.lastAction?.captured ?? null;
    if (!cap || !gameState.lastAction) return;
    const effectId = gameState.lastAction.id;
    setPoofEffect({
      id: effectId,
      r: cap.r,
      c: cap.c,
      victimOwner: cap.piece.owner,
    });
    const timer = window.setTimeout(() => {
      setPoofEffect((prev) => (prev?.id === effectId ? null : prev));
    }, 650);
    return () => clearTimeout(timer);
  }, [gameState.lastAction?.id]);

  // Legal destination steps for the currently selected piece
  const stepsForSelected = useMemo(() => {
    if (!selectedPos) return [];
    return legalSteps.filter((s) => samePos(s.from, selectedPos));
  }, [legalSteps, selectedPos]);

  const handleSquareTap = (r: number, c: number) => {
    if (gameState.winner || !canControlCurrentTurn) return;

    const tappedPos: BoardPos = { r, c };

    // 1. If tapping a valid destination for the currently selected piece, execute the move!
    const matchingStep = stepsForSelected.find((s) => samePos(s.to, tappedPos));
    if (selectedPos && matchingStep) {
      const nextState = applyDamaStep(gameState, selectedPos, tappedPos);
      onCommitState(nextState);
      return;
    }

    // 2. If locked in a multi-jump chain, only the chain piece can remain selected
    if (gameState.chainPos) {
      setSelectedPos(gameState.chainPos);
      return;
    }

    // 3. If tapping one of the active player's pieces that has legal moves, select it
    const cellPiece = gameState.board[r][c];
    if (cellPiece && cellPiece.owner === gameState.turn) {
      const hasMoves = legalSteps.some((s) => samePos(s.from, tappedPos));
      if (hasMoves) {
        setSelectedPos(tappedPos);
      } else if (mandatoryOrigins.size > 0) {
        // Highlight the first mandatory piece so the player sees Mayor rule
        const firstKey = Array.from(mandatoryOrigins)[0];
        if (firstKey) {
          const [mr, mc] = firstKey.split(',').map(Number);
          setSelectedPos({ r: mr, c: mc });
        }
      }
    } else {
      setSelectedPos(null);
    }
  };

  const activeTurnName =
    gameState.turn === 'p1' ? p1Avatar.name : p2Avatar.name;
  const hasMandatoryCapture = mandatoryOrigins.size > 0;
  const ghostCapturedSet = new Set(gameState.capturedInChain);

  return (
    <div className="dama-stage-container">
      {/* Compact Top Status Strip Inside Board Stage */}
      <div className="board-hud-bar">
        <div className="hud-turn-pill">
          <span
            className={`turn-dot ${gameState.turn === 'p1' ? 'dot-p1' : 'dot-p2'}`}
          />
          <span className="hud-turn-text">
            {gameState.winner
              ? `🎉 ${gameState.winner === 'p1' ? p1Avatar.name : p2Avatar.name} Wins!`
              : hasMandatoryCapture
              ? `🔥 ${activeTurnName}: Must Capture!`
              : `${activeTurnName}'s Turn (${gameState.p1Remaining}v${gameState.p2Remaining})`}
          </span>
        </div>

        <div className="hud-actions">
          <button
            type="button"
            className={`hud-mini-btn ${passAndPlay ? 'active-solo' : ''}`}
            onClick={onTogglePassAndPlay}
            title="Toggle 1-Phone Practice / Pass & Play mode"
          >
            {passAndPlay ? '📱 2P Same Phone' : '🌐 Online Turn'}
          </button>
          <button
            type="button"
            className="hud-mini-btn"
            onClick={onResetMatch}
            title="Reset Dama Board"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main 8x8 Filipino Dama Vector Board */}
      <svg
        viewBox="0 0 100 100"
        className="board-svg"
        role="grid"
        aria-label="Filipino Dama 8x8 Board"
      >
        {/* 64 Board Squares */}
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

            let squareFill = playable ? '#d4a373' : '#faedcd';
            if (isSelected) squareFill = '#a7f3d0';
            else if (isTarget) squareFill = '#fde68a';
            else if (isLastFrom || isLastTo) squareFill = '#e9c46a';

            return (
              <rect
                key={`sq-${r}-${c}`}
                x={c * 12.5}
                y={r * 12.5}
                width="12.5"
                height="12.5"
                fill={squareFill}
                onClick={() => playable && handleSquareTap(r, c)}
                style={{ cursor: playable ? 'pointer' : 'default' }}
              />
            );
          })
        )}

        {/* Traditional Filipino Dama Diagonal Guide Lines */}
        <g
          stroke="#7f4f24"
          strokeWidth="0.48"
          opacity="0.45"
          pointerEvents="none"
        >
          <line x1="18.75" y1="6.25" x2="6.25" y2="18.75" />
          <line x1="43.75" y1="6.25" x2="6.25" y2="43.75" />
          <line x1="68.75" y1="6.25" x2="6.25" y2="68.75" />
          <line x1="93.75" y1="6.25" x2="6.25" y2="93.75" />
          <line x1="93.75" y1="31.25" x2="31.25" y2="93.75" />
          <line x1="93.75" y1="56.25" x2="56.25" y2="93.75" />
          <line x1="93.75" y1="81.25" x2="81.25" y2="93.75" />

          <line x1="81.25" y1="6.25" x2="93.75" y2="18.75" />
          <line x1="56.25" y1="6.25" x2="93.75" y2="43.75" />
          <line x1="31.25" y1="6.25" x2="93.75" y2="68.75" />
          <line x1="6.25" y1="6.25" x2="93.75" y2="93.75" />
          <line x1="6.25" y1="31.25" x2="68.75" y2="93.75" />
          <line x1="6.25" y1="56.25" x2="43.75" y2="93.75" />
          <line x1="6.25" y1="81.25" x2="18.75" y2="93.75" />
        </g>

        {/* Legal Destination Target Indicators (Tap-to-Move >= 42x42px cell) */}
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
              <circle
                r={isCaptureTarget ? '4.4' : '3.2'}
                fill={isCaptureTarget ? 'rgba(239, 68, 68, 0.28)' : 'rgba(16, 185, 129, 0.35)'}
                stroke={isCaptureTarget ? '#ef4444' : '#059669'}
                strokeWidth="0.7"
                className="target-dot-pulse"
              />
              <circle
                r="1.3"
                fill={isCaptureTarget ? '#ef4444' : '#059669'}
              />
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
                style={{ cursor: canControlCurrentTurn ? 'pointer' : 'default' }}
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

        {/* Cat Pounce + Paw Smack Cloud Poof Capture Burst */}
        {poofEffect && <PawSmackPoofSvg r={poofEffect.r} c={poofEffect.c} />}
      </svg>

      {/* Victory Celebration Overlay Banner */}
      {gameState.winner && (
        <div className="victory-overlay-card">
          <div className="victory-title">
            👑{' '}
            {gameState.winner === 'p1' ? p1Avatar.name : p2Avatar.name} Wins
            Dama! 🐾
          </div>
          <button
            type="button"
            className="victory-rematch-btn"
            onClick={onResetMatch}
          >
            Play Rematch 💕
          </button>
        </div>
      )}
    </div>
  );
}
