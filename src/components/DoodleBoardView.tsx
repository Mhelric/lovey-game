import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CatAvatarConfig, PlayerSlot } from '../types/arcade';
import {
  applyAddDoodleStroke,
  applyClearDoodleStrokes,
  applyFinishDoodleDrawing,
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
  getDoodleDifficultyInfo,
  getDoodleRoundTimeSec,
  getMaskedWordDisplay,
  getMaxGuessesForDifficulty,
  recordUsedDoodleWords,
} from '../engines/doodleEngine';

function formatDoodleTimer(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${seconds}s`;
}
import {
  ClearCanvasIcon,
  DoodleClashIcon,
  EraserIcon,
  HeartIcon,
  LightbulbIcon,
  PencilIcon,
  SparkleIcon,
  TimerClockIcon,
  TrophyIcon,
  UndoIcon,
} from './ArcadeIcons';
import { CatAvatarSvg } from './CatAvatarSvg';
import {
  playDoodleClear,
  playDoodleCorrectGuess,
  playDoodleStrokePop,
  playDoodleStumpedRound,
  playDoodleWrongGuess,
  playTapPop,
  playTimesUpAlarm,
} from '../services/soundEffects';

interface DoodleBoardViewProps {
  gameState: DoodleGameState;
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  passAndPlay?: boolean;
  isShuffling?: boolean;
  isPaused?: boolean;
  onCommitState: (nextState: DoodleGameState) => void;
  onBroadcastStroke?: (stroke: DoodleStroke) => void;
  onBroadcastClear?: () => void;
}

const SVG_VIEW_W = 800;
const SVG_VIEW_H = 1000;

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

interface BatchedStrokePath {
  key: string;
  color: string;
  width: number;
  d: string;
}

function groupDoodleStrokes(strokes: readonly DoodleStroke[]): BatchedStrokePath[] {
  const groups: BatchedStrokePath[] = [];
  for (const stroke of strokes) {
    const pathD = pointsToSvgPath(stroke.points);
    if (!pathD) continue;
    const last = groups[groups.length - 1];
    if (last && last.color === stroke.color && last.width === stroke.width) {
      last.d += ` ${pathD}`;
    } else {
      groups.push({
        key: stroke.id,
        color: stroke.color,
        width: stroke.width,
        d: pathD,
      });
    }
  }
  return groups;
}

export function DoodleBoardView({
  gameState,
  mySlot,
  p1Avatar,
  p2Avatar,
  passAndPlay = false,
  isShuffling = false,
  isPaused = false,
  onCommitState,
  onBroadcastStroke,
  onBroadcastClear,
}: DoodleBoardViewProps) {
  const [currentColor, setCurrentColor] = useState<string>(DOODLE_PALETTE[0]);
  const [currentWidth, setCurrentWidth] = useState<number>(DOODLE_STROKE_WIDTHS[1].value);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [guessInputText, setGuessInputText] = useState<string>('');

  // Live active stroke & touch dot guide while finger/pointer is down
  const [activePoints, setActivePoints] = useState<DoodlePoint[]>([]);
  const [touchGuidePoint, setTouchGuidePoint] = useState<DoodlePoint | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // In Pass & Play on 1 device, the active viewer follows whose turn it is
  const effectiveSlot: PlayerSlot = passAndPlay ? gameState.turn : mySlot;
  const isDrawer = effectiveSlot === gameState.drawerSlot;
  const isGuesser = effectiveSlot === gameState.guesserSlot;

  const drawerAvatar = gameState.drawerSlot === 'p1' ? p1Avatar : p2Avatar;
  const guesserAvatar = gameState.guesserSlot === 'p1' ? p1Avatar : p2Avatar;
  const drawerName = drawerAvatar.name || (gameState.drawerSlot === 'p1' ? 'Lovey 1' : 'Lovey 2');
  const guesserName = guesserAvatar.name || (gameState.guesserSlot === 'p1' ? 'Lovey 1' : 'Lovey 2');

  const diffInfo = getDoodleDifficultyInfo(gameState.round);
  const currentMaxRoundTime = getDoodleRoundTimeSec(diffInfo.id);
  const maxGuesses = getMaxGuessesForDifficulty(diffInfo.id);
  const guessesLeft = gameState.guessesLeft ?? maxGuesses;
  const batchedStrokes = useMemo(
    () => groupDoodleStrokes(gameState.strokes),
    [gameState.strokes]
  );

  // Dedicated 3-Second Secret Word Popup for Drawer before canvas displays
  const [drawerWordPopupActive, setDrawerWordPopupActive] = useState<boolean>(false);
  const [drawerWordCountdown, setDrawerWordCountdown] = useState<number>(3);
  const wordPopupShownRef = useRef<string>('');

  // 1-Phone Handover Privacy Curtain before Drawing & Alarm states
  const [prePickHandoverActive, setPrePickHandoverActive] = useState<boolean>(
    () =>
      passAndPlay &&
      (gameState.phase === 'word_selection' ||
        (gameState.phase === 'drawing' &&
          gameState.strokes.length === 0 &&
          gameState.roundSecondsLeft === currentMaxRoundTime))
  );
  const [prePickCountdown, setPrePickCountdown] = useState<number>(10);
  const [guesserHandoverModal, setGuesserHandoverModal] = useState<boolean>(false);
  const prevPhaseRef = useRef(gameState.phase);
  const prevMatchRoundRef = useRef(`${gameState.matchSeed}-${gameState.round}`);

  // Record every seen word on both Drawer and Guesser devices to prevent repeats
  useEffect(() => {
    if (gameState.matchSeed === 202612) return;
    recordUsedDoodleWords([
      gameState.selectedWord,
      ...(gameState.usedWords ?? []),
    ]);
  }, [gameState.matchSeed, gameState.selectedWord, gameState.usedWords]);

  // Legacy savestate safeguard: auto-advance any saved match stuck in 'word_selection'
  useEffect(() => {
    if (gameState.phase === 'word_selection' && gameState.wordChoices.length > 0) {
      const isAuthoritative = passAndPlay
        ? mySlot === 'p1'
        : mySlot === gameState.drawerSlot;
      if (isAuthoritative) {
        onCommitState(applySelectDoodleWord(gameState, gameState.wordChoices[0]));
      }
    }
  }, [gameState, passAndPlay, mySlot, onCommitState]);

  // In 2-Phone Live Mode (!passAndPlay), ensure handover popups never display
  useEffect(() => {
    if (!passAndPlay) {
      setPrePickHandoverActive(false);
      setGuesserHandoverModal(false);
    }
  }, [passAndPlay]);

  // Trigger 10s handover privacy curtain for Drawer when starting a fresh round in 1-Phone Pass & Play
  useEffect(() => {
    const matchRoundKey = `${gameState.matchSeed}-${gameState.round}`;
    if (
      passAndPlay &&
      gameState.phase === 'drawing' &&
      gameState.strokes.length === 0 &&
      gameState.roundSecondsLeft === currentMaxRoundTime &&
      prevMatchRoundRef.current !== matchRoundKey
    ) {
      setPrePickHandoverActive(true);
      setPrePickCountdown(10);
    } else if (!passAndPlay) {
      setPrePickHandoverActive(false);
    }
    prevMatchRoundRef.current = matchRoundKey;
  }, [
    passAndPlay,
    gameState.matchSeed,
    gameState.phase,
    gameState.round,
    gameState.strokes.length,
    gameState.roundSecondsLeft,
    currentMaxRoundTime,
  ]);

  // Trigger 3s Secret Word Popup for Drawer before revealing the drawing canvas
  useEffect(() => {
    const matchRoundKey = `${gameState.matchSeed}-${gameState.round}`;
    if (
      gameState.phase === 'drawing' &&
      isDrawer &&
      (!passAndPlay || !prePickHandoverActive) &&
      !isShuffling &&
      wordPopupShownRef.current !== matchRoundKey
    ) {
      wordPopupShownRef.current = matchRoundKey;
      setDrawerWordPopupActive(true);
      setDrawerWordCountdown(3);
    }
  }, [
    gameState.phase,
    gameState.matchSeed,
    gameState.round,
    isDrawer,
    passAndPlay,
    prePickHandoverActive,
    isShuffling,
  ]);

  // Countdown timer for 3s Secret Word Popup
  useEffect(() => {
    if (!drawerWordPopupActive) return;
    if (drawerWordCountdown <= 0) {
      const autoClose = window.setTimeout(() => {
        setDrawerWordPopupActive(false);
      }, 500);
      return () => window.clearTimeout(autoClose);
    }
    const timer = window.setInterval(() => {
      setDrawerWordCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [drawerWordPopupActive, drawerWordCountdown]);

  // Decrement 10s pre-pick countdown (paused while first-turn shuffle is loading/playing)
  useEffect(() => {
    if (!prePickHandoverActive || isShuffling) return;
    if (prePickCountdown <= 0) {
      setPrePickHandoverActive(false);
      return;
    }
    const t = window.setInterval(() => {
      setPrePickCountdown((prev) => {
        if (prev <= 1) {
          setPrePickHandoverActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [prePickHandoverActive, prePickCountdown, isShuffling]);

  // Play sound when any guess is registered (synchronizes for both Guesser and Drawer)
  // gameState.guesses prepends new attempts at index 0, so index 0 is always the latest attempt!
  const lastHandledGuessIdRef = useRef<string>(gameState.guesses[0]?.id || '');
  const lastHandledRoundRef = useRef<number>(gameState.round);
  const lastHandledOutcomeIdRef = useRef<string>(gameState.lastRoundOutcome?.id || '');

  useEffect(() => {
    // If round changed, reset tracking refs without playing old sounds
    if (lastHandledRoundRef.current !== gameState.round) {
      lastHandledRoundRef.current = gameState.round;
      lastHandledGuessIdRef.current = gameState.guesses[0]?.id || '';
      lastHandledOutcomeIdRef.current = gameState.lastRoundOutcome?.id || '';
      return;
    }

    const latestGuess = gameState.guesses[0];
    if (latestGuess && latestGuess.id !== lastHandledGuessIdRef.current) {
      lastHandledGuessIdRef.current = latestGuess.id;
      if (latestGuess.isCorrect) {
        playDoodleCorrectGuess();
      } else {
        playDoodleWrongGuess();
      }
    }
  }, [gameState.guesses, gameState.round]);

  // Round summary outcome sound: fallback victory song if guessed, or comical stumped cue if failed
  useEffect(() => {
    if (gameState.phase === 'round_summary' && gameState.lastRoundOutcome) {
      if (gameState.lastRoundOutcome.id !== lastHandledOutcomeIdRef.current) {
        lastHandledOutcomeIdRef.current = gameState.lastRoundOutcome.id;
        if (gameState.lastRoundOutcome.guesserGuessedCorrectly) {
          // If latest guess audio didn't trigger, guarantee victory song plays
          if (!gameState.guesses[0]?.isCorrect || lastHandledGuessIdRef.current !== gameState.guesses[0]?.id) {
            playDoodleCorrectGuess();
          }
        } else {
          // Guesser failed to guess the word (stumped)
          playDoodleStumpedRound();
        }
      }
    }
  }, [gameState.phase, gameState.lastRoundOutcome, gameState.guesses]);

  // Alarm sound & Guesser handover modal when drawing ends and guessing begins
  useEffect(() => {
    if (prevPhaseRef.current === 'drawing' && gameState.phase === 'guessing') {
      playTimesUpAlarm();
      if (passAndPlay) {
        setGuesserHandoverModal(true);
      } else {
        setGuesserHandoverModal(false);
      }
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase, passAndPlay]);

  // Drawing Timer tick effect: paused during shuffle roulette, 1-Phone handover curtain, or 3s drawer word popup
  useEffect(() => {
    if (
      gameState.phase !== 'drawing' ||
      isPaused ||
      isShuffling ||
      (passAndPlay && prePickHandoverActive) ||
      drawerWordPopupActive
    ) {
      return;
    }
    const isMasterTick = passAndPlay ? mySlot === 'p1' : mySlot === gameState.drawerSlot;
    if (!isMasterTick) return;

    const interval = window.setInterval(() => {
      onCommitState(applyTickDoodleTimer(gameState));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    gameState,
    mySlot,
    passAndPlay,
    isPaused,
    isShuffling,
    prePickHandoverActive,
    drawerWordPopupActive,
    onCommitState,
  ]);

  // Clear active touch state if phase leaves 'drawing'
  useEffect(() => {
    if (gameState.phase !== 'drawing') {
      isPointerDownRef.current = false;
      setActivePoints([]);
      setTouchGuidePoint(null);
    }
  }, [gameState.phase]);

  // Exact SVG user-space coordinate mapping (fixes any right/left aspect-ratio offset)
  const getNormalizedPoint = useCallback((e: PointerEvent): DoodlePoint | null => {
    const svg = svgRef.current;
    if (!svg) return null;

    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const loc = pt.matrixTransform(ctm.inverse());
      return {
        x: Math.round(Math.max(0, Math.min(SVG_VIEW_W, loc.x)) * 10) / 10,
        y: Math.round(Math.max(0, Math.min(SVG_VIEW_H, loc.y)) * 10) / 10,
      };
    }

    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: Math.round(Math.max(0, Math.min(SVG_VIEW_W, (rawX / rect.width) * SVG_VIEW_W)) * 10) / 10,
      y: Math.round(Math.max(0, Math.min(SVG_VIEW_H, (rawY / rect.height) * SVG_VIEW_H)) * 10) / 10,
    };
  }, []);

  const handlePointerDown = (e: PointerEvent) => {
    if (!isDrawer || gameState.phase !== 'drawing' || isPaused) return;
    e.preventDefault();
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    isPointerDownRef.current = true;
    (e.currentTarget as Element)?.setPointerCapture?.(e.pointerId);
    setTouchGuidePoint(pt);
    setActivePoints([pt]);
    playDoodleStrokePop();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDrawer || gameState.phase !== 'drawing') return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    if (isPointerDownRef.current) {
      setTouchGuidePoint(pt);
      setActivePoints((prev) => {
        if (prev.length === 0) return [pt];
        const last = prev[prev.length - 1];
        const distSq = (pt.x - last.x) ** 2 + (pt.y - last.y) ** 2;
        if (distSq < 4) return prev;
        return [...prev, pt];
      });
    }
  };

  const handlePointerUp = () => {
    setTouchGuidePoint(null);
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (activePoints.length > 0) {
      const newStroke: DoodleStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        color: isEraser ? '#FFFDF9' : currentColor,
        width: isEraser ? currentWidth * 1.6 : currentWidth,
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

  const handleFinishDrawing = () => {
    playTapPop();
    const next = applyFinishDoodleDrawing(gameState);
    onCommitState(next);
  };

  const handleGuessSubmit = (e?: Event) => {
    e?.preventDefault();
    const text = guessInputText.trim();
    if (!text || gameState.phase !== 'guessing') return;
    setGuessInputText('');

    const next = applySubmitDoodleGuess(gameState, text, effectiveSlot);
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

  const effectiveBrushWidth = isEraser ? currentWidth * 1.6 : currentWidth;
  const guideOuterRadius = Math.max(18, effectiveBrushWidth / 2 + 10);
  const guideInnerRadius = Math.max(3.5, effectiveBrushWidth / 2);

  return (
    <div className="doodle-stage-container">
      <div className="doodle-table-stage">
        <div className="doodle-table-inner">
          {/* Top Scoreboard & Round Difficulty Header Bar */}
          <div className="doodle-header-bar">
            <div className="doodle-player-score-col">
              <span className="doodle-score-role">
                {gameState.drawerSlot === 'p1' ? 'Drawer' : 'Guesser'}
              </span>
              <span className="doodle-player-name">{p1Avatar.name || 'Lovey 1'}</span>
              <span className="doodle-score-badge">{gameState.p1Score} pts</span>
            </div>

            <div className="doodle-round-badge">
              <span className={`doodle-round-title diff-${diffInfo.id}`}>
                R{gameState.round}/{gameState.totalRounds} • {diffInfo.label}
              </span>
              {gameState.phase === 'drawing' && (
                <div
                  className={`doodle-timer-pill ${
                    isPaused ? 'paused' : gameState.roundSecondsLeft <= 10 ? 'urgent' : ''
                  }`}
                >
                  <TimerClockIcon size={12} />
                  <span>{isPaused ? 'PAUSED' : formatDoodleTimer(gameState.roundSecondsLeft)}</span>
                </div>
              )}
              {gameState.phase === 'guessing' && (
                <div className="doodle-tries-pill">
                  {Array.from({ length: maxGuesses }, (_, idx) => (
                    <span
                      key={idx}
                      className={`doodle-try-heart ${idx < guessesLeft ? 'active' : 'spent'}`}
                    >
                      <HeartIcon size={11} />
                    </span>
                  ))}
                  <span>{guessesLeft} {guessesLeft === 1 ? 'try' : 'tries'} left</span>
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

          {gameState.phase === 'round_summary' ? (
            /* Phase 3: Round Summary */
            <div className="doodle-phase-card anim-fade-scale">
              <div className="doodle-summary-content">
                {gameState.lastRoundOutcome?.guesserGuessedCorrectly ? (
                  <div className="doodle-result-badge success">
                    <SparkleIcon size={18} />
                    <span>GUESSED RIGHT!</span>
                  </div>
                ) : (
                  <div className="doodle-result-badge timeout">
                    <DoodleClashIcon size={18} />
                    <span>STUMPED ALL {maxGuesses} GUESSES!</span>
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

                <button
                  type="button"
                  className="vibrant-play-btn doodle-next-btn sticker-press"
                  onClick={handleNextRound}
                >
                  {gameState.round >= gameState.totalRounds ? (
                    <>
                      <TrophyIcon size={16} />
                      <span>Award Cat Doodle Trophy</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Next: Round {gameState.round + 1} ({getDoodleDifficultyInfo(gameState.round + 1).label})
                      </span>
                      <SparkleIcon size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Phase 2A ('drawing') & Phase 2B ('guessing'): Canvas Area */
            <div className="doodle-canvas-container">
              {/* Word & Hint Banner */}
              <div className="doodle-word-banner">
                {isDrawer && gameState.phase === 'drawing' ? (
                  <div className="doodle-drawer-prompt">
                    <div className="doodle-drawer-word-wrap">
                      <span className="doodle-banner-label">DRAW:</span>
                      <strong className="doodle-banner-word">
                        {passAndPlay && (prePickHandoverActive || isShuffling)
                          ? '???'
                          : gameState.selectedWord}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="doodle-done-drawing-btn sticker-press"
                      onClick={handleFinishDrawing}
                      disabled={gameState.strokes.length === 0}
                      title="Finish drawing and let the guesser guess"
                    >
                      <span>Done</span>
                    </button>
                  </div>
                ) : (
                  <div className="doodle-guesser-prompt">
                    <div className="doodle-guesser-hint-row">
                      <LightbulbIcon size={14} />
                      <span className="doodle-letter-count">
                        {gameState.selectedWord?.replace(/ /g, '').length} letters
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
                  viewBox={`0 0 ${SVG_VIEW_W} ${SVG_VIEW_H}`}
                  preserveAspectRatio="none"
                  className={`doodle-drawing-svg ${
                    isDrawer && gameState.phase === 'drawing' ? 'can-draw' : ''
                  }`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onPointerLeave={handlePointerUp}
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
                  <rect
                    width={SVG_VIEW_W}
                    height={SVG_VIEW_H}
                    fill="url(#doodleDots)"
                    rx="14"
                  />

                  {/* Committed Vector Strokes (consecutive matching strokes batched for minimal DOM nodes) */}
                  {batchedStrokes.map((batch) => (
                    <path
                      key={batch.key}
                      d={batch.d}
                      stroke={batch.color}
                      strokeWidth={batch.width}
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
                      strokeWidth={effectiveBrushWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      opacity={0.94}
                    />
                  )}

                  {/* Live Touch/Hold Dot & Target Ring Guide */}
                  {touchGuidePoint && isDrawer && gameState.phase === 'drawing' && (
                    <g
                      className="doodle-touch-guide"
                      transform={`translate(${touchGuidePoint.x}, ${touchGuidePoint.y})`}
                      pointerEvents="none"
                    >
                      {/* Outer visibility ring so user sees exact touch center around their fingertip */}
                      <circle
                        cx="0"
                        cy="0"
                        r={guideOuterRadius}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="4"
                        opacity="0.9"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r={guideOuterRadius}
                        fill="none"
                        stroke="#5B2A4E"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                      {/* Crosshair ticks outside the ring */}
                      <line
                        x1={-guideOuterRadius - 6}
                        y1="0"
                        x2={-guideOuterRadius + 2}
                        y2="0"
                        stroke="#5B2A4E"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1={guideOuterRadius - 2}
                        y1="0"
                        x2={guideOuterRadius + 6}
                        y2="0"
                        stroke="#5B2A4E"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="0"
                        y1={-guideOuterRadius - 6}
                        x2="0"
                        y2={-guideOuterRadius + 2}
                        stroke="#5B2A4E"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="0"
                        y1={guideOuterRadius - 2}
                        x2="0"
                        y2={guideOuterRadius + 6}
                        stroke="#5B2A4E"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      {/* Exact Brush Size & Color Center Dot */}
                      <circle
                        cx="0"
                        cy="0"
                        r={guideInnerRadius}
                        fill={isEraser ? '#FFFDF9' : currentColor}
                        stroke="#5B2A4E"
                        strokeWidth="1.8"
                      />
                    </g>
                  )}
                </svg>

                {/* Guesser Floating Guesses Stream */}
                {gameState.guesses.length > 0 && (
                  <div className="doodle-guesses-ribbon" aria-live="polite">
                    {gameState.guesses.slice(0, maxGuesses).map((g) => (
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

              {/* Bottom Interactive Deck based on Phase ('drawing' vs 'guessing') and Role */}
              {gameState.phase === 'drawing' ? (
                isDrawer ? (
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
                                width: `${Math.max(5, Math.round(w.value / 2.2))}px`,
                                height: `${Math.max(5, Math.round(w.value / 2.2))}px`,
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
                  <div className="doodle-phase-status-bar">
                    <PencilIcon size={15} />
                    <span>
                      {gameState.strokes.length === 0 && gameState.roundSecondsLeft === currentMaxRoundTime ? (
                        <>
                          <strong>{drawerName}</strong> is studying their secret word ({formatDoodleTimer(currentMaxRoundTime)} timer will start shortly)...
                        </>
                      ) : (
                        <>
                          <strong>{drawerName}</strong> is drawing ({formatDoodleTimer(gameState.roundSecondsLeft)} left)... You&apos;ll get {maxGuesses} guesses when they finish!
                        </>
                      )}
                    </span>
                  </div>
                )
              ) : (
                /* 'guessing' phase: Drawer is done, Guesser gets 3 (Easy/Med) or 5 (Hard/Final) guesses! */
                isGuesser ? (
                  <div className="doodle-guesser-deck">
                    <form className="doodle-guesser-form" onSubmit={handleGuessSubmit}>
                      <input
                        type="text"
                        className="doodle-guess-input"
                        placeholder="Guess the drawing..."
                        value={guessInputText}
                        onInput={(e) => setGuessInputText((e.target as HTMLInputElement).value)}
                        autoComplete="off"
                        autoCorrect="off"
                        spellcheck={false}
                        maxLength={24}
                      />
                      <button
                        type="submit"
                        className="doodle-send-guess-btn sticker-press"
                        disabled={!guessInputText.trim()}
                      >
                        <span>Guess</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="doodle-phase-status-bar guessing-mode">
                    <SparkleIcon size={15} />
                    <span>
                      Drawing complete! Waiting for <strong>{guesserName}</strong> to guess ({guessesLeft}/{maxGuesses} tries left)...
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Modals (placed outside table-stage so they cover the entire viewport & block background clicks) */}

      {/* 1-Phone Mode Privacy Handover Curtain before Drawing (hidden while shuffle roulette is active) */}
      {passAndPlay && prePickHandoverActive && !isShuffling && (
        <div
          className="modal-backdrop doodle-handover-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div
            className="doodle-handover-card anim-fade-scale"
            style={{ maxWidth: '300px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doodle-handover-avatar">
              <CatAvatarSvg
                breed={drawerAvatar.breed}
                accessory={drawerAvatar.accessory}
                size={56}
              />
            </div>
            <h3 className="doodle-handover-title">
              Pass Phone to {drawerName}!
            </h3>
            <p className="doodle-handover-desc">
              A random secret word is ready for Round {gameState.round}. Keep the screen hidden from {guesserName}! Starting in <strong>{prePickCountdown}s</strong>...
            </p>
            <div className="popup-btn-row stacked">
              <button
                type="button"
                className="popup-btn-primary"
                onClick={() => {
                  playTapPop();
                  setPrePickHandoverActive(false);
                }}
                autoFocus
              >
                <span>I am {drawerName} — Show Secret Word &amp; Draw</span>
                <PencilIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Phone Mode Handover Overlay for Guesser when 60s drawing timer finishes */}
      {passAndPlay && guesserHandoverModal && (
        <div
          className="modal-backdrop doodle-handover-modal-backdrop"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div
            className="doodle-handover-card anim-fade-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doodle-handover-avatar alarm">
              <CatAvatarSvg breed={guesserAvatar.breed} accessory={guesserAvatar.accessory} size={56} />
            </div>
            <div className="doodle-times-up-pill">
              <TimerClockIcon size={14} />
              <span>TIME&apos;S UP! {formatDoodleTimer(currentMaxRoundTime)} ALARM</span>
            </div>
            <h3 className="doodle-handover-title">Hand phone to {guesserName}!</h3>
            <p className="doodle-handover-desc">
              Drawing phase is finished! {guesserName} has <strong>{maxGuesses} tries</strong> to guess what was drawn!
            </p>
            <div className="popup-btn-row stacked">
              <button
                type="button"
                className="popup-btn-primary"
                onClick={() => {
                  playTapPop();
                  setGuesserHandoverModal(false);
                }}
                autoFocus
              >
                <span>I am {guesserName} — Ready to Guess</span>
                <SparkleIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Second Secret Word Popup Modal for Drawer before Canvas is shown */}
      {drawerWordPopupActive && isDrawer && (
        <div
          className="modal-backdrop doodle-word-reveal-backdrop"
          style={{ zIndex: 160 }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div
            className="modal-card doodle-word-reveal-card anim-fade-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doodle-popup-cat-badge">
              <CatAvatarSvg
                breed={drawerAvatar.breed}
                accessory={drawerAvatar.accessory}
                size={62}
                animateIdle
              />
            </div>

            <div className="doodle-round-pill">
              <span>
                Round {gameState.round} of {gameState.totalRounds} • {diffInfo.label} Stage
              </span>
            </div>

            <span className="doodle-popup-prompt-label">YOUR SECRET WORD TO DRAW:</span>

            <div className="doodle-popup-word-box">
              <strong className="doodle-popup-secret-word">
                {gameState.selectedWord}
              </strong>
            </div>

            <div className="doodle-popup-timer-info">
              <TimerClockIcon size={14} />
              <span>Drawing time: <strong>{formatDoodleTimer(currentMaxRoundTime)}</strong></span>
            </div>

            <div className="popup-btn-row stacked" style={{ marginTop: '4px' }}>
              <button
                type="button"
                className={`popup-btn-primary ${drawerWordCountdown > 0 ? 'doodle-popup-btn-waiting' : ''}`}
                onClick={() => {
                  if (drawerWordCountdown === 0) {
                    playTapPop();
                    setDrawerWordPopupActive(false);
                  }
                }}
                disabled={drawerWordCountdown > 0}
              >
                {drawerWordCountdown > 0 ? (
                  <span>Ready to Draw in {drawerWordCountdown}...</span>
                ) : (
                  <>
                    <span>Start Drawing Now!</span>
                    <PencilIcon size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
