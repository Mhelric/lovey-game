import { useEffect, useState } from 'preact/hooks';
import { playTapPop } from '../services/soundEffects';

interface StackCat {
  id: number;
  x: number;
  y: number;
  scale: number;
  rot: number;
  breed: 'tabby' | 'void' | 'strawberry' | 'tuxedo' | 'calico' | 'cloud' | 'fold' | 'siamese';
  delay: number;
  expression: 'happy' | 'cute' | 'wink' | 'love';
  hasCrown?: boolean;
  hasBow?: boolean;
}

const CAT_COLORS: Record<string, { body: string; belly: string; ear: string; eye: string }> = {
  tabby: { body: '#FFB87A', belly: '#FFF2DF', ear: '#FF8BA7', eye: '#5B2A4E' },
  void: { body: '#3D3554', belly: '#524970', ear: '#FF7AA5', eye: '#FFBE0B' },
  strawberry: { body: '#FFB5CC', belly: '#FFF0F5', ear: '#FF6B9A', eye: '#5B2A4E' },
  tuxedo: { body: '#2E2A3B', belly: '#FFF5F8', ear: '#FF8BA7', eye: '#5B2A4E' },
  calico: { body: '#FFF5E6', belly: '#FF9E79', ear: '#FF8BA7', eye: '#5B2A4E' },
  cloud: { body: '#FFFFFF', belly: '#E8F1F5', ear: '#FFB5CC', eye: '#5B2A4E' },
  fold: { body: '#A3B8C8', belly: '#E8EFF5', ear: '#FF9EBA', eye: '#5B2A4E' },
  siamese: { body: '#F5E6D3', belly: '#6B4F3B', ear: '#FF8BA7', eye: '#5B2A4E' },
};

const STACK_CATS: StackCat[] = [
  // Row 0 - Ground Base (y = 590)
  { id: 1, x: 48, y: 590, scale: 1.05, rot: -3, breed: 'tabby', delay: 0.05, expression: 'happy' },
  { id: 2, x: 136, y: 590, scale: 1.0, rot: 2, breed: 'void', delay: 0.08, expression: 'cute' },
  { id: 3, x: 224, y: 590, scale: 1.05, rot: -2, breed: 'strawberry', delay: 0.11, expression: 'happy' },
  { id: 4, x: 312, y: 590, scale: 1.0, rot: 3, breed: 'tuxedo', delay: 0.14, expression: 'wink' },

  // Row 1 (y = 485)
  { id: 5, x: 35, y: 485, scale: 0.98, rot: -4, breed: 'calico', delay: 0.22, expression: 'cute' },
  { id: 6, x: 120, y: 485, scale: 1.02, rot: 3, breed: 'fold', delay: 0.25, expression: 'happy' },
  { id: 7, x: 205, y: 485, scale: 0.98, rot: -2, breed: 'cloud', delay: 0.28, expression: 'cute' },
  { id: 8, x: 290, y: 485, scale: 1.02, rot: 4, breed: 'siamese', delay: 0.31, expression: 'wink' },
  { id: 9, x: 350, y: 485, scale: 0.92, rot: -3, breed: 'tabby', delay: 0.34, expression: 'happy' },

  // Row 2 (y = 380)
  { id: 10, x: 55, y: 380, scale: 1.0, rot: 3, breed: 'void', delay: 0.40, expression: 'love' },
  { id: 11, x: 140, y: 380, scale: 1.05, rot: -3, breed: 'strawberry', delay: 0.43, expression: 'happy' },
  { id: 12, x: 225, y: 380, scale: 1.0, rot: 2, breed: 'tuxedo', delay: 0.46, expression: 'cute' },
  { id: 13, x: 310, y: 380, scale: 0.98, rot: -4, breed: 'calico', delay: 0.49, expression: 'wink' },

  // Row 3 (y = 275)
  { id: 14, x: 40, y: 275, scale: 0.98, rot: -2, breed: 'cloud', delay: 0.58, expression: 'happy' },
  { id: 15, x: 125, y: 275, scale: 1.02, rot: 3, breed: 'siamese', delay: 0.61, expression: 'cute' },
  { id: 16, x: 210, y: 275, scale: 1.0, rot: -3, breed: 'fold', delay: 0.64, expression: 'love' },
  { id: 17, x: 295, y: 275, scale: 1.02, rot: 2, breed: 'tabby', delay: 0.67, expression: 'happy' },

  // Row 4 (y = 175)
  { id: 18, x: 75, y: 175, scale: 1.0, rot: 3, breed: 'strawberry', delay: 0.76, expression: 'cute' },
  { id: 19, x: 160, y: 175, scale: 1.05, rot: -2, breed: 'void', delay: 0.79, expression: 'wink' },
  { id: 20, x: 245, y: 175, scale: 1.0, rot: 4, breed: 'calico', delay: 0.82, expression: 'happy' },

  // Row 5 - Top Couple Crown Peak (y = 80)
  { id: 21, x: 135, y: 80, scale: 1.1, rot: -4, breed: 'tabby', delay: 0.95, expression: 'love', hasCrown: true },
  { id: 22, x: 215, y: 80, scale: 1.1, rot: 4, breed: 'void', delay: 0.98, expression: 'love', hasBow: true },
];

interface IntroStackAnimationProps {
  onComplete: () => void;
}

export function IntroStackAnimation({ onComplete }: IntroStackAnimationProps) {
  const [fading, setFading] = useState(false);

  const handleSkip = () => {
    if (fading) return;
    playTapPop();
    setFading(true);
    window.setTimeout(() => {
      onComplete();
    }, 280);
  };

  useEffect(() => {
    // Sound effect on peak landing
    const soundTimer = window.setTimeout(() => {
      playTapPop();
    }, 980);

    // Auto-advance after screen is completely stacked
    const finishTimer = window.setTimeout(() => {
      setFading(true);
      window.setTimeout(() => {
        onComplete();
      }, 350);
    }, 2050);

    return () => {
      window.clearTimeout(soundTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`intro-stack-overlay ${fading ? 'fading-out' : ''}`}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label="Skip intro animation"
    >
      <svg
        viewBox="0 0 360 640"
        className="intro-stack-svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Soft Background Sparkles */}
        <g opacity="0.35">
          <circle cx="50" cy="80" r="3" fill="#FF8BA7" />
          <circle cx="310" cy="120" r="2.5" fill="#FFBE0B" />
          <circle cx="40" cy="220" r="2.5" fill="#FF8BA7" />
          <circle cx="320" cy="330" r="3" fill="#FFBE0B" />
        </g>

        {/* Stacking Cats from Bottom to Top */}
        {STACK_CATS.map((cat) => {
          const colors = CAT_COLORS[cat.breed];
          return (
            <g
              key={cat.id}
              className="intro-cat-node"
              style={{
                transform: `translate3d(${cat.x}px, ${cat.y}px, 0) scale(${cat.scale}) rotate(${cat.rot}deg)`,
                animationDelay: `${cat.delay}s`,
              }}
            >
              {/* Ears */}
              <polygon
                points="-26,-12 -33,-30 -14,-22"
                fill={colors.body}
                stroke="#5B2A4E"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <polygon points="-24,-14 -29,-25 -17,-19" fill={colors.ear} />

              <polygon
                points="26,-12 33,-30 14,-22"
                fill={colors.body}
                stroke="#5B2A4E"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <polygon points="24,-14 29,-25 17,-19" fill={colors.ear} />

              {/* Chubby Mochi Body */}
              <ellipse
                cx="0"
                cy="0"
                rx="34"
                ry="26"
                fill={colors.body}
                stroke="#5B2A4E"
                strokeWidth="2.4"
              />

              {/* Belly Cushion */}
              <ellipse cx="0" cy="6" rx="19" ry="14" fill={colors.belly} />

              {/* Blushing Cheeks */}
              <circle cx="-19" cy="4" r="4.5" fill="#FF8BA7" opacity="0.55" />
              <circle cx="19" cy="4" r="4.5" fill="#FF8BA7" opacity="0.55" />

              {/* Eyes Expression */}
              {cat.expression === 'happy' ? (
                <>
                  <path
                    d="M-15,-2 Q-11,-7 -7,-2"
                    fill="none"
                    stroke="#5B2A4E"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7,-2 Q11,-7 15,-2"
                    fill="none"
                    stroke="#5B2A4E"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </>
              ) : cat.expression === 'wink' ? (
                <>
                  <ellipse cx="-11" cy="-3" rx="3.5" ry="4.5" fill={colors.eye} />
                  <circle cx="-12" cy="-4.5" r="1.3" fill="#FFF" />
                  <path
                    d="M7,-2 Q11,-6 15,-2"
                    fill="none"
                    stroke="#5B2A4E"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <ellipse cx="-11" cy="-3" rx="3.5" ry="4.5" fill={colors.eye} />
                  <circle cx="-12.2" cy="-4.5" r="1.4" fill="#FFF" />
                  <circle cx="-9.8" cy="-1.5" r="0.7" fill="#FFF" />
                  <ellipse cx="11" cy="-3" rx="3.5" ry="4.5" fill={colors.eye} />
                  <circle cx="9.8" cy="-4.5" r="1.4" fill="#FFF" />
                  <circle cx="12.2" cy="-1.5" r="0.7" fill="#FFF" />
                </>
              )}

              {/* Nose & Cute Cat Mouth */}
              <polygon points="0,0.5 -1.8,-1.2 1.8,-1.2" fill="#FF8BA7" />
              <path
                d="M-3.8,2 Q-1.8,4.5 0,2.5 Q1.8,4.5 3.8,2"
                fill="none"
                stroke="#5B2A4E"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Little Resting Paws */}
              <ellipse
                cx="-13"
                cy="22"
                rx="4.5"
                ry="3"
                fill={colors.belly}
                stroke="#5B2A4E"
                strokeWidth="1.8"
              />
              <ellipse
                cx="13"
                cy="22"
                rx="4.5"
                ry="3"
                fill={colors.belly}
                stroke="#5B2A4E"
                strokeWidth="1.8"
              />

              {/* Crown Accessory for King Ginger Cat */}
              {cat.hasCrown && (
                <polygon
                  points="-9,-28 -5,-23 0,-31 5,-23 9,-28 7,-20 -7,-20"
                  fill="#FFBE0B"
                  stroke="#5B2A4E"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              )}

              {/* Ribbon Bow Accessory for Queen Void Cat */}
              {cat.hasBow && (
                <g transform="translate(8, -24)">
                  <polygon points="0,0 7,-4 7,4" fill="#FF4D80" stroke="#5B2A4E" strokeWidth="1.4" />
                  <polygon points="0,0 -7,-4 -7,4" fill="#FF4D80" stroke="#5B2A4E" strokeWidth="1.4" />
                  <circle cx="0" cy="0" r="2.2" fill="#FFBE0B" stroke="#5B2A4E" strokeWidth="1.2" />
                </g>
              )}
            </g>
          );
        })}

        {/* Floating Heart at Peak */}
        <g className="intro-heart-node" transform="translate(175, 42)">
          <path
            d="M0,7 C-5,0 -12,2 -12,8 C-12,14 -4,19 0,23 C4,19 12,14 12,8 C12,2 5,0 0,7 Z"
            fill="#FF4D80"
            stroke="#5B2A4E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <span className="intro-skip-pill">Tap to Skip</span>
    </div>
  );
}
