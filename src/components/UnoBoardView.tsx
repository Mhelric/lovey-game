import { useEffect, useState, useRef } from 'preact/hooks';
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
  playTapPop,
  playTurnBannerPop,
  playUnoCall,
  playVictoryFanfare,
} from '../services/soundEffects';
import { PawIcon, SparkleIcon } from './ArcadeIcons';
import { CatAvatarSvg } from './CatAvatarSvg';

interface UnoBoardViewProps {
  gameState: UnoGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay?: boolean;
  onCommitState: (next: UnoGameState) => void;
}

// High-contrast vibrant colors to clearly distinguish Red vs Green
const COLOR_MAP: Record<UnoPlayableColor, { bg: string; border: string; label: string }> = {
  red: { bg: '#EF4444', border: '#B91C1C', label: 'Red' },
  yellow: { bg: '#F59E0B', border: '#B45309', label: 'Yellow' },
  green: { bg: '#10B981', border: '#047857', label: 'Green' },
  blue: { bg: '#0EA5E9', border: '#0284C7', label: 'Blue' },
};

// Sort hierarchy: Wilds first -> Colors (Red, Blue, Yellow, Green) -> Numbers (0-9) then Actions
const COLOR_ORDER: Record<string, number> = {
  wild: 0,
  red: 1,
  blue: 2,
  yellow: 3,
  green: 4,
};

const VALUE_ORDER: Record<string, number> = {
  wild4: 0,
  wild: 1,
  '0': 2,
  '1': 3,
  '2': 4,
  '3': 5,
  '4': 6,
  '5': 7,
  '6': 8,
  '7': 9,
  skip: 10,
  reverse: 11,
  draw2: 12,
};

function sortUnoCards(cards: UnoCard[]): UnoCard[] {
  return [...cards].sort((a, b) => {
    const colA = COLOR_ORDER[a.color] ?? 99;
    const colB = COLOR_ORDER[b.color] ?? 99;
    if (colA !== colB) return colA - colB;

    const valA = VALUE_ORDER[a.value] ?? 99;
    const valB = VALUE_ORDER[b.value] ?? 99;
    return valA - valB;
  });
}

interface FlyingDeal {
  id: string;
  target: 'player' | 'opponent';
}

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
  const [turnPopup, setTurnPopup] = useState<{
    id: string;
    slot: PlayerSlot;
    avatar: CatAvatarConfig;
  } | null>(null);

  // One-tap auto-sort feedback state
  const [justSorted, setJustSorted] = useState(false);

  // Flying deal animation state
  const [flyingDeals, setFlyingDeals] = useState<FlyingDeal[]>([]);

  const isMyTurn = passAndPlay || gameState.turn === mySlot;
  const isP1 = mySlot === 'p1';
  const rawMyHand = isP1 ? gameState.p1Hand : gameState.p2Hand;
  const opponentHand = isP1 ? gameState.p2Hand : gameState.p1Hand;
  const myAvatar = isP1 ? p1Avatar : p2Avatar;
  const opponentAvatar = isP1 ? p2Avatar : p1Avatar;
  const myCalledUno = isP1 ? gameState.p1CalledUno : gameState.p2CalledUno;
  const opponentCalledUno = isP1 ? gameState.p2CalledUno : gameState.p1CalledUno;

  // Track previous hand lengths to trigger deal swoosh animations on remote/opponent turns
  const prevMyHandCount = useRef(rawMyHand.length);
  const prevOppHandCount = useRef(opponentHand.length);

  const myHand = rawMyHand;

  useEffect(() => {
    setPendingWildCardId(null);
  }, [gameState.turn]);

  // Turn Indicator Popup Window ("[CAT AVATAR] Player Name's Turn!")
  useEffect(() => {
    if (gameState.winner || !gameState.lastAction) return;
    const avatar = gameState.turn === 'p1' ? p1Avatar : p2Avatar;
    const popId = `uno-turn-${gameState.turn}-${Date.now()}`;
    playTurnBannerPop();
    setTurnPopup({ id: popId, slot: gameState.turn, avatar });
    const t = window.setTimeout(() => {
      setTurnPopup((prev) => (prev?.id === popId ? null : prev));
    }, 1250);
    return () => window.clearTimeout(t);
  }, [gameState.turn]);

  // Detect card additions from remote player actions to trigger flying deal animation
  useEffect(() => {
    if (rawMyHand.length > prevMyHandCount.current) {
      const diff = rawMyHand.length - prevMyHandCount.current;
      triggerDealAnimation('player', diff);
    }
    prevMyHandCount.current = rawMyHand.length;
  }, [rawMyHand.length]);

  useEffect(() => {
    if (opponentHand.length > prevOppHandCount.current) {
      const diff = opponentHand.length - prevOppHandCount.current;
      triggerDealAnimation('opponent', diff);
    }
    prevOppHandCount.current = opponentHand.length;
  }, [opponentHand.length]);

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

  const triggerDealAnimation = (target: 'player' | 'opponent', count: number) => {
    const deals: FlyingDeal[] = [];
    const animCount = Math.min(4, Math.max(1, count));
    for (let i = 0; i < animCount; i++) {
      deals.push({
        id: `deal-${Date.now()}-${i}-${Math.random()}`,
        target,
      });
    }
    setFlyingDeals((prev) => [...prev, ...deals]);
    window.setTimeout(() => {
      setFlyingDeals((prev) => prev.filter((d) => !deals.some((x) => x.id === d.id)));
    }, 450);
  };

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
    const penaltyCount = gameState.stackCount > 0 ? gameState.stackCount : 1;
    triggerDealAnimation('player', penaltyCount);
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

  const handleSortHand = () => {
    playTapPop();
    const sorted = sortUnoCards(rawMyHand);
    const next: UnoGameState = {
      ...gameState,
      p1Hand: isP1 ? sorted : gameState.p1Hand,
      p2Hand: !isP1 ? sorted : gameState.p2Hand,
    };
    onCommitState(next);
    setJustSorted(true);
    window.setTimeout(() => setJustSorted(false), 800);
  };

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
  const canPlayAny = hasAnyPlayableCard(myHand, gameState);
  const isPenaltyActive = gameState.stackCount > 0;

  return (
    <div className="uno-stage-container">
      {/* 1. Opponent Bar Outside/Above Table Box: opponent name | remaining cards */}
      <div className="uno-top-opponent-bar">
        <div className="uno-partner-badge">
          <CatAvatarSvg
            breed={opponentAvatar.breed}
            accessory={opponentAvatar.accessory}
            size={22}
            animateIdle={false}
          />
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
      </div>

      {/* 2. Main Full-Height Table Stage Box */}
      <div className="board-stage sticker-board-frame uno-table-stage">
        {/* Flying Deal Animation Cards */}
        {flyingDeals.map((deal) => (
          <div
            key={deal.id}
            className={`uno-flying-deal-card ${
              deal.target === 'player' ? 'fly-to-player' : 'fly-to-opponent'
            }`}
          />
        ))}

        {/* A. Opponent Cards (Top inside the box) */}
        <div className="uno-stage-opponent-cards">
          {opponentHand.slice(0, 10).map((c, i) => {
            const total = Math.min(10, opponentHand.length);
            const rot = (i - (total - 1) / 2) * 4;
            const tx = (i - (total - 1) / 2) * 10;
            return (
              <div
                key={c.id}
                className="uno-card-back-mini"
                style={{
                  transform: `translate3d(${tx}px, 0, 0) rotate(${rot}deg)`,
                  zIndex: i + 1,
                }}
              >
                <PawIcon size={11} className="uno-mini-paw" />
              </div>
            );
          })}
        </div>

        {/* B. Center Arena: draw deck | pile cards */}
        <div className="uno-center-arena">
          {/* Stacking Attack/Penalty Banner with Direct Action Prompt (in normal layout flow above piles) */}
          {isPenaltyActive && (
            <div className="uno-stack-toast attack-active anim-fade-scale">
              <span>
                {isMyTurn
                  ? `Draw +${gameState.stackCount} Cards or Counter with +2 / +4!`
                  : `Waiting for ${opponentAvatar.name} to draw +${gameState.stackCount} or counter...`}
              </span>
            </div>
          )}

          <div className="uno-piles-row">
            {/* Draw Pile Button */}
            <button
              type="button"
              className={`uno-draw-pile-btn sticker-press ${
                isPenaltyActive && isMyTurn
                  ? 'pulse-danger-draw'
                  : isMyTurn && !canPlayAny && !gameState.justDrew
                  ? 'pulse-need-draw'
                  : ''
              }`}
              onClick={handleDrawCard}
              disabled={!isMyTurn || gameState.winner !== null || (gameState.justDrew && gameState.stackCount === 0)}
              title={
                isPenaltyActive && isMyTurn
                  ? `Take +${gameState.stackCount} Penalty Cards`
                  : 'Tap to draw from deck'
              }
            >
              <div className="uno-deck-shadow-lip" />
              <div className="uno-deck-top-card">
                <span className="uno-draw-label">DRAW</span>
                <span className="uno-deck-count-badge">
                  {gameState.deck.length}
                </span>
              </div>

              {/* Pulsing Red Attack Badge on Draw Pile button */}
              {isPenaltyActive && isMyTurn && (
                <span className="uno-deck-attack-badge">
                  Take +{gameState.stackCount}
                </span>
              )}
            </button>

            {/* Discard Pile with Active Color Glow Ring */}
            <div
              className="uno-discard-pile-wrap"
              style={{
                boxShadow: `0 0 0 5px ${COLOR_MAP[gameState.activeColor]?.bg || '#EF4444'}55`,
              }}
            >
              {topDiscard && (
                <UnoCardView card={topDiscard} isDiscardTop />
              )}
            </div>
          </div>

          {/* Active Color Name Indicator (Red, Blue, Yellow, Green) */}
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
        </div>

        {/* C. Player's Cards (Bottom inside the box) */}
        <div className="uno-stage-player-cards">
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

        {/* 4. Center Turn Indicator Popup: "[CAT AVATAR] Player Name's Turn!" */}
        {turnPopup && (
          <div className="turn-popup-overlay" aria-live="polite">
            <div key={turnPopup.id} className="turn-popup-card">
              <div className="turn-popup-avatar">
                <CatAvatarSvg
                  breed={turnPopup.avatar.breed}
                  accessory={turnPopup.avatar.accessory}
                  size={36}
                  animateIdle={false}
                />
              </div>
              <div className="turn-popup-meta">
                <span className="turn-popup-role">
                  {turnPopup.slot === mySlot ? 'Your Turn' : "Opponent's Turn"}
                </span>
                <span className="turn-popup-title">
                  {turnPopup.avatar.name}&apos;s Turn!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Action Event Modal Banner (Skip, Reverse, Swap, Stack Attacks) */}
        {toastMessage && (
          <div className="uno-modal-event-overlay" aria-live="polite">
            <div className="uno-modal-event-card">
              <SparkleIcon size={16} />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* 6. Tactile 4-Color Wild Chooser Modal */}
        {pendingWildCardId && (
          <div className="uno-wild-modal-backdrop anim-fade-scale">
            <div className="uno-wild-modal-card">
              <div className="uno-wild-modal-header">
                <SparkleIcon size={18} />
                <h4 className="uno-wild-title">Pick a Wild Color!</h4>
              </div>
              <p className="uno-wild-subtitle">Choose the color for the next player</p>
              <div className="uno-wild-color-grid">
                {(['red', 'blue', 'yellow', 'green'] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`uno-wild-color-card card-${color} sticker-press`}
                    onClick={() => handleSelectWildColor(color)}
                  >
                    <PawIcon size={20} />
                    <span className="uno-wild-color-label">{COLOR_MAP[color].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Player Bar Outside/Below Table Box: player name | remaining cards | sort btn | pass */}
      <div className="uno-bottom-player-bar">
        <div className="uno-bottom-player-meta">
          <CatAvatarSvg
            breed={myAvatar.breed}
            accessory={myAvatar.accessory}
            size={22}
            animateIdle={false}
          />
          <span className="uno-player-name">{myAvatar.name}</span>
          <span className="uno-card-count-pill">
            {rawMyHand.length} cards
          </span>
        </div>

        <div className="uno-bottom-player-actions">
          {/* Auto-Organizer Card Sorter Button */}
          <button
            type="button"
            className="uno-sort-btn sticker-press"
            onClick={handleSortHand}
            title="Sort cards: Wilds first, then Colors and Numbers"
          >
            <span>{justSorted ? 'Sorted!' : 'Sort'}</span>
          </button>

          {/* Pass Turn Button */}
          {gameState.justDrew && isMyTurn && !gameState.winner && (
            <button
              type="button"
              className="uno-pass-btn sticker-press anim-fade-scale"
              onClick={handlePassTurn}
            >
              <span>Pass</span>
            </button>
          )}

          {/* UNO Shout Button */}
          {rawMyHand.length <= 2 && !myCalledUno && !gameState.winner && (
            <button
              type="button"
              className="uno-shout-btn sticker-press anim-fade-scale"
              onClick={handleCallUno}
            >
              <span>UNO!</span>
            </button>
          )}
        </div>
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
  const cardBg = isWild ? '#2A1824' : COLOR_MAP[card.color as UnoPlayableColor]?.bg || '#EF4444';
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
              <span className="quad q-blue" />
              <span className="quad q-yellow" />
              <span className="quad q-green" />
            </div>
          </div>
        );
      case 'wild4':
        return (
          <div className="uno-wild-center-flower">
            <span className="uno-symbol-bold">+4</span>
            <div className="uno-wild-quad-ring mini">
              <span className="quad q-red" />
              <span className="quad q-blue" />
              <span className="quad q-yellow" />
              <span className="quad q-green" />
            </div>
          </div>
        );
      case '7':
        return (
          <div className="uno-card-7-swap">
            <span className="uno-symbol-num">7</span>
            <span className="uno-swap-badge">SWAP</span>
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
