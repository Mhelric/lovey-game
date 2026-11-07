import { useEffect, useState } from 'preact/hooks';
import { GameMode } from '../types/arcade';
import {
  CloseIcon,
  CrownIcon,
  PawIcon,
  SnakeLadderIcon,
  SparkleIcon,
  TutorialBookIcon,
} from './ArcadeIcons';

interface DamaTutorialModalProps {
  isOpen: boolean;
  gameMode: GameMode;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  badge: string;
  description: string;
  tip: string;
}

const DAMA_STEPS: readonly TutorialStep[] = [
  {
    badge: 'Cat Dama • Step 1 of 4',
    title: 'Move Diagonally Forward',
    description:
      'Each normal cat pawn (Tao) steps 1 tile diagonally forward onto an empty pink square.',
    tip: 'Tap your cat to show yellow destination tiles & green paw hints, then tap a hint to move!',
  },
  {
    badge: 'Cat Dama • Step 2 of 4',
    title: 'Jump Forward & Backward',
    description:
      'In Filipino Dama, normal cats leap over an adjacent rival cat BOTH forward and backward into an empty square behind it.',
    tip: 'Red paw hints show capture jumps. Chain jumps continue pouncing in a combo!',
  },
  {
    badge: 'Cat Dama • Step 3 of 4',
    title: 'Mandatory Max Capture (Mayor)',
    description:
      'Captures are mandatory! If multiple jumps exist, you MUST choose the route that captures the most rival cats.',
    tip: 'A dashed red pulsing ring highlights cats required to jump by the Mayor rule.',
  },
  {
    badge: 'Cat Dama • Step 4 of 4',
    title: 'Flying Dama King Promotion',
    description:
      'Reach the opponent’s back row at the end of a turn to crown your cat into a Royal Flying Dama King!',
    tip: 'Flying Dama Kings can slide and jump across ANY number of empty diagonal squares.',
  },
];

const SNAKES_STEPS: readonly TutorialStep[] = [
  {
    badge: 'Snakes & Ladders • Step 1 of 2',
    title: '100 or 150 Tile Race',
    description:
      'Tap the centered Dice button below the board to hop your cat along the 100-tile or 150-tile path (no bonus roll on 6).',
    tip: 'Landing at the bottom of a ladder climbs up; landing on a snake head slides down!',
  },
  {
    badge: 'Snakes & Ladders • Step 2 of 2',
    title: 'Random Mystery Powerups',
    description:
      'Purple star tiles grant random powerups: Twin Paw 2x Dice (for 2 turns!), Catnip Zoomies, Bubble Shield, Lucky Paw, or Switcheroo!',
    tip: 'Overshooting the final tile bounces your cat backward. Land on the crown tile to win!',
  },
];

const UNO_STEPS: readonly TutorialStep[] = [
  {
    badge: 'Cat Uno • Step 1 of 3',
    title: 'Match Color, Number or Wild',
    description:
      'Match the top card of the discard pile by color or number. Play Wild or Wild 4 anytime to change the active color!',
    tip: 'If you have no matching card, tap the Draw deck to pull a card.',
  },
  {
    badge: 'Cat Uno • Step 2 of 3',
    title: '2-Player Combos (Skip & Reverse)',
    description:
      'In 2-player UNO, Skip skips your partner so you play again immediately! Reverse acts like a U-Turn bouncing straight back to you!',
    tip: 'Chain Skips and Reverses together to play multiple cards in a single burst!',
  },
  {
    badge: 'Cat Uno • Step 3 of 3',
    title: 'Stacking & 7-Hand Swap!',
    description:
      'Stack +2 on +2 and +4 on +4 to pass higher penalties back to your partner! Play any 7 to swap your entire hand with your opponent!',
    tip: 'When you are down to 1 card, hit the UNO! button before playing to win!',
  },
];

const BLUFF_STEPS: readonly TutorialStep[] = [
  {
    badge: 'Kitty Bluff • Step 1 of 3',
    title: 'Play Face-Down & Declare',
    description:
      'Tap any card in your hand to place it face-down, then declare what role you claim it is: Fresh Tuna (+2), Bandit Paws (Steal 2), Cat Monarch (+3), or Yarn Shield (+1 & Heal).',
    tip: 'You can tell the truth OR bluff any role you want!',
  },
  {
    badge: 'Kitty Bluff • Step 2 of 3',
    title: 'Trust or HISS! Call Bluff',
    description:
      'Your partner chooses to Trust your claim (allowing its declared effect) or Call Bluff to flip your face-down card!',
    tip: 'If you hold a Yarn Shield, you can also guard against a Bandit Paws steal!',
  },
  {
    badge: 'Kitty Bluff • Step 3 of 3',
    title: '10 Fish Treats or Knockout',
    description:
      'Catching a lie costs the bluffer 1 Heart and gives the caller +1 Treat. Calling a true claim costs the caller 1 Heart!',
    tip: 'First cat to reach 10 Fish Treats or reduce their rival to 0 Hearts wins!',
  },
];

function TutorialIllustrationSvg({
  gameMode,
  stepIndex,
}: {
  gameMode: GameMode;
  stepIndex: number;
}) {
  return (
    <svg
      viewBox="0 0 180 96"
      width="100%"
      height="98"
      aria-hidden="true"
      className="tutorial-board-svg"
    >
      <rect
        x="4"
        y="4"
        width="172"
        height="88"
        rx="16"
        fill="#fffaf5"
        stroke="#fbcfe8"
        strokeWidth="2"
      />
      {/* Cutesy Minimal Checkerboard Background Tiles */}
      {[
        [20, 16],
        [76, 34],
        [132, 16],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="28"
          height="28"
          rx="6"
          fill="#fbcfe8"
          opacity="0.55"
        />
      ))}

      {gameMode === 'bluff' ? (
        <>
          <rect
            x="44"
            y="22"
            width="38"
            height="50"
            rx="8"
            fill="#f3e8ff"
            stroke="#5b2a4e"
            strokeWidth="2"
            transform="rotate(-6 63 47)"
          />
          <circle cx="63" cy="46" r="11" fill="#ffb74d" stroke="#5b2a4e" strokeWidth="1.5" />
          <path d="M54 45 Q63 41 72 45 Q69 50 63 48 Q57 50 54 45 Z" fill="#5b2a4e" />
          <rect
            x="92"
            y="26"
            width="66"
            height="42"
            rx="10"
            fill="#fff0f3"
            stroke="#ff6b8b"
            strokeWidth="1.8"
          />
          <text
            x="125"
            y="43"
            textAnchor="middle"
            fill="#be185d"
            fontSize="8.2"
            fontWeight="900"
          >
            TRUTH OR BLUFF
          </text>
          <text
            x="125"
            y="56"
            textAnchor="middle"
            fill="#432818"
            fontSize="7.4"
            fontWeight="700"
          >
            10 Treats to Win
          </text>
        </>
      ) : gameMode === 'uno' ? (
        <>
          <rect
            x="52"
            y="24"
            width="34"
            height="48"
            rx="6"
            fill="#38bdf8"
            stroke="#5b2a4e"
            strokeWidth="2"
            transform="rotate(-8 69 48)"
          />
          <rect
            x="94"
            y="24"
            width="34"
            height="48"
            rx="6"
            fill="#ff4b72"
            stroke="#5b2a4e"
            strokeWidth="2"
            transform="rotate(8 111 48)"
          />
          <text
            x="69"
            y="54"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="18"
            fontWeight="900"
            transform="rotate(-8 69 48)"
          >
            7
          </text>
          <text
            x="111"
            y="54"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="18"
            fontWeight="900"
            transform="rotate(8 111 48)"
          >
            +2
          </text>
        </>
      ) : gameMode === 'snakes' ? (
        <>
          <circle cx="48" cy="52" r="16" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.5" />
          <MiniCatFace cx={48} cy={52} fur="#ff9ebb" />
          <path
            d="M 68 46 Q 94 16 120 38"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.8"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          <rect
            x="116"
            y="32"
            width="32"
            height="32"
            rx="8"
            fill="#fef08a"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text x="132" y="52" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="900">
            100
          </text>
        </>
      ) : stepIndex === 0 ? (
        <>
          <circle cx="54" cy="64" r="16" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.5" />
          <MiniCatFace cx={54} cy={64} fur="#ff9ebb" />
          <path
            d="M 70 52 Q 88 32 108 34"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <polygon points="113,34 105,29 106,39" fill="#10b981" />
          <circle
            cx="124"
            cy="30"
            r="13"
            fill="rgba(16, 185, 129, 0.22)"
            stroke="#10b981"
            strokeWidth="1.8"
          />
          <circle cx="124" cy="30" r="4.5" fill="#10b981" />
        </>
      ) : stepIndex === 1 ? (
        <>
          <circle cx="44" cy="68" r="14" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.5" />
          <MiniCatFace cx={44} cy={68} fur="#ff9ebb" />
          <circle cx="90" cy="48" r="14" fill="#fffbeb" stroke="#fb923c" strokeWidth="1.5" />
          <MiniCatFace cx={90} cy={48} fur="#ffb74d" />
          <path
            d="M 55 56 Q 86 12 126 24"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.6"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          <circle
            cx="136"
            cy="26"
            r="13"
            fill="rgba(244, 63, 94, 0.2)"
            stroke="#f43f5e"
            strokeWidth="1.8"
          />
          <circle cx="136" cy="26" r="4.5" fill="#f43f5e" />
        </>
      ) : stepIndex === 2 ? (
        <>
          <circle
            cx="42"
            cy="48"
            r="19"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="42" cy="48" r="14" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.5" />
          <MiniCatFace cx={42} cy={48} fur="#ff9ebb" />
          <rect
            x="66"
            y="26"
            width="102"
            height="44"
            rx="12"
            fill="#fff0f3"
            stroke="#ff6b8b"
            strokeWidth="1.5"
          />
          <text
            x="117"
            y="43"
            textAnchor="middle"
            fill="#be185d"
            fontSize="7.4"
            fontWeight="800"
            letterSpacing="0.3"
            style={{ fontSize: '7.4px', fontWeight: 800 }}
          >
            MAYOR RULE
          </text>
          <text
            x="117"
            y="56"
            textAnchor="middle"
            fill="#432818"
            fontSize="6.6"
            fontWeight="700"
            style={{ fontSize: '6.6px', fontWeight: 700 }}
          >
            Max Capture First
          </text>
        </>
      ) : (
        <>
          <circle cx="90" cy="52" r="18" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.8" />
          <MiniCatFace cx={90} cy={52} fur="#ff9ebb" />
          <path
            d="M 81 35 L 79 25 L 86 30 L 90 23 L 94 30 L 101 25 L 99 35 Z"
            fill="#ffbe0b"
            stroke="#b45309"
            strokeWidth="1"
          />
        </>
      )}
    </svg>
  );
}

function MiniCatFace({
  cx,
  cy,
  fur,
}: {
  cx: number;
  cy: number;
  fur: string;
}) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <path
        d="M -9 -3 C -11 -10, -8 -13, -4 -9 C -1 -10, 1 -10, 4 -9 C 8 -13, 11 -10, 9 -3 C 12 2, 10 9, 5 10 C 2 10.5, -2 10.5, -5 10 C -10 9, -12 2, -9 -3 Z"
        fill={fur}
      />
      <ellipse cx="0" cy="3.5" rx="7" ry="5" fill="#fff8f0" />
      <circle cx="-3.8" cy="0.5" r="1.6" fill="#432818" />
      <circle cx="3.8" cy="0.5" r="1.6" fill="#432818" />
      <ellipse cx="-6" cy="2.8" rx="1.9" ry="1" fill="#ff758f" opacity="0.75" />
      <ellipse cx="6" cy="2.8" rx="1.9" ry="1" fill="#ff758f" opacity="0.75" />
      <path
        d="M -2.1 3.1 Q 0 4.9 2.1 3.1"
        fill="none"
        stroke="#432818"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </g>
  );
}

export function DamaTutorialModal({
  isOpen,
  gameMode,
  onClose,
}: DamaTutorialModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen, gameMode]);

  if (!isOpen) return null;

  const steps =
    gameMode === 'snakes'
      ? SNAKES_STEPS
      : gameMode === 'uno'
      ? UNO_STEPS
      : gameMode === 'bluff'
      ? BLUFF_STEPS
      : DAMA_STEPS;
  const current = steps[step] || steps[0];

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="How to Play Tutorial"
    >
      <div className="modal-card tutorial-modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2
              className="modal-title"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TutorialBookIcon size={18} />
              <span>
                {gameMode === 'snakes'
                  ? 'Snakes & Ladders'
                  : gameMode === 'uno'
                  ? 'Cat Uno'
                  : gameMode === 'bluff'
                  ? 'Kitty Bluff'
                  : 'Cat Dama'}
              </span>
            </h2>
            <p className="modal-subtitle">{current.badge}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close tutorial"
          >
            <CloseIcon size={15} />
          </button>
        </div>

        <div className="tutorial-stage-box">
          <TutorialIllustrationSvg gameMode={gameMode} stepIndex={step} />
          <h3 className="tutorial-step-title">{current.title}</h3>
          <p className="tutorial-step-desc">{current.description}</p>
          <div className="tutorial-tip-pill">
            <SparkleIcon size={14} />
            <span>{current.tip}</span>
          </div>
        </div>

        <div className="tutorial-dots">
          {steps.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`tutorial-dot ${idx === step ? 'active' : ''}`}
              onClick={() => setStep(idx)}
              aria-label={`Go to tutorial step ${idx + 1}`}
            />
          ))}
        </div>

        <div className="modal-row-two">
          <button
            type="button"
            className="slot-btn"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{ opacity: step === 0 ? 0.45 : 1 }}
          >
            Previous
          </button>

          {step < steps.length - 1 ? (
            <button
              type="button"
              className="save-lobby-btn"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            >
              <span>Next</span>
              <PawIcon size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="save-lobby-btn"
              onClick={onClose}
            >
              <span>Let&apos;s Play!</span>
              {gameMode === 'snakes' ? (
                <SnakeLadderIcon size={16} />
              ) : (
                <CrownIcon size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
