import { useEffect, useState } from 'preact/hooks';
import { playTapPop } from '../services/soundEffects';

interface ChibiStackCat {
  id: number;
  x: number;
  y: number;
  scale: number;
  rot: number;
  breed: 'tabby' | 'void' | 'strawberry' | 'tuxedo' | 'calico' | 'cloud' | 'fold' | 'siamese';
  delay: number;
  expression: 'happy' | 'sparkle' | 'wink' | 'dizzy' | 'surprised' | 'cute' | 'love';
  isWobbly?: boolean;
  hasCrown?: boolean;
  hasBow?: boolean;
}

const BREED_PALETTES: Record<
  string,
  {
    body: string;
    belly: string;
    ear: string;
    eye: string;
    cheek: string;
    darkPatch?: string;
    hasMask?: boolean;
  }
> = {
  tabby: { body: '#FFB26B', belly: '#FFF3E3', ear: '#FF8BA7', eye: '#5B2A4E', cheek: '#FF7AA5' },
  void: { body: '#3A3252', belly: '#50466E', ear: '#FF7AA5', eye: '#FFBE0B', cheek: '#FF6B9A' },
  strawberry: { body: '#FFADC6', belly: '#FFF0F5', ear: '#FF6B9A', eye: '#5B2A4E', cheek: '#FF4D80' },
  tuxedo: { body: '#2A2638', belly: '#FFF5F8', ear: '#FF8BA7', eye: '#5B2A4E', cheek: '#FF7AA5' },
  calico: { body: '#FFF5E6', belly: '#FF9E79', ear: '#FF8BA7', eye: '#5B2A4E', cheek: '#FF7AA5', darkPatch: '#5B2A4E' },
  cloud: { body: '#FFFFFF', belly: '#EBF3F8', ear: '#FFB2CA', eye: '#4A3E56', cheek: '#FF8BA7' },
  fold: { body: '#9CB2C4', belly: '#E8EFF5', ear: '#FFA3BF', eye: '#5B2A4E', cheek: '#FF7AA5' },
  siamese: { body: '#F6E7D5', belly: '#6B4D39', ear: '#6B4D39', eye: '#3B82F6', cheek: '#FF7AA5', hasMask: true },
};

// True Disney Chibi / Tsum Tsum Stacking Pyramid (14 Cats snuggly nestled with zero gaps)
// Tier 1 (Base): 5 cats (y = 495)
// Tier 2: 4 cats nestled into Tier 1 (y = 457)
// Tier 3: 3 cats nestled into Tier 2 (y = 419)
// Tier 4: The Summit Couple nestled into Tier 3 (y = 381)
const CHIBI_STACK: ChibiStackCat[] = [
  // --- Tier 1: Foundation Base Ground Floor (y = 495) ---
  { id: 1, x: 56, y: 495, scale: 1.02, rot: -3, breed: 'cloud', delay: 0.04, expression: 'surprised' },
  { id: 2, x: 118, y: 495, scale: 1.04, rot: 1, breed: 'tabby', delay: 0.10, expression: 'happy' },
  { id: 3, x: 180, y: 495, scale: 1.06, rot: 0, breed: 'tuxedo', delay: 0.16, expression: 'cute' },
  { id: 4, x: 242, y: 495, scale: 1.04, rot: -1, breed: 'strawberry', delay: 0.22, expression: 'happy' },
  { id: 5, x: 304, y: 495, scale: 1.02, rot: 3, breed: 'siamese', delay: 0.28, expression: 'wink' },

  // --- Tier 2: Lower Balance Tier (y = 457) ---
  { id: 6, x: 87, y: 457, scale: 1.02, rot: -2, breed: 'calico', delay: 0.40, expression: 'cute' },
  { id: 7, x: 149, y: 457, scale: 1.03, rot: 1, breed: 'fold', delay: 0.46, expression: 'sparkle' },
  { id: 8, x: 211, y: 457, scale: 1.03, rot: -1, breed: 'tabby', delay: 0.52, expression: 'happy' },
  { id: 9, x: 273, y: 457, scale: 1.02, rot: 2, breed: 'void', delay: 0.58, expression: 'wink' },

  // --- Tier 3: Upper Balance Tier (y = 419) ---
  { id: 10, x: 118, y: 419, scale: 1.02, rot: -2, breed: 'strawberry', delay: 0.70, expression: 'sparkle' },
  { id: 11, x: 180, y: 419, scale: 1.04, rot: 0, breed: 'fold', delay: 0.77, expression: 'dizzy', isWobbly: true },
  { id: 12, x: 242, y: 419, scale: 1.02, rot: 2, breed: 'calico', delay: 0.84, expression: 'happy' },

  // --- Tier 4: The Summit Couple (y = 381) ---
  { id: 13, x: 149, y: 381, scale: 1.08, rot: 4, breed: 'tabby', delay: 1.02, expression: 'love', hasCrown: true },
  { id: 14, x: 211, y: 381, scale: 1.08, rot: -4, breed: 'void', delay: 1.08, expression: 'love', hasBow: true },
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
    // Sound pop when tier 2 lands
    const sound1 = window.setTimeout(() => {
      playTapPop();
    }, 450);

    // Sound pop when precarious wobbly balancer lands on tier 3
    const sound2 = window.setTimeout(() => {
      playTapPop();
    }, 770);

    // Sound pop when King & Queen couple crowns summit
    const sound3 = window.setTimeout(() => {
      playTapPop();
    }, 1120);

    // Auto-advance once stack is complete and celebrated
    const finishTimer = window.setTimeout(() => {
      setFading(true);
      window.setTimeout(() => {
        onComplete();
      }, 340);
    }, 2550);

    return () => {
      window.clearTimeout(sound1);
      window.clearTimeout(sound2);
      window.clearTimeout(sound3);
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
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Soft Background Clouds and Sparkles in Sky */}
        <g opacity="0.5">
          <circle cx="50" cy="110" r="3.5" fill="#FF8BA7" />
          <circle cx="310" cy="120" r="3" fill="#FFBE0B" />
          <circle cx="40" cy="240" r="3" fill="#FFBE0B" />
          <circle cx="320" cy="230" r="3.5" fill="#FF8BA7" />
          <circle cx="85" cy="175" r="2.5" fill="#FF4D80" />
          <circle cx="275" cy="170" r="2.5" fill="#FF4D80" />
        </g>

        {/* Ground Platform Shadow for Foundation Cats */}
        <g opacity="0.6">
          <ellipse cx="180" cy="528" rx="155" ry="14" fill="#5B2A4E" opacity="0.12" />
          <ellipse cx="180" cy="526" rx="145" ry="9" fill="#FFA3BF" opacity="0.25" />
        </g>

        {/* Chibi Cats Stacking Hierarchy */}
        {CHIBI_STACK.map((cat) => {
          const colors = BREED_PALETTES[cat.breed];
          const isFold = cat.breed === 'fold';

          return (
            <g
              key={cat.id}
              transform={`translate(${cat.x}, ${cat.y})`}
            >
              {/* Drop & Squash Keyframe Group */}
              <g
                className="chibi-cat-drop"
                style={{
                  animationDelay: `${cat.delay}s`,
                }}
              >
                {/* Secondary Wobble Sway for Precarious Cat */}
                <g className={cat.isWobbly ? 'chibi-wobbly-sway' : ''}>
                  {/* Cat Inner Scale and Rotation Group */}
                  <g transform={`scale(${cat.scale}) rotate(${cat.rot})`}>
                    {/* Ears */}
                    {isFold ? (
                      /* Scottish Fold Floppy Downward Ears */
                      <>
                        <polygon
                          points="-26,-10 -34,-2 -16,-5"
                          fill={colors.body}
                          stroke="#5B2A4E"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <polygon points="-24,-9 -30,-4 -18,-6" fill={colors.ear} />
                        <polygon
                          points="26,-10 34,-2 16,-5"
                          fill={colors.body}
                          stroke="#5B2A4E"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <polygon points="24,-9 30,-4 18,-6" fill={colors.ear} />
                      </>
                    ) : (
                      /* Standard Cute Chibi Perky Triangular Ears */
                      <>
                        <polygon
                          points="-25,-12 -33,-30 -13,-22"
                          fill={colors.body}
                          stroke="#5B2A4E"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <polygon points="-23,-14 -29,-25 -16,-19" fill={colors.ear} />
                        <polygon
                          points="25,-12 33,-30 13,-22"
                          fill={colors.body}
                          stroke="#5B2A4E"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                        />
                        <polygon points="23,-14 29,-25 16,-19" fill={colors.ear} />
                      </>
                    )}

                    {/* Curled Side Tail */}
                    <path
                      d={cat.rot >= 0 ? 'M28,12 Q38,15 36,4 Q34,-2 30,2' : 'M-28,12 Q-38,15 -36,4 Q-34,-2 -30,2'}
                      fill="none"
                      stroke="#5B2A4E"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Chubby Pillowy Mochi Body */}
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="34"
                      ry="26"
                      fill={colors.body}
                      stroke="#5B2A4E"
                      strokeWidth="2.6"
                    />

                    {/* Optional Calico / Tuxedo Dark Spot */}
                    {colors.darkPatch && (
                      <path
                        d="M-22,-14 Q-12,-8 -18,8 Q-28,12 -33,-2 Z"
                        fill={colors.darkPatch}
                      />
                    )}

                    {/* Siamese Cocoa Face Mask */}
                    {colors.hasMask && (
                      <ellipse cx="0" cy="1" rx="14" ry="10" fill="#6B4D39" opacity="0.85" />
                    )}

                    {/* Round Mochi Belly Cushion */}
                    <ellipse cx="0" cy="7" rx="20" ry="13" fill={colors.belly} />

                    {/* Disney Chibi Blushing Cheeks */}
                    <ellipse cx="-19" cy="5" rx="5.2" ry="3.8" fill={colors.cheek} opacity="0.65" />
                    <ellipse cx="19" cy="5" rx="5.2" ry="3.8" fill={colors.cheek} opacity="0.65" />

                    {/* Chibi Eyes Expression */}
                    {cat.expression === 'happy' ? (
                      <>
                        {/* Joyful Arc Eyes (⌒ ⌒) */}
                        <path
                          d="M-16,-2 Q-11,-8 -6,-2"
                          fill="none"
                          stroke="#5B2A4E"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6,-2 Q11,-8 16,-2"
                          fill="none"
                          stroke="#5B2A4E"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                      </>
                    ) : cat.expression === 'wink' ? (
                      <>
                        {/* Big Glossy Left Eye */}
                        <ellipse cx="-11" cy="-3" rx="4" ry="5.2" fill={colors.eye} />
                        <circle cx="-12.5" cy="-5" r="1.6" fill="#FFF" />
                        <circle cx="-9.5" cy="-1.5" r="0.8" fill="#FFF" />
                        {/* Winking Right Eye */}
                        <path
                          d="M6,-2 Q11,-7 16,-2"
                          fill="none"
                          stroke="#5B2A4E"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        />
                      </>
                    ) : cat.expression === 'love' ? (
                      <>
                        {/* Adoring Heart Eyes for Summit Couple */}
                        <path
                          d="M-11,-4 C-13,-7 -16,-6 -16,-3 C-16,0 -12,3 -11,5 C-10,3 -6,0 -6,-3 C-6,-6 -9,-7 -11,-4 Z"
                          fill="#FF4D80"
                          stroke="#5B2A4E"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M11,-4 C9,-7 6,-6 6,-3 C6,0 10,3 11,5 C12,3 16,0 16,-3 C16,-6 13,-7 11,-4 Z"
                          fill="#FF4D80"
                          stroke="#5B2A4E"
                          strokeWidth="1.2"
                        />
                      </>
                    ) : cat.expression === 'dizzy' ? (
                      <>
                        {/* Wobbly Spiral / Dizzy Eyes for Precarious Balancer (@ @) */}
                        <path
                          d="M-14,-2 A 3.2 3.2 0 1 1 -8,-2 A 2 2 0 1 1 -11,-2"
                          fill="none"
                          stroke="#5B2A4E"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8,-2 A 3.2 3.2 0 1 1 14,-2 A 2 2 0 1 1 11,-2"
                          fill="none"
                          stroke="#5B2A4E"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </>
                    ) : cat.expression === 'surprised' ? (
                      <>
                        {/* Big Round Surprised Eyes */}
                        <circle cx="-11" cy="-3" r="4.2" fill={colors.eye} />
                        <circle cx="-12.2" cy="-4.5" r="1.5" fill="#FFF" />
                        <circle cx="11" cy="-3" r="4.2" fill={colors.eye} />
                        <circle cx="9.8" cy="-4.5" r="1.5" fill="#FFF" />
                        {/* Little 'O' Mouth */}
                        <circle cx="0" cy="5" r="2.2" fill="#5B2A4E" />
                      </>
                    ) : (
                      <>
                        {/* Classic Disney Chibi Glossy Sparkle Eyes */}
                        <ellipse cx="-11" cy="-3" rx="4.2" ry="5.4" fill={colors.eye} />
                        <circle cx="-12.8" cy="-5.2" r="1.7" fill="#FFF" />
                        <circle cx="-9.5" cy="-1.5" r="0.9" fill="#FFF" />
                        <ellipse cx="11" cy="-3" rx="4.2" ry="5.4" fill={colors.eye} />
                        <circle cx="9.2" cy="-5.2" r="1.7" fill="#FFF" />
                        <circle cx="12.5" cy="-1.5" r="0.9" fill="#FFF" />
                      </>
                    )}

                    {/* Tiny Kawaii Nose & Cat 'w' Mouth (Unless surprised) */}
                    {cat.expression !== 'surprised' && (
                      <>
                        <polygon points="0,0.8 -2,-1.2 2,-1.2" fill="#FF8BA7" />
                        <path
                          d="M-4,2.5 Q-2,5.2 0,2.8 Q2,5.2 4,2.5"
                          fill="none"
                          stroke="#5B2A4E"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </>
                    )}

                    {/* Little Stubby Chibi Paws Clutching Lower Cat's Back */}
                    <ellipse
                      cx="-14"
                      cy="22"
                      rx="5"
                      ry="3.5"
                      fill={colors.belly}
                      stroke="#5B2A4E"
                      strokeWidth="2"
                    />
                    <ellipse
                      cx="14"
                      cy="22"
                      rx="5"
                      ry="3.5"
                      fill={colors.belly}
                      stroke="#5B2A4E"
                      strokeWidth="2"
                    />

                    {/* Crown Accessory for King Ginger Cat */}
                    {cat.hasCrown && (
                      <g transform="translate(0, -2)">
                        <polygon
                          points="-10,-28 -5,-22 0,-32 5,-22 10,-28 8,-19 -8,-19"
                          fill="#FFBE0B"
                          stroke="#5B2A4E"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <circle cx="0" cy="-21" r="1.4" fill="#FF4D80" />
                      </g>
                    )}

                    {/* Ribbon Bow Accessory for Queen Void Cat */}
                    {cat.hasBow && (
                      <g transform="translate(10, -25)">
                        <polygon points="0,0 8,-5 8,5" fill="#FF4D80" stroke="#5B2A4E" strokeWidth="1.6" />
                        <polygon points="0,0 -8,-5 -8,5" fill="#FF4D80" stroke="#5B2A4E" strokeWidth="1.6" />
                        <circle cx="0" cy="0" r="2.4" fill="#FFBE0B" stroke="#5B2A4E" strokeWidth="1.3" />
                      </g>
                    )}
                  </g>
                </g>
              </g>
            </g>
          );
        })}

        {/* Celebratory Floating Heart and Golden Sparkles at Summit */}
        {/* Outer <g> locks translation at (180, 315), inner <g> animates scale & pop! */}
        <g transform="translate(180, 315)">
          <g className="chibi-heart-burst">
            <path
              d="M0,6 C-6,-2 -15,0 -15,8 C-15,16 -5,22 0,27 C5,22 15,16 15,8 C15,0 6,-2 0,6 Z"
              fill="#FF4D80"
              stroke="#5B2A4E"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Heart Specular Shimmer */}
            <path
              d="M-10,6 C-10,4 -7,2 -4,3"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Sparkles */}
            <path
              d="M-24,4 L-20,6 L-24,8 L-22,6 Z"
              fill="#FFBE0B"
              stroke="#5B2A4E"
              strokeWidth="1"
            />
            <path
              d="M24,4 L20,6 L24,8 L22,6 Z"
              fill="#FFBE0B"
              stroke="#5B2A4E"
              strokeWidth="1"
            />
            <path
              d="M-14,-14 L-11,-12 L-14,-10 L-13,-12 Z"
              fill="#FFBE0B"
              stroke="#5B2A4E"
              strokeWidth="0.8"
            />
            <path
              d="M14,-14 L11,-12 L14,-10 L13,-12 Z"
              fill="#FFBE0B"
              stroke="#5B2A4E"
              strokeWidth="0.8"
            />
          </g>
        </g>
      </svg>

      <span className="intro-skip-pill">Tap to Skip</span>
    </div>
  );
}
