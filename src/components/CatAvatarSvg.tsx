import { useState } from 'preact/hooks';
import { CatAccessoryId, CatAvatarConfig, CatBreedId } from '../types/arcade';
import { playCatAngryMeow, playCatMeow } from '../services/soundEffects';

export interface CatBreedMeta {
  id: CatBreedId;
  label: string;
  fur: string;
  secondaryFur: string;
  bellyPatch: string;
  innerEar: string;
  eyeColor: string;
  noseColor: string;
  cheekColor: string;
  foldedEars?: boolean;
  fluffy?: boolean;
}

export const CAT_BREEDS: readonly CatBreedMeta[] = [
  {
    id: 'strawberry-cat',
    label: 'Strawberry',
    fur: '#ff9ebb',
    secondaryFur: '#ff759f',
    bellyPatch: '#fff0f5',
    innerEar: '#ffc2d4',
    eyeColor: '#4a2511',
    noseColor: '#e63946',
    cheekColor: '#ff5d8f',
  },
  {
    id: 'orange-tabby',
    label: 'Ginger Mochi',
    fur: '#ffb74d',
    secondaryFur: '#f57c00',
    bellyPatch: '#fff8e7',
    innerEar: '#ffccbc',
    eyeColor: '#4a2511',
    noseColor: '#ff758f',
    cheekColor: '#ff8a65',
  },
  {
    id: 'calico',
    label: 'Peach Calico',
    fur: '#fff8eb',
    secondaryFur: '#ffab40',
    bellyPatch: '#ffffff',
    innerEar: '#ffb3c1',
    eyeColor: '#432818',
    noseColor: '#ff758f',
    cheekColor: '#ff8fab',
  },
  {
    id: 'tuxedo',
    label: 'Berry Tux',
    fur: '#4a4e69',
    secondaryFur: '#22223b',
    bellyPatch: '#f8f9fa',
    innerEar: '#ffb3c1',
    eyeColor: '#2ec4b6',
    noseColor: '#ff758f',
    cheekColor: '#ff8fab',
  },
  {
    id: 'siamese',
    label: 'Milk Tea',
    fur: '#f5ebe0',
    secondaryFur: '#7f5539',
    bellyPatch: '#faf3dd',
    innerEar: '#e6ccb2',
    eyeColor: '#0096c7',
    noseColor: '#582f0e',
    cheekColor: '#ff8fab',
  },
  {
    id: 'void-black',
    label: 'Lavender Void',
    fur: '#3c3754',
    secondaryFur: '#242038',
    bellyPatch: '#564d75',
    innerEar: '#9d8df1',
    eyeColor: '#ffbe0b',
    noseColor: '#ff758f',
    cheekColor: '#f72585',
  },
  {
    id: 'scottish-fold',
    label: 'Blueberry Fold',
    fur: '#90a4ae',
    secondaryFur: '#607d8b',
    bellyPatch: '#eceff1',
    innerEar: '#f8bbd0',
    eyeColor: '#f59e0b',
    noseColor: '#f472b6',
    cheekColor: '#f48fb1',
    foldedEars: true,
  },
  {
    id: 'white-persian',
    label: 'Cloud Puff',
    fur: '#ffffff',
    secondaryFur: '#dbeafe',
    bellyPatch: '#f8fafc',
    innerEar: '#fbcfe8',
    eyeColor: '#3b82f6',
    noseColor: '#f472b6',
    cheekColor: '#ff8fab',
    fluffy: true,
  },
] as const;

export const CAT_ACCESSORIES: readonly {
  id: CatAccessoryId;
  label: string;
}[] = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: 'Crown' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'sakura', label: 'Sakura' },
  { id: 'sunglasses', label: 'Shades' },
] as const;

export function getCatBreedMeta(breed: CatBreedId): CatBreedMeta {
  return CAT_BREEDS.find((b) => b.id === breed) ?? CAT_BREEDS[0];
}

export type CatActionAnim =
  | 'none'
  | 'powerup'
  | 'climb'
  | 'eaten'
  | 'ascend';

export type CatEyeExpression =
  | 'normal'
  | 'happy'
  | 'wink'
  | 'heart'
  | 'surprised'
  | 'dizzy';

interface CatAvatarSvgProps {
  breed: CatBreedId;
  accessory?: CatAccessoryId;
  size?: number;
  x?: number;
  y?: number;
  animateIdle?: boolean;
  dizzy?: boolean;
  crownOverride?: boolean;
  happySquint?: boolean;
  isPetting?: boolean;
  isAngryPet?: boolean;
  actionAnim?: CatActionAnim;
  expression?: CatEyeExpression;
}

const TAIL_D =
  'M 35.5 37 C 43 36, 45.2 28.8, 41 25.8 C 38.4 24.3, 36.8 27.8, 38.5 30.5';

/**
 * Finch-inspired Chubby Pastel Illustrated Cat Avatar
 * Enhanced with grounded rossark-motion choreography:
 * - Feet stay planted while body breathes / squishes from base pivot (24, 43)
 * - Tail root pivot wave with phase delay (wags faster when petted)
 * - Live gliding pupils & natural blinks
 * - Happy paw wave & rosy cheek glow when petted, or feisty Angry puff when poked!
 */
export function CatAvatarSvg({
  breed,
  accessory = 'none',
  size = 34,
  x,
  y,
  animateIdle = true,
  dizzy = false,
  crownOverride = false,
  happySquint = false,
  isPetting = false,
  isAngryPet = false,
  actionAnim = 'none',
  expression,
}: CatAvatarSvgProps) {
  const meta = getCatBreedMeta(breed);
  const effectiveAccessory: CatAccessoryId = crownOverride ? 'crown' : accessory;
  const effectiveExpression: CatEyeExpression = expression
    ? expression
    : dizzy
    ? 'dizzy'
    : (happySquint || isPetting) && !isAngryPet
    ? 'happy'
    : 'normal';
  const squintActive = effectiveExpression === 'happy';

  const actionClass =
    actionAnim !== 'none' ? `cat-action-${actionAnim}` : '';

  return (
    <svg
      viewBox="0 0 48 48"
      x={x}
      y={y}
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <g className={actionClass || undefined}>
        {/* Grounded Little Bottom Feet (Stay planted on cushion) */}
        {[16.5, 31.5].map((cx) => (
          <ellipse
            key={cx}
            cx={cx}
            cy="43"
            rx="3.4"
            ry="1.9"
            fill={meta.secondaryFur}
            stroke="#5B2A4E"
            strokeWidth="1.2"
          />
        ))}

        {/* Mochi Body & Head Group (Pivots cleanly from base 24, 42) */}
        <g
          className={
            isAngryPet
              ? 'cat-pet-angry-stomp'
              : isPetting
              ? 'cat-pet-mochi-bounce'
              : animateIdle
              ? 'cat-breath-wave'
              : undefined
          }
        >
          {/* Curled Tail with Root-Pivot Wave Follow-Through */}
          <g
            className={
              isPetting || isAngryPet
                ? 'cat-tail-happy-wag'
                : animateIdle
                ? 'cat-tail-wave'
                : undefined
            }
          >
            <path
              d={TAIL_D}
              fill="none"
              stroke="#5B2A4E"
              strokeWidth="5.8"
              strokeLinecap="round"
            />
            <path
              d={TAIL_D}
              fill="none"
              stroke={meta.secondaryFur}
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          </g>

          {/* Chubby Mochi Cat Body + Head Silhouette */}
          {meta.foldedEars ? (
            <path
              d="M 10 22 C 8 15, 13 11, 18 13 C 22 11.5, 26 11.5, 30 13 C 35 11, 40 15, 38 22 C 42 28, 41 41, 32 43 C 27 44, 21 44, 16 43 C 7 41, 6 28, 10 22 Z"
              fill={meta.fur}
              stroke="#5B2A4E"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M 9.5 19 C 7.5 10, 10 5.5, 16.5 11 C 21 9.5, 27 9.5, 31.5 11 C 38 5.5, 40.5 10, 38.5 19 C 42.5 25.5, 41.5 40.5, 32.5 43 C 27 44.2, 21 44.2, 15.5 43 C 6.5 40.5, 5.5 25.5, 9.5 19 Z"
              fill={meta.fur}
              stroke="#5B2A4E"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          )}

          {/* Inner Ears */}
          {meta.foldedEars ? (
            <>
              <path
                d="M 9 18 C 9 13, 14 11.5, 17.5 14.5 C 14.5 16.5, 11 18, 9 18 Z"
                fill={meta.secondaryFur}
              />
              <path
                d="M 39 18 C 39 13, 34 11.5, 30.5 14.5 C 33.5 16.5, 37 18, 39 18 Z"
                fill={meta.secondaryFur}
              />
            </>
          ) : (
            <>
              <path
                d="M 11.2 17 C 10.2 11.8, 11.5 9.2, 15.4 12.6 C 14 14.2, 12.5 15.8, 11.2 17 Z"
                fill={meta.innerEar}
              />
              <path
                d="M 36.8 17 C 37.8 11.8, 36.5 9.2, 32.6 12.6 C 34 14.2, 35.5 15.8, 36.8 17 Z"
                fill={meta.innerEar}
              />
            </>
          )}

          {/* Forehead & Cheek Color Patches per Breed */}
          {(breed === 'calico' ||
            breed === 'orange-tabby' ||
            breed === 'strawberry-cat') && (
            <>
              <path
                d="M 27 10.5 C 33 11, 38.5 16, 38.5 23 C 34 24, 29 20, 27 10.5 Z"
                fill={meta.secondaryFur}
                opacity="0.88"
              />
              <path
                d="M 10 21 C 10 15, 14 11, 19 10.6 C 17.5 16.5, 14 20.5, 10 21 Z"
                fill={breed === 'calico' ? '#5e4033' : meta.secondaryFur}
                opacity="0.78"
              />
            </>
          )}

          {breed === 'siamese' && (
            <ellipse
              cx="24"
              cy="24.5"
              rx="9.5"
              ry="7.2"
              fill={meta.secondaryFur}
              opacity="0.85"
            />
          )}

          {/* Soft Cozy Muzzle & Belly Patch */}
          <ellipse cx="24" cy="34.5" rx="11.2" ry="8.2" fill={meta.bellyPatch} />
          <ellipse
            cx="24"
            cy="25.5"
            rx="10.5"
            ry="7.6"
            fill={meta.bellyPatch}
            opacity={breed === 'siamese' ? 0.18 : 0.72}
          />

          {/* Fluffy Tuft on Top */}
          {meta.fluffy && (
            <path
              d="M 20 10.5 Q 22 6.8 24 9.5 Q 26.5 6.8 28 10.5"
              fill={meta.fur}
            />
          )}

          {/* Rosy Pastel Oval Cheeks */}
          {[13.8, 34.2].map((cx) => (
            <ellipse
              key={cx}
              cx={cx}
              cy={squintActive ? '25.2' : '26.2'}
              rx={squintActive ? '3.5' : '3.2'}
              ry={squintActive ? '2.1' : '1.9'}
              fill={meta.cheekColor}
              opacity={squintActive ? '0.92' : '0.78'}
            />
          ))}

          {/* Expressive Live Cat Eyes */}
          {isAngryPet ? (
            <g>
              {/* Fierce Narrowed Angry Eyes */}
              <path
                d="M 14.2 21.2 L 20.6 22.8 A 3.1 2.9 0 0 1 14.2 21.2 Z"
                fill="#FFFDF9"
                stroke="#432818"
                strokeWidth="0.9"
              />
              <path
                d="M 33.8 21.2 L 27.4 22.8 A 3.1 2.9 0 0 0 33.8 21.2 Z"
                fill="#FFFDF9"
                stroke="#432818"
                strokeWidth="0.9"
              />
              {[17.8, 30.2].map((cx) => (
                <circle key={cx} cx={cx} cy="22.8" r="1.9" fill="#E11D48" />
              ))}
              {[17.3, 29.7].map((cx) => (
                <circle key={cx} cx={cx} cy="22.3" r="0.7" fill="#ffffff" />
              ))}
              {/* Furrowed V-Shaped Angry Eyebrows */}
              <line
                x1="13.8"
                y1="19.4"
                x2="21.2"
                y2="22.1"
                stroke="#432818"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <line
                x1="34.2"
                y1="19.4"
                x2="26.8"
                y2="22.1"
                stroke="#432818"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              {/* Cute Anime Anger Vein Symbol (💢) on Forehead/Temple */}
              <g
                transform="translate(34.5, 13.5)"
                stroke="#E11D48"
                strokeWidth="1.35"
                strokeLinecap="round"
                fill="none"
              >
                <path d="M -2.6 -1.1 Q -0.9 -0.9 -1.1 -2.6 M 2.6 -1.1 Q 0.9 -0.9 1.1 -2.6 M -2.6 1.1 Q -0.9 0.9 -1.1 2.6 M 2.6 1.1 Q 0.9 0.9 1.1 2.6" />
              </g>
            </g>
          ) : effectiveExpression === 'dizzy' ? (
            <g stroke="#432818" strokeWidth="1.8" strokeLinecap="round">
              {[17.5, 30.5].map((cx) => (
                <g key={cx}>
                  <line x1={cx - 2} y1="20.5" x2={cx + 2} y2="24.5" />
                  <line x1={cx + 2} y1="20.5" x2={cx - 2} y2="24.5" />
                </g>
              ))}
            </g>
          ) : effectiveExpression === 'heart' ? (
            <g>
              {/* Heart Eyes for Summit Couple */}
              <path
                d="M 17.5 20.8 C 15.5 18.2, 13 19.2, 13 21.8 C 13 24.2, 16.5 26.6, 17.5 27.6 C 18.5 26.6, 22 24.2, 22 21.8 C 22 19.2, 19.5 18.2, 17.5 20.8 Z"
                fill="#ff4d6d"
                stroke="#432818"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              <path
                d="M 30.5 20.8 C 28.5 18.2, 26 19.2, 26 21.8 C 26 24.2, 29.5 26.6, 30.5 27.6 C 31.5 26.6, 35 24.2, 35 21.8 C 35 19.2, 32.5 18.2, 30.5 20.8 Z"
                fill="#ff4d6d"
                stroke="#432818"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </g>
          ) : effectiveExpression === 'happy' ? (
            <g
              fill="none"
              stroke="#432818"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M 14.5 23.2 Q 17.5 19.2 20.5 23.2 M 27.5 23.2 Q 30.5 19.2 33.5 23.2" />
            </g>
          ) : effectiveExpression === 'wink' ? (
            <g>
              {/* Left Eye: Open Glossy Anime Sparkle */}
              <ellipse
                cx="17.5"
                cy="22.4"
                rx="3.05"
                ry="2.95"
                fill="#FFFDF9"
                stroke="#432818"
                strokeWidth="0.6"
              />
              <circle cx="17.5" cy="22.4" r="2.55" fill={meta.eyeColor} />
              <circle cx="16.6" cy="21.3" r="1.05" fill="#ffffff" />
              <circle
                cx="18.3"
                cy="23.3"
                r="0.48"
                fill="#ffffff"
                opacity="0.85"
              />
              {/* Right Eye: Happy Winking Squint */}
              <path
                d="M 27.5 23.2 Q 30.5 19.2 33.5 23.2"
                fill="none"
                stroke="#432818"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          ) : effectiveExpression === 'surprised' ? (
            <g>
              {[17.5, 30.5].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy="22.4" r="3.2" fill="#FFFDF9" stroke="#432818" strokeWidth="0.7" />
                  <circle cx={cx} cy="22.4" r="2.4" fill="#432818" />
                  <circle cx={cx - 0.9} cy="21.3" r="1.1" fill="#ffffff" />
                </g>
              ))}
            </g>
          ) : (
            <g className={animateIdle ? 'cat-eye-blink' : undefined}>
              {[17.5, 30.5].map((cx) => (
                <ellipse
                  key={cx}
                  cx={cx}
                  cy="22.4"
                  rx="3.05"
                  ry="2.95"
                  fill="#FFFDF9"
                  stroke="#432818"
                  strokeWidth="0.6"
                />
              ))}
              <g className={animateIdle ? 'cat-pupil-glide' : undefined}>
                {[17.5, 30.5].map((cx) => (
                  <g key={cx}>
                    <circle cx={cx} cy="22.4" r="2.55" fill={meta.eyeColor} />
                    <circle cx={cx - 0.9} cy="21.3" r="1.05" fill="#ffffff" />
                    <circle
                      cx={cx + 0.8}
                      cy="23.3"
                      r="0.48"
                      fill="#ffffff"
                      opacity="0.85"
                    />
                  </g>
                ))}
              </g>
            </g>
          )}

          {/* Cute Button Nose & Cat Mouth (Smile, Surprised 'o', or Feisty Angry Fangs!) */}
          <ellipse cx="24" cy="24.8" rx="1.7" ry="1.2" fill={meta.noseColor} />
          {isAngryPet ? (
            <g>
              {/* Feisty Open Hiss Mouth with Tiny White Kitty Fangs */}
              <path
                d="M 20.8 28.4 Q 24 25.4 27.2 28.4 Q 24 29.8 20.8 28.4 Z"
                fill="#E11D48"
                stroke="#432818"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <polygon points="21.8,27.1 22.5,28.5 23.1,27.0" fill="#ffffff" />
              <polygon points="26.2,27.1 25.5,28.5 24.9,27.0" fill="#ffffff" />
            </g>
          ) : effectiveExpression === 'surprised' ? (
            <circle cx="24" cy="27.4" r="1.6" fill="#432818" />
          ) : (
            <>
              {squintActive && (
                <path
                  d="M 22.4 26.6 Q 24 29.8 25.6 26.6 Z"
                  fill="#FF6B9A"
                  stroke="#432818"
                  strokeWidth="0.8"
                />
              )}
              <path
                d="M 20.8 26.5 Q 22.4 28.4 24 26.2 Q 25.6 28.4 27.2 26.5"
                fill="none"
                stroke="#432818"
                strokeWidth="1.45"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Soft Side Whiskers */}
          <g
            stroke="#8c6249"
            strokeWidth="1.05"
            strokeLinecap="round"
            opacity="0.6"
          >
            <line x1="6.3" y1="23.8" x2="10.5" y2="24.8" />
            <line x1="6.6" y1="27" x2="10.8" y2="26.8" />
            <line x1="41.7" y1="23.8" x2="37.5" y2="24.8" />
            <line x1="41.4" y1="27" x2="37.2" y2="26.8" />
          </g>

          {/* Cute Chubby Front Paws Resting on Chest */}
          {([
            [18.2, 14, 'cat-paw-left-wave'],
            [29.8, -14, 'cat-paw-right-wave'],
          ] as const).map(([cx, rot, cls]) => (
            <g
              key={cx}
              className={isPetting || isAngryPet ? cls : undefined}
            >
              <ellipse
                cx={cx}
                cy="35.5"
                rx="3.6"
                ry="2.5"
                transform={`rotate(${rot} ${cx} 35.5)`}
                fill={meta.fur}
                stroke={meta.secondaryFur}
                strokeWidth="0.95"
              />
            </g>
          ))}

          {/* Accessories / Outfits */}
          {effectiveAccessory === 'crown' && (
            <g transform="translate(24, 7.2)">
              <path
                d="M -7 3.6 L -8.5 -3.8 L -3.2 0.2 L 0 -5 L 3.2 0.2 L 8.5 -3.8 L 7 3.6 Z"
                fill="#ffbe0b"
                stroke="#5B2A4E"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="0.8" r="1.35" fill="#ff4d6d" />
              <circle cx="-4" cy="1.2" r="0.9" fill="#38bdf8" />
              <circle cx="4" cy="1.2" r="0.9" fill="#38bdf8" />
            </g>
          )}

          {effectiveAccessory === 'ribbon' && (
            <g transform="translate(33, 11.2) rotate(16)">
              <path
                d="M -6 -3.3 C -2 -3.3, -1 0, 0 0 C 1 0, 2 -3.3, 6 -3.3 L 6 3.3 C 2 3.3, 1 0, 0 0 C -1 0, -2 3.3, -6 3.3 Z"
                fill="#ff4d6d"
                stroke="#5B2A4E"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />
              <circle
                cx="0"
                cy="0"
                r="2"
                fill="#ffb3c1"
                stroke="#5B2A4E"
                strokeWidth="0.9"
              />
            </g>
          )}

          {effectiveAccessory === 'sakura' && (
            <g transform="translate(14, 10.8)" stroke="#5B2A4E" strokeWidth="0.7">
              {[
                [0, -2.6],
                [2.5, -0.8],
                [1.6, 2.1],
                [-1.6, 2.1],
                [-2.5, -0.8],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2.1" fill="#ffb3c1" />
              ))}
              <circle cx="0" cy="0" r="1.4" fill="#ffbe0b" />
            </g>
          )}

          {effectiveAccessory === 'sunglasses' && (
            <g>
              {[
                [12.2, 14],
                [25.4, 27.2],
              ].map(([rx, lx]) => (
                <g key={rx}>
                  <rect
                    x={rx}
                    y="19"
                    width="10.4"
                    height="6.4"
                    rx="2.1"
                    fill="#1e293b"
                    stroke="#5B2A4E"
                    strokeWidth="1"
                  />
                  <line
                    x1={lx}
                    y1="20.6"
                    x2={lx + 2.8}
                    y2="23.8"
                    stroke="#ffffff"
                    strokeWidth="1.2"
                    opacity="0.78"
                    strokeLinecap="round"
                  />
                </g>
              ))}
              <line
                x1="22.6"
                y1="21.5"
                x2="25.4"
                y2="21.5"
                stroke="#ffbe0b"
                strokeWidth="1.8"
              />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

const PET_REACTIONS: readonly {
  phrase: string;
  emotion: 'happy' | 'angry';
}[] = [
  { phrase: 'Purrr~ ♥', emotion: 'happy' },
  { phrase: 'Hiss~!', emotion: 'angry' },
  { phrase: 'Nyaa~ ♪', emotion: 'happy' },
  { phrase: 'No touchy!', emotion: 'angry' },
  { phrase: 'Love u! ♥', emotion: 'happy' },
  { phrase: 'Mrrrow~!', emotion: 'angry' },
] as const;

function PetReactionOverlaySvg({
  cx,
  cy,
  phrase,
  emotion,
}: {
  cx: number;
  cy: number;
  phrase: string;
  emotion: 'happy' | 'angry';
}) {
  const isAngry = emotion === 'angry';
  return (
    <g transform={`translate(${cx}, ${cy})`} pointerEvents="none">
      {isAngry ? (
        <>
          {[
            [-28, 13],
            [28, 11],
          ].map(([bx, by], i) => (
            <g
              key={i}
              className={`pet-heart-burst h${i + 1}`}
              transform={`translate(${bx}, ${by})`}
              stroke="#E11D48"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M -3.2 -1.3 Q -1.1 -1.1 -1.3 -3.2 M 3.2 -1.3 Q 1.1 -1.1 1.3 -3.2 M -3.2 1.3 Q -1.1 1.1 -1.3 3.2 M 3.2 1.3 Q 1.1 1.1 1.3 3.2" />
            </g>
          ))}
        </>
      ) : (
        <>
          {([
            [-28, 18, '#FF4D6D'],
            [28, 16, '#FF6B9A'],
          ] as const).map(([bx, by, fill], i) => (
            <g key={i} className={`pet-heart-burst h${i + 1}`}>
              <path
                d={`M ${bx} ${by} C ${+bx - 1.5} ${+by - 1.5}, ${+bx - 5} ${+by - 4.5}, ${+bx - 5} ${+by - 7.5} A 2.6 2.6 0 0 1 ${bx} ${+by - 9} A 2.6 2.6 0 0 1 ${+bx + 5} ${+by - 7.5} C ${+bx + 5} ${+by - 4.5}, ${+bx + 1.5} ${+by - 1.5}, ${bx} ${by} Z`}
                fill={fill}
                stroke="#5B2A4E"
                strokeWidth="1.1"
              />
            </g>
          ))}
        </>
      )}

      {/* Centered Speech Bubble Pill Above Cat */}
      <g className="pet-pop-bubble">
        <rect
          x="-34"
          y="-19"
          width="68"
          height="20"
          rx="10"
          fill={isAngry ? '#FFE4E6' : '#FFFDF9'}
          stroke={isAngry ? '#E11D48' : '#5B2A4E'}
          strokeWidth="2"
        />
        <path
          d="M -4 1 L 0 6 L 4 1 Z"
          fill={isAngry ? '#FFE4E6' : '#FFFDF9'}
          stroke={isAngry ? '#E11D48' : '#5B2A4E'}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <line
          x1="-3.2"
          y1="1"
          x2="3.2"
          y2="1"
          stroke={isAngry ? '#FFE4E6' : '#FFFDF9'}
          strokeWidth="2.4"
        />
        <text
          x="0"
          y="-5.5"
          textAnchor="middle"
          fill={isAngry ? '#BE123C' : '#FF4D6D'}
          style={{
            fontSize: '8.5px',
            fontFamily: "var(--font-display, 'Baloo 2', sans-serif)",
            fontWeight: 800,
          }}
        >
          {phrase}
        </text>
      </g>
    </g>
  );
}

/**
 * Interactive Main Menu & Victory Hero Illustration:
 * - Supports Solo Mode (`isJoined = false`, single cat centered on cushion)
 * - Supports Side-by-Side Couple Mode (`isJoined = true`, P-1 Host & P-2 Invited side-by-side)
 * - Matches exact player outfits (`p1Accessory` & `p2Accessory`)
 * - Clickable cats trigger grounded mochi bounce (happy) or feisty stomp (angry)!
 */
export function CoupleCatsSceneSvg({
  p1Breed,
  p2Breed,
  p1Accessory = 'crown',
  p2Accessory = 'ribbon',
  p1Name = 'Lovey 1',
  p2Name = 'Lovey 2',
  soloAvatar,
  isJoined = true,
  showRoleLabels = false,
  interactive = false,
  showTrophy = false,
  size = 218,
}: {
  p1Breed: CatBreedId;
  p2Breed: CatBreedId;
  p1Accessory?: CatAccessoryId;
  p2Accessory?: CatAccessoryId;
  p1Name?: string;
  p2Name?: string;
  soloAvatar?: CatAvatarConfig;
  isJoined?: boolean;
  showRoleLabels?: boolean;
  interactive?: boolean;
  showTrophy?: boolean;
  size?: number;
}) {
  const [petCounts, setPetCounts] = useState<{ p1: number; p2: number }>({
    p1: 0,
    p2: 0,
  });
  const [petActive, setPetActive] = useState<{ p1: boolean; p2: boolean }>({
    p1: false,
    p2: false,
  });

  const m1 = getCatBreedMeta(isJoined ? p1Breed : soloAvatar?.breed ?? p1Breed);
  const m2 = getCatBreedMeta(p2Breed);

  const handlePetCat = (which: 'p1' | 'p2') => {
    if (!interactive) return;
    const nextIdx = petCounts[which] + 1;
    const nextEmotion = PET_REACTIONS[nextIdx % PET_REACTIONS.length].emotion;
    if (nextEmotion === 'angry') {
      playCatAngryMeow();
    } else {
      playCatMeow();
    }

    setPetCounts((prev) => ({ ...prev, [which]: nextIdx }));
    setPetActive((prev) => ({ ...prev, [which]: false }));
    window.requestAnimationFrame(() =>
      setPetActive((prev) => ({ ...prev, [which]: true }))
    );
    window.setTimeout(
      () => setPetActive((prev) => ({ ...prev, [which]: false })),
      1000
    );
  };

  const soloBreed = soloAvatar?.breed ?? p1Breed;
  const soloAcc = soloAvatar?.accessory ?? p1Accessory;

  const catsToRender = isJoined
    ? [
        { slot: 'p1' as const, breed: p1Breed, acc: p1Accessory, x: 24, size: 72 },
        { slot: 'p2' as const, breed: p2Breed, acc: p2Accessory, x: 84, size: 72 },
      ]
    : [
        { slot: 'p1' as const, breed: soloBreed, acc: soloAcc, x: 51, size: 78 },
      ];

  return (
    <svg
      viewBox="0 0 180 132"
      width={size}
      height={Math.round(size * 0.73)}
      aria-hidden={!interactive}
      style={{ display: 'block', overflow: 'visible' }}
      className="couple-hero-svg"
    >
      {/* Warm Pastel Aura & Fluffy Cloud Cushion */}
      <ellipse
        cx="90"
        cy="70"
        rx="68"
        ry="46"
        fill="rgba(255, 255, 255, 0.68)"
      />
      <ellipse cx="90" cy="113" rx="64" ry="11.5" fill="#5B2A4E" />
      <ellipse
        cx="90"
        cy="108.5"
        rx="64"
        ry="11.5"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="2.8"
      />
      <ellipse cx="90" cy="107" rx="53" ry="7.2" fill="#FFF8F2" />

      {/* Twinkling Sticker Sparkle Stars */}
      <path
        d="M 20 50 L 22 55 L 27 57 L 22 59 L 20 64 L 18 59 L 13 57 L 18 55 Z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M 160 48 L 161.8 52.5 L 166.5 54.2 L 161.8 56 L 160 60.5 L 158.2 56 L 153.5 54.2 L 158.2 52.5 Z"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle
        cx="26"
        cy="78"
        r="2.8"
        fill="#4FC3C9"
        stroke="#5B2A4E"
        strokeWidth="1.1"
      />
      <circle
        cx="154"
        cy="76"
        r="2.8"
        fill="#A78BFA"
        stroke="#5B2A4E"
        strokeWidth="1.1"
      />

      {catsToRender.map((c) => {
        const count = petCounts[c.slot];
        const active = petActive[c.slot];
        const reaction = PET_REACTIONS[count % PET_REACTIONS.length];
        return (
          <g
            key={c.slot}
            transform={`translate(${c.x}, 28)`}
            onClick={() => handlePetCat(c.slot)}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          >
            <CatAvatarSvg
              breed={c.breed}
              accessory={c.acc}
              size={c.size}
              animateIdle={true}
              isPetting={active && reaction.emotion === 'happy'}
              isAngryPet={active && reaction.emotion === 'angry'}
            />
            {active && (
              <PetReactionOverlaySvg
                cx={c.size / 2}
                cy={-2}
                phrase={reaction.phrase}
                emotion={reaction.emotion}
              />
            )}
          </g>
        );
      })}

      {isJoined && (
        <>
          {/* Cozy Hugging Paws Meeting in the Middle */}
          <ellipse
            cx="84"
            cy="86"
            rx="6.2"
            ry="4.2"
            transform="rotate(14 84 86)"
            fill={m1.fur}
            stroke="#5B2A4E"
            strokeWidth="2"
          />
          <ellipse
            cx="96"
            cy="86"
            rx="6.2"
            ry="4.2"
            transform="rotate(-14 96 86)"
            fill={m2.fur}
            stroke="#5B2A4E"
            strokeWidth="2"
          />

          {/* Center Floating Glossy Love Heart / Trophy Badge Between Couple Cats */}
          <g transform="translate(90, 20)">
            <g className="sticker-anim-bob">
              <circle cx="0" cy="2" r="13.5" fill="#5B2A4E" />
              <circle
                cx="0"
                cy="0"
                r="13.5"
                fill="#FFF8F2"
                stroke="#5B2A4E"
                strokeWidth="2.4"
              />
              {showTrophy ? (
                <g transform="translate(-10, -10) scale(0.84)">
                  <path
                    d="M6 4h12v5a6 6 0 0 1-12 0V4z"
                    fill="#FFBE0B"
                    stroke="#5B2A4E"
                    strokeWidth="1.8"
                  />
                  <rect x="10" y="14" width="4" height="4" fill="#F59E0B" />
                  <rect
                    x="7"
                    y="18"
                    width="10"
                    height="3"
                    rx="1.5"
                    fill="#D97706"
                    stroke="#5B2A4E"
                    strokeWidth="1.4"
                  />
                </g>
              ) : (
                <>
                  <path
                    d="M 0 7.5 C -2 6, -8.5 1, -8.5 -3.8 A 4.6 4.6 0 0 1 0 -5.8 A 4.6 4.6 0 0 1 8.5 -3.8 C 8.5 1, 2 6, 0 7.5 Z"
                    fill="#FF4D6D"
                    stroke="#5B2A4E"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                  />
                  <ellipse
                    cx="-3"
                    cy="-3.2"
                    rx="1.8"
                    ry="0.9"
                    transform="rotate(-25 -3 -3.2)"
                    fill="rgba(255, 255, 255, 0.78)"
                  />
                </>
              )}
            </g>
          </g>

          {/* Role Indicator Pills Below Each Cat: Host & Invited */}
          {showRoleLabels && (
            [
              { x: 54, bg: '#FF6B9A', txt: `${p1Name.slice(0, 8)} • Host` },
              { x: 126, bg: '#38BDF8', txt: `${p2Name.slice(0, 8)} • Invited` },
            ].map(({ x, bg, txt }) => (
              <g key={x} transform={`translate(${x}, 113)`}>
                <rect
                  x="-36"
                  y="-9"
                  width="72"
                  height="17"
                  rx="8.5"
                  fill={bg}
                  stroke="#5B2A4E"
                  strokeWidth="1.8"
                />
                <text
                  x="0"
                  y="2.5"
                  textAnchor="middle"
                  fill="#ffffff"
                  style={{
                    fontSize: '7.4px',
                    fontFamily: "var(--font-display, 'Baloo 2', sans-serif)",
                    fontWeight: 800,
                  }}
                >
                  {txt}
                </text>
              </g>
            ))
          )}
        </>
      )}
    </svg>
  );
}
