import { useEffect, useState } from 'preact/hooks';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import {
  applyRespondToClaim,
  applySubmitBluffClaim,
  BLUFF_CARD_META,
  BLUFF_CARD_ORDER,
  BluffCard,
  BluffCardKind,
  BluffGameState,
  canDefenderBlockWithShield,
} from '../engines/bluffEngine';
import {
  BluffCallSirenIcon,
  BluffCardArtSvg,
  CheckCircleIcon,
  FishTreatIcon,
  HeartIcon,
  PawIcon,
  SparkleIcon,
} from './ArcadeIcons';
import {
  playBluffCaught,
  playBluffTruth,
  playCardPlay,
  playTapPop,
  playVictoryFanfare,
} from '../services/soundEffects';

interface BluffBoardViewProps {
  gameState: BluffGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay?: boolean;
  onCommitState: (next: BluffGameState) => void;
}

const CARD_THEME: Record<
  BluffCardKind,
  { bg: string; border: string; pillBg: string; pillText: string }
> = {
  fish: {
    bg: '#E0F2FE',
    border: '#0284C7',
    pillBg: '#38BDF8',
    pillText: '#ffffff',
  },
  thief: {
    bg: '#F3E8FF',
    border: '#7E22CE',
    pillBg: '#A855F7',
    pillText: '#ffffff',
  },
  monarch: {
    bg: '#FEF3C7',
    border: '#D97706',
    pillBg: '#F59E0B',
    pillText: '#ffffff',
  },
  shield: {
    bg: '#DCFCE7',
    border: '#047857',
    pillBg: '#10B981',
    pillText: '#ffffff',
  },
};

export function BluffBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay = false,
  onCommitState,
}: BluffBoardViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const viewerSlot: PlayerSlot = passAndPlay ? gameState.turn : mySlot;
  const isMyTurn = passAndPlay || gameState.turn === mySlot;
  const isViewerP1 = viewerSlot === 'p1';

  const myHand = isViewerP1 ? gameState.p1Hand : gameState.p2Hand;
  const opponentHand = isViewerP1 ? gameState.p2Hand : gameState.p1Hand;
  const myTreats = isViewerP1 ? gameState.p1Treats : gameState.p2Treats;
  const opponentTreats = isViewerP1 ? gameState.p2Treats : gameState.p1Treats;
  const myHearts = isViewerP1 ? gameState.p1Hearts : gameState.p2Hearts;
  const opponentHearts = isViewerP1 ? gameState.p2Hearts : gameState.p1Hearts;

  const myAvatar = isViewerP1 ? p1Avatar : p2Avatar;
  const opponentAvatar = isViewerP1 ? p2Avatar : p1Avatar;

  const selectedCard: BluffCard | null =
    myHand.find((c) => c.id === selectedCardId) ?? null;

  useEffect(() => {
    setSelectedCardId(null);
  }, [gameState.turn, gameState.phase, gameState.turnCount]);

  useEffect(() => {
    if (!gameState.lastResolution) return;
    const outcome = gameState.lastResolution.outcome;
    if (outcome === 'bluff_caught') {
      playBluffCaught();
    } else if (outcome === 'truth_proven') {
      playBluffTruth();
    } else {
      playCardPlay();
    }
  }, [gameState.lastResolution?.id]);

  useEffect(() => {
    if (gameState.winner) {
      playVictoryFanfare();
    }
  }, [gameState.winner]);

  const handleSelectCardFromHand = (card: BluffCard) => {
    if (!isMyTurn || gameState.phase !== 'play' || gameState.winner) return;
    playTapPop();
    setSelectedCardId((prev) => (prev === card.id ? null : card.id));
  };

  const handleDeclareClaim = (claimedKind: BluffCardKind) => {
    if (
      !isMyTurn ||
      gameState.phase !== 'play' ||
      !selectedCard ||
      gameState.winner
    ) {
      return;
    }
    playCardPlay();
    const next = applySubmitBluffClaim(gameState, selectedCard.id, claimedKind);
    setSelectedCardId(null);
    onCommitState(next);
  };

  const handleRespondDecision = (
    decision: 'trust' | 'call_bluff' | 'block_shield'
  ) => {
    if (!isMyTurn || gameState.phase !== 'respond' || gameState.winner) return;
    playTapPop();
    const next = applyRespondToClaim(gameState, decision);
    onCommitState(next);
  };

  const pending = gameState.pendingClaim;
  const canBlockShield = canDefenderBlockWithShield(gameState);
  const lastRes = gameState.lastResolution;

  const actorName =
    pending?.actor === 'p1'
      ? p1Avatar.name
      : pending?.actor === 'p2'
      ? p2Avatar.name
      : '';
  const responderName =
    pending?.responder === 'p1'
      ? p1Avatar.name
      : pending?.responder === 'p2'
      ? p2Avatar.name
      : '';
  const activeTurnName =
    gameState.turn === 'p1' ? p1Avatar.name : p2Avatar.name;

  return (
    <div className="dama-stage-container bluff-stage-container">
      <div className="board-stage sticker-board-frame bluff-table-stage">
        <div className="bluff-table-felt">
          {/* Top Opponent Status Bar */}
          <div className="bluff-opponent-bar">
            <div className="bluff-player-stats-row">
              <span className="bluff-player-name">{opponentAvatar.name}</span>

              {/* Hearts Life Meter */}
              <div
                className="bluff-hearts-cluster"
                aria-label={`${opponentHearts} of ${gameState.maxHearts} hearts`}
              >
                {Array.from({ length: gameState.maxHearts }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`bluff-heart-slot ${
                      idx < opponentHearts ? 'alive' : 'lost'
                    }`}
                  >
                    <HeartIcon size={13} />
                  </span>
                ))}
              </div>

              {/* Treats Counter Pill */}
              <span className="bluff-treats-pill">
                <FishTreatIcon size={13} />
                <span>
                  {opponentTreats}/{gameState.targetTreats}
                </span>
              </span>
            </div>

            {/* Opponent Mini Face-Down Card Fan */}
            <div className="bluff-opponent-fan" aria-hidden="true">
              {opponentHand.map((c, i) => {
                const rot = (i - (opponentHand.length - 1) / 2) * 6;
                return (
                  <div
                    key={c.id}
                    className="bluff-mini-card-back"
                    style={{
                      transform: `rotate(${rot}deg)`,
                    }}
                  >
                    <PawIcon size={10} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center Velvet Bluff Arena */}
          <div className="bluff-center-arena">
            {gameState.phase === 'respond' && pending ? (
              /* RESPOND PHASE: Face-Down Claimed Card + Trust / Hiss Buttons */
              <div className="bluff-respond-stage anim-fade-scale">
                <div className="bluff-claim-banner">
                  <div className="bluff-mystery-card-token">
                    <BluffCardArtSvg kind="mystery" size={38} />
                    <span className="bluff-mystery-tag">SECRET</span>
                  </div>

                  <div className="bluff-claim-speech">
                    <span className="bluff-claim-kicker">
                      {actorName} declares:
                    </span>
                    <div className="bluff-claimed-role-row">
                      <BluffCardArtSvg kind={pending.claimedKind} size={28} />
                      <div className="bluff-claimed-role-text">
                        <strong>
                          {BLUFF_CARD_META[pending.claimedKind].title}
                        </strong>
                        <span>
                          {BLUFF_CARD_META[pending.claimedKind].badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isMyTurn ? (
                  <div className="bluff-decision-actions">
                    <button
                      type="button"
                      className="bluff-decision-btn trust-btn sticker-press"
                      onClick={() => handleRespondDecision('trust')}
                    >
                      <CheckCircleIcon size={17} />
                      <div className="bluff-btn-copy">
                        <strong>Trust Claim</strong>
                        <span>
                          Allow {BLUFF_CARD_META[pending.claimedKind].shortTitle}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="bluff-decision-btn call-btn sticker-press"
                      onClick={() => handleRespondDecision('call_bluff')}
                    >
                      <BluffCallSirenIcon size={18} />
                      <div className="bluff-btn-copy">
                        <strong>HISS! Call Bluff</strong>
                        <span>Flip &amp; Inspect</span>
                      </div>
                    </button>

                    {canBlockShield && (
                      <button
                        type="button"
                        className="bluff-decision-btn shield-btn sticker-press"
                        onClick={() => handleRespondDecision('block_shield')}
                      >
                        <BluffCardArtSvg kind="shield" size={20} />
                        <div className="bluff-btn-copy">
                          <strong>Guard with Yarn Shield</strong>
                          <span>Block Steal &amp; +1 Treat</span>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bluff-waiting-pill">
                    <SparkleIcon size={14} />
                    <span>
                      Waiting for <strong>{responderName}</strong> to Trust or
                      Call Bluff…
                    </span>
                  </div>
                )}
              </div>
            ) : isMyTurn && selectedCard ? (
              /* PLAY PHASE STEP 2: Choose What Role to Claim (Truth or Bluff!) */
              <div className="bluff-declare-picker anim-fade-scale">
                <div className="bluff-declare-header">
                  <span>
                    Playing{' '}
                    <strong>{BLUFF_CARD_META[selectedCard.kind].title}</strong>{' '}
                    face-down • Declare as:
                  </span>
                </div>
                <div className="bluff-declare-grid">
                  {BLUFF_CARD_ORDER.map((kind) => {
                    const isTruth = selectedCard.kind === kind;
                    const meta = BLUFF_CARD_META[kind];
                    return (
                      <button
                        key={kind}
                        type="button"
                        className={`bluff-declare-option sticker-press ${
                          isTruth ? 'is-truth' : 'is-bluff'
                        }`}
                        onClick={() => handleDeclareClaim(kind)}
                      >
                        <BluffCardArtSvg kind={kind} size={26} />
                        <div className="bluff-declare-meta">
                          <span className="bluff-declare-title">
                            {meta.shortTitle}
                          </span>
                          <span className="bluff-declare-sub">{meta.badge}</span>
                        </div>
                        <span
                          className={`bluff-honesty-tag ${
                            isTruth ? 'truth' : 'bluff'
                          }`}
                        >
                          {isTruth ? 'TRUTH' : 'BLUFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* PLAY PHASE STEP 1: Center Resolution History & Goal Prompt */
              <div className="bluff-idle-center">
                {lastRes ? (
                  <div
                    className={`bluff-resolution-card outcome-${lastRes.outcome} anim-fade-scale`}
                  >
                    <div className="bluff-res-icons">
                      <BluffCardArtSvg
                        kind={
                          lastRes.outcome === 'trusted'
                            ? lastRes.claimedKind
                            : lastRes.actualKind
                        }
                        size={36}
                      />
                    </div>
                    <div className="bluff-res-copy">
                      <span className="bluff-res-kicker">
                        {lastRes.outcome === 'bluff_caught'
                          ? 'BLUFF CAUGHT! (-1 HEART)'
                          : lastRes.outcome === 'truth_proven'
                          ? 'TRUTH PROVEN! (-1 CALLER HEART)'
                          : lastRes.outcome === 'shield_blocked'
                          ? 'SHIELD BLOCKED!'
                          : 'CLAIM RESOLVED'}
                      </span>
                      <p className="bluff-res-msg">{lastRes.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bluff-welcome-emblem">
                    <div className="bluff-emblem-icons">
                      <FishTreatIcon size={20} />
                      <SparkleIcon size={16} />
                      <HeartIcon size={18} />
                    </div>
                    <span className="bluff-goal-headline">
                      Reach {gameState.targetTreats} Treats or Knock Out Rival
                      Hearts!
                    </span>
                  </div>
                )}

                <div className="bluff-step-hint-pill">
                  <PawIcon size={13} />
                  <span>
                    {isMyTurn
                      ? 'Tap a card below to play face-down & declare!'
                      : `Waiting for ${activeTurnName} to play a card…`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Player Hand & Stats Section */}
          <div className="bluff-player-section">
            <div className="bluff-player-bar-header">
              <div className="bluff-player-stats-row">
                <span className="bluff-player-name">{myAvatar.name}</span>

                <div
                  className="bluff-hearts-cluster"
                  aria-label={`${myHearts} of ${gameState.maxHearts} hearts`}
                >
                  {Array.from({ length: gameState.maxHearts }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`bluff-heart-slot ${
                        idx < myHearts ? 'alive' : 'lost'
                      }`}
                    >
                      <HeartIcon size={14} />
                    </span>
                  ))}
                </div>

                <span className="bluff-treats-pill highlight">
                  <FishTreatIcon size={14} />
                  <span>
                    {myTreats}/{gameState.targetTreats} Treats
                  </span>
                </span>
              </div>
            </div>

            {/* 4-Card Interactive Hand Grid */}
            <div className="bluff-hand-row">
              {myHand.map((card) => {
                const isSelected = selectedCardId === card.id;
                const canSelect =
                  isMyTurn &&
                  gameState.phase === 'play' &&
                  gameState.winner === null;
                const meta = BLUFF_CARD_META[card.kind];
                const theme = CARD_THEME[card.kind];

                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`bluff-hand-card sticker-press ${
                      isSelected ? 'is-selected' : ''
                    } ${canSelect ? 'is-interactive' : 'is-disabled'}`}
                    style={{
                      backgroundColor: theme.bg,
                      borderColor: isSelected ? '#FF4D6D' : '#5B2A4E',
                    }}
                    onClick={() => handleSelectCardFromHand(card)}
                    disabled={!canSelect}
                  >
                    <span
                      className="bluff-card-top-pill"
                      style={{
                        backgroundColor: theme.pillBg,
                        color: theme.pillText,
                      }}
                    >
                      {meta.badge}
                    </span>

                    <div className="bluff-card-art-wrap">
                      <BluffCardArtSvg kind={card.kind} size={34} />
                    </div>

                    <span className="bluff-card-name">{meta.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
