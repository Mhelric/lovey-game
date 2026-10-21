import { useEffect, useState } from 'preact/hooks';
import {
  FloatingReaction,
  GameMode,
  PlayerSlot,
  QUICK_EMOJIS,
} from './types/arcade';

function MiniCatAvatar({
  furColor,
  earColor,
  crown,
}: {
  furColor: string;
  earColor: string;
  crown?: boolean;
}) {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
      <g className="cat-ear-anim">
        <polygon points="5,14 7,4 14,10" fill={furColor} />
        <polygon points="7,12 8,6 12,10" fill={earColor} />
      </g>
      <polygon points="27,14 25,4 18,10" fill={furColor} />
      <polygon points="25,12 24,6 20,10" fill={earColor} />
      <circle cx="16" cy="18" r="10" fill={furColor} />
      <g className="cat-eyes-anim">
        <circle cx="12.5" cy="16.5" r="1.6" fill="#2b1810" />
        <circle cx="19.5" cy="16.5" r="1.6" fill="#2b1810" />
      </g>
      <polygon points="16,18.5 14.6,20.2 17.4,20.2" fill="#ff758f" />
      <ellipse cx="10.5" cy="19.5" rx="1.8" ry="1" fill="#ffb3c1" opacity="0.7" />
      <ellipse cx="21.5" cy="19.5" rx="1.8" ry="1" fill="#ffb3c1" opacity="0.7" />
      {crown && (
        <polygon
          points="11,9 13,4 16,7 19,4 21,9"
          fill="#ffbe0b"
          stroke="#b67d00"
          strokeWidth="0.8"
        />
      )}
    </svg>
  );
}

function DamaPreviewBoard() {
  const squares = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isPlayable = (r + c) % 2 === 1;
      squares.push(
        <rect
          key={`${r}-${c}`}
          x={c * 12.5}
          y={r * 12.5}
          width="12.5"
          height="12.5"
          fill={isPlayable ? '#e6ccb2' : '#ddb892'}
        />
      );
    }
  }

  return (
    <svg viewBox="0 0 100 100" className="board-svg" role="img" aria-label="Filipino Dama 8x8 Board">
      {/* 8x8 Checker Grid */}
      {squares}

      {/* Traditional Filipino Dama Diagonal Guide Lines on Playable Squares */}
      <g stroke="#9c6644" strokeWidth="0.55" opacity="0.55">
        <line x1="18.75" y1="6.25" x2="6.25" y2="18.75" />
        <line x1="43.75" y1="6.25" x2="6.25" y2="43.75" />
        <line x1="68.75" y1="6.25" x2="6.25" y2="68.75" />
        <line x1="93.75" y1="6.25" x2="6.25" y2="93.75" />
        <line x1="93.75" y1="31.25" x2="31.25" y2="93.75" />
        <line x1="93.75" y1="56.25" x2="56.25" y2="93.75" />
        <line x1="93.75" y1="81.25" x2="81.25" y2="93.75" />

        <line x1="81.25" y1="6.25" x2="93.75" y2="18.75" />
        <line x1="56.25" y1="6.25" x2="93.75" y2="43.75" />
        <line x1="31.25" y1="6.25" x2="93.75" y2="68.75" />
        <line x1="6.25" y1="6.25" x2="93.75" y2="93.75" />
        <line x1="6.25" y1="31.25" x2="68.75" y2="93.75" />
        <line x1="6.25" y1="56.25" x2="43.75" y2="93.75" />
        <line x1="6.25" y1="81.25" x2="18.75" y2="93.75" />
      </g>

      {/* Sample Cartoon Cat Pieces Preview */}
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4, 5, 6, 7]
          .filter((c) => (r + c) % 2 === 1)
          .map((c) => {
            const cx = c * 12.5 + 6.25;
            const cy = r * 12.5 + 6.25;
            return (
              <g key={`p2-${r}-${c}`} transform={`translate(${cx}, ${cy})`}>
                <circle r="4.6" fill="#ff9f1c" stroke="#7f4f24" strokeWidth="0.6" />
                <polygon points="-3.4,-2.5 -2.2,-5.4 -0.6,-3.2" fill="#ff9f1c" />
                <polygon points="3.4,-2.5 2.2,-5.4 0.6,-3.2" fill="#ff9f1c" />
                <circle cx="-1.4" cy="-0.4" r="0.6" fill="#2b1810" />
                <circle cx="1.4" cy="-0.4" r="0.6" fill="#2b1810" />
              </g>
            );
          })
      )}

      {[5, 6, 7].map((r) =>
        [0, 1, 2, 3, 4, 5, 6, 7]
          .filter((c) => (r + c) % 2 === 1)
          .map((c) => {
            const cx = c * 12.5 + 6.25;
            const cy = r * 12.5 + 6.25;
            return (
              <g key={`p1-${r}-${c}`} transform={`translate(${cx}, ${cy})`}>
                <circle r="4.6" fill="#ff758f" stroke="#800f2f" strokeWidth="0.6" />
                <polygon points="-3.4,-2.5 -2.2,-5.4 -0.6,-3.2" fill="#ff758f" />
                <polygon points="3.4,-2.5 2.2,-5.4 0.6,-3.2" fill="#ff758f" />
                <circle cx="-1.4" cy="-0.4" r="0.6" fill="#2b1810" />
                <circle cx="1.4" cy="-0.4" r="0.6" fill="#2b1810" />
              </g>
            );
          })
      )}
    </svg>
  );
}

function SnakesPreviewBoard() {
  const cells = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const rowFromBottom = 9 - r;
      const num =
        rowFromBottom % 2 === 0
          ? rowFromBottom * 10 + c + 1
          : rowFromBottom * 10 + (10 - c);
      const isEven = (r + c) % 2 === 0;
      cells.push(
        <g key={num}>
          <rect
            x={c * 10}
            y={r * 10}
            width="10"
            height="10"
            fill={isEven ? '#fff8f0' : '#fde2e4'}
            stroke="#f0d4b8"
            strokeWidth="0.25"
          />
          <text
            x={c * 10 + 1.4}
            y={r * 10 + 3.2}
            fontSize="2.2"
            fontWeight="700"
            fill="#9c6644"
          >
            {num}
          </text>
        </g>
      );
    }
  }

  return (
    <svg viewBox="0 0 100 100" className="board-svg" role="img" aria-label="Snakes and Ladders 10x10 Board">
      {cells}
      {/* Classic Wooden Ladder Preview */}
      <g stroke="#8b5a2b" strokeWidth="1.1" strokeLinecap="round">
        <line x1="23" y1="85" x2="43" y2="45" />
        <line x1="27" y1="85" x2="47" y2="45" />
        <line x1="25" y1="78" x2="29" y2="78" strokeWidth="0.8" />
        <line x1="29" y1="70" x2="33" y2="70" strokeWidth="0.8" />
        <line x1="33" y1="62" x2="37" y2="62" strokeWidth="0.8" />
        <line x1="37" y1="54" x2="41" y2="54" strokeWidth="0.8" />
      </g>
      {/* Classic Colorful Cartoon Snake Preview */}
      <path
        d="M 75 25 C 62 35, 85 50, 68 62 C 55 70, 75 78, 65 86"
        fill="none"
        stroke="#2ec4b6"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="75" cy="25" r="2.3" fill="#2ec4b6" />
    </svg>
  );
}

export function App() {
  const [mode, setMode] = useState<GameMode>('dama');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 640,
  });

  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const triggerReaction = (emoji: string, sender: PlayerSlot = 'p1') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setReactions((prev) => [
      ...prev.slice(-5),
      { id, sender, content: emoji, kind: 'emoji', createdAt: Date.now() },
    ]);
    window.setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== id));
    }, 1850);
  };

  return (
    <main className="arcade-shell">
      {/* Zone 1: Top Couple Status & Mode Switcher */}
      <header className="top-bar">
        <div className="couple-row">
          <div className="player-pill">
            <div className="cat-badge">
              <MiniCatAvatar furColor="#ff758f" earColor="#ffb3c1" crown />
              <span className="online-dot" title="Online" />
            </div>
            <div className="player-meta">
              <span className="player-name">Strawberry Cat</span>
              <span className="player-score">P1 • Ready</span>
            </div>
          </div>

          <div className="room-center-pill">
            <span className="room-code-label">🐾 LOVEY</span>
            <span className="viewport-tag">
              {viewport.w}×{viewport.h}
            </span>
          </div>

          <div className="player-pill right">
            <div className="cat-badge">
              <MiniCatAvatar furColor="#ff9f1c" earColor="#ffe5ec" />
              <span className="online-dot" title="Online" />
            </div>
            <div className="player-meta">
              <span className="player-name">Orange Tabby</span>
              <span className="player-score">P2 • Ready</span>
            </div>
          </div>
        </div>

        <nav className="mode-tabs" aria-label="Game Switcher">
          <button
            type="button"
            className={`mode-tab ${mode === 'dama' ? 'active' : ''}`}
            onClick={() => setMode('dama')}
          >
            <span>👑</span>
            <span>Filipino Dama</span>
          </button>
          <button
            type="button"
            className={`mode-tab ${mode === 'snakes' ? 'active' : ''}`}
            onClick={() => setMode('snakes')}
          >
            <span>🐍</span>
            <span>Snakes & Ladders</span>
          </button>
        </nav>
      </header>

      {/* Zone 2: Square Responsive Vector Board Stage */}
      <section className="board-stage">
        {mode === 'dama' ? <DamaPreviewBoard /> : <SnakesPreviewBoard />}
        <div className="shell-overlay-banner">
          {mode === 'dama'
            ? 'Filipino Dama 8×8 Shell Ready'
            : 'Seeded Snakes & Ladders 10×10 Shell Ready'}
        </div>
      </section>

      {/* Floating Compositor Emoji/Chat Layer */}
      <div className="floating-layer" aria-live="polite">
        {reactions.map((item) => (
          <div
            key={item.id}
            className={`floating-bubble from-${item.sender}`}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Zone 3: Persistent Couple Quick Reactions Bar (>= 42x42px targets) */}
      <footer className="bottom-bar" aria-label="Quick Couple Reactions">
        {QUICK_EMOJIS.map((emoji, idx) => (
          <button
            key={emoji}
            type="button"
            className="emoji-btn"
            onClick={() => triggerReaction(emoji, idx % 2 === 0 ? 'p1' : 'p2')}
            aria-label={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </footer>
    </main>
  );
}
