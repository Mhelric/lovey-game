import { CatAccessoryId, ReactionStickerId } from '../types/arcade';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Chunky Sticker-Cartoony "LOVEY GAME" Logo with Perched Crown
 */
export function LoveyLogoWordmarkSvg() {
  return (
    <div className="chunky-logo-badge" aria-label="Lovey Game">
      <span className="logo-perched-crown" aria-hidden="true">
        <svg viewBox="0 0 32 22" width="28" height="20">
          <path
            d="M3 19h26l2-13-7.5 5L16 2 8.5 11 1 6l2 13z"
            fill="#FFBE0B"
            stroke="#5B2A4E"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="13" r="2.1" fill="#FF4D6D" />
        </svg>
      </span>
      <span className="chunky-logo-text">LOVEY GAME</span>
    </div>
  );
}

export function SettingsGearIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Clean Chunky Cartoon Paw Icon with Plum Outline */}
      <ellipse
        cx="12"
        cy="15.2"
        rx="5"
        ry="4.1"
        fill="#FF6B9A"
        stroke="#5B2A4E"
        strokeWidth="2"
      />
      <circle
        cx="6.4"
        cy="9.8"
        r="2.2"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <circle
        cx="10.1"
        cy="7.2"
        r="2.2"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <circle
        cx="13.9"
        cy="7.2"
        r="2.2"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
      <circle
        cx="17.6"
        cy="9.8"
        r="2.2"
        fill="#FFD6E4"
        stroke="#5B2A4E"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ExitDoorIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M9 12h10m0 0l-3.5-3.5M19 12l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        strokeWidth="2.4"
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
      <circle cx="12" cy="12" r="9.5" fill="#10b981" />
      <path
        d="M8 12.3l2.6 2.6 5.4-5.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.3"
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
      <circle cx="12" cy="12" r="9.5" fill="#ef4444" />
      <path
        d="M12 7.5v5.5M12 16.5h.01"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DiceFaceSvg({
  value,
  size = 24,
}: {
  value: number;
  size?: number;
}) {
  const dots: Record<number, [number, number][]> = {
    1: [[12, 12]],
    2: [
      [7.5, 7.5],
      [16.5, 16.5],
    ],
    3: [
      [7, 7],
      [12, 12],
      [17, 17],
    ],
    4: [
      [7.5, 7.5],
      [16.5, 7.5],
      [7.5, 16.5],
      [16.5, 16.5],
    ],
    5: [
      [7.5, 7.5],
      [16.5, 7.5],
      [12, 12],
      [7.5, 16.5],
      [16.5, 16.5],
    ],
    6: [
      [7.5, 6.8],
      [16.5, 6.8],
      [7.5, 12],
      [16.5, 12],
      [7.5, 17.2],
      [16.5, 17.2],
    ],
  };
  const activeDots = dots[value] || dots[6];
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5.5"
        fill="#ffffff"
        stroke="#5B2A4E"
        stroke-width="2.4"
      />
      {activeDots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.95" fill="#5B2A4E" />
      ))}
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
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" fill="#ffbe0b" />
      <path
        d="M6 5H3.5A1.5 1.5 0 0 0 2 6.5v1A3.5 3.5 0 0 0 5.5 11H6.3M18 5h2.5A1.5 1.5 0 0 1 22 6.5v1A3.5 3.5 0 0 1 18.5 11h-.8"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="10.2" y="14.5" width="3.6" height="4.2" rx="1" fill="#f59e0b" />
      <rect x="7" y="18.2" width="10" height="3" rx="1.5" fill="#d97706" />
      <circle cx="10" cy="8" r="1.2" fill="#fffbeb" opacity="0.85" />
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
        d="M3.5 18.5h17l1.5-10.5-5.5 3.8L12 5l-4.5 6.8L2 8l1.5 10.5z"
        fill="#ffbe0b"
        stroke="#d97706"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.8" r="1.6" fill="#ff4d6d" />
      <circle cx="7.2" cy="14.4" r="1.2" fill="#38bdf8" />
      <circle cx="16.8" cy="14.4" r="1.2" fill="#38bdf8" />
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
        d="M12 20.5s-8-4.8-8-10.8A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8 3.4c0 6-8 10.8-8 10.8z"
        fill="#ff4d6d"
      />
      <ellipse
        cx="8.5"
        cy="8.8"
        rx="1.6"
        ry="1"
        transform="rotate(-25 8.5 8.8)"
        fill="#ffb3c1"
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
        fill="#ff758f"
      />
      <path
        d="M16.2 15.5s-4.8-2.9-4.8-6.4a2.8 2.8 0 0 1 4.8-2 2.8 2.8 0 0 1 4.8 2c0 3.5-4.8 6.4-4.8 6.4z"
        fill="#ff4d6d"
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
      <ellipse cx="12" cy="15.2" rx="4.6" ry="3.8" fill="currentColor" />
      <circle cx="6.8" cy="10.2" r="2.1" fill="currentColor" />
      <circle cx="10.2" cy="7.6" r="2.1" fill="currentColor" />
      <circle cx="13.8" cy="7.6" r="2.1" fill="currentColor" />
      <circle cx="17.2" cy="10.2" r="2.1" fill="currentColor" />
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
        d="M12 2.5 L14.4 9.6 L21.5 12 L14.4 14.4 L12 21.5 L9.6 14.4 L2.5 12 L9.6 9.6 Z"
        fill="#ffbe0b"
      />
      <circle cx="18.5" cy="5.5" r="1.6" fill="#ff758f" />
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
        fill="#ff758f"
      />
      {muted ? (
        <path
          d="M16.5 9.5l4.5 5m0-5l-4.5 5"
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16.5 8.5a5 5 0 0 1 0 7m2.8-9.5a8.5 8.5 0 0 1 0 12"
          fill="none"
          stroke="#2ec4b6"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function ModeLiveIcon({
  passAndPlay,
  size = 15,
}: {
  passAndPlay: boolean;
  size?: number;
}) {
  if (passAndPlay) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <rect x="6" y="2.5" width="12" height="19" rx="3" fill="#ff9f1c" />
        <rect x="8" y="5" width="8" height="12.5" rx="1.2" fill="#fff8f0" />
        <circle cx="12" cy="19.3" r="1" fill="#fff8f0" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#38bdf8" />
      <path
        d="M3.6 12h16.8M12 3.2c2.5 2.6 3.8 5.6 3.8 8.8s-1.3 6.2-3.8 8.8c-2.5-2.6-3.8-5.6-3.8-8.8S9.5 5.8 12 3.2z"
        fill="none"
        stroke="#e0f2fe"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function ResetIcon({ size = 15 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <polygon points="3,7.5 8.5,7.5 5.5,12.5" fill="currentColor" />
    </svg>
  );
}

export function HomeMenuIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M3.5 11.2L12 4l8.5 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-4.8v-5.5H9.8V21H5a1.5 1.5 0 0 1-1.5-1.5v-8.3z"
        fill="#ff758f"
      />
    </svg>
  );
}

export function TutorialBookIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v16H5.5A2.5 2.5 0 0 0 3 21.5v-16z"
        fill="#38bdf8"
      />
      <path
        d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v16h5.5a2.5 2.5 0 0 1 2.5 2.5v-16z"
        fill="#0ea5e9"
      />
      <circle cx="12" cy="11" r="2.2" fill="#fffbeb" />
    </svg>
  );
}

export function CopyIcon({ size = 15 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="8" y="8" width="12" height="13" rx="2.5" fill="#ff758f" />
      <path
        d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V6"
        fill="none"
        stroke="#fb6f92"
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
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatBubbleIcon({ size = 22 }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" width={size} height={size} aria-hidden="true">
      <path
        d="M5 6.5h18A2.5 2.5 0 0 1 25.5 9v10a2.5 2.5 0 0 1-2.5 2.5H11l-5.2 3.8V21.5H5A2.5 2.5 0 0 1 2.5 19V9A2.5 2.5 0 0 1 5 6.5z"
        fill="#ffffff"
      />
      <circle cx="10" cy="14" r="1.7" fill="#ec4899" />
      <circle cx="14" cy="14" r="1.7" fill="#ec4899" />
      <circle cx="18" cy="14" r="1.7" fill="#ec4899" />
    </svg>
  );
}

export function SnakeLadderIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M5 19c0-4 6-4 6-8s-5-4-5-7c0-2 2.5-3 5-1.5"
        fill="none"
        stroke="#2ec4b6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M15 4v16M20 4v16M15 8h5M15 12h5M15 16h5"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AccessoryBadgeIcon({
  accessory,
  size = 18,
}: {
  accessory: CatAccessoryId;
  size?: number;
}) {
  switch (accessory) {
    case 'crown':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 18h18l1.2-9.5-5.2 3.6L12 5.5 7 12.1 1.8 8.5 3 18z" />
        </svg>
      );
    case 'ribbon':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4.5 7.5c0-2 3.8-1 7.5 2.8 3.7-3.8 7.5-4.8 7.5-2.8v9c0 2-3.8 1-7.5-2.8-3.7 3.8-7.5 4.8-7.5 2.8v-9z" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );
    case 'sakura':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4.5a3 3 0 0 1 2.6 4.5 3 3 0 0 1 3.9 3.9 3 3 0 0 1-2.5 5.1 3 3 0 0 1-4 0 3 3 0 0 1-2.5-5.1 3 3 0 0 1 3.9-3.9A3 3 0 0 1 12 4.5z" />
        </svg>
      );
    case 'sunglasses':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2.5" y="9" width="7.5" height="5.5" rx="2" />
          <rect x="14" y="9" width="7.5" height="5.5" rx="2" />
          <path d="M10 11h4" />
        </svg>
      );
    case 'none':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="15" rx="4.2" ry="3.4" />
          <circle cx="7" cy="10" r="1.6" />
          <circle cx="10.3" cy="7.8" r="1.6" />
          <circle cx="13.7" cy="7.8" r="1.6" />
          <circle cx="17" cy="10" r="1.6" />
        </svg>
      );
  }
}

/**
 * Finch-style Lineless Pastel Cat Reaction Stickers (with subtle compositor animation)
 */
export function ReactionStickerSvg({
  id,
  size = 26,
  animated = false,
}: {
  id: ReactionStickerId;
  size?: number;
  animated?: boolean;
}) {
  const cls = animated ? 'sticker-anim-bob' : undefined;
  switch (id) {
    case 'love':
      return (
        <svg
          viewBox="0 0 36 36"
          width={size}
          height={size}
          className={cls}
          aria-hidden="true"
        >
          <path
            d="M7 16 C6 9 9 5 13 9 C16 8 20 8 23 9 C27 5 30 9 29 16 C31 22 27 29 18 29 C9 29 5 22 7 16 Z"
            fill="#ff8fab"
          />
          <ellipse cx="18" cy="21" rx="8.5" ry="6.2" fill="#ffe5ec" />
          <path
            d="M13 18.5s-2.8-1.6-2.8-3.5a1.5 1.5 0 0 1 2.8-.9 1.5 1.5 0 0 1 2.8.9c0 1.9-2.8 3.5-2.8 3.5z"
            fill="#e63946"
          />
          <path
            d="M23 18.5s-2.8-1.6-2.8-3.5a1.5 1.5 0 0 1 2.8-.9 1.5 1.5 0 0 1 2.8.9c0 1.9-2.8 3.5-2.8 3.5z"
            fill="#e63946"
          />
          <path
            d="M15.8 21.5 Q16.9 23 18 21.5 Q19.1 23 20.2 21.5"
            fill="none"
            stroke="#5e3023"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'joy':
      return (
        <svg
          viewBox="0 0 36 36"
          width={size}
          height={size}
          className={cls}
          aria-hidden="true"
        >
          <path
            d="M7 16 C6 9 9 5 13 9 C16 8 20 8 23 9 C27 5 30 9 29 16 C31 22 27 29 18 29 C9 29 5 22 7 16 Z"
            fill="#ffbe0b"
          />
          <ellipse cx="18" cy="21" rx="8.5" ry="6.2" fill="#fff8f0" />
          <path
            d="M11 16.5 Q13 14 15 16.5M21 16.5 Q23 14 25 16.5"
            fill="none"
            stroke="#432818"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M14.5 20.2 H21.5 Q18 25.5 14.5 20.2 Z" fill="#ff4d6d" />
          <Drop cx={9} cy={18.5} />
          <Drop cx={27} cy={18.5} />
        </svg>
      );
    case 'cry':
      return (
        <svg
          viewBox="0 0 36 36"
          width={size}
          height={size}
          className={cls}
          aria-hidden="true"
        >
          <path
            d="M7 16 C6 9 9 5 13 9 C16 8 20 8 23 9 C27 5 30 9 29 16 C31 22 27 29 18 29 C9 29 5 22 7 16 Z"
            fill="#94a3b8"
          />
          <ellipse cx="18" cy="21" rx="8.2" ry="6" fill="#f1f5f9" />
          <circle cx="13" cy="16.5" r="2" fill="#1e293b" />
          <circle cx="23" cy="16.5" r="2" fill="#1e293b" />
          <circle cx="12.4" cy="15.8" r="0.7" fill="#ffffff" />
          <circle cx="22.4" cy="15.8" r="0.7" fill="#ffffff" />
          <rect
            x="11.8"
            y="18.5"
            width="2.2"
            height="5.5"
            rx="1.1"
            fill="#38bdf8"
          />
          <rect
            x="22"
            y="18.5"
            width="2.2"
            height="5.5"
            rx="1.1"
            fill="#38bdf8"
          />
          <path
            d="M15.5 22.8 Q18 20.8 20.5 22.8"
            fill="none"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'paws':
      return (
        <svg
          viewBox="0 0 36 36"
          width={size}
          height={size}
          className={cls}
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r="14" fill="#ffe5ec" />
          <ellipse cx="18" cy="21" rx="5.5" ry="4.5" fill="#ff4d6d" />
          <circle cx="11.5" cy="14.5" r="2.4" fill="#ff4d6d" />
          <circle cx="15.6" cy="11.6" r="2.4" fill="#ff4d6d" />
          <circle cx="20.4" cy="11.6" r="2.4" fill="#ff4d6d" />
          <circle cx="24.5" cy="14.5" r="2.4" fill="#ff4d6d" />
        </svg>
      );
    case 'fish':
      return (
        <svg
          viewBox="0 0 36 36"
          width={size}
          height={size}
          className={cls}
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r="14" fill="#e0f2fe" />
          <path d="M24 18l5.5-4.5v9L24 18z" fill="#0284c7" />
          <ellipse cx="16.5" cy="18" rx="8.5" ry="5.5" fill="#38bdf8" />
          <circle cx="12" cy="16.8" r="1.3" fill="#0f172a" />
          <ellipse
            cx="13.5"
            cy="19.2"
            rx="1.4"
            ry="0.8"
            fill="#ff758f"
            opacity="0.8"
          />
        </svg>
      );
    case 'heart':
    default:
      return (
        <svg
          viewBox="0 0 36 36"
          width={size}
          height={size}
          className={cls}
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r="14" fill="#fff0f3" />
          <path
            d="M18 27.5s-9.5-5.6-9.5-12.2A5.2 5.2 0 0 1 18 11.5a5.2 5.2 0 0 1 9.5 3.8c0 6.6-9.5 12.2-9.5 12.2z"
            fill="#ff4d6d"
          />
          <circle cx="13.5" cy="14.5" r="1.6" fill="#ffb3c1" />
        </svg>
      );
  }
}

function Drop({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r="1.9" fill="#38bdf8" />;
}
