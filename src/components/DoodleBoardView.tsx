import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import {
  applyAddDoodleStroke,
  applyClearDoodleStrokes,
  applyNextDoodleRound,
  applySelectDoodleWord,
  applySubmitDoodleGuess,
  applyTickDoodleTimer,
  applyUndoDoodleStroke,
  DOODLE_PALETTE,
  DOODLE_STROKE_WIDTHS,
  DoodleGameState,
  DoodlePoint,
  DoodleStroke,
  DoodleWordOption,
  getMaskedWordDisplay,
} from '../engines/doodleEngine';
import {
  ClearCanvasIcon,
  DoodleClashIcon,
  EraserIcon,
  LightbulbIcon,
  PencilIcon,
  SparkleIcon,
  TimerClockIcon,
  UndoIcon,
} from './ArcadeIcons';
import { CatAvatarSvg } from './CatAvatarSvg';
import {
  playDoodleClear,
  playDoodleCorrectGuess,
  playDoodleStrokePop,
  playDoodleWrongGuess,
  playTapPop,
} from '../services/soundEffects';

interface DoodleBoardViewProps {
  gameState: DoodleGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay?: boolean;
  onCommitState: (nextState: DoodleGameState) => void;
  onBroadcastStroke?: (stroke: DoodleStroke) => void;
  onBroadcastClear?: () => void;
}

function pointsToSvgPath(points: DoodlePoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function DoodleBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay = false,
  onCommitState,
  onBroadcastStroke,
  onBroadcastClear,
}: DoodleBoardViewProps) {
  const [currentColor, setCurrentColor] = useState<string>(DOODLE_PALETTE[0]);
  const [currentWidth, setCurrentWidth] = useState<number>(DOODLE_STROKE_WIDTHS[1].value);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [guessInputText, setGuessInputText] = useState<string>('');

  // Live active stroke while finger/pointer is down
  const [activePoints, setActivePoints] = useState<DoodlePoint[]>([]);
  const isPointerDownRef = useRef<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDrawer = passAndPlay || mySlot === gameState.drawerSlot;
  const drawerAvatar = gameState.drawerSlot === 'p1' ? p1Avatar : p2Avatar;
  const guesserAvatar = gameState.guesserSlot === 'p1' ? p1Avatar : p2Avatar;
  const drawerName = drawerAvatar.name || (gameState.drawerSlot === 'p1' ? 'Lovey 1' : 'Lovey 2');
  const guesserName = guesserAvatar.name || (gameState.guesserSlot === 'p1' ? 'Lovey 1' : 'Lovey 2');

  // Timer tick effect: The Drawer ticks the timer (or P1 in passAndPlay)
  useEffect(() => {
    if (gameState.phase !== 'drawing') return;
    const isMasterTick = passAndPlay ? mySlot === 'p1' : mySlot === gameState.drawerSlot;
    if (!isMasterTick) return;

    const interval = window.setInterval(() => {
      onCommitState(applyTickDoodleTimer(gameState));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [gameState, mySlot, passAndPlay, onCommitState]);

  // Pointer event handlers for the SVG Drawing surface
  const getNormalizedPoint = useCallback((e: PointerEvent): DoodlePoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const normX = Math.round(Math.max(0, Math.min(1000, (rawX / rect.width) * 1000)));
    const normY = Math.round(Math.max(0, Math.min(800, (rawY / rect.height) * 800)));
    return { x: normX, y: normY };
  }, []);

  const handlePointerDown = (e: PointerEvent) => {
    if (!isDrawer || gameState.phase !== 'drawing') return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    isPointerDownRef.current = true;
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
    setActivePoints([pt]);
    playDoodleStrokePop();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isPointerDownRef.current || !isDrawer || gameState.phase !== 'drawing') return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    setActivePoints((prev) => {
      if (prev.length === 0) return [pt];
      const last = prev[prev.length - 1];
      const distSq = (pt.x - last.x) ** 2 + (pt.y - last.y) ** 2;
      // Skip points too close to keep vector path lightweight
      if (distSq < 16) return prev;
      return [...prev, pt];
    });
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (activePoints.length > 0) {
      const newStroke: DoodleStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        color: isEraser ? '#FFFDF9' : currentColor,
        width: isEraser ? currentWidth * 1.8 : currentWidth,
        points: activePoints,
      };
      setActivePoints([]);
      const next = applyAddDoodleStroke(gameState, newStroke);
      onCommitState(next);
      onBroadcastStroke?.(newStroke);
    }
  };

  const handleUndo = () => {
    playTapPop();
    const next = applyUndoDoodleStroke(gameState);
    onCommitState(next);
  };

  const handleClear = () => {
    playDoodleClear();
    const next = applyClearDoodleStrokes(gameState);
    onCommitState(next);
    onBroadcastClear?.();
  };

  const handleWordSelect = (option: DoodleWordOption) => {
    playTapPop();
    const next = applySelectDoodleWord(gameState, option);
    onCommitState(next);
  };

  const handleGuessSubmit = (e?: Event) => {
    e?.preventDefault();
    const text = guessInputText.trim();
    if (!text || gameState.phase !== 'drawing') return;
    setGuessInputText('');

    const next = applySubmitDoodleGuess(gameState, text, mySlot);
    if (next.lastRoundOutcome?.guesserGuessedCorrectly) {
      playDoodleCorrectGuess();
    } else {
      playDoodleWrongGuess();
    }
    onCommitState(next);
  };

  const handleNextRound = () => {
    playTapPop();
    const next = applyNextDoodleRound(gameState);
    onCommitState(next);
  };

  const maskedDisplay = getMaskedWordDisplay(
    gameState.selectedWord,
    gameState.revealedHintIndices
  );

  return (
    <div className="dama-stage-container doodle-stage-container">
      <div className="board-stage sticker-board-frame doodle-table-stage">
        <div className="doodle-table-inner">
          {/* Top Scoreboard & Round Header Bar */}
          <div className="doodle-header-bar">
            <div className="doodle-player-score-col">
              <span className="doodle-score-role">
                {gameState.drawerSlot === 'p1' ? 'Drawer' : 'Guesser'}
              </span>
              <span className="doodle-player-name">{p1Avatar.name || 'Lovey 1'}</span>
              <span className="doodle-score-badge">{gameState.p1Score} pts</span>
            </div>

            <div className="doodle-round-badge">
              <span className="doodle-round-title">Round {gameState.round}/{gameState.totalRounds}</span>
              {gameState.phase === 'drawing' && (
                <div className={`doodle-timer-pill ${gameState.roundSecondsLeft <= 10 ? 'urgent' : ''}`}>
                  <TimerClockIcon size={13} />
                  <span>{gameState.roundSecondsLeft}s</span>
                </div>
              )}
            </div>

            <div className="doodle-player-score-col right">
              <span className="doodle-score-role">
                {gameState.drawerSlot === 'p2' ? 'Drawer' : 'Guesser'}
              </span>
              <span className="doodle-player-name">{p2Avatar.name || 'Lovey 2'}</span>
              <span className="doodle-score-badge">{gameState.p2Score} pts</span>
            </div>
          </div>

          {/* Phase 1: Word Selection */}
          {gameState.phase === 'word_selection' ? (
            <div className="doodle-phase-card anim-fade-scale">
              {isDrawer ? (
                <>
                  <div className="doodle-phase-heading">
                    <DoodleClashIcon size={24} />
                    <h3 className="doodle-phase-title">Pick a Secret Word!</h3>
                    <p className="doodle-phase-desc">
                      Choose one word to draw for {guesserName}.
                    </p>
                  </div>

                  <div className="doodle-word-choices-grid">
                    {gameState.wordChoices.map((opt) => (
                      <button
                        key={opt.word}
                        type="button"
                        className="doodle-word-choice-card sticker-press"
                        onClick={() => handleWordSelect(opt)}
                      >
                        <span className="doodle-word-cat-badge">{opt.category}</span>
                        <span className="doodle-word-text">{opt.word}</span>
                        <span className="doodle-word-hint-text">{opt.hint}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="doodle-waiting-box">
                  <div className="doodle-waiting-avatar-bounce">
                    <CatAvatarSvg
                      breed={drawerAvatar.breed}
                      accessory={drawerAvatar.accessory}
                      size={54}
                    />
                  </div>
                  <h3 className="doodle-waiting-title">
                    {drawerName} is picking a word...
                  </h3>
                  <p className="doodle-waiting-sub">
                    Get ready to guess their masterpiece!
                  </p>
                </div>
              )}
            </div>
          ) : gameState.phase === 'round_summary' ? (
            /* Phase 3: Round Summary */
            <div className="doodle-phase-card anim-fade-scale">
              <div className="doodle-summary-content">
                {gameState.lastRoundOutcome?.guesserGuessedCorrectly ? (
                  <div className="doodle-result-badge success">
                    <SparkleIcon size={20} />
                    <span>CORRECT GUESS!</span>
                  </div>
                ) : (
                  <div className="doodle-result-badge timeout">
                    <TimerClockIcon size={20} />
                    <span>TIME&apos;S UP!</span>
                  </div>
                )}

                <div className="doodle-summary-word-reveal">
                  <span className="doodle-reveal-sub">The Secret Word Was:</span>
                  <span className="doodle-reveal-word">
                    {gameState.lastRoundOutcome?.word}
                  </span>
                </div>

                <div className="doodle-points-breakdown-row">
                  <div className="doodle-point-award-pill">
                    <span>{guesserName} (Guesser)</span>
                    <strong>+{gameState.lastRoundOutcome?.pointsAwardedGuesser ?? 0} pts</strong>
                  </div>
                  <div className="doodle-point-award-pill">
                    <span>{drawerName} (Drawer)</span>
                    <strong>+{gameState.lastRoundOutcome?.pointsAwardedDrawer ?? 0} pts</strong>
                  </div>
                </div>

                {mySlot === 'p1' && (
                  <button
                    type="button"
                    className="vibrant-play-btn doodle-next-btn sticker-press"
                    onClick={handleNextRound}
                  >
                    <span>
                      {gameState.round >= gameState.totalRounds
                        ? 'Finish Match'
                        : `Start Round ${gameState.round + 1}`}
                    </span>
                    <SparkleIcon size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Phase 2: Drawing & Guessing Canvas Area */
            <div className="doodle-canvas-container">
              {/* Word & Hint Banner */}
              <div className="doodle-word-banner">
                {isDrawer ? (
                  <div className="doodle-drawer-prompt">
                    <span className="doodle-banner-label">DRAW:</span>
                    <strong className="doodle-banner-word">
                      {gameState.selectedWord}
                    </strong>
                    <span className="doodle-banner-cat">
                      ({gameState.selectedCategory})
                    </span>
                  </div>
                ) : (
                  <div className="doodle-guesser-prompt">
                    <div className="doodle-guesser-hint-row">
                      <LightbulbIcon size={14} />
                      <span className="doodle-banner-cat">
                        {gameState.selectedCategory}
                      </span>
                      <span className="doodle-letter-count">
                        ({gameState.selectedWord?.replace(/ /g, '').length} letters)
                      </span>
                    </div>
                    <div className="doodle-masked-blanks">
                      {maskedDisplay}
                    </div>
                  </div>
                )}
              </div>

              {/* Vector Drawing Canvas */}
              <div className="doodle-canvas-frame">
                <svg
                  ref={svgRef}
                  viewBox="0 0 1000 800"
                  className={`doodle-drawing-svg ${isDrawer ? 'can-draw' : ''}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  touch-action="none"
                  aria-label="Doodle drawing canvas"
                >
                  {/* Background grid dots for artistic flair */}
                  <pattern
                    id="doodleDots"
                    x="0"
                    y="0"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="20" cy="20" r="1.5" fill="#E2E8F0" />
                  </pattern>
                  <rect width="1000" height="800" fill="url(#doodleDots)" rx="16" />

                  {/* Committed Vector Strokes */}
                  {gameState.strokes.map((stroke) => (
                    <path
                      key={stroke.id}
                      d={pointsToSvgPath(stroke.points)}
                      stroke={stroke.color}
                      strokeWidth={stroke.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  ))}

                  {/* Live in-progress active stroke */}
                  {activePoints.length > 0 && (
                    <path
                      d={pointsToSvgPath(activePoints)}
                      stroke={isEraser ? '#FFFDF9' : currentColor}
                      strokeWidth={isEraser ? currentWidth * 1.8 : currentWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      opacity={0.92}
                    />
                  )}
                </svg>

                {/* Guesser Floating Wrong Guesses Stream */}
                {gameState.guesses.length > 0 && (
                  <div className="doodle-guesses-ribbon" aria-live="polite">
                    {gameState.guesses.slice(0, 3).map((g) => (
                      <span
                        key={g.id}
                        className={`doodle-guess-chip ${g.isCorrect ? 'correct' : 'wrong'}`}
                      >
                        {g.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Interactive Deck: Drawer Tool Palette OR Guesser Input Bar */}
              {isDrawer ? (
                <div className="doodle-drawer-toolbar">
                  {/* Color Swatches */}
                  <div className="doodle-palette-row" role="group" aria-label="Color Palette">
                    {DOODLE_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`doodle-color-btn ${currentColor === c && !isEraser ? 'active' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => {
                          playTapPop();
                          setCurrentColor(c);
                          setIsEraser(false);
                        }}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>

                  {/* Action Tool Row */}
                  <div className="doodle-tools-row">
                    <div className="doodle-tool-group">
                      <button
                        type="button"
                        className={`doodle-tool-btn ${!isEraser ? 'active' : ''}`}
                        onClick={() => {
                          playTapPop();
                          setIsEraser(false);
                        }}
                        title="Pencil"
                      >
                        <PencilIcon size={16} />
                      </button>
                      <button
                        type="button"
                        className={`doodle-tool-btn ${isEraser ? 'active' : ''}`}
                        onClick={() => {
                          playTapPop();
                          setIsEraser(true);
                        }}
                        title="Eraser"
                      >
                        <EraserIcon size={16} />
                      </button>
                    </div>

                    <div className="doodle-tool-group stroke-sizes">
                      {DOODLE_STROKE_WIDTHS.map((w) => (
                        <button
                          key={w.label}
                          type="button"
                          className={`doodle-size-btn ${currentWidth === w.value ? 'active' : ''}`}
                          onClick={() => {
                            playTapPop();
                            setCurrentWidth(w.value);
                          }}
                        >
                          <span
                            className="doodle-size-dot"
                            style={{
                              width: `${w.value / 3}px`,
                              height: `${w.value / 3}px`,
                              backgroundColor: isEraser ? '#5B2A4E' : currentColor,
                            }}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="doodle-tool-group">
                      <button
                        type="button"
                        className="doodle-tool-btn"
                        onClick={handleUndo}
                        disabled={gameState.strokes.length === 0}
                        title="Undo"
                      >
                        <UndoIcon size={16} />
                      </button>
                      <button
                        type="button"
                        className="doodle-tool-btn clear-btn"
                        onClick={handleClear}
                        disabled={gameState.strokes.length === 0}
                        title="Clear Canvas"
                      >
                        <ClearCanvasIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Guesser Controls */
                <form className="doodle-guesser-form" onSubmit={handleGuessSubmit}>
                  <input
                    type="text"
                    className="doodle-guess-input"
                    placeholder="Type your guess here..."
                    value={guessInputText}
                    onInput={(e) => setGuessInputText((e.target as HTMLInputElement).value)}
                    autoComplete="off"
                    autoCorrect="off"
                    spellcheck={false}
                    maxLength={24}
                  />
                  <button
                    type="submit"
                    className="vibrant-play-btn doodle-send-guess-btn sticker-press"
                    disabled={!guessInputText.trim()}
                  >
                    <span>Guess</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
