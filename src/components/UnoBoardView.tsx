import { useEffect, useState } from 'preact/hooks';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import {
  applyCallUno,
  applyDrawCard,
  applyPassTurn,
  applyPlayCard,
  canPlayCard,
  hasAnyPlayableCard,
  UnoCard,
  UnoGameState,
  UnoPlayableColor,
} from '../engines/unoEngine';
import {
  playCardDraw,
  playCardPlay,
  playColorSelect,
  playHandSwap,
  playUnoCall,
  playVictoryFanfare,
} from '../services/soundEffects';
import { SparkleIcon } from './ArcadeIcons';

interface UnoBoardViewProps {
  gameState: UnoGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay?: boolean;
  onCommitState: (next: UnoGameState) => void;
}

const COLOR_MAP: Record<UnoPlayableColor, { bg: string; border: string; label: string }> = {
  red: { bg: '#FF4B72', border: '#BE185D', label: 'Strawberry' },
  yellow: { bg: '#FFB703', border: '#D97706', label: 'Honey' },
  green: { bg: '#10B981', border: '#047857', label: 'Mint' },
  blue: { bg: '#38BDF8', border: '#0284C7', label: 'Sky' },
};

export function UnoBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay = false,
  onCommitState,
}: UnoBoardViewProps) {
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);

  const isMyTurn = passAndPlay || gameState.turn === mySlot;
  const isP1 = mySlot === 'p1';
  const myHand = isP1 ? gameState.p1Hand : gameState.p2Hand;
  const opponentHand = isP1 ? gameState.p2Hand : gameState.p1Hand;
  const myAvatar = isP1 ? p1Avatar : p2Avatar;
  const opponentAvatar = isP1 ? p2Avatar : p1Avatar;
  const myCalledUno = isP1 ? gameState.p1CalledUno : gameState.p2CalledUno;
  const opponentCalledUno = isP1 ? gameState.p2CalledUno : gameState.p1CalledUno;

  useEffect(() => {
    setPendingWildCardId(null);
  }, [gameState.turn]);

  // Watch for game state animations/toasts
  useEffect(() => {
    if (gameState.lastAction) {
      setToastMessage(gameState.lastAction.message);
      if (gameState.lastAction.eventKind === 'swap7') {
        playHandSwap();
      }
      const t = window.setTimeout(() => setToastMessage(null), 2200);
      return () => window.clearTimeout(t);
    }
  }, [gameState.lastAction?.id]);

  useEffect(() => {
    if (gameState.winner) {
      playVictoryFanfare();
    }
  }, [gameState.winner]);

  const handleCardClick = (card: UnoCard) => {
    if (!isMyTurn || gameState.winner) return;

    if (!canPlayCard(card, gameState)) {
      return;
    }

    if (card.color === 'wild') {
      setPendingWildCardId(card.id);
      return;
    }

    playCardPlay();
    setAnimatingCardId(card.id);
    window.setTimeout(() => {
      setAnimatingCardId(null);
      const next = applyPlayCard(gameState, card.id);
      onCommitState(next);
    }, 180);
  };

  const handleSelectWildColor = (color: UnoPlayableColor) => {
    if (!pendingWildCardId) return;
    playColorSelect();
    playCardPlay();
    const cardId = pendingWildCardId;
    setPendingWildCardId(null);
    setAnimatingCardId(cardId);
    window.setTimeout(() => {
      setAnimatingCardId(null);
      const next = applyPlayCard(gameState, cardId, color);
      onCommitState(next);
    }, 180);
  };

  const handleDrawCard = () => {
    if (!isMyTurn || gameState.winner) return;
    playCardDraw();
    const next = applyDrawCard(gameState);
    onCommitState(next);
  };

  const handlePassTurn = () => {
    if (!isMyTurn || gameState.winner || !gameState.justDrew) return;
    playCardDraw();
    const next = applyPassTurn(gameState);
    onCommitState(next);
  };

  const handleCallUno = () => {
    playUnoCall();
    const next = applyCallUno(gameState, mySlot);
    onCommitState(next);
  };

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
  const canPlayAny = hasAnyPlayableCard(myHand, gameState);

  return (
    <div className="dama-stage-container uno-stage-container">
      <div className="board-stage sticker-board-frame uno-table-stage">
        {/* Table Felt Background Pattern */}
        <div
          className="uno-table-felt"
          style={{
            borderColor: COLOR_MAP[gameState.activeColor]?.border || '#5B2A4E',
          }}
        >
          {/* Opponent Hand Banner (Top) */}
          <div className="uno-opponent-bar">
            <div className="uno-partner-badge">
              <span className="uno-partner-name">{opponentAvatar.name}</span>
              <span className="uno-card-count-pill">
                {opponentHand.length} cards
              </span>
              {(opponentCalledUno || opponentHand.length === 1) && (
                <span className="uno-danger-shout-pill anim-fade-scale">
                  UNO! 
                </span>
              )}
            </div>

            {/* Opponent Fan of Face-Down Cards */}
            <div className="uno-opponent-cards-fan">
              {opponentHand.slice(0, 12).map((c, i) => {
                const total = Math.min(12, opponentHand.length);
                const rot = (i - (total - 1) / 2) * 5;
                const tx = (i - (total - 1) / 2) * 11;
                return (
                  <div
                    key={c.id}
                    className="uno-card-back-mini"
                    style={{
                      transform: `translate3d(${tx}px, 0, 0) rotate(${rot}deg)`,
                      zIndex: i + 1,
                    }}
                  >
                    <span className="uno-mini-paw"></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Arena: Draw Pile + Discard Pile + Active Color Aura */}
          <div className="uno-center-arena">
            {/* Draw Pile */}
            <button
              type="button"
              className={`uno-draw-pile-btn sticker-press ${
                isMyTurn && !canPlayAny && !gameState.justDrew
                  ? 'pulse-need-draw'
                  : ''
              }`}
              onClick={handleDrawCard}
              disabled={!isMyTurn || gameState.winner !== null || (gameState.justDrew && gameState.stackCount === 0)}
              title="Tap to draw from deck"
            >
              <div className="uno-deck-shadow-lip" />
              <div className="uno-deck-top-card">
                <span className="uno-draw-label">DRAW</span>
                <span className="uno-deck-count-badge">
                  {gameState.deck.length}
                </span>
              </div>
            </button>

            {/* Discard Pile with Active Color Glow Ring */}
            <div
              className="uno-discard-pile-wrap"
              style={{
                boxShadow: `0 0 0 5px ${COLOR_MAP[gameState.activeColor]?.bg || '#FF4B72'}55`,
              }}
            >
              {topDiscard && (
                <UnoCardView card={topDiscard} isDiscardTop />
              )}
            </div>

            {/* Active Color & Stack Indicator */}
            <div className="uno-active-color-pill">
              <span
                className="uno-color-dot"
                style={{
                  backgroundColor: COLOR_MAP[gameState.activeColor]?.bg,
                }}
              />
              <span className="uno-color-name">
                {COLOR_MAP[gameState.activeColor]?.label}
              </span>
            </div>

            {/* Stacking Penalty Badge */}
            {gameState.stackCount > 0 && (
              <div className="uno-stack-toast anim-fade-scale">
                <span>+{gameState.stackCount} Penalty! Stack or Draw!</span>
              </div>
            )}

            {/* Center Action Event Toast */}
            {toastMessage && (
              <div className="uno-event-toast anim-fade-scale">
                <SparkleIcon size={14} />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>

          {/* Player Hand & Controls (Bottom) */}
          <div className="uno-player-section">
            <div className="uno-player-bar-header">
              <div className="uno-player-meta">
                <span className="uno-player-name">{myAvatar.name}</span>
                <span className="uno-card-count-pill">
                  {myHand.length} cards
                </span>
              </div>

              {/* UNO Shout Button & Pass Button */}
              <div className="uno-action-btns-row">
                {myHand.length <= 2 && !myCalledUno && !gameState.winner && (
                  <button
                    type="button"
                    className="uno-shout-btn sticker-press anim-fade-scale"
                    onClick={handleCallUno}
                  >
                    <span>UNO! </span>
                  </button>
                )}

                {gameState.justDrew && isMyTurn && !gameState.winner && (
                  <button
                    type="button"
                    className="uno-pass-btn sticker-press anim-fade-scale"
                    onClick={handlePassTurn}
                  >
                    <span>Pass Turn</span>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable / Spread Hand of Interactive Cards */}
            <div className="uno-player-cards-scroll">
              <div className="uno-player-cards-ribbon">
                {myHand.map((c, idx) => {
                  const playable = isMyTurn && canPlayCard(c, gameState);
                  const isAnimating = animatingCardId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`uno-card-hand-item sticker-press ${
                        playable ? 'is-playable' : 'is-dim'
                      } ${isAnimating ? 'is-flying' : ''}`}
                      onClick={() => handleCardClick(c)}
                      disabled={!playable}
                      style={{
                        zIndex: idx + 1,
                      }}
                    >
                      <UnoCardView card={c} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Color Wild Chooser Modal */}
        {pendingWildCardId && (
          <div className="uno-wild-modal-backdrop anim-fade-scale">
            <div className="uno-wild-modal-card">
              <h4 className="uno-wild-title">Choose Wild Color</h4>
              <div className="uno-wild-color-grid">
                {(['red', 'yellow', 'green', 'blue'] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="uno-wild-color-petal sticker-press"
                    style={{
                      backgroundColor: COLOR_MAP[color].bg,
                      borderColor: COLOR_MAP[color].border,
                    }}
                    onClick={() => handleSelectWildColor(color)}
                  >
                    <span>{COLOR_MAP[color].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Scalable Inline Vector UNO Card Component.
 * Supports numbers, Skip, Reverse, Draw Two, Wild, and Wild 4.
 */
function UnoCardView({
  card,
  isDiscardTop = false,
}: {
  card: UnoCard;
  isDiscardTop?: boolean;
}) {
  const isWild = card.color === 'wild';
  const cardBg = isWild ? '#2A1824' : COLOR_MAP[card.color as UnoPlayableColor]?.bg || '#FF4B72';
  const borderColor = isWild ? '#FFBE0B' : '#5B2A4E';

  const renderSymbol = () => {
    switch (card.value) {
      case 'skip':
        return (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#ffffff" strokeWidth="3" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="#ffffff" strokeWidth="3" />
          </svg>
        );
      case 'reverse':
        return (
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M 6 9 H 16 L 12 5 M 18 15 H 8 L 12 19"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'draw2':
        return <span className="uno-symbol-bold">+2</span>;
      case 'wild':
        return (
          <div className="uno-wild-center-flower">
            <span className="uno-wild-label">WILD</span>
            <div className="uno-wild-quad-ring">
              <span className="quad q-red" />
              <span className="quad q-yellow" />
              <span className="quad q-green" />
              <span className="quad q-blue" />
            </div>
          </div>
        );
      case 'wild4':
        return (
          <div className="uno-wild-center-flower">
            <span className="uno-symbol-bold">+4</span>
            <div className="uno-wild-quad-ring mini">
              <span className="quad q-red" />
              <span className="quad q-yellow" />
              <span className="quad q-green" />
              <span className="quad q-blue" />
            </div>
          </div>
        );
      case '7':
        return (
          <div className="uno-card-7-swap">
            <span className="uno-symbol-num">7</span>
            <span className="uno-swap-badge">SWAP </span>
          </div>
        );
      default:
        return <span className="uno-symbol-num">{card.value}</span>;
    }
  };

  const cornerLabel =
    card.value === 'draw2'
      ? '+2'
      : card.value === 'wild4'
      ? '+4'
      : card.value === 'skip'
      ? '⊘'
      : card.value === 'reverse'
      ? '⇄'
      : card.value === 'wild'
      ? 'W'
      : card.value;

  return (
    <div
      className={`uno-card-surface ${isDiscardTop ? 'discard-top' : ''}`}
      style={{
        backgroundColor: cardBg,
        borderColor,
      }}
    >
      {/* Top Left Corner Index */}
      <span className="uno-corner-index top-left">{cornerLabel}</span>

      {/* Inner Tilted Cream Oval */}
      <div className="uno-card-inner-oval">
        {renderSymbol()}
      </div>

      {/* Bottom Right Corner Index */}
      <span className="uno-corner-index bottom-right">{cornerLabel}</span>
    </div>
  );
}
