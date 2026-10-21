import { CatAccessoryId, CatBreedId } from '../types/arcade';

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
}

/**
 * Finch-inspired Chubby Pastel Illustrated Cat Avatar
 * Uses smooth organic cubic-Bezier curves, soft lineless/warm-contoured patches,
 * chubby cheeks, cozy belly patch, and cute tucked front paws.
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
}: CatAvatarSvgProps) {
  const meta = getCatBreedMeta(breed);
  const effectiveAccessory: CatAccessoryId = crownOverride ? 'crown' : accessory;

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
      <g className={animateIdle ? 'cat-ear-anim' : undefined}>
        {/* Curled Tail peeking on the right */}
        <path
          d="M 36 37 C 43 36, 45 29, 41 26 C 38.5 24.5, 37 28, 38.5 30.5"
          fill="none"
          stroke="#5B2A4E"
          stroke-width="5.8"
          stroke-linecap="round"
        />
        <path
          d="M 36 37 C 43 36, 45 29, 41 26 C 38.5 24.5, 37 28, 38.5 30.5"
          fill="none"
          stroke={meta.secondaryFur}
          stroke-width="3.8"
          stroke-linecap="round"
        />

        {/* Chubby Mochi Cat Body + Head Silhouette (One Seamless Organic Shape) */}
        {meta.foldedEars ? (
          <path
            d="M 10 22 C 8 15, 13 11, 18 13 C 22 11.5, 26 11.5, 30 13 C 35 11, 40 15, 38 22 C 42 28, 41 41, 32 43 C 27 44, 21 44, 16 43 C 7 41, 6 28, 10 22 Z"
            fill={meta.fur}
            stroke="#5B2A4E"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        ) : (
          <path
            d="M 9.5 19 C 7.5 10, 10 5.5, 16.5 11 C 21 9.5, 27 9.5, 31.5 11 C 38 5.5, 40.5 10, 38.5 19 C 42.5 25.5, 41.5 40.5, 32.5 43 C 27 44.2, 21 44.2, 15.5 43 C 6.5 40.5, 5.5 25.5, 9.5 19 Z"
            fill={meta.fur}
            stroke="#5B2A4E"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        )}

        {/* Inner Ears (Soft Rounded Teardrop Shapes) */}
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

        {/* Finch-style Forehead & Cheek Color Patches per Breed */}
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
          <ellipse cx="24" cy="24.5" rx="9.5" ry="7.2" fill={meta.secondaryFur} opacity="0.85" />
        )}

        {/* Soft Cozy Muzzle & Belly Patch (Finch signature soft tummy/face area) */}
        <ellipse cx="24" cy="34.5" rx="11.2" ry="8.2" fill={meta.bellyPatch} />
        <ellipse cx="24" cy="25.5" rx="10.5" ry="7.6" fill={meta.bellyPatch} opacity={breed === 'siamese' ? 0.18 : 0.72} />

        {/* Fluffy Tuft on Top */}
        {meta.fluffy && (
          <path
            d="M 20 10.5 Q 22 6.8 24 9.5 Q 26.5 6.8 28 10.5"
            fill={meta.fur}
          />
        )}

        {/* Rosy Pastel Oval Cheeks */}
        <ellipse
          cx="13.8"
          cy="26.2"
          rx="3.1"
          ry="1.8"
          fill={meta.cheekColor}
          opacity="0.72"
        />
        <ellipse
          cx="34.2"
          cy="26.2"
          rx="3.1"
          ry="1.8"
          fill={meta.cheekColor}
          opacity="0.72"
        />

        {/* Expressive Cat Eyes */}
        {dizzy ? (
          <g stroke="#432818" strokeWidth="1.8" strokeLinecap="round">
            <line x1="15.5" y1="20.5" x2="19.5" y2="24.5" />
            <line x1="19.5" y1="20.5" x2="15.5" y2="24.5" />
            <line x1="28.5" y1="20.5" x2="32.5" y2="24.5" />
            <line x1="32.5" y1="20.5" x2="28.5" y2="24.5" />
          </g>
        ) : happySquint ? (
          <g
            fill="none"
            stroke="#432818"
            strokeWidth="2.1"
            strokeLinecap="round"
          >
            <path d="M 14.8 23.2 Q 17.5 19.6 20.2 23.2" />
            <path d="M 27.8 23.2 Q 30.5 19.6 33.2 23.2" />
          </g>
        ) : (
          <g className={animateIdle ? 'cat-eye-blink' : undefined}>
            <circle cx="17.5" cy="22.4" r="2.7" fill={meta.eyeColor} />
            <circle cx="30.5" cy="22.4" r="2.7" fill={meta.eyeColor} />
            <circle cx="16.6" cy="21.4" r="1" fill="#ffffff" />
            <circle cx="29.6" cy="21.4" r="1" fill="#ffffff" />
          </g>
        )}

        {/* Cute Button Nose & W Cat Smile */}
        <ellipse cx="24" cy="24.8" rx="1.7" ry="1.2" fill={meta.noseColor} />
        <path
          d="M 20.8 26.5 Q 22.4 28.4 24 26.2 Q 25.6 28.4 27.2 26.5"
          fill="none"
          stroke="#432818"
          strokeWidth="1.45"
          strokeLinecap="round"
        />

        {/* Soft Side Whiskers */}
        <g stroke="#8c6249" strokeWidth="1" strokeLinecap="round" opacity="0.55">
          <line x1="6.5" y1="24" x2="10.5" y2="24.8" />
          <line x1="6.8" y1="27" x2="10.8" y2="26.8" />
          <line x1="41.5" y1="24" x2="37.5" y2="24.8" />
          <line x1="41.2" y1="27" x2="37.2" y2="26.8" />
        </g>

        {/* Cute Chubby Front Paws Resting on Chest */}
        <ellipse
          cx="18.2"
          cy="35.5"
          rx="3.6"
          ry="2.5"
          transform="rotate(14 18.2 35.5)"
          fill={meta.fur}
          stroke={meta.secondaryFur}
          strokeWidth="0.9"
        />
        <ellipse
          cx="29.8"
          cy="35.5"
          rx="3.6"
          ry="2.5"
          transform="rotate(-14 29.8 35.5)"
          fill={meta.fur}
          stroke={meta.secondaryFur}
          strokeWidth="0.9"
        />

        {/* Little Bottom Feet Peeking Out */}
        <ellipse cx="16.5" cy="43" rx="3.2" ry="1.8" fill={meta.secondaryFur} />
        <ellipse cx="31.5" cy="43" rx="3.2" ry="1.8" fill={meta.secondaryFur} />

        {/* Accessories */}
        {effectiveAccessory === 'crown' && (
          <g transform="translate(24, 7.5)">
            <path
              d="M -6.5 3.5 L -8 -3.5 L -3 0.2 L 0 -4.5 L 3 0.2 L 8 -3.5 L 6.5 3.5 Z"
              fill="#ffbe0b"
              stroke="#d97706"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="0.8" r="1.2" fill="#ff4d6d" />
          </g>
        )}

        {effectiveAccessory === 'ribbon' && (
          <g transform="translate(33, 11.5) rotate(16)">
            <path
              d="M -5.5 -3 C -2 -3, -1 0, 0 0 C 1 0, 2 -3, 5.5 -3 L 5.5 3 C 2 3, 1 0, 0 0 C -1 0, -2 3, -5.5 3 Z"
              fill="#ff4d6d"
            />
            <circle cx="0" cy="0" r="1.8" fill="#ffb3c1" />
          </g>
        )}

        {effectiveAccessory === 'sakura' && (
          <g transform="translate(14, 11)">
            <circle cx="0" cy="-2.6" r="2" fill="#ffb3c1" />
            <circle cx="2.5" cy="-0.8" r="2" fill="#ffb3c1" />
            <circle cx="1.6" cy="2.1" r="2" fill="#ffb3c1" />
            <circle cx="-1.6" cy="2.1" r="2" fill="#ffb3c1" />
            <circle cx="-2.5" cy="-0.8" r="2" fill="#ffb3c1" />
            <circle cx="0" cy="0" r="1.3" fill="#ffbe0b" />
          </g>
        )}

        {effectiveAccessory === 'sunglasses' && (
          <g>
            <rect
              x="12.5"
              y="19.2"
              width="10"
              height="6.2"
              rx="2"
              fill="#1e293b"
            />
            <rect
              x="25.5"
              y="19.2"
              width="10"
              height="6.2"
              rx="2"
              fill="#1e293b"
            />
            <line
              x1="22.5"
              y1="21.5"
              x2="25.5"
              y2="21.5"
              stroke="#ffbe0b"
              strokeWidth="1.6"
            />
            <line
              x1="14.2"
              y1="20.8"
              x2="17"
              y2="23.8"
              stroke="#ffffff"
              strokeWidth="1.1"
              opacity="0.7"
            />
            <line
              x1="27.2"
              y1="20.8"
              x2="30"
              y2="23.8"
              stroke="#ffffff"
              strokeWidth="1.1"
              opacity="0.7"
            />
          </g>
        )}
      </g>
    </svg>
  );
}

/**
 * Sticker-Cartoony Main Menu & Victory Hero Illustration:
 * Two detailed chubby couple cats snuggled together on a cozy pastel cushion
 * with a floating glossy heart badge, sparkling stars, and speech bubbles.
 */
export function CoupleCatsSceneSvg({
  p1Breed,
  p2Breed,
  showTrophy = false,
  size = 218,
}: {
  p1Breed: CatBreedId;
  p2Breed: CatBreedId;
  showTrophy?: boolean;
  size?: number;
}) {
  const m1 = getCatBreedMeta(p1Breed);
  const m2 = getCatBreedMeta(p2Breed);

  return (
    <svg
      viewBox="0 0 180 128"
      width={size}
      height={Math.round(size * 0.71)}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
      className="couple-hero-svg"
    >
      {/* Warm Pastel Aura & Fluffy Cloud Cushion */}
      <ellipse
        cx="90"
        cy="70"
        rx="66"
        ry="46"
        fill="rgba(255, 255, 255, 0.65)"
      />
      <ellipse
        cx="90"
        cy="112"
        rx="62"
        ry="11"
        fill="#5B2A4E"
      />
      <ellipse
        cx="90"
        cy="108"
        rx="62"
        ry="11"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        stroke-width="2.8"
      />
      <ellipse
        cx="90"
        cy="106.5"
        rx="52"
        ry="7"
        fill="#FFF8F2"
      />

      {/* Twinkling Sticker Sparkle Stars */}
      <path
        d="M 22 52 L 24 57 L 29 59 L 24 61 L 22 66 L 20 61 L 15 59 L 20 57 Z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <path
        d="M 158 50 L 159.8 54.5 L 164.5 56.2 L 159.8 58 L 158 62.5 L 156.2 58 L 151.5 56.2 L 156.2 54.5 Z"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
      <circle cx="28" cy="78" r="2.8" fill="#4FC3C9" stroke="#5B2A4E" stroke-width="1.1" />
      <circle cx="154" cy="76" r="2.8" fill="#A78BFA" stroke="#5B2A4E" stroke-width="1.1" />

      {/* Left Cat (P1) — Full Detailed CatAvatarSvg Snuggled Inward */}
      <g transform="translate(26, 28) rotate(-5 36 38)">
        <CatAvatarSvg
          breed={p1Breed}
          accessory="crown"
          size={72}
          animateIdle={true}
        />
      </g>

      {/* Right Cat (P2) — Full Detailed CatAvatarSvg Snuggled Inward */}
      <g transform="translate(82, 28) rotate(5 36 38)">
        <CatAvatarSvg
          breed={p2Breed}
          accessory="ribbon"
          size={72}
          animateIdle={true}
        />
      </g>

      {/* Cozy Hugging Paws Meeting in the Middle */}
      <ellipse
        cx="84"
        cy="85"
        rx="6.2"
        ry="4.2"
        transform="rotate(14 84 85)"
        fill={m1.fur}
        stroke="#5B2A4E"
        stroke-width="2"
      />
      <ellipse
        cx="96"
        cy="85"
        rx="6.2"
        ry="4.2"
        transform="rotate(-14 96 85)"
        fill={m2.fur}
        stroke="#5B2A4E"
        stroke-width="2"
      />

      {/* Center Floating Glossy Love Heart / Trophy Badge Between the Cats */}
      <g transform="translate(90, 22)">
        <g className="sticker-anim-bob">
          <circle
            cx="0"
            cy="2"
            r="15.5"
            fill="#5B2A4E"
          />
          <circle
            cx="0"
            cy="0"
            r="15.5"
            fill="#FFF8F2"
            stroke="#5B2A4E"
            stroke-width="2.6"
          />
          {showTrophy ? (
            <g transform="translate(-10, -10) scale(0.84)">
              <path
                d="M6 4h12v5a6 6 0 0 1-12 0V4z"
                fill="#FFBE0B"
                stroke="#5B2A4E"
                stroke-width="1.8"
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
                stroke-width="1.4"
              />
            </g>
          ) : (
            <>
              <path
                d="M 0 8.5 C -2 6.8, -9.5 1.2, -9.5 -4.2 A 5.2 5.2 0 0 1 0 -6.4 A 5.2 5.2 0 0 1 9.5 -4.2 C 9.5 1.2, 2 6.8, 0 8.5 Z"
                fill="#FF4D6D"
                stroke="#5B2A4E"
                stroke-width="2"
                stroke-linejoin="round"
              />
              <ellipse
                cx="-3.4"
                cy="-3.6"
                rx="2.1"
                ry="1.1"
                transform="rotate(-25 -3.4 -3.6)"
                fill="rgba(255, 255, 255, 0.75)"
              />
            </>
          )}
        </g>
      </g>

      {/* Mini Floating Heart Bubbles on Left & Right */}
      <g transform="translate(36, 26)">
        <g className="sticker-anim-bob">
          <path
            d="M 0 4.5 C -1.2 3.5, -5.2 0.6, -5.2 -2.2 A 2.9 2.9 0 0 1 0 -3.4 A 2.9 2.9 0 0 1 5.2 -2.2 C 5.2 0.6, 1.2 3.5, 0 4.5 Z"
            fill="#FF7AA5"
            stroke="#5B2A4E"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </g>
      </g>
      <g transform="translate(144, 26)">
        <g className="sticker-anim-bob">
          <path
            d="M 0 4.5 C -1.2 3.5, -5.2 0.6, -5.2 -2.2 A 2.9 2.9 0 0 1 0 -3.4 A 2.9 2.9 0 0 1 5.2 -2.2 C 5.2 0.6, 1.2 3.5, 0 4.5 Z"
            fill="#FFBE0B"
            stroke="#5B2A4E"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
