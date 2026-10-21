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
    tip: 'Tap any of your cats to highlight its green destination tiles, then tap a green dot to move!',
  },
  {
    badge: 'Cat Dama • Step 2 of 4',
    title: 'Jump Forward & Backward',
    description:
      'In Filipino Dama, normal cats can leap over an adjacent rival cat BOTH forward and backward onto an empty square right behind it.',
    tip: 'If another jump is available after landing, your cat continues pouncing in a multi-jump combo!',
  },
  {
    badge: 'Cat Dama • Step 3 of 4',
    title: 'Mandatory Max Capture (Mayor)',
    description:
      'Captures are mandatory. If more than one capture path exists, you must take the path that captures the MOST rival cats.',
    tip: 'A red pulsing ring automatically highlights which cat must jump!',
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
    title: 'Roll the Cat Paw Dice',
    description:
      'Take turns tapping the centered Dice button at the top to hop your cat along the 100-tile path.',
    tip: 'Landing at the bottom of a ladder climbs up; landing on a snake head slides down!',
  },
  {
    badge: 'Snakes & Ladders • Step 2 of 2',
    title: 'Exact Roll to Tile 100',
    description:
      'Mystery Twist tiles grant Fish Boosts, Yarn Shields, or Cat Swaps. Reach Tile 100 first to win!',
    tip: 'If your roll overshoots 100, your cat bounces backward from 100.',
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
      <rect x="20" y="16" width="28" height="28" rx="6" fill="#fbcfe8" opacity="0.55" />
      <rect x="76" y="34" width="28" height="28" rx="6" fill="#fbcfe8" opacity="0.55" />
      <rect x="132" y="16" width="28" height="28" rx="6" fill="#fbcfe8" opacity="0.55" />

      {gameMode === 'snakes' ? (
        <>
          <circle cx="52" cy="54" r="16" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.5" />
          <MiniCatFace cx={52} cy={54} fur="#ff9ebb" />
          <path
            d="M 74 48 Q 100 22 124 44"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.8"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          <rect
            x="122"
            y="34"
            width="30"
            height="30"
            rx="8"
            fill="#fef08a"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text x="137" y="54" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="900">
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
            cx="54"
            cy="52"
            r="20"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle cx="54" cy="52" r="14" fill="#fff0f3" stroke="#ff6b8b" strokeWidth="1.5" />
          <MiniCatFace cx={54} cy={52} fur="#ff9ebb" />
          <rect
            x="86"
            y="29"
            width="76"
            height="38"
            rx="10"
            fill="#fff0f3"
            stroke="#ff6b8b"
            strokeWidth="1.5"
          />
          <text x="124" y="45" textAnchor="middle" fill="#be185d" fontSize="9.5" fontWeight="900">
            MAYOR RULE
          </text>
          <text x="124" y="58" textAnchor="middle" fill="#432818" fontSize="8.5" fontWeight="700">
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

  const steps = gameMode === 'snakes' ? SNAKES_STEPS : DAMA_STEPS;
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
                  ? 'How to Play Snakes & Ladders'
                  : 'How to Play Cat Dama'}
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
