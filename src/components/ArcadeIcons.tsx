import { CatAccessoryId, ReactionStickerId } from '../types/arcade';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Kawaii Cat-Vibes "LOVEY GAME" Logo with Seamless Symmetrical Cat Ears, Whiskers & Heart-Paw Emblem
 * (No crown on ears; ears seamlessly integrated into the badge outline)
 */
export function LoveyLogoWordmarkSvg() {
  return (
    <div className="chunky-logo-badge" aria-label="Lovey Game">
      {/* Unified SVG Cat-Eared Badge Backing (Seamless ears + pill in one outline) */}
      <svg
        viewBox="0 0 220 56"
        className="logo-unified-cat-frame"
        aria-hidden="true"
      >
        {/* 3D Bottom Shadow Lip */}
        <rect
          x="12"
          y="18"
          width="196"
          height="35"
          rx="17.5"
          fill="#5B2A4E"
        />

        {/* Continuous Cat-Ear Pill Silhouette (Left Ear + Pill Body + Right Ear) */}
        <path
          d="M 29.5 14
             L 33 4.2 C 34.2 1.2, 38.2 1.0, 40.4 3.6 L 49.5 14
             L 170.5 14
             L 179.6 3.6 C 181.8 1.0, 185.8 1.2, 187 4.2 L 190.5 14
             A 17.5 17.5 0 0 1 208 31.5
             A 17.5 17.5 0 0 1 190.5 49
             L 29.5 49
             A 17.5 17.5 0 0 1 12 31.5
             A 17.5 17.5 0 0 1 29.5 14 Z"
          fill="#FFFDF9"
          stroke="#5B2A4E"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Symmetrical Pink Inner Cat Ears */}
        <path
          d="M 33.2 13.5 L 35.8 6.4 C 36.3 5.0, 38.0 4.9, 39.0 6.1 L 44.8 13.5 Z"
          fill="#FF9EBB"
        />
        <path
          d="M 186.8 13.5 L 184.2 6.4 C 183.7 5.0, 182.0 4.9, 181.0 6.1 L 175.2 13.5 Z"
          fill="#FF9EBB"
        />

        {/* Top Glossy Specular Highlight Line */}
        <path
          d="M 54 18.5 H 166"
          stroke="#FFE4EE"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Left Cute Cat Whiskers */}
        <line
          x1="3"
          y1="27"
          x2="11"
          y2="29"
          stroke="#5B2A4E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="3"
          y1="35"
          x2="11"
          y2="34"
          stroke="#5B2A4E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Right Cute Cat Whiskers */}
        <line
          x1="217"
          y1="27"
          x2="209"
          y2="29"
          stroke="#5B2A4E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="217"
          y1="35"
          x2="209"
          y2="34"
          stroke="#5B2A4E"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>

      <div className="chunky-logo-content">
        <span className="chunky-logo-text">LOVEY</span>

        {/* Cute Center Cat Heart-Paw Emblem */}
        <span className="logo-center-cat-emblem" aria-hidden="true">
          <svg viewBox="0 0 28 26" width="22" height="20">
            <path
              d="M14 23.5 C11 21, 3 15, 3 8.5 A 5.8 5.8 0 0 1 14 5.5 A 5.8 5.8 0 0 1 25 8.5 C25 15, 17 21, 14 23.5 Z"
              fill="#FF4D6D"
              stroke="#5B2A4E"
              strokeWidth="2.3"
              strokeLinejoin="round"
            />
            <ellipse cx="14" cy="14.2" rx="3.2" ry="2.5" fill="#FFF8F2" />
            <circle cx="10.3" cy="10.3" r="1.35" fill="#FFF8F2" />
            <circle cx="12.7" cy="8.8" r="1.35" fill="#FFF8F2" />
            <circle cx="15.3" cy="8.8" r="1.35" fill="#FFF8F2" />
            <circle cx="17.7" cy="10.3" r="1.35" fill="#FFF8F2" />
          </svg>
        </span>

        <span className="chunky-logo-text">GAME</span>
      </div>
    </div>
  );
}

/**
 * Redesigned Settings Button Icon: Cute Cat-Eared Gear Charm with Golden Bell Heart
 */
export function SettingsGearIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Gear Scalloped Outer Ring */}
      <path
        d="M14 2.2 l1.8 1.9 2.5-.6 1 2.4 2.5.6-.1 2.6 2 1.6-1.1 2.3 1.1 2.3-2 1.6.1 2.6-2.5.6-1 2.4-2.5-.6L14 25.8l-1.8-1.9-2.5.6-1-2.4-2.5-.6.1-2.6-2-1.6 1.1-2.3-1.1-2.3 2-1.6-.1-2.6 2.5-.6 1-2.4 2.5.6z"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Cat Silhouette Inner Charm */}
      <path
        d="M8.5 12 C7.5 8, 9.5 6.2, 11.8 8.8 C13.2 8.3, 14.8 8.3, 16.2 8.8 C18.5 6.2, 20.5 8, 19.5 12 C21 15.2, 19.8 19.8, 14 19.8 C8.2 19.8, 7 15.2, 8.5 12 Z"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Golden Bell Center */}
      <circle
        cx="14"
        cy="14.5"
        r="2.8"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="1.5"
      />
      <circle cx="13.2" cy="13.7" r="0.8" fill="#FFF8F2" />
    </svg>
  );
}

export function EditPenIcon({ size = 14, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4.5 1.5L5 15 16.5 3.5z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 5.5l3 3"
        stroke="#5B2A4E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}


export function ArrowBackIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M19 12H6m0 0l5-5m-5 5l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="#10B981"
        stroke="#5B2A4E"
        strokeWidth="2"
      />
      <path
        d="M8 12.3l2.6 2.6 5.4-5.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlertCircleIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="#F43F5E"
        stroke="#5B2A4E"
        strokeWidth="2"
      />
      <path
        d="M12 7.5v5.5M12 16.5h.01"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const DICE_DOTS: readonly [number, number][][] = [
  [],
  [[12, 12]],
  [[7.5, 7.5], [16.5, 16.5]],
  [[7, 7], [12, 12], [17, 17]],
  [[7.5, 7.5], [16.5, 7.5], [7.5, 16.5], [16.5, 16.5]],
  [[7.5, 7.5], [16.5, 7.5], [12, 12], [7.5, 16.5], [16.5, 16.5]],
  [[7.5, 6.8], [16.5, 6.8], [7.5, 12], [16.5, 12], [7.5, 17.2], [16.5, 17.2]],
];

export function DiceFaceSvg({
  value,
  size = 24,
  tint = '#ffffff',
}: {
  value: number;
  size?: number;
  tint?: string;
}) {
  const activeDots = DICE_DOTS[value] || DICE_DOTS[6];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect
        x="2"
        y="3.4"
        width="20"
        height="19.2"
        rx="5.5"
        fill="#5B2A4E"
      />
      <rect
        x="2"
        y="1.8"
        width="20"
        height="19.5"
        rx="5.5"
        fill={tint}
        stroke="#5B2A4E"
        strokeWidth="2.2"
      />
      <path
        d="M 5.5 4.2 H 14.5"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {activeDots.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy - 0.4}
          r="1.95"
          fill={value === 1 ? '#FF4D6D' : '#5B2A4E'}
        />
      ))}
    </svg>
  );
}

export function DoubleDiceIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 28 26"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(1, 3) rotate(-10 8 8)">
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="3.8"
          fill="#FFE08A"
          stroke="#5B2A4E"
          strokeWidth="2"
        />
        <circle cx="5.2" cy="5.2" r="1.3" fill="#5B2A4E" />
        <circle cx="10.8" cy="10.8" r="1.3" fill="#5B2A4E" />
      </g>
      <g transform="translate(11, 5) rotate(10 8 8)">
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="3.8"
          fill="#FFD6E4"
          stroke="#5B2A4E"
          strokeWidth="2"
        />
        <circle cx="5" cy="5" r="1.25" fill="#FF4D6D" />
        <circle cx="11" cy="5" r="1.25" fill="#5B2A4E" />
        <circle cx="8" cy="8" r="1.25" fill="#5B2A4E" />
        <circle cx="5" cy="11" r="1.25" fill="#5B2A4E" />
        <circle cx="11" cy="11" r="1.25" fill="#FF4D6D" />
      </g>
    </svg>
  );
}

export function TrophyIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 5H3.5A1.5 1.5 0 0 0 2 6.5v1A3.5 3.5 0 0 0 5.5 11H6.5M18 5h2.5A1.5 1.5 0 0 1 22 6.5v1A3.5 3.5 0 0 1 18.5 11h-1"
        fill="none"
        stroke="#5B2A4E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6 3.5h12v5.5a6 6 0 0 1-12 0V3.5z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="14.5"
        width="4"
        height="4"
        fill="#F59E0B"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <rect
        x="6.5"
        y="18"
        width="11"
        height="3.4"
        rx="1.6"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        strokeWidth="1.9"
      />
      <circle cx="9.6" cy="7.2" r="1.3" fill="#FFF8F2" />
    </svg>
  );
}

export function CrownIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.2 18.8h17.6l1.7-10.8-5.8 4L12 4.5 7.3 12 1.5 8l1.7 10.8z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.8" r="1.8" fill="#FF4D6D" />
      <circle cx="7.2" cy="14.4" r="1.3" fill="#38BDF8" />
      <circle cx="16.8" cy="14.4" r="1.3" fill="#38BDF8" />
    </svg>
  );
}

export function HeartIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 20.5s-8.2-4.8-8.2-10.8A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.2 3.5c0 6-8.2 10.8-8.2 10.8z"
        fill="#FF4D6D"
        stroke="#5B2A4E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse
        cx="8.5"
        cy="8.8"
        rx="1.7"
        ry="1"
        transform="rotate(-25 8.5 8.8)"
        fill="#FFE5EC"
      />
    </svg>
  );
}

export function DoubleHeartIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9 19s-6.5-3.9-6.5-8.7A3.8 3.8 0 0 1 9 7.6a3.8 3.8 0 0 1 6.5 2.7C15.5 15.1 9 19 9 19z"
        fill="#FF8FAB"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <path
        d="M16.2 16s-5-3-5-6.6a3 3 0 0 1 5-2.1 3 3 0 0 1 5 2.1c0 3.6-5 6.6-5 6.6z"
        fill="#FF4D6D"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function PawIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="15.4" rx="4.8" ry="3.9" fill="currentColor" />
      <circle cx="6.6" cy="10.2" r="2.2" fill="currentColor" />
      <circle cx="10.1" cy="7.5" r="2.2" fill="currentColor" />
      <circle cx="13.9" cy="7.5" r="2.2" fill="currentColor" />
      <circle cx="17.4" cy="10.2" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function SparkleIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="18.8" cy="5.2" r="1.8" fill="#FF6B9A" />
    </svg>
  );
}

export function SoundIcon({
  muted,
  size = 16,
}: {
  muted: boolean;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M4 9.5h4l5-4v13l-5-4H4a1.5 1.5 0 0 1-1.5-1.5v-2A1.5 1.5 0 0 1 4 9.5z"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M16.5 9.5l4.5 5m0-5l-4.5 5"
          stroke="#E11D48"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7m2.8-9.5a8.5 8.5 0 0 1 0 12"
          fill="none"
          stroke="#10B981"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}


export function TutorialBookIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5v-16z"
        fill="#38BDF8"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <path
        d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5v-16z"
        fill="#7DD3FC"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.2" fill="#FFFBEB" />
    </svg>
  );
}

export function CopyIcon({ size = 15 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect
        x="8"
        y="7.5"
        width="12"
        height="13.5"
        rx="3"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="2"
      />
      <path
        d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V6"
        fill="none"
        stroke="#5B2A4E"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M6.5 6.5l11 11m0-11l-11 11"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Cute Floating Cat Messenger Bubble Icon (Cat Head Speech Bubble with Ears & Heart)
 */
export function ChatBubbleIcon({ size = 25 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      {/* Cat Speech Bubble Silhouette with Pointy Cat Ears */}
      <path
        d="M 6 13 C 4.5 6.5, 7.5 3.5, 11.8 8.2 C 14.5 7.4, 17.5 7.4, 20.2 8.2 C 24.5 3.5, 27.5 6.5, 26 13 C 28.5 17.5, 26.5 23.5, 20 24.2 L 15 28.2 L 14.2 24.4 C 7.5 24, 3.8 18.5, 6 13 Z"
        fill="#FFF8F2"
        stroke="#5B2A4E"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      {/* Inner Pink Ear Triangles */}
      <path d="M 7.5 11.5 C 6.8 8, 8.2 6.5, 10.6 9.2 Z" fill="#FF8FAB" />
      <path d="M 24.5 11.5 C 25.2 8, 23.8 6.5, 21.4 9.2 Z" fill="#FF8FAB" />
      {/* Cute Cat Eyes & W-Smile inside the Bubble */}
      <circle cx="11.8" cy="15.2" r="1.5" fill="#5B2A4E" />
      <circle cx="20.2" cy="15.2" r="1.5" fill="#5B2A4E" />
      <ellipse cx="9.6" cy="17.2" rx="1.6" ry="0.9" fill="#FF8FAB" />
      <ellipse cx="22.4" cy="17.2" rx="1.6" ry="0.9" fill="#FF8FAB" />
      <path
        d="M 13.8 17.2 Q 14.9 18.6 16 17 Q 17.1 18.6 18.2 17.2"
        fill="none"
        stroke="#5B2A4E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SnakeLadderIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 26 26" width={size} height={size} aria-hidden="true">
      {/* Cute Wavy Green Snake */}
      <path
        d="M4.5 20.5c0-4 6.5-4 6.5-8s-5.5-4-5.5-7c0-2.2 2.8-3.2 5.5-1.5"
        fill="none"
        stroke="#5B2A4E"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <path
        d="M4.5 20.5c0-4 6.5-4 6.5-8s-5.5-4-5.5-7c0-2.2 2.8-3.2 5.5-1.5"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Golden Honey Ladder */}
      <path
        d="M15.5 4v18M21.5 4v18M15.5 8.5h6M15.5 13h6M15.5 17.5h6"
        stroke="#5B2A4E"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M15.5 4v18M21.5 4v18M15.5 8.5h6M15.5 13h6M15.5 17.5h6"
        stroke="#FBBF24"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UnoCardsIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 26 26"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Back Sky Blue Card tilted left */}
      <g transform="translate(4.5, 3) rotate(-14 8 10)">
        <rect
          x="0"
          y="0"
          width="12.5"
          height="17.5"
          rx="3.2"
          fill="#38BDF8"
          stroke="#5B2A4E"
          strokeWidth="2"
        />
        <ellipse
          cx="6.25"
          cy="8.75"
          rx="4.2"
          ry="3"
          transform="rotate(25 6.25 8.75)"
          fill="#ffffff"
        />
      </g>
      {/* Front Strawberry Red Card tilted right */}
      <g transform="translate(10, 5) rotate(12 8 10)">
        <rect
          x="0"
          y="0"
          width="12.5"
          height="17.5"
          rx="3.2"
          fill="#FF4B72"
          stroke="#5B2A4E"
          strokeWidth="2"
        />
        <ellipse
          cx="6.25"
          cy="8.75"
          rx="4.2"
          ry="3"
          transform="rotate(-25 6.25 8.75)"
          fill="#FFF8F2"
        />
        <circle cx="6.25" cy="8.75" r="1.4" fill="#FF4B72" />
      </g>
    </svg>
  );
}

/**
 * Kitty Bluff Game Mode Icon: Sly Cat Bandit Mask over Dual Mystery Cards
 */
export function KittyBluffIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 26 26"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Back Mystery Violet Card */}
      <g transform="translate(3, 3.5) rotate(-11 7 9)">
        <rect
          x="0"
          y="0"
          width="13"
          height="17.5"
          rx="3.2"
          fill="#A855F7"
          stroke="#5B2A4E"
          strokeWidth="2"
        />
      </g>
      {/* Front Cream Bluff Card */}
      <g transform="translate(8.5, 4.5) rotate(8 7 9)">
        <rect
          x="0"
          y="0"
          width="13.5"
          height="18"
          rx="3.2"
          fill="#FFF8F2"
          stroke="#5B2A4E"
          strokeWidth="2"
        />
      </g>
      {/* Sly Cat Bandit Mask Emblem in Center */}
      <path
        d="M5.5 13 C5 9.2, 7.2 7.5, 9.8 10 C11.8 9.4, 14.2 9.4, 16.2 10 C18.8 7.5, 21 9.2, 20.5 13 C21.8 15.8, 19.6 18.8, 16.2 18.2 C14.6 17.9, 13.8 16.6, 13 16.6 C12.2 16.6, 11.4 17.9, 9.8 18.2 C6.4 18.8, 4.2 15.8, 5.5 13 Z"
        fill="#5B2A4E"
        stroke="#FFF8F2"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Glowing Sly Eyes */}
      <path
        d="M7.6 13.6 Q9.4 12.1 11.1 13.8 Z"
        fill="#FFBE0B"
      />
      <path
        d="M14.9 13.8 Q16.6 12.1 18.4 13.6 Z"
        fill="#FF6B9A"
      />
    </svg>
  );
}

export function FishTreatIcon({ size = 15, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M17.5 12 L22 7.5 V16.5 L17.5 12 Z"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <ellipse
        cx="10.8"
        cy="12"
        rx="7.8"
        ry="5.2"
        fill="#38BDF8"
        stroke="#5B2A4E"
        strokeWidth="2"
      />
      <path
        d="M12.5 8.2 Q10.5 12 12.5 15.8"
        fill="none"
        stroke="#BAE6FD"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="7" cy="10.8" r="1.35" fill="#5B2A4E" />
      <circle cx="6.6" cy="10.4" r="0.5" fill="#FFF8F2" />
    </svg>
  );
}

export function TimerClockIcon({ size = 13, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="13"
        r="8.5"
        fill="#FFF8F2"
        stroke="#5B2A4E"
        strokeWidth="2.2"
      />
      <path
        d="M9.5 2.5 H14.5 M12 2.5 V4.5 M12 8.5 V13 L15 14.8"
        fill="none"
        stroke="#5B2A4E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BluffCallSirenIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2.2 L14.8 7.6 L20.8 6.4 L17.6 11.6 L21.5 16.2 L15.5 16.6 L14.2 22 L10.4 17.4 L4.5 19 L7.2 13.5 L3 9 L9 8.2 Z"
        fill="#FFBE0B"
        stroke="#5B2A4E"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5 V13 M12 16.2 H12.02"
        stroke="#5B2A4E"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Custom Vector Card Role Illustrations for Kitty Bluff (Strictly 0 Emojis)
 */
export function BluffCardArtSvg({
  kind,
  size = 38,
}: {
  kind: 'fish' | 'thief' | 'monarch' | 'shield' | 'mystery';
  size?: number;
}) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      {kind === 'fish' ? (
        <>
          <circle cx="24" cy="24" r="19" fill="#E0F2FE" stroke="#5B2A4E" strokeWidth="2.4" />
          <path
            d="M32 24 L40 16.5 V31.5 L32 24 Z"
            fill="#FF6B9A"
            stroke="#5B2A4E"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <ellipse
            cx="21"
            cy="24"
            rx="12.5"
            ry="8.5"
            fill="#38BDF8"
            stroke="#5B2A4E"
            strokeWidth="2.4"
          />
          <path
            d="M24 17.5 Q20.5 24 24 30.5"
            fill="none"
            stroke="#BAE6FD"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="14.5" cy="22" r="2" fill="#5B2A4E" />
          <circle cx="13.9" cy="21.3" r="0.75" fill="#ffffff" />
          <ellipse cx="16.5" cy="26" rx="2" ry="1.1" fill="#FF8FAB" />
        </>
      ) : kind === 'thief' ? (
        <>
          <circle cx="24" cy="24" r="19" fill="#F3E8FF" stroke="#5B2A4E" strokeWidth="2.4" />
          {/* Cat Head Silhouette */}
          <path
            d="M12 22 C10.5 13, 14.5 10, 18.5 15 C22 14, 26 14, 29.5 15 C33.5 10, 37.5 13, 36 22 C38 29, 34 36, 24 36 C14 36, 10 29, 12 22 Z"
            fill="#FFB74D"
            stroke="#5B2A4E"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Bandit Domino Mask */}
          <path
            d="M11.5 22.5 C14 19, 19.5 19.5, 24 21.5 C28.5 19.5, 34 19, 36.5 22.5 C35.5 26.8, 30 27.5, 26.2 25.5 C24.8 24.8, 23.2 24.8, 21.8 25.5 C18 27.5, 12.5 26.8, 11.5 22.5 Z"
            fill="#5B2A4E"
          />
          {/* Sly Glowing Eyes inside Mask */}
          <path d="M15.5 23 L20.5 21.8 L19.5 24.5 Z" fill="#FFBE0B" />
          <path d="M32.5 23 L27.5 21.8 L28.5 24.5 Z" fill="#FFBE0B" />
          {/* Cheeky W-Smirk */}
          <path
            d="M20.5 30 Q22.2 31.8 24 30 Q25.8 31.8 27.5 30"
            fill="none"
            stroke="#5B2A4E"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : kind === 'monarch' ? (
        <>
          <circle cx="24" cy="24" r="19" fill="#FEF3C7" stroke="#5B2A4E" strokeWidth="2.4" />
          {/* Royal Velvet Cushion Base */}
          <rect
            x="11"
            y="29"
            width="26"
            height="6.5"
            rx="3.2"
            fill="#FF4D6D"
            stroke="#5B2A4E"
            strokeWidth="2.2"
          />
          {/* Golden Crown */}
          <path
            d="M11.5 29.5 L9.5 16.5 L17.5 22 L24 12.5 L30.5 22 L38.5 16.5 L36.5 29.5 Z"
            fill="#FFBE0B"
            stroke="#5B2A4E"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="23.5" r="2.5" fill="#FF4D6D" stroke="#5B2A4E" strokeWidth="1.5" />
          <circle cx="16.8" cy="25" r="1.8" fill="#38BDF8" />
          <circle cx="31.2" cy="25" r="1.8" fill="#38BDF8" />
        </>
      ) : kind === 'shield' ? (
        <>
          <circle cx="24" cy="24" r="19" fill="#DCFCE7" stroke="#5B2A4E" strokeWidth="2.4" />
          {/* Protective Shield Crest */}
          <path
            d="M24 9.5 L36.5 14 V23.5 C36.5 31.8, 30.8 37, 24 39.2 C17.2 37, 11.5 31.8, 11.5 23.5 V14 Z"
            fill="#2EC4B6"
            stroke="#5B2A4E"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Cozy Yarn Heart Center */}
          <circle
            cx="24"
            cy="23.8"
            r="6.8"
            fill="#FF8FAB"
            stroke="#5B2A4E"
            strokeWidth="2"
          />
          <path
            d="M19.5 21.5 Q24 25.5 28.5 21.5 M19.5 25.5 Q24 21.5 28.5 25.5"
            fill="none"
            stroke="#FFF8F2"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="24" cy="24" r="19" fill="#FCE7F3" stroke="#5B2A4E" strokeWidth="2.4" />
          <ellipse cx="24" cy="27" rx="6.5" ry="5.2" fill="#FF6B9A" stroke="#5B2A4E" strokeWidth="2" />
          {[[15.5, 19.5], [20.8, 16], [27.2, 16], [32.5, 19.5]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2.8" fill="#FF6B9A" stroke="#5B2A4E" strokeWidth="1.8" />
          ))}
          <text
            x="24"
            y="29.8"
            textAnchor="middle"
            fill="#FFF8F2"
            fontSize="9.5"
            fontWeight="900"
          >
            ?
          </text>
        </>
      )}
    </svg>
  );
}

export function AccessoryBadgeIcon({ accessory, size = 22 }: { accessory: CatAccessoryId; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {accessory === 'crown' ? (
        <>
          <path d="M3 18h18l1.2-9.5-5.2 3.6L12 5 7 12.1 1.8 8.5 3 18z" fill="#FFBE0B" stroke="#5B2A4E" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="13.5" r="1.6" fill="#FF4D6D" />
        </>
      ) : accessory === 'ribbon' ? (
        <>
          <path d="M4.5 7.5c0-2 3.8-1 7.5 2.8 3.7-3.8 7.5-4.8 7.5-2.8v9c0 2-3.8 1-7.5-2.8-3.7 3.8-7.5 4.8-7.5 2.8v-9z" fill="#FF4D6D" stroke="#5B2A4E" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.5" fill="#FFB3C1" stroke="#5B2A4E" strokeWidth="1.8" />
        </>
      ) : accessory === 'sakura' ? (
        <>
          <path d="M12 4.2a3.2 3.2 0 0 1 2.7 4.6 3.2 3.2 0 0 1 4 4 3.2 3.2 0 0 1-2.6 5.2 3.2 3.2 0 0 1-4.1 0 3.2 3.2 0 0 1-2.6-5.2 3.2 3.2 0 0 1 4-4A3.2 3.2 0 0 1 12 4.2z" fill="#FFB3C1" stroke="#5B2A4E" strokeWidth="1.9" strokeLinejoin="round" />
          <circle cx="12" cy="12.2" r="2.2" fill="#FFBE0B" />
        </>
      ) : accessory === 'sunglasses' ? (
        <>
          <rect x="2" y="8.5" width="8.5" height="6.5" rx="2.2" fill="#334155" stroke="#5B2A4E" strokeWidth="2" />
          <rect x="13.5" y="8.5" width="8.5" height="6.5" rx="2.2" fill="#334155" stroke="#5B2A4E" strokeWidth="2" />
          <path d="M10.5 11.2h3" stroke="#FFBE0B" strokeWidth="2.2" />
          <line x1="4" y1="10.2" x2="6.5" y2="13" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="15.5" y1="10.2" x2="18" y2="13" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="12" cy="15" rx="4.2" ry="3.4" fill="#FFE5EC" stroke="#5B2A4E" strokeWidth="1.9" />
          {[7, 10.3, 13.7, 17].map((cx, i) => (
            <circle key={i} cx={cx} cy={i === 0 || i === 3 ? 10 : 7.8} r="1.7" fill="#FF8FAB" stroke="#5B2A4E" strokeWidth="1.5" />
          ))}
        </>
      )}
    </svg>
  );
}

/**
 * Custom Vector Illustrations for Snakes & Ladders Powerups & Rules
 */
export function PowerupIllustrationSvg({
  kind,
  size = 48,
}: {
  kind:
    | 'double_dice'
    | 'boost'
    | 'shield_gain'
    | 'shield_saved'
    | 'extra_roll'
    | 'swap';
  size?: number;
}) {
  const bg =
    kind === 'double_dice'
      ? '#FEF3C7'
      : kind === 'boost'
      ? '#DCFCE7'
      : kind === 'shield_gain' || kind === 'shield_saved'
      ? '#E0F2FE'
      : kind === 'extra_roll'
      ? '#FCE7F3'
      : '#F3E8FF';

  return (
    <svg viewBox="0 0 56 56" width={size} height={size} aria-hidden="true">
      <circle cx="28" cy="28" r="24" fill={bg} stroke="#5B2A4E" strokeWidth="2.8" />
      {kind === 'double_dice' ? (
        <>
          <g transform="translate(6, 12) rotate(-12 12 12)">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="#FFBE0B" stroke="#5B2A4E" strokeWidth="2.4" />
            <circle cx="8" cy="8" r="2" fill="#5B2A4E" />
            <circle cx="16" cy="16" r="2" fill="#5B2A4E" />
          </g>
          <g transform="translate(24, 15) rotate(12 12 12)">
            <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF6B9A" stroke="#5B2A4E" strokeWidth="2.4" />
            {[[7.5, 7.5], [16.5, 7.5], [12, 12], [7.5, 16.5], [16.5, 16.5]].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="1.8" fill="#FFF8F2" />
            ))}
          </g>
        </>
      ) : kind === 'boost' ? (
        <>
          <path d="M 16 36 C 16 20, 28 12, 40 14 C 38 28, 30 38, 16 36 Z" fill="#10B981" stroke="#5B2A4E" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 16 36 Q 26 26 36 18" fill="none" stroke="#A7F3D0" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 14 42 L 22 34 M 24 44 L 30 38" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
        </>
      ) : kind === 'shield_gain' || kind === 'shield_saved' ? (
        <>
          <path d="M 28 11 L 42 16 V 27 C 42 36.5, 35.5 42.5, 28 45 C 20.5 42.5, 14 36.5, 14 27 V 16 Z" fill="#2EC4B6" stroke="#5B2A4E" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 28 15.5 L 37.5 19 V 26.5 C 37.5 33, 33 37.5, 28 39.5" fill="none" stroke="#A5F3FC" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="27" r="4.5" fill="#FFF8F2" />
        </>
      ) : kind === 'extra_roll' ? (
        <>
          <ellipse cx="28" cy="33" rx="8.5" ry="6.8" fill="#FFBE0B" stroke="#5B2A4E" strokeWidth="2.4" />
          {[[17.5, 23.5], [24, 18.5], [32, 18.5], [38.5, 23.5]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3.8" fill="#FFBE0B" stroke="#5B2A4E" strokeWidth="2.2" />
          ))}
        </>
      ) : (
        <path d="M 16 22 H 38 L 33 16 M 40 34 H 18 L 23 40" fill="none" stroke="#A855F7" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * Compositor-Only Confetti Burst Overlay for Winning Celebrations
 */
const CONFETTI_PIECES: readonly [string, string, string, string][] = [
  ['8%', '0s', '#FF6B9A', '-25deg'],
  ['18%', '0.15s', '#FFBE0B', '20deg'],
  ['28%', '0.05s', '#2EC4B6', '-15deg'],
  ['38%', '0.25s', '#A855F7', '35deg'],
  ['48%', '0.1s', '#FF4D6D', '-30deg'],
  ['58%', '0.3s', '#38BDF8', '18deg'],
  ['68%', '0.08s', '#10B981', '-22deg'],
  ['78%', '0.2s', '#FB923C', '28deg'],
  ['88%', '0.12s', '#FF6B9A', '-18deg'],
  ['94%', '0.28s', '#FFBE0B', '24deg'],
];

export function ConfettiCelebrationOverlay() {
  return (
    <div className="victory-confetti-layer" aria-hidden="true">
      {CONFETTI_PIECES.map(([x, delay, color, rot], idx) => (
        <span
          key={idx}
          className="confetti-ribbon"
          style={{
            left: x,
            backgroundColor: color,
            animationDelay: delay,
            transform: `rotate(${rot})`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Finch-style Lineless Pastel Cat Reaction Stickers (with subtle compositor animation)
 */
const CAT_HEAD_PATH =
  'M7 16 C6 9 9 5 13 9 C16 8 20 8 23 9 C27 5 30 9 29 16 C31 22 27 29 18 29 C9 29 5 22 7 16 Z';

export function ReactionStickerSvg({
  id,
  size = 26,
  animated = false,
}: {
  id: ReactionStickerId;
  size?: number;
  animated?: boolean;
}) {
  const isHead = id === 'love' || id === 'joy' || id === 'cry';
  const headFill = id === 'love' ? '#ff8fab' : id === 'joy' ? '#ffbe0b' : '#94a3b8';
  const headBelly = id === 'love' ? '#ffe5ec' : id === 'joy' ? '#fff8f0' : '#f1f5f9';
  const circleFill = id === 'paws' ? '#ffe5ec' : id === 'fish' ? '#e0f2fe' : '#fff0f3';

  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={animated ? 'sticker-anim-bob' : undefined}
      aria-hidden="true"
    >
      {isHead ? (
        <>
          <path d={CAT_HEAD_PATH} fill={headFill} stroke="#5B2A4E" strokeWidth="1.6" />
          <ellipse cx="18" cy="21" rx={id === 'cry' ? 8.2 : 8.5} ry={id === 'cry' ? 6 : 6.2} fill={headBelly} />
          {id === 'love' ? (
            <>
              {[13, 23].map((cx) => (
                <path
                  key={cx}
                  d={`M${cx} 18.5s-2.8-1.6-2.8-3.5a1.5 1.5 0 0 1 2.8-.9 1.5 1.5 0 0 1 2.8.9c0 1.9-2.8 3.5-2.8 3.5z`}
                  fill="#e63946"
                />
              ))}
              <path d="M15.8 21.5 Q16.9 23 18 21.5 Q19.1 23 20.2 21.5" fill="none" stroke="#5e3023" strokeWidth="1.4" strokeLinecap="round" />
            </>
          ) : id === 'joy' ? (
            <>
              <path d="M11 16.5 Q13 14 15 16.5M21 16.5 Q23 14 25 16.5" fill="none" stroke="#432818" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14.5 20.2 H21.5 Q18 25.5 14.5 20.2 Z" fill="#ff4d6d" />
              {[9, 27].map((cx) => (
                <circle key={cx} cx={cx} cy={18.5} r="1.9" fill="#38bdf8" />
              ))}
            </>
          ) : (
            <>
              {[13, 23].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy={16.5} r="2" fill="#1e293b" />
                  <circle cx={cx - 0.6} cy={15.8} r="0.7" fill="#ffffff" />
                  <rect x={cx - 1.2} y={18.5} width="2.2" height="5.5" rx="1.1" fill="#38bdf8" />
                </g>
              ))}
              <path d="M15.5 22.8 Q18 20.8 20.5 22.8" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </>
      ) : (
        <>
          <circle cx="18" cy="18" r="14" fill={circleFill} stroke="#5B2A4E" strokeWidth="1.6" />
          {id === 'paws' ? (
            <>
              <ellipse cx="18" cy="21" rx="5.5" ry="4.5" fill="#ff4d6d" />
              {[[11.5, 14.5], [15.6, 11.6], [20.4, 11.6], [24.5, 14.5]].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2.4" fill="#ff4d6d" />
              ))}
            </>
          ) : id === 'fish' ? (
            <>
              <path d="M24 18l5.5-4.5v9L24 18z" fill="#0284c7" />
              <ellipse cx="16.5" cy="18" rx="8.5" ry="5.5" fill="#38bdf8" />
              <circle cx="12" cy="16.8" r="1.3" fill="#0f172a" />
              <ellipse cx="13.5" cy="19.2" rx="1.4" ry="0.8" fill="#ff758f" opacity="0.8" />
            </>
          ) : (
            <>
              <path d="M18 27.5s-9.5-5.6-9.5-12.2A5.2 5.2 0 0 1 18 11.5a5.2 5.2 0 0 1 9.5 3.8c0 6.6-9.5 12.2-9.5 12.2z" fill="#ff4d6d" />
              <circle cx="13.5" cy="14.5" r="1.6" fill="#ffb3c1" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
