import { useEffect, useState } from 'preact/hooks';
import { CatAvatarSvg, CatEyeExpression } from './CatAvatarSvg';
import { CatAccessoryId, CatBreedId } from '../types/arcade';
import { playTapPop } from '../services/soundEffects';

interface IntroCatItem {
  id: number;
  x: number;
  y: number;
  rot: number;
  breed: CatBreedId;
  accessory?: CatAccessoryId;
  expression: CatEyeExpression;
  delay: number;
  isMovingBackAndForth?: boolean;
}

// Exactly matches user mockup (media_1794142158589_8f8a7d33.png)
// Row 1 (Ground Base): 5 cats (White, Ginger, Tuxedo, Strawberry, Siamese)
// Row 2: 4 cats (Peach Calico, Blue-grey Fold, Ginger, Void)
// Row 3: Middle Wiggle Cat (moving back and forth!), flanked by Pink Strawberry & Peach Calico
// Row 4: Summit Couple (Ginger King with Crown & Void Queen with Ribbon Bow, Heart Eyes)
const INTRO_CATS: IntroCatItem[] = [
  // --- Row 1: Ground Base (y = 475) ---
  { id: 1, x: 64, y: 475, rot: -2, breed: 'white-persian', expression: 'surprised', delay: 0.04 },
  { id: 2, x: 122, y: 475, rot: 0, breed: 'orange-tabby', expression: 'happy', delay: 0.09 },
  { id: 3, x: 180, y: 475, rot: 0, breed: 'tuxedo', expression: 'normal', delay: 0.14 },
  { id: 4, x: 238, y: 475, rot: 0, breed: 'strawberry-cat', expression: 'happy', delay: 0.19 },
  { id: 5, x: 296, y: 475, rot: 2, breed: 'siamese', expression: 'wink', delay: 0.24 },

  // --- Row 2: Lower Balance Tier (y = 439) ---
  { id: 6, x: 93, y: 439, rot: -2, breed: 'calico', expression: 'happy', delay: 0.36 },
  { id: 7, x: 151, y: 439, rot: 0, breed: 'scottish-fold', expression: 'normal', delay: 0.42 },
  { id: 8, x: 209, y: 439, rot: 0, breed: 'orange-tabby', expression: 'happy', delay: 0.48 },
  { id: 9, x: 267, y: 439, rot: 2, breed: 'void-black', expression: 'wink', delay: 0.54 },

  // --- Row 3: Middle Cat (moving back and forth!) nestled in center pocket ---
  { id: 10, x: 180, y: 403, rot: 0, breed: 'scottish-fold', expression: 'normal', delay: 0.64, isMovingBackAndForth: true },

  // --- Row 3: Flanking Cats (y = 403) ---
  { id: 11, x: 122, y: 403, rot: -2, breed: 'strawberry-cat', expression: 'normal', delay: 0.72 },
  { id: 12, x: 238, y: 403, rot: 2, breed: 'calico', expression: 'happy', delay: 0.78 },

  // --- Row 4: The Summit Couple (y = 367) ---
  { id: 13, x: 153, y: 367, rot: 4, breed: 'orange-tabby', accessory: 'crown', expression: 'heart', delay: 0.98 },
  { id: 14, x: 207, y: 367, rot: -4, breed: 'void-black', accessory: 'ribbon', expression: 'heart', delay: 1.04 },
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
    // Sound pop when Row 2 lands
    const sound1 = window.setTimeout(() => {
      playTapPop();
    }, 400);

    // Sound pop when Row 3 and middle cat land
    const sound2 = window.setTimeout(() => {
      playTapPop();
    }, 720);

    // Sound pop when Summit Couple crowns peak
    const sound3 = window.setTimeout(() => {
      playTapPop();
    }, 1040);

    // Auto-advance once stack is complete and celebrated
    const finishTimer = window.setTimeout(() => {
      setFading(true);
      window.setTimeout(() => {
        onComplete();
      }, 340);
    }, 2600);

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
        {/* Soft Background Clouds and Floating Pastel Sparkles */}
        <g opacity="0.45">
          <circle cx="48" cy="105" r="3.5" fill="#FF8BA7" />
          <circle cx="312" cy="115" r="3" fill="#FFBE0B" />
          <circle cx="42" cy="225" r="3" fill="#FFBE0B" />
          <circle cx="318" cy="220" r="3.5" fill="#FF8BA7" />
          <circle cx="85" cy="165" r="2.5" fill="#FF4D80" />
          <circle cx="275" cy="160" r="2.5" fill="#FF4D80" />
        </g>

        {/* Ground Platform Shadow for Foundation Cats */}
        <g opacity="0.55">
          <ellipse cx="180" cy="506" rx="156" ry="14" fill="#5B2A4E" opacity="0.12" />
          <ellipse cx="180" cy="504" rx="146" ry="8" fill="#FFA3BF" opacity="0.25" />
        </g>

        {/* Cats Stacking Hierarchy - Using Official CatAvatarSvg Components */}
        {INTRO_CATS.map((cat) => (
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
              {/* If middle cat: playful back-and-forth wiggle animation! */}
              <g className={cat.isMovingBackAndForth ? 'chibi-middle-wiggle' : ''}>
                {/* Center the 68x68 CatAvatarSvg box at (0, 0) and apply rotation tilt */}
                <g transform={`translate(-34, -34) rotate(${cat.rot} 34 34)`}>
                  <CatAvatarSvg
                    breed={cat.breed}
                    accessory={cat.accessory}
                    expression={cat.expression}
                    size={68}
                    animateIdle={false}
                  />
                </g>
              </g>
            </g>
          </g>
        ))}

        {/* Celebratory Floating Heart and Spark Chevrons matching user image */}
        <g transform="translate(180, 295)">
          <g className="chibi-heart-burst">
            {/* Big Pink Heart */}
            <path
              d="M 0 5 C -6 -4, -16 -2, -16 7 C -16 16, -5 22, 0 27 C 5 22, 16 16, 16 7 C 16 -2, 6 -4, 0 5 Z"
              fill="#ff4d6d"
              stroke="#5B2A4E"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Heart Specular Shimmer */}
            <path
              d="M -11 6 C -11 3, -8 1, -5 2"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Anime Spark Chevrons (^ < >) matching user mockup */}
            {/* Top spark: ^ */}
            <path
              d="M -7 -14 L 0 -19 L 7 -14"
              fill="none"
              stroke="#5B2A4E"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Left spark: < */}
            <path
              d="M -22 4 L -27 10 L -22 16"
              fill="none"
              stroke="#5B2A4E"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Right spark: > */}
            <path
              d="M 22 4 L 27 10 L 22 16"
              fill="none"
              stroke="#5B2A4E"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      </svg>

      <span className="intro-skip-pill">Tap to Skip</span>
    </div>
  );
}
