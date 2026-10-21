import { CatAccessoryId, CatBreedId } from '../types/arcade';

export interface CatBreedMeta {
  id: CatBreedId;
  label: string;
  fur: string;
  secondaryFur: string;
  innerEar: string;
  eyeColor: string;
  noseColor: string;
  foldedEars?: boolean;
  fluffy?: boolean;
}

export const CAT_BREEDS: readonly CatBreedMeta[] = [
  {
    id: 'strawberry-cat',
    label: 'Strawberry',
    fur: '#ff8fab',
    secondaryFur: '#fb6f92',
    innerEar: '#ffe5ec',
    eyeColor: '#2b1810',
    noseColor: '#d90429',
  },
  {
    id: 'orange-tabby',
    label: 'Orange Tabby',
    fur: '#ff9f1c',
    secondaryFur: '#e07a00',
    innerEar: '#ffd6a5',
    eyeColor: '#2b1810',
    noseColor: '#ff758f',
  },
  {
    id: 'calico',
    label: 'Calico',
    fur: '#fff8f0',
    secondaryFur: '#ff9f1c',
    innerEar: '#ffb3c1',
    eyeColor: '#2b1810',
    noseColor: '#ff758f',
  },
  {
    id: 'tuxedo',
    label: 'Tuxedo',
    fur: '#2b2d42',
    secondaryFur: '#ffffff',
    innerEar: '#ffb3c1',
    eyeColor: '#4ade80',
    noseColor: '#ff758f',
  },
  {
    id: 'siamese',
    label: 'Siamese',
    fur: '#f5ebe0',
    secondaryFur: '#5e4033',
    innerEar: '#d5bdaf',
    eyeColor: '#0284c7',
    noseColor: '#432818',
  },
  {
    id: 'void-black',
    label: 'Void Black',
    fur: '#1a1829',
    secondaryFur: '#312e47',
    innerEar: '#6d597a',
    eyeColor: '#facc15',
    noseColor: '#ff758f',
  },
  {
    id: 'scottish-fold',
    label: 'Scottish Fold',
    fur: '#94a3b8',
    secondaryFur: '#64748b',
    innerEar: '#cbd5e1',
    eyeColor: '#d97706',
    noseColor: '#f472b6',
    foldedEars: true,
  },
  {
    id: 'white-persian',
    label: 'White Persian',
    fur: '#ffffff',
    secondaryFur: '#e2e8f0',
    innerEar: '#fbcfe8',
    eyeColor: '#3b82f6',
    noseColor: '#f472b6',
    fluffy: true,
  },
] as const;

export const CAT_ACCESSORIES: readonly {
  id: CatAccessoryId;
  label: string;
  icon: string;
}[] = [
  { id: 'none', label: 'None', icon: '🐾' },
  { id: 'crown', label: 'Crown', icon: '👑' },
  { id: 'ribbon', label: 'Ribbon', icon: '🎀' },
  { id: 'sakura', label: 'Sakura', icon: '🌸' },
  { id: 'sunglasses', label: 'Shades', icon: '🕶️' },
] as const;

export function getCatBreedMeta(breed: CatBreedId): CatBreedMeta {
  return CAT_BREEDS.find((b) => b.id === breed) ?? CAT_BREEDS[0];
}

interface CatAvatarSvgProps {
  breed: CatBreedId;
  accessory?: CatAccessoryId;
  size?: number;
  animateIdle?: boolean;
  dizzy?: boolean;
  crownOverride?: boolean;
}

export function CatAvatarSvg({
  breed,
  accessory = 'none',
  size = 32,
  animateIdle = true,
  dizzy = false,
  crownOverride = false,
}: CatAvatarSvgProps) {
  const meta = getCatBreedMeta(breed);
  const effectiveAccessory: CatAccessoryId = crownOverride ? 'crown' : accessory;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Ears */}
      {meta.foldedEars ? (
        <g className={animateIdle ? 'cat-ear-anim' : undefined}>
          <polygon points="6,17 11,11 16,15" fill={meta.secondaryFur} />
          <polygon points="34,17 29,11 24,15" fill={meta.secondaryFur} />
        </g>
      ) : (
        <>
          <g className={animateIdle ? 'cat-ear-anim' : undefined}>
            <polygon
              points="6,18 8,5 17,12"
              fill={breed === 'siamese' ? meta.secondaryFur : meta.fur}
              stroke="#432818"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <polygon points="8.5,15.5 9.5,8 14.5,12.5" fill={meta.innerEar} />
          </g>
          <g>
            <polygon
              points="34,18 32,5 23,12"
              fill={
                breed === 'siamese' || breed === 'calico'
                  ? meta.secondaryFur
                  : meta.fur
              }
              stroke="#432818"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
            <polygon points="31.5,15.5 30.5,8 25.5,12.5" fill={meta.innerEar} />
          </g>
        </>
      )}

      {/* Fluffy Persian Cheek Tufts */}
      {meta.fluffy && (
        <path
          d="M 5 23 Q 2 25 6 28 Q 4 30 9 30 L 31 30 Q 36 30 34 28 Q 38 25 35 23 Z"
          fill={meta.fur}
          stroke="#cbd5e1"
          strokeWidth="0.9"
        />
      )}

      {/* Main Chubby Head Circle */}
      <circle
        cx="20"
        cy="22"
        r="12.5"
        fill={meta.fur}
        stroke="#432818"
        strokeWidth="1.1"
      />

      {/* Breed-Specific Markings */}
      {breed === 'orange-tabby' && (
        <g stroke={meta.secondaryFur} strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M 16 13 L 18 16 L 20 13.5 L 22 16 L 24 13" />
          <line x1="8.5" y1="21" x2="11.5" y2="21.5" />
          <line x1="8.5" y1="23.5" x2="11.5" y2="23.5" />
          <line x1="31.5" y1="21" x2="28.5" y2="21.5" />
          <line x1="31.5" y1="23.5" x2="28.5" y2="23.5" />
        </g>
      )}

      {breed === 'calico' && (
        <g>
          <path d="M 9 15 Q 15 11 18 17 Q 13 20 9 15 Z" fill="#ff9f1c" />
          <path d="M 23 12 Q 29 12 31 19 Q 26 20 23 12 Z" fill="#5e4033" />
        </g>
      )}

      {breed === 'tuxedo' && (
        <g>
          <ellipse cx="20" cy="26.5" rx="7.2" ry="5.5" fill="#ffffff" />
          <polygon points="20,17 15,25 25,25" fill="#ffffff" />
        </g>
      )}

      {breed === 'siamese' && (
        <ellipse cx="20" cy="22.5" rx="7.5" ry="5.8" fill={meta.secondaryFur} opacity="0.88" />
      )}

      {breed === 'strawberry-cat' && (
        <g>
          {/* Cute Strawberry Leaf Tuft on Top */}
          <path
            d="M 20 9.5 Q 16 6 15 9.5 Q 18 11 20 9.5 Q 22 11 25 9.5 Q 24 6 20 9.5 Z"
            fill="#2ec4b6"
            stroke="#1b7a71"
            strokeWidth="0.7"
          />
          {/* Tiny Berry Seeds */}
          <circle cx="15" cy="14" r="0.65" fill="#fff3b0" />
          <circle cx="20" cy="13" r="0.65" fill="#fff3b0" />
          <circle cx="25" cy="14" r="0.65" fill="#fff3b0" />
        </g>
      )}

      {/* Eyes (Normal Blinking vs Dizzy Spiral @_@ for Snake Slide) */}
      {dizzy ? (
        <g stroke="#2b1810" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M 14.5 20.5 m -2.2 0 a 2.2 2.2 0 1 0 4.4 0 a 1.3 1.3 0 1 0 -2.6 0" />
          <path d="M 25.5 20.5 m -2.2 0 a 2.2 2.2 0 1 0 4.4 0 a 1.3 1.3 0 1 0 -2.6 0" />
        </g>
      ) : (
        <g className={animateIdle ? 'cat-eyes-anim' : undefined}>
          <circle cx="14.8" cy="20.5" r="2.1" fill={meta.eyeColor} />
          <circle cx="25.2" cy="20.5" r="2.1" fill={meta.eyeColor} />
          <circle cx="14.1" cy="19.8" r="0.75" fill="#ffffff" />
          <circle cx="24.5" cy="19.8" r="0.75" fill="#ffffff" />
        </g>
      )}

      {/* Rosy Cheeks */}
      <ellipse cx="11.5" cy="23.8" rx="2.3" ry="1.2" fill="#ff758f" opacity="0.55" />
      <ellipse cx="28.5" cy="23.8" rx="2.3" ry="1.2" fill="#ff758f" opacity="0.55" />

      {/* Cute Triangle Nose & 'w' Cat Mouth */}
      <polygon points="20,22.2 18.3,24.2 21.7,24.2" fill={meta.noseColor} />
      <path
        d="M 17.2 25.5 Q 18.6 27 20 25.3 Q 21.4 27 22.8 25.5"
        fill="none"
        stroke={breed === 'void-black' ? '#f8fafc' : '#432818'}
        strokeWidth="1.05"
        strokeLinecap="round"
      />

      {/* Accessories */}
      {effectiveAccessory === 'crown' && (
        <g transform="translate(0, -1)">
          <polygon
            points="13,11 15,4 20,8 25,4 27,11"
            fill="#ffbe0b"
            stroke="#9a6700"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="8.5" r="1.2" fill="#e63946" />
        </g>
      )}

      {effectiveAccessory === 'ribbon' && (
        <g transform="translate(27, 10) rotate(18)">
          <polygon points="0,0 -5,-3.5 -5,3.5" fill="#ff4d6d" stroke="#800f2f" strokeWidth="0.7" />
          <polygon points="0,0 5,-3.5 5,3.5" fill="#ff4d6d" stroke="#800f2f" strokeWidth="0.7" />
          <circle cx="0" cy="0" r="1.6" fill="#ffb3c1" stroke="#800f2f" strokeWidth="0.6" />
        </g>
      )}

      {effectiveAccessory === 'sakura' && (
        <g transform="translate(11, 10)">
          <circle cx="0" cy="-2.6" r="2" fill="#ffb3c1" />
          <circle cx="2.5" cy="-0.8" r="2" fill="#ffb3c1" />
          <circle cx="1.5" cy="2.1" r="2" fill="#ffb3c1" />
          <circle cx="-1.5" cy="2.1" r="2" fill="#ffb3c1" />
          <circle cx="-2.5" cy="-0.8" r="2" fill="#ffb3c1" />
          <circle cx="0" cy="0" r="1.3" fill="#ffbe0b" />
        </g>
      )}

      {effectiveAccessory === 'sunglasses' && (
        <g>
          <line x1="9" y1="19.5" x2="31" y2="19.5" stroke="#111827" strokeWidth="1.3" />
          <rect x="10.5" y="18" width="7.8" height="4.8" rx="1.4" fill="#111827" />
          <rect x="21.7" y="18" width="7.8" height="4.8" rx="1.4" fill="#111827" />
          <line x1="12" y1="21.8" x2="14.5" y2="18.8" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" />
          <line x1="23.2" y1="21.8" x2="25.7" y2="18.8" stroke="#ffffff" strokeWidth="0.9" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}
