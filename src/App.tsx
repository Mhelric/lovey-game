import { Fragment } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  CatAvatarConfig,
  CoupleRoomRow,
  DEFAULT_P1_AVATAR,
  DEFAULT_P2_AVATAR,
  FloatingReaction,
  GameMode,
  PlayerSlot,
  QUICK_STICKERS,
  ReactionStickerId,
} from './types/arcade';
import { CatAvatarSvg, CoupleCatsSceneSvg } from './components/CatAvatarSvg';
import {
  ConfettiCelebrationOverlay,
  CrownIcon,
  DoodleClashIcon,
  DoubleHeartIcon,
  PawIcon,
  ReactionStickerSvg,
  SettingsGearIcon,
  SnakeLadderIcon,
  SparkleIcon,
  TimerClockIcon,
  TrophyIcon,
} from './components/ArcadeIcons';



import { HomeMenuView } from './components/HomeMenuView';
import { QuickChatBar } from './components/QuickChatBar';
import { DamaBoardView } from './components/DamaBoardView';
import {
  applyDamaStep,
  createInitialDamaState,
  DamaGameState,
  getLegalStepsForState,
} from './engines/damaEngine';
import {
  applySnakesDiceRoll,
  createInitialSnakesState,
  SnakesGameState,
  SnakesMaxTile,
} from './engines/snakesEngine';
import {
  applySelectDoodleWord,
  createInitialDoodleState,
  DoodleGameState,
  DoodleStroke,
} from './engines/doodleEngine';
import {
  checkCoupleRoomExists,
  CoupleRealtimeChannel,
  fetchActiveMatch,
  fetchOrCreateCoupleRoom,
  normalizeRoomCode,
  RealtimeBroadcastEvent,
  recordMatchWinInDb,
  updatePlayerAvatarInDb,
  updateRoomModeInDb,
  upsertActiveMatch,
} from './services/supabaseService';

import {
  isSoundMuted,
  playPowerupReveal,
  playReactionChime,
  playShuffleTick,
  playTapPop,
  playTimerTick,
  setBgMusicTrack,
  setSoundMuted,
} from './services/soundEffects';

/**
 * Fun First-Turn Shuffle Ceremony Modal (Applies to Both Cat Dama & Snakes & Ladders)
 * Rapidly bounces a golden spotlight & crown pointer between both players' cats
 * before landing on the randomly selected starting player!
 */
function FirstTurnShuffleOverlay({
  matchKey,
  isFreshMatch,
  winnerSlot,
  p1Avatar,
  p2Avatar,
  onShuffleActiveChange,
}: {
  matchKey: string;
  isFreshMatch: boolean;
  winnerSlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  onShuffleActiveChange?: (active: boolean) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealed'>('idle');
  const [highlightSlot, setHighlightSlot] = useState<PlayerSlot>('p1');
  const lastShuffledKeyRef = useRef<string>('');

  useEffect(() => {
    if (!isFreshMatch) {
      setPhase('idle');
      onShuffleActiveChange?.(false);
      return;
    }
    if (lastShuffledKeyRef.current === matchKey) return;
    lastShuffledKeyRef.current = matchKey;

    setPhase('shuffling');
    onShuffleActiveChange?.(true);
    const startSlot: PlayerSlot = winnerSlot === 'p1' ? 'p2' : 'p1';
    setHighlightSlot(startSlot);

    // Roulette deceleration schedule (8 hops before locking onto winnerSlot)
    const hopScheduleMs = [110, 230, 360, 500, 660, 840, 1050, 1290];
    const timers: number[] = [];

    hopScheduleMs.forEach((delay, idx) => {
      timers.push(
        window.setTimeout(() => {
          const nextSlot: PlayerSlot =
            idx % 2 === 0
              ? startSlot === 'p1'
                ? 'p2'
                : 'p1'
              : startSlot;
          setHighlightSlot(nextSlot);
          playShuffleTick(idx);
        }, delay)
      );
    });

    // Final Reveal Lock-In
    timers.push(
      window.setTimeout(() => {
        setHighlightSlot(winnerSlot);
        setPhase('revealed');
        playPowerupReveal();
      }, 1540)
    );

    // Auto-dismiss so the chosen player can make the first move
    timers.push(
      window.setTimeout(() => {
        setPhase('idle');
        onShuffleActiveChange?.(false);
      }, 2800)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      onShuffleActiveChange?.(false);
    };
  }, [matchKey, isFreshMatch, winnerSlot, onShuffleActiveChange]);

  if (phase === 'idle') return null;

  const winnerAvatar = winnerSlot === 'p1' ? p1Avatar : p2Avatar;

  return (
    <div
      className="first-turn-shuffle-backdrop"
      role="status"
      aria-live="polite"
    >
      <div className="first-turn-shuffle-card">
        <span className="shuffle-kicker-pill">
          <SparkleIcon size={12} />
          <span>
            {phase === 'shuffling' ? 'FIRST TURN ROULETTE' : 'FIRST TURN DECIDED!'}
          </span>
          <SparkleIcon size={12} />
        </span>

        <h3 className="shuffle-main-title">
          {phase === 'shuffling'
            ? 'Shuffling Who Goes First…'
            : `${winnerAvatar.name} Goes First!`}
        </h3>

        <div className="shuffle-candidates-row">
          {(['p1', 'p2'] as const).map((slot, idx) => {
            const av = slot === 'p1' ? p1Avatar : p2Avatar;
            const isLit = highlightSlot === slot;
            const won = phase === 'revealed' && winnerSlot === slot;
            return (
              <Fragment key={slot}>
                {idx === 1 && (
                  <div
                    className={`shuffle-vs-coin ${
                      phase === 'shuffling' ? 'spinning' : ''
                    }`}
                  >
                    <span>VS</span>
                  </div>
                )}
                <div
                  className={`shuffle-cat-slot ${slot}-theme ${
                    isLit ? 'is-lit' : 'is-dim'
                  } ${won ? 'is-winner' : ''}`}
                >
                  {isLit && (
                    <div className="shuffle-pointer-badge">
                      {phase === 'revealed' ? (
                        <CrownIcon size={16} />
                      ) : (
                        <PawIcon size={14} />
                      )}
                    </div>
                  )}
                  <CatAvatarSvg
                    breed={av.breed}
                    accessory={av.accessory}
                    size={54}
                    animateIdle={false}
                    happySquint={won}
                  />
                  <span className="shuffle-cat-name">{av.name}</span>
                </div>
              </Fragment>
            );
          })}
        </div>

        <span className="shuffle-sub-hint">
          {phase === 'shuffling'
            ? 'Picking a lucky cat…'
            : 'Get ready to make your first move!'}
        </span>
      </div>
    </div>
  );
}

const STORAGE_ROOM_KEY = 'lovey_arcade_room_code';
const STORAGE_HOST_ROOM_KEY = 'lovey_arcade_host_room_code';
const STORAGE_SLOT_KEY = 'lovey_arcade_player_slot';
const STORAGE_MY_AVATAR_KEY = 'lovey_arcade_my_avatar';
const STORAGE_TUTORIAL_PREFIX = 'lovey_seen_tutorial_';
const STORAGE_SAVESTATE_PREFIX = 'lovey_savestate_v1_';
const STORAGE_SESSION_PREFIX = 'lovey_session_v1_';

const VALID_STICKER_IDS = new Set<string>(QUICK_STICKERS.map((s) => s.id));

const saveStorageJson = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const loadStorageJson = <T,>(k: string): T | null => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function saveLocalGameSavestate<T>(r: string, m: GameMode, state: T): void {
  saveStorageJson(`${STORAGE_SAVESTATE_PREFIX}${normalizeRoomCode(r)}_${m}`, {
    updatedAt: Date.now(),
    state,
  });
}

function loadLocalGameSavestate<T>(r: string, m: GameMode): T | null {
  return (
    loadStorageJson<{ state?: T }>(
      `${STORAGE_SAVESTATE_PREFIX}${normalizeRoomCode(r)}_${m}`
    )?.state ?? null
  );
}

function saveLocalActiveSession(
  r: string,
  screen: 'menu' | 'play',
  mode: GameMode
): void {
  saveStorageJson(`${STORAGE_SESSION_PREFIX}${normalizeRoomCode(r)}`, {
    screen,
    mode,
  });
}

function loadLocalActiveSession(
  r: string
): { screen: 'menu' | 'play'; mode: GameMode } | null {
  const p = loadStorageJson<{ screen?: 'menu' | 'play'; mode?: GameMode }>(
    `${STORAGE_SESSION_PREFIX}${normalizeRoomCode(r)}`
  );
  return p && (p.screen === 'menu' || p.screen === 'play') && p.mode ? (p as any) : null;
}

function isDamaInProgress(s: DamaGameState | null | undefined): boolean {
  if (!s || !Array.isArray(s.board) || s.winner) return false;
  return Boolean(
    s.lastAction || s.p1Remaining < 12 || s.p2Remaining < 12
  );
}

function isSnakesInProgress(s: SnakesGameState | null | undefined): boolean {
  if (!s || typeof s.boardSeed !== 'number' || s.winner) return false;
  return Boolean(
    s.p1Tile > 1 || s.p2Tile > 1 || s.lastAnimation
  );
}

function isDoodleInProgress(s: DoodleGameState | null | undefined): boolean {
  if (!s || s.winner) return false;
  return Boolean(
    s.round > 1 ||
    s.selectedWord ||
    (s.strokes && s.strokes.length > 0) ||
    (s.guesses && s.guesses.length > 0) ||
    s.p1Score > 0 ||
    s.p2Score > 0
  );
}

const damaScore = (s: DamaGameState) => Math.max(0, 24 - (s.p1Remaining + s.p2Remaining)) * 10 + (s.lastAction ? 1 : 0) + (s.winner ? 1000 : 0);
const snakesScore = (s: SnakesGameState) => (s.p1Tile - 1) + (s.p2Tile - 1) + (s.lastAnimation ? 1 : 0) + (s.winner ? 1000 : 0);
const doodleScore = (s: DoodleGameState) =>
  (s.round - 1) * 500 +
  s.p1Score +
  s.p2Score +
  (s.strokes?.length ?? 0) * 2 +
  (s.guesses?.length ?? 0) * 5 +
  (s.winner ? 10000 : 0);

function mergeDamaSavestate(l: DamaGameState, inc?: DamaGameState): DamaGameState {
  if (!inc?.board) return l;
  if ((l.matchSeed ?? 0) === (inc.matchSeed ?? 0) && (l.matchSeed ?? 0) !== 0) return damaScore(inc) >= damaScore(l) ? inc : l;
  return !inc.matchSeed && isDamaInProgress(l) ? l : inc;
}
function mergeSnakesSavestate(l: SnakesGameState, inc?: SnakesGameState): SnakesGameState {
  if (typeof inc?.boardSeed !== 'number') return l;
  if (l.boardSeed === inc.boardSeed) return snakesScore(inc) >= snakesScore(l) ? inc : l;
  return inc.boardSeed === 202610 && isSnakesInProgress(l) ? l : inc;
}
function mergeDoodleSavestate(l: DoodleGameState, inc?: DoodleGameState): DoodleGameState {
  if (!inc?.phase) return l;
  if (l.matchSeed === inc.matchSeed) return doodleScore(inc) >= doodleScore(l) ? inc : l;
  return inc.matchSeed === 202612 && isDoodleInProgress(l) ? l : inc;
}



function loadSavedMyAvatar(): CatAvatarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_MY_AVATAR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CatAvatarConfig>;
      if (parsed && typeof parsed.name === 'string' && parsed.breed && parsed.accessory) {
        return {
          name: parsed.name.slice(0, 14) || 'Lovey',
          breed: parsed.breed,
          accessory: parsed.accessory,
        };
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_P1_AVATAR;
}

export function App() {
  // Persistent Default Character saved on this device (independent of room code)
  const [myAvatar, setMyAvatar] = useState<CatAvatarConfig>(loadSavedMyAvatar);
  const myAvatarRef = useRef<CatAvatarConfig>(myAvatar);
  myAvatarRef.current = myAvatar;

  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROOM_KEY);
      if (!saved || saved.toUpperCase() === 'GOAL') {
        localStorage.setItem(STORAGE_ROOM_KEY, 'LOVEY');
        localStorage.setItem(STORAGE_HOST_ROOM_KEY, 'LOVEY');
        return 'LOVEY';
      }
      return normalizeRoomCode(saved);
    } catch {
      return 'LOVEY';
    }
  });

  const [mySlot, setMySlot] = useState<PlayerSlot>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SLOT_KEY);
      return saved === 'p2' ? 'p2' : 'p1';
    } catch {
      return 'p1';
    }
  });
  const mySlotRef = useRef<PlayerSlot>(mySlot);
  mySlotRef.current = mySlot;

  const [roomData, setRoomData] = useState<CoupleRoomRow>(() => {
    const savedSession = loadLocalActiveSession(roomCode);
    return {
      room_code: roomCode,
      p1_avatar: mySlot === 'p1' ? myAvatar : DEFAULT_P1_AVATAR,
      p2_avatar: mySlot === 'p2' ? myAvatar : DEFAULT_P2_AVATAR,
      p1_dama_wins: 0,
      p2_dama_wins: 0,
      p1_snakes_wins: 0,
      p2_snakes_wins: 0,
      p1_doodle_wins: 0,
      p2_doodle_wins: 0,
      current_mode: savedSession?.mode ?? 'dama',
      updated_at: new Date().toISOString(),
    };
  });

  const [damaState, setDamaState] = useState<DamaGameState>(() => {
    const saved = loadLocalGameSavestate<DamaGameState>(roomCode, 'dama');
    if (saved && Array.isArray(saved.board)) return saved;
    return createInitialDamaState();
  });
  const [snakesState, setSnakesState] = useState<SnakesGameState>(() => {
    const saved = loadLocalGameSavestate<SnakesGameState>(roomCode, 'snakes');
    if (saved && typeof saved.boardSeed === 'number') return saved;
    return createInitialSnakesState(202610, true, 100);
  });
  const [doodleState, setDoodleState] = useState<DoodleGameState>(() => {
    const saved = loadLocalGameSavestate<DoodleGameState>(roomCode, 'doodle');
    if (saved && typeof saved.matchSeed === 'number') return saved;
    return createInitialDoodleState(202612, 'p1');
  });
  const [activeScreen, setActiveScreen] = useState<'menu' | 'play'>(() => {
    const savedSession = loadLocalActiveSession(roomCode);
    if (savedSession?.screen === 'play') {
      const savedDama = loadLocalGameSavestate<DamaGameState>(roomCode, 'dama');
      const savedSnakes = loadLocalGameSavestate<SnakesGameState>(
        roomCode,
        'snakes'
      );
      const savedDoodle = loadLocalGameSavestate<DoodleGameState>(
        roomCode,
        'doodle'
      );
      if (
        (savedSession.mode === 'dama' && savedDama) ||
        (savedSession.mode === 'snakes' && savedSnakes) ||
        (savedSession.mode === 'doodle' && savedDoodle)
      ) {
        return 'play';
      }
    }
    return 'menu';
  });
  const [passAndPlay, setPassAndPlay] = useState<boolean>(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [chatMessages, setChatMessages] = useState<FloatingReaction[]>([]);
  const [onlineSeen, setOnlineSeen] = useState<Record<PlayerSlot, number>>({
    p1: Date.now(),
    p2: 0,
  });
  const [partnerJoinedSession, setPartnerJoinedSession] = useState<boolean>(
    () => mySlot === 'p2'
  );
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [CustomizerModalComp, setCustomizerModalComp] = useState<any>(null);

  useEffect(() => {
    if (customizerOpen && !CustomizerModalComp) {
      import('./components/CatCustomizerModal').then((m) => {
        setCustomizerModalComp(() => m.CatCustomizerModal);
      });
    }
  }, [customizerOpen, CustomizerModalComp]);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [ScoreboardModalComp, setScoreboardModalComp] = useState<any>(null);

  useEffect(() => {
    if (scoreboardOpen && !ScoreboardModalComp) {
      import('./components/CoupleScoreboardModal').then((m) => {
        setScoreboardModalComp(() => m.CoupleScoreboardModal);
      });
    }
  }, [scoreboardOpen, ScoreboardModalComp]);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [TutorialModalComp, setTutorialModalComp] = useState<any>(null);

  useEffect(() => {
    if (tutorialOpen && !TutorialModalComp) {
      import('./components/DamaTutorialModal').then((m) => {
        setTutorialModalComp(() => m.DamaTutorialModal);
      });
    }
  }, [tutorialOpen, TutorialModalComp]);

  const [SnakesBoardComp, setSnakesBoardComp] = useState<any>(null);
  const [DoodleBoardComp, setDoodleBoardComp] = useState<any>(null);

  useEffect(() => {
    if (roomData.current_mode === 'snakes' && !SnakesBoardComp) {
      import('./components/SnakesBoardView').then((m) => {
        setSnakesBoardComp(() => m.SnakesBoardView);
      });
    } else if (roomData.current_mode === 'doodle' && !DoodleBoardComp) {
      import('./components/DoodleBoardView').then((m) => {
        setDoodleBoardComp(() => m.DoodleBoardView);
      });
    }
  }, [roomData.current_mode, SnakesBoardComp, DoodleBoardComp]);
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  const [timerEnabled, setTimerEnabled] = useState<boolean>(() => {
    return localStorage.getItem('lovey_timer_enabled') === 'true';
  });
  const [timerDurationSec, setTimerDurationSec] = useState<number>(() => {
    const saved = localStorage.getItem('lovey_timer_duration');
    return saved ? Math.max(10, Math.min(60, parseInt(saved, 10))) : 20;
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(20);
  const [isShufflingActive, setIsShufflingActive] = useState<boolean>(false);
  const [autoRollSignal, setAutoRollSignal] = useState<number>(0);
  const autoMoveExecutingRef = useRef<boolean>(false);
  const [kickedModalOpen, setKickedModalOpen] = useState<boolean>(false);

  const timerEnabledRef = useRef<boolean>(timerEnabled);
  timerEnabledRef.current = timerEnabled;
  const timerDurationSecRef = useRef<number>(timerDurationSec);
  timerDurationSecRef.current = timerDurationSec;

  const channelRef = useRef<CoupleRealtimeChannel | null>(null);
  const damaStateRef = useRef<DamaGameState>(damaState);
  damaStateRef.current = damaState;
  const snakesStateRef = useRef<SnakesGameState>(snakesState);
  snakesStateRef.current = snakesState;
  const doodleStateRef = useRef<DoodleGameState>(doodleState);
  doodleStateRef.current = doodleState;
  const activeScreenRef = useRef<'menu' | 'play'>(activeScreen);
  activeScreenRef.current = activeScreen;
  const roomDataRef = useRef<CoupleRoomRow>(roomData);
  roomDataRef.current = roomData;

  // Automatically persist per-game savestates & active screen to localStorage on every move
  useEffect(() => {
    saveLocalGameSavestate(roomCode, 'dama', damaState);
  }, [roomCode, damaState]);

  useEffect(() => {
    saveLocalGameSavestate(roomCode, 'snakes', snakesState);
  }, [roomCode, snakesState]);

  useEffect(() => {
    saveLocalGameSavestate(roomCode, 'doodle', doodleState);
  }, [roomCode, doodleState]);

  useEffect(() => {
    saveLocalActiveSession(roomCode, activeScreen, roomData.current_mode);
  }, [roomCode, activeScreen, roomData.current_mode]);

  const lastStartingSlotRef = useRef<{ slot: PlayerSlot; streak: number }>({
    slot: 'p1',
    streak: 0,
  });

  const pickFairStartingTurn = (): PlayerSlot => {
    let pick: PlayerSlot;
    if (lastStartingSlotRef.current.streak >= 2) {
      // Prevent any player from getting 3 first-turns in a row
      pick = lastStartingSlotRef.current.slot === 'p1' ? 'p2' : 'p1';
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      pick = buf[0] % 2 === 0 ? 'p1' : 'p2';
    } else {
      pick = Math.random() < 0.5 ? 'p1' : 'p2';
    }

    if (lastStartingSlotRef.current.slot === pick) {
      lastStartingSlotRef.current.streak += 1;
    } else {
      lastStartingSlotRef.current = { slot: pick, streak: 1 };
    }
    return pick;
  };

  // Switch background music track automatically per screen & game mode
  useEffect(() => {
    if (activeScreen === 'menu') {
      setBgMusicTrack('menu');
    } else if (roomData.current_mode === 'snakes') {
      setBgMusicTrack('snakes');
    } else if (roomData.current_mode === 'doodle') {
      setBgMusicTrack('doodle');
    } else {
      setBgMusicTrack('dama');
    }
  }, [activeScreen, roomData.current_mode]);

  const checkAutoOpenTutorial = useCallback((mode: GameMode) => {
    try {
      const key = `${STORAGE_TUTORIAL_PREFIX}${mode}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1');
        setTutorialOpen(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const spawnFloatingReaction = useCallback((reaction: FloatingReaction) => {
    playReactionChime();
    setReactions((prev) => [...prev.slice(-6), reaction]);
    if (reaction.kind === 'chat') {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === reaction.id)) return prev;
        return [...prev.slice(-49), reaction];
      });
    }
    window.setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== reaction.id));
    }, 2150);
  }, []);

  const syncFromDatabase = useCallback(async (targetRoom: string) => {
    const slot = mySlotRef.current;
    const localAv = myAvatarRef.current;

    // First restore any local savestate for this room immediately (0ms latency!)
    const localDama = loadLocalGameSavestate<DamaGameState>(targetRoom, 'dama');
    if (localDama && Array.isArray(localDama.board)) {
      setDamaState((prev) => mergeDamaSavestate(prev, localDama));
    }
    const localSnakes = loadLocalGameSavestate<SnakesGameState>(
      targetRoom,
      'snakes'
    );
    if (localSnakes && typeof localSnakes.boardSeed === 'number') {
      setSnakesState((prev) => mergeSnakesSavestate(prev, localSnakes));
    }
    const localDoodle = loadLocalGameSavestate<DoodleGameState>(targetRoom, 'doodle');
    if (localDoodle && typeof localDoodle.matchSeed === 'number') {
      setDoodleState((prev) => mergeDoodleSavestate(prev, localDoodle));
    }

    const [row, matchRow] = await Promise.all([
      fetchOrCreateCoupleRoom(targetRoom),
      fetchActiveMatch<unknown>(targetRoom),
    ]);

    // Always keep our device's default character authoritative for our own slot!
    setRoomData((prev) => {
      const activeMode =
        (matchRow?.game_mode as GameMode) ||
        (prev.current_mode ?? row.current_mode) ||
        row.current_mode;
      return {
        ...row,
        p1_avatar: slot === 'p1' ? localAv : row.p1_avatar,
        p2_avatar: slot === 'p2' ? localAv : row.p2_avatar,
        current_mode: activeMode,
      };
    });

    // Push our device character to the room DB so our partner sees our outfit & name
    updatePlayerAvatarInDb(targetRoom, slot, localAv);

    if (matchRow && matchRow.state_json) {
      if (matchRow.game_mode === 'dama') {
        const maybeDama = matchRow.state_json as DamaGameState;
        if (Array.isArray(maybeDama.board)) {
          setDamaState((prev) => mergeDamaSavestate(prev, maybeDama));
        }
      } else if (matchRow.game_mode === 'snakes') {
        const maybeSnakes = matchRow.state_json as SnakesGameState;
        if (typeof maybeSnakes.boardSeed === 'number') {
          setSnakesState((prev) => mergeSnakesSavestate(prev, maybeSnakes));
        }
      } else if (matchRow.game_mode === 'doodle') {
        const maybeDoodle = matchRow.state_json as DoodleGameState;
        if (maybeDoodle && typeof maybeDoodle.matchSeed === 'number') {
          setDoodleState((prev) => mergeDoodleSavestate(prev, maybeDoodle));
        }
      }
    } else if (!localDama && !localSnakes && !localDoodle) {
      // If targetRoom has no local savestate and no database match, reset to fresh initial state
      setDamaState(createInitialDamaState('p1'));
      setSnakesState(createInitialSnakesState());
      setDoodleState(createInitialDoodleState());
    }
  }, []);

  useEffect(() => {
    syncFromDatabase(roomCode);

    const channel = new CoupleRealtimeChannel(roomCode, mySlot, {
      onBroadcast: (event: RealtimeBroadcastEvent) => {
        if (event.type === 'reaction') {
          spawnFloatingReaction(event.reaction);
        } else if (event.type === 'avatar_update') {
          setRoomData((prev) =>
            event.slot === 'p1'
              ? { ...prev, p1_avatar: event.avatar }
              : { ...prev, p2_avatar: event.avatar }
          );
        } else if (event.type === 'partner_left') {
          setPartnerJoinedSession(false);
          setOnlineSeen((prev) => ({ ...prev, [event.slot]: 0 }));
        } else if (event.type === 'partner_kicked') {
          if (mySlotRef.current === 'p2') {
            setKickedModalOpen(true);
            handleLeaveJoinedRoom();
          }
        } else if (event.type === 'partner_joined') {
          setPartnerJoinedSession(true);
          setOnlineSeen((prev) => ({ ...prev, [event.slot]: Date.now() }));
          setRoomData((prev) =>
            event.slot === 'p1'
              ? { ...prev, p1_avatar: event.avatar }
              : { ...prev, p2_avatar: event.avatar }
          );
          // Reply with our own device avatar + full savestates so the partner immediately syncs
          channelRef.current?.sendBroadcast({
            type: 'avatar_update',
            slot: mySlotRef.current,
            avatar: myAvatarRef.current,
          });
          channelRef.current?.sendBroadcast({
            type: 'savestate_snapshot',
            damaState: damaStateRef.current,
            snakesState: snakesStateRef.current,
            doodleState: doodleStateRef.current,
            currentMode: roomDataRef.current.current_mode,
            isPlaying: activeScreenRef.current === 'play',
            timerConfig: {
              enabled: timerEnabledRef.current,
              durationSec: timerDurationSecRef.current,
            },
            sender: mySlotRef.current,
          });
        } else if (event.type === 'request_savestate') {
          // Partner reloaded or recovered from slow internet — send our latest savestate for all games!
          channelRef.current?.sendBroadcast({
            type: 'savestate_snapshot',
            damaState: damaStateRef.current,
            snakesState: snakesStateRef.current,
            doodleState: doodleStateRef.current,
            currentMode: roomDataRef.current.current_mode,
            isPlaying: activeScreenRef.current === 'play',
            timerConfig: {
              enabled: timerEnabledRef.current,
              durationSec: timerDurationSecRef.current,
            },
            sender: mySlotRef.current,
          });
        } else if (event.type === 'timer_config_update') {
          setTimerEnabled(event.enabled);
          setTimerDurationSec(event.durationSec);
          setTimeRemaining(event.durationSec);
          localStorage.setItem('lovey_timer_enabled', String(event.enabled));
          localStorage.setItem('lovey_timer_duration', String(event.durationSec));
        } else if (event.type === 'savestate_snapshot') {
          if (event.timerConfig) {
            setTimerEnabled(event.timerConfig.enabled);
            setTimerDurationSec(event.timerConfig.durationSec);
            setTimeRemaining(event.timerConfig.durationSec);
            localStorage.setItem(
              'lovey_timer_enabled',
              String(event.timerConfig.enabled)
            );
            localStorage.setItem(
              'lovey_timer_duration',
              String(event.timerConfig.durationSec)
            );
          }
          const inDama = event.damaState as DamaGameState | undefined;
          if (inDama && Array.isArray(inDama.board)) {
            setDamaState((prev) => mergeDamaSavestate(prev, inDama));
          }
          const inSnakes = event.snakesState as SnakesGameState | undefined;
          if (inSnakes && typeof inSnakes.boardSeed === 'number') {
            setSnakesState((prev) => mergeSnakesSavestate(prev, inSnakes));
          }
          const inDoodle = event.doodleState as DoodleGameState | undefined;
          if (inDoodle && typeof inDoodle.matchSeed === 'number') {
            setDoodleState((prev) => mergeDoodleSavestate(prev, inDoodle));
          }
          if (
            event.currentMode === 'dama' ||
            event.currentMode === 'snakes' ||
            event.currentMode === 'doodle'
          ) {
            setRoomData((prev) => ({
              ...prev,
              current_mode: event.currentMode,
            }));
          }
          // If we are Invited (p2) and Host is actively playing, auto-rejoin the active board!
          if (mySlotRef.current === 'p2' && event.isPlaying) {
            setActiveScreen('play');
          }
        } else if (
          event.type === 'mode_switch' ||
          event.type === 'start_match'
        ) {
          setRoomData((prev) => ({ ...prev, current_mode: event.mode }));
          setActiveScreen('play');
          checkAutoOpenTutorial(event.mode);
        } else if (event.type === 'match_sync') {
          if (event.gameMode === 'dama') {
            const incoming = event.stateJson as DamaGameState;
            if (incoming && Array.isArray(incoming.board)) {
              setDamaState(incoming);
            }
          } else if (event.gameMode === 'snakes') {
            const incoming = event.stateJson as SnakesGameState;
            if (incoming && typeof incoming.boardSeed === 'number') {
              setSnakesState(incoming);
            }
          } else if (event.gameMode === 'doodle') {
            const incoming = event.stateJson as DoodleGameState;
            if (incoming && typeof incoming.matchSeed === 'number') {
              setDoodleState(incoming);
            }
          }
          if (event.winner === 'p1' || event.winner === 'p2') {
            const winKey = `${event.winner}_${event.gameMode}_wins` as keyof CoupleRoomRow;
            setRoomData((prev) => ({
              ...prev,
              [winKey]: ((prev[winKey] as number) || 0) + 1,
            }));
            fetchOrCreateCoupleRoom(roomCode).then((r) => {
              setRoomData((prev) => {
                const next = {
                  ...r,
                  p1_avatar: prev.p1_avatar,
                  p2_avatar: prev.p2_avatar,
                  current_mode: prev.current_mode || event.gameMode,
                };
                (['dama', 'snakes', 'doodle'] as const).forEach((gm) => {
                  (['p1', 'p2'] as const).forEach((ps) => {
                    const k = `${ps}_${gm}_wins` as keyof CoupleRoomRow;
                    (next as any)[k] = Math.max((prev[k] as number) || 0, (r[k] as number) || 0);
                  });
                });
                return next;
              });
            });
          }
        } else if (event.type === 'doodle_stroke') {
          const stroke = event.stroke as DoodleStroke;
          if (stroke && Array.isArray(stroke.points)) {
            setDoodleState((prev) => {
              if (prev.strokes.some((s) => s.id === stroke.id)) return prev;
              return { ...prev, strokes: [...prev.strokes, stroke] };
            });
          }
        } else if (event.type === 'doodle_clear') {
          setDoodleState((prev) => ({ ...prev, strokes: [] }));
        }
      },
      onPartnerOnlineChange: (seenMap) => {
        setOnlineSeen(seenMap);
      },
      onResyncRequested: () => {
        syncFromDatabase(roomCode);
      },
    });

    channel.connect();
    channelRef.current = channel;

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible') {
        syncFromDatabase(roomCode);
        channelRef.current?.sendBroadcast({
          type: 'request_savestate',
          slot: mySlotRef.current,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    window.addEventListener('online', handleVisibilityOrOnline);

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityOrOnline
      );
      window.removeEventListener('online', handleVisibilityOrOnline);
      channel.destroy();
      channelRef.current = null;
    };
  }, [
    roomCode,
    mySlot,
    spawnFloatingReaction,
    syncFromDatabase,
    checkAutoOpenTutorial,
  ]);

  const handleChangeMyRoomCode = async (newCode: string) => {
    playTapPop();
    const cleaned = normalizeRoomCode(newCode);
    setMySlot('p1');
    setPartnerJoinedSession(false);
    setOnlineSeen({ p1: Date.now(), p2: 0 });
    setRoomCode(cleaned);
    try {
      localStorage.setItem(STORAGE_ROOM_KEY, cleaned);
      localStorage.setItem(STORAGE_HOST_ROOM_KEY, cleaned);
      localStorage.setItem(STORAGE_SLOT_KEY, 'p1');
    } catch {
      // Ignore
    }
    const row = await fetchOrCreateCoupleRoom(cleaned);
    const savedSession = loadLocalActiveSession(cleaned);
    setRoomData((prev) => ({
      ...row,
      p1_avatar: myAvatarRef.current,
      current_mode: savedSession?.mode ?? (prev.current_mode || row.current_mode),
    }));
    await updatePlayerAvatarInDb(cleaned, 'p1', myAvatarRef.current);
  };

  const handleAttemptJoinAsInvited = async (
    targetCode: string
  ): Promise<boolean> => {
    playTapPop();
    const cleaned = normalizeRoomCode(targetCode);
    const { ok, room } = await checkCoupleRoomExists(cleaned);
    if (!ok || !room) {
      return false;
    }

    const myCurrentAv = myAvatarRef.current;
    setMySlot('p2');
    setPartnerJoinedSession(true);
    setRoomCode(cleaned);
    setRoomData({
      ...room,
      p2_avatar: myCurrentAv,
    });
    try {
      localStorage.setItem(STORAGE_ROOM_KEY, cleaned);
      localStorage.setItem(STORAGE_SLOT_KEY, 'p2');
    } catch {
      // Ignore
    }

    await updatePlayerAvatarInDb(cleaned, 'p2', myCurrentAv);

    window.setTimeout(() => {
      channelRef.current?.updateSlot('p2');
      channelRef.current?.sendBroadcast({
        type: 'partner_joined',
        slot: 'p2',
        avatar: myCurrentAv,
      });
      channelRef.current?.sendBroadcast({
        type: 'request_savestate',
        slot: 'p2',
      });
    }, 380);

    return true;
  };

  const handleLeaveJoinedRoom = () => {
    playTapPop();
    // Notify the Host immediately that Invited has left the room
    channelRef.current?.sendBroadcast({
      type: 'partner_left',
      slot: 'p2',
    });

    let hostRoom = 'LOVEY';
    try {
      hostRoom = normalizeRoomCode(
        localStorage.getItem(STORAGE_HOST_ROOM_KEY) || 'LOVEY'
      );
      if (hostRoom === roomCode) {
        const prefix = normalizeRoomCode(
          myAvatarRef.current.name || 'CAT'
        ).slice(0, 6);
        hostRoom = `${prefix}${Math.floor(10 + Math.random() * 89)}`;
      }
      localStorage.setItem(STORAGE_ROOM_KEY, hostRoom);
      localStorage.setItem(STORAGE_HOST_ROOM_KEY, hostRoom);
      localStorage.setItem(STORAGE_SLOT_KEY, 'p1');
    } catch {
      // Ignore
    }
    setActiveScreen('menu');
    setMySlot('p1');
    setPartnerJoinedSession(false);
    setOnlineSeen({ p1: Date.now(), p2: 0 });
    setRoomCode(hostRoom);
  };

  const handleHostKickPlayer = async () => {
    playTapPop();
    const partnerName = roomData.p2_avatar.name || 'Invited player';
    channelRef.current?.sendBroadcast({
      type: 'partner_kicked',
      slot: 'p2',
    });
    setPartnerJoinedSession(false);
    setOnlineSeen((prev) => ({ ...prev, p2: 0 }));
    // Keep roomData.p2_avatar so their name remains on the P-2 spot in the bottom screen!
    spawnFloatingReaction({
      id: `kick-notice-${Date.now()}`,
      sender: 'p1',
      kind: 'chat',
      content: `${partnerName} was removed from the room`,
      createdAt: Date.now(),
    });
  };

  const handleRejoinSavedGame = (targetMode?: GameMode) => {
    playTapPop();
    const modeToJoin = targetMode ?? roomData.current_mode;
    setRoomData((prev) => ({ ...prev, current_mode: modeToJoin }));
    setActiveScreen('play');
    // Request latest peer savestate in case moves happened while we were on menu
    channelRef.current?.sendBroadcast({
      type: 'request_savestate',
      slot: mySlot,
    });
    if (mySlot === 'p1') {
      channelRef.current?.sendBroadcast({
        type: 'start_match',
        mode: modeToJoin,
        snakesMaxTile: snakesState.maxTile ?? 100,
        sender: 'p1',
      });
      updateRoomModeInDb(roomCode, modeToJoin);
    }
  };

  const broadcastAndPersistMatch = async (
    gameMode: GameMode,
    turn: PlayerSlot,
    boardSeed: number,
    stateJson: unknown,
    winner: PlayerSlot | 'draw' | null
  ) => {
    channelRef.current?.sendBroadcast({
      type: 'match_sync',
      gameMode,
      turn,
      boardSeed,
      stateJson,
      winner,
      sender: mySlot,
    });
    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: gameMode,
      turn,
      board_seed: boardSeed,
      state_json: stateJson,
      winner,
    });
  };

  const handleHostLaunchGame = async (
    selectedMode: GameMode,
    soloPractice = false,
    snakesMaxTile: SnakesMaxTile = 100,
    forceNewMatch = false
  ) => {
    playTapPop();
    if (soloPractice) {
      setPassAndPlay(true);
    }
    setRoomData((prev) => ({ ...prev, current_mode: selectedMode }));
    setActiveScreen('play');
    checkAutoOpenTutorial(selectedMode);

    if (selectedMode === 'dama') {
      const nextDama = !forceNewMatch && isDamaInProgress(damaState) ? damaState : createInitialDamaState(pickFairStartingTurn());
      setDamaState(nextDama);
      broadcastAndPersistMatch('dama', nextDama.turn, nextDama.matchSeed ?? 0, nextDama, nextDama.winner);
    } else if (selectedMode === 'snakes') {
      const nextSnakes = !forceNewMatch && isSnakesInProgress(snakesState) && (snakesState.maxTile ?? 100) === snakesMaxTile
        ? snakesState
        : createInitialSnakesState(Math.floor(100000 + Math.random() * 899999), true, snakesMaxTile, pickFairStartingTurn());
      setSnakesState(nextSnakes);
      broadcastAndPersistMatch('snakes', nextSnakes.turn, nextSnakes.boardSeed, nextSnakes, nextSnakes.winner);
    } else {
      const nextDoodle = !forceNewMatch && isDoodleInProgress(doodleState)
        ? doodleState
        : createInitialDoodleState(Math.floor(100000 + Math.random() * 899999), pickFairStartingTurn());
      setDoodleState(nextDoodle);
      broadcastAndPersistMatch('doodle', nextDoodle.turn, nextDoodle.matchSeed, nextDoodle, nextDoodle.winner);
    }

    channelRef.current?.sendBroadcast({
      type: 'start_match',
      mode: selectedMode,
      snakesMaxTile,
      sender: 'p1',
    });
    updateRoomModeInDb(roomCode, selectedMode);
  };

  const commitGameWin = async (
    mode: GameMode,
    winSlot: PlayerSlot,
    summary: string
  ) => {
    const winKey = `${winSlot}_${mode}_wins` as keyof CoupleRoomRow;
    setRoomData((prev) => ({
      ...prev,
      [winKey]: ((prev[winKey] as number) || 0) + 1,
    }));
    const updatedRoom = await recordMatchWinInDb(
      roomData,
      mode,
      winSlot,
      summary
    );
    if (updatedRoom) {
      setRoomData((prev) => ({
        ...updatedRoom,
        [winKey]: Math.max(
          (prev[winKey] as number) || 0,
          (updatedRoom[winKey] as number) || 0
        ),
        p1_avatar: prev.p1_avatar,
        p2_avatar: prev.p2_avatar,
        current_mode: prev.current_mode || mode,
      }));
    }
  };



  const handleCommitDamaState = async (nextState: DamaGameState) => {
    setDamaState(nextState);
    await broadcastAndPersistMatch(
      'dama',
      nextState.turn,
      nextState.matchSeed ?? 0,
      nextState,
      nextState.winner
    );
    if (nextState.winner && nextState.winner !== 'draw') {
      await commitGameWin(
        'dama',
        nextState.winner,
        `Cat Dama (${nextState.p1Remaining} - ${nextState.p2Remaining})`
      );
    }
  };

  const handleResetDamaMatch = async () => {
    const fresh = createInitialDamaState(pickFairStartingTurn());
    setDamaState(fresh);
    await broadcastAndPersistMatch(
      'dama',
      fresh.turn,
      fresh.matchSeed ?? 0,
      fresh,
      null
    );
  };

  const handleCommitSnakesState = async (nextState: SnakesGameState) => {
    setSnakesState(nextState);
    await broadcastAndPersistMatch(
      'snakes',
      nextState.turn,
      nextState.boardSeed,
      nextState,
      nextState.winner
    );
    if (nextState.winner) {
      await commitGameWin(
        'snakes',
        nextState.winner,
        `Snakes ${nextState.maxTile ?? 100} (Seed #${nextState.boardSeed})`
      );
    }
  };

  const handleNewSnakesSeedMatch = async (
    twistsEnabled: boolean,
    maxTile: SnakesMaxTile = snakesState.maxTile ?? 100
  ) => {
    const newSeed = Math.floor(100000 + Math.random() * 899999);
    const fresh = createInitialSnakesState(
      newSeed,
      twistsEnabled,
      maxTile,
      pickFairStartingTurn()
    );
    setSnakesState(fresh);
    await broadcastAndPersistMatch(
      'snakes',
      fresh.turn,
      fresh.boardSeed,
      fresh,
      null
    );
  };

  const handleCommitDoodleState = async (nextState: DoodleGameState) => {
    setDoodleState(nextState);
    await broadcastAndPersistMatch(
      'doodle',
      nextState.turn,
      nextState.matchSeed,
      nextState,
      nextState.winner
    );
    if (nextState.winner && nextState.winner !== 'draw') {
      await commitGameWin(
        'doodle',
        nextState.winner,
        `Doodle Clash (P1 ${nextState.p1Score} - P2 ${nextState.p2Score})`
      );
    }
  };

  const handleResetDoodleMatch = async () => {
    const newSeed = Math.floor(100000 + Math.random() * 899999);
    const fresh = createInitialDoodleState(newSeed, pickFairStartingTurn());
    setDoodleState(fresh);
    await broadcastAndPersistMatch(
      'doodle',
      fresh.turn,
      fresh.matchSeed,
      fresh,
      null
    );
  };

  const handleSendReaction = (content: string, kind: 'emoji' | 'chat') => {
    const reaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender: mySlot,
      content,
      kind,
      createdAt: Date.now(),
    };
    spawnFloatingReaction(reaction);
    channelRef.current?.sendBroadcast({ type: 'reaction', reaction });
  };

  const handleHostSwitchMode = (
    newMode: GameMode,
    snakesMaxTile: SnakesMaxTile = snakesState.maxTile ?? 100
  ) => {
    if (mySlot !== 'p1') return;
    playTapPop();
    setRoomData((prev) => ({ ...prev, current_mode: newMode }));
    checkAutoOpenTutorial(newMode);

    if (newMode === 'snakes') {
      if (
        !isSnakesInProgress(snakesState) ||
        (snakesState.maxTile ?? 100) !== snakesMaxTile
      ) {
        handleNewSnakesSeedMatch(snakesState.twistsEnabled, snakesMaxTile);
      } else {
        channelRef.current?.sendBroadcast({
          type: 'match_sync',
          gameMode: 'snakes',
          turn: snakesState.turn,
          boardSeed: snakesState.boardSeed,
          stateJson: snakesState,
          winner: snakesState.winner,
          sender: mySlot,
        });
      }
    } else if (newMode === 'doodle') {
      if (!isDoodleInProgress(doodleState)) {
        handleResetDoodleMatch();
      } else {
        channelRef.current?.sendBroadcast({
          type: 'match_sync',
          gameMode: 'doodle',
          turn: doodleState.turn,
          boardSeed: doodleState.matchSeed,
          stateJson: doodleState,
          winner: doodleState.winner,
          sender: mySlot,
        });
      }
    } else {
      if (!isDamaInProgress(damaState)) {
        handleResetDamaMatch();
      } else {
        channelRef.current?.sendBroadcast({
          type: 'match_sync',
          gameMode: 'dama',
          turn: damaState.turn,
          boardSeed: damaState.matchSeed ?? 0,
          stateJson: damaState,
          winner: damaState.winner,
          sender: mySlot,
        });
      }
    }

    channelRef.current?.sendBroadcast({
      type: 'mode_switch',
      mode: newMode,
      snakesMaxTile,
      sender: 'p1',
    });
    updateRoomModeInDb(roomCode, newMode);
  };

  const handleHostResetCurrentMatch = () => {
    if (roomData.current_mode === 'dama') {
      handleResetDamaMatch();
    } else if (roomData.current_mode === 'doodle') {
      handleResetDoodleMatch();
    } else {
      handleNewSnakesSeedMatch(
        snakesState.twistsEnabled,
        snakesState.maxTile ?? 100
      );
    }
  };

  const handleToggleMute = () => {
    const nextMuted = setSoundMuted(!muted);
    setMuted(nextMuted);
  };

  /**
   * Saves the player's default character on this device (independent of room code)
   * and syncs it to their active slot in the current room.
   */
  const handleSaveProfile = async (newAvatar: CatAvatarConfig) => {
    playTapPop();
    setCustomizerOpen(false);
    setMyAvatar(newAvatar);
    try {
      localStorage.setItem(STORAGE_MY_AVATAR_KEY, JSON.stringify(newAvatar));
    } catch {
      // Ignore storage errors
    }

    setRoomData((prev) =>
      mySlot === 'p1'
        ? { ...prev, p1_avatar: newAvatar }
        : { ...prev, p2_avatar: newAvatar }
    );

    channelRef.current?.sendBroadcast({
      type: 'avatar_update',
      slot: mySlot,
      avatar: newAvatar,
    });

    await updatePlayerAvatarInDb(roomCode, mySlot, newAvatar);
  };

  const now = Date.now();
  const p1Online = mySlot === 'p1' || now - (onlineSeen.p1 || 0) < 16000;
  const p2Online = mySlot === 'p2' || now - (onlineSeen.p2 || 0) < 16000;

  // Cat is alone on homescreen until a partner joins the room or you join someone's room!
  const isJoinedWithPartner =
    mySlot === 'p2' || p2Online || partnerJoinedSession;

  const p1Wins =
    roomData.current_mode === 'dama'
      ? roomData.p1_dama_wins
      : roomData.current_mode === 'doodle'
      ? roomData.p1_doodle_wins || 0
      : roomData.p1_snakes_wins;
  const p2Wins =
    roomData.current_mode === 'dama'
      ? roomData.p2_dama_wins
      : roomData.current_mode === 'doodle'
      ? roomData.p2_doodle_wins || 0
      : roomData.p2_snakes_wins;

  // Authoritative avatars (our own slot always uses our device's myAvatar)
  const effectiveP1Avatar: CatAvatarConfig =
    mySlot === 'p1' ? myAvatar : roomData.p1_avatar;
  const effectiveP2Avatar: CatAvatarConfig =
    mySlot === 'p2' ? myAvatar : roomData.p2_avatar;

  const p1DisplayName = effectiveP1Avatar.name || 'Lovey 1';
  const p2DisplayName =
    effectiveP2Avatar.name && effectiveP2Avatar.name !== p1DisplayName
      ? effectiveP2Avatar.name
      : 'Lovey 2';

  const activeTurnSlot: PlayerSlot =
    roomData.current_mode === 'dama'
      ? damaState.turn
      : roomData.current_mode === 'doodle'
      ? doodleState.turn
      : snakesState.turn;

  const [turnBubbleText, setTurnBubbleText] = useState('Your turn!');

  useEffect(() => {
    if (
      roomData.current_mode === 'snakes' &&
      snakesState.lastAnimation?.eventMessage
    ) {
      setTurnBubbleText(snakesState.lastAnimation.eventMessage);
      const t = window.setTimeout(() => {
        setTurnBubbleText('Your turn!');
      }, 1800);
      return () => window.clearTimeout(t);
    }
    if (
      roomData.current_mode === 'doodle' &&
      doodleState.lastRoundOutcome?.summaryMessage
    ) {
      setTurnBubbleText(doodleState.lastRoundOutcome.summaryMessage);
      const t = window.setTimeout(() => {
        setTurnBubbleText('Your turn!');
      }, 2500);
      return () => window.clearTimeout(t);
    }
    setTurnBubbleText('Your turn!');
  }, [
    roomData.current_mode,
    snakesState.lastAnimation?.id,
    snakesState.lastAnimation?.eventMessage,
    doodleState.lastRoundOutcome?.id,
    doodleState.lastRoundOutcome?.summaryMessage,
  ]);

  const p1CapturedCount = Math.max(0, 12 - damaState.p2Remaining);
  const p2CapturedCount = Math.max(0, 12 - damaState.p1Remaining);

  const currentWinner: PlayerSlot | 'draw' | null =
    roomData.current_mode === 'dama'
      ? damaState.winner
      : roomData.current_mode === 'doodle'
      ? doodleState.winner
      : snakesState.winner;

  const handleToggleTimer = () => {
    if (mySlot !== 'p1') return;
    const next = !timerEnabled;
    setTimerEnabled(next);
    localStorage.setItem('lovey_timer_enabled', String(next));
    channelRef.current?.sendBroadcast({
      type: 'timer_config_update',
      enabled: next,
      durationSec: timerDurationSec,
      sender: 'p1',
    });
  };

  const handleChangeTimerDuration = (sec: number) => {
    if (mySlot !== 'p1') return;
    const clamped = Math.max(10, Math.min(60, sec));
    setTimerDurationSec(clamped);
    setTimeRemaining(clamped);
    localStorage.setItem('lovey_timer_duration', String(clamped));
    channelRef.current?.sendBroadcast({
      type: 'timer_config_update',
      enabled: timerEnabled,
      durationSec: clamped,
      sender: 'p1',
    });
  };

  const lastMoveActionKey =
    roomData.current_mode === 'dama'
      ? damaState.lastAction?.id ?? ''
      : roomData.current_mode === 'doodle'
      ? `${doodleState.round}-${doodleState.phase}-${doodleState.strokes.length}-${doodleState.guesses.length}`
      : snakesState.lastAnimation?.id ?? '';

  useEffect(() => {
    setTimeRemaining(timerDurationSec);
    autoMoveExecutingRef.current = false;
  }, [
    activeTurnSlot,
    roomData.current_mode,
    lastMoveActionKey,
    timerDurationSec,
  ]);

  useEffect(() => {
    if (
      !timerEnabled ||
      activeScreen !== 'play' ||
      currentWinner ||
      isShufflingActive
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 4 && prev > 1 && !isSoundMuted()) {
          playTimerTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerEnabled, activeScreen, currentWinner, isShufflingActive]);

  const executeAutoRandomMove = useCallback(() => {
    const mode = roomData.current_mode;
    if (mode === 'dama') {
      const legalSteps = getLegalStepsForState(damaState);
      if (legalSteps.length > 0) {
        const chosen = legalSteps[Math.floor(Math.random() * legalSteps.length)];
        let nextState = applyDamaStep(damaState, chosen.from, chosen.to);
        while (nextState.chainPos) {
          const chainSteps = getLegalStepsForState(nextState);
          if (chainSteps.length === 0) break;
          const nextHop = chainSteps[Math.floor(Math.random() * chainSteps.length)];
          nextState = applyDamaStep(nextState, nextHop.from, nextHop.to);
        }
        handleCommitDamaState(nextState);
      }
    } else if (mode === 'snakes') {
      if (passAndPlay || mySlot === activeTurnSlot) {
        setAutoRollSignal((prev) => prev + 1);
      } else {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const doubleTurns =
          (snakesState.turn === 'p1'
            ? snakesState.p1DoubleDiceTurns
            : snakesState.p2DoubleDiceTurns) ?? 0;
        const d2 =
          doubleTurns > 0 ? Math.floor(Math.random() * 6) + 1 : undefined;
        const entropy = Math.floor(Math.random() * 1000000);
        const nextState = applySnakesDiceRoll(snakesState, d1, d2, entropy);
        handleCommitSnakesState(nextState);
      }
    } else if (mode === 'doodle') {
      if (doodleState.phase === 'word_selection' && doodleState.wordChoices.length > 0) {
        const next = applySelectDoodleWord(doodleState, doodleState.wordChoices[0]);
        handleCommitDoodleState(next);
      }
    }
  }, [
    roomData.current_mode,
    damaState,
    snakesState,
    doodleState,
    passAndPlay,
    mySlot,
    activeTurnSlot,
  ]);

  useEffect(() => {
    if (
      !timerEnabled ||
      activeScreen !== 'play' ||
      currentWinner ||
      isShufflingActive
    ) {
      return;
    }

    const isMyTurn = passAndPlay || mySlot === activeTurnSlot;
    const shouldActivePlayerMove = isMyTurn && timeRemaining === 0;
    const shouldFallbackMove = !isMyTurn && timeRemaining <= -2;

    if (
      (shouldActivePlayerMove || shouldFallbackMove) &&
      !autoMoveExecutingRef.current
    ) {
      autoMoveExecutingRef.current = true;
      executeAutoRandomMove();
      const t = window.setTimeout(() => {
        autoMoveExecutingRef.current = false;
      }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [
    timeRemaining,
    timerEnabled,
    activeScreen,
    currentWinner,
    isShufflingActive,
    passAndPlay,
    mySlot,
    activeTurnSlot,
    executeAutoRandomMove,
  ]);

  return (
    <main className="arcade-shell">
      {activeScreen === 'menu' ? (
        <HomeMenuView
          roomData={{
            ...roomData,
            p1_avatar: { ...effectiveP1Avatar, name: p1DisplayName },
            p2_avatar: { ...effectiveP2Avatar, name: p2DisplayName },
          }}
          mySlot={mySlot}
          myAvatar={myAvatar}
          isJoined={isJoinedWithPartner}
          p2Online={p2Online}
          hasSavedDama={isJoinedWithPartner && isDamaInProgress(damaState)}
          hasSavedSnakes={isJoinedWithPartner && isSnakesInProgress(snakesState)}
          hasSavedDoodle={isJoinedWithPartner && isDoodleInProgress(doodleState)}
          savedSnakesMaxTile={snakesState.maxTile ?? 100}
          chatMessages={chatMessages}
          onOpenSettings={() => setCustomizerOpen(true)}
          onChangeMyRoomCode={handleChangeMyRoomCode}
          onAttemptJoinAsInvited={handleAttemptJoinAsInvited}
          onLeaveJoinedRoom={handleLeaveJoinedRoom}
          onRejoinSavedGame={handleRejoinSavedGame}
          onHostLaunchGame={handleHostLaunchGame}
          onSendReaction={handleSendReaction}
          onHostKickPlayer={handleHostKickPlayer}
        />
      ) : (
        <div className="ingame-screen-layout">
          {/* Minimal In-Game Top Bar: Top-Left Settings Charm Button + Centered Game Sticker Pill */}
          <header className="ingame-top-bar">
            <button
              type="button"
              className="icon-circle-btn settings-charm-btn sticker-press"
              onClick={() => setCustomizerOpen(true)}
              aria-label="Open Settings"
              title="Settings"
            >
              <SettingsGearIcon size={25} />
            </button>

            <div className="ingame-title-pill">
              {roomData.current_mode === 'dama' ? (
                <>
                  <CrownIcon size={16} />
                  <span>Cat Dama</span>
                </>
              ) : roomData.current_mode === 'doodle' ? (
                <>
                  <DoodleClashIcon size={16} />
                  <span>Doodle Clash</span>
                </>
              ) : (
                <>
                  <SnakeLadderIcon size={16} />
                  <span>
                    Snakes &amp; Ladders ({snakesState.maxTile ?? 100})
                  </span>
                </>
              )}
            </div>

            {timerEnabled ? (
              <div
                className={`ingame-timer-badge ${timeRemaining <= 5 ? 'urgent' : ''}`}
                title={`Turn Timer: ${Math.max(0, timeRemaining)}s remaining`}
                aria-label={`Turn Timer: ${Math.max(0, timeRemaining)} seconds`}
              >
                <span className="timer-clock-icon" aria-hidden="true">
                  <TimerClockIcon size={13} />
                </span>
                <span className="timer-sec-count">{Math.max(0, timeRemaining)}s</span>
              </div>
            ) : (
              <div className="menu-top-spacer" aria-hidden="true" />
            )}
          </header>

          {/* Center Stage: Game Board + Fun First-Turn Shuffle Ceremony */}
          <div className="ingame-board-center" style={{ position: 'relative' }}>
            {roomData.current_mode === 'dama' ? (
              <DamaBoardView
                gameState={damaState}
                mySlot={mySlot}
                p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
                p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
                passAndPlay={passAndPlay}
                onCommitState={handleCommitDamaState}
              />
            ) : roomData.current_mode === 'doodle' ? (
              DoodleBoardComp ? (
                <DoodleBoardComp
                  gameState={doodleState}
                  mySlot={mySlot}
                  p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
                  p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
                  passAndPlay={passAndPlay}
                  onCommitState={handleCommitDoodleState}
                  onBroadcastStroke={(stroke: DoodleStroke) => {
                    channelRef.current?.sendBroadcast({
                      type: 'doodle_stroke',
                      stroke,
                      sender: mySlot,
                    });
                  }}
                  onBroadcastClear={() => {
                    channelRef.current?.sendBroadcast({
                      type: 'doodle_clear',
                      sender: mySlot,
                    });
                  }}
                />
              ) : null
            ) : SnakesBoardComp ? (
              <SnakesBoardComp
                gameState={snakesState}
                mySlot={mySlot}
                p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
                p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
                passAndPlay={passAndPlay}
                onCommitState={handleCommitSnakesState}
                autoRollSignal={autoRollSignal}
              />
            ) : null}

            <FirstTurnShuffleOverlay
              matchKey={
                roomData.current_mode === 'dama'
                  ? `dama-${damaState.matchSeed ?? 1}`
                  : roomData.current_mode === 'doodle'
                  ? `doodle-${doodleState.matchSeed}`
                  : `snakes-${snakesState.boardSeed}`
              }
              isFreshMatch={
                roomData.current_mode === 'dama'
                  ? !damaState.lastAction &&
                    !damaState.winner &&
                    damaState.p1Remaining === 12 &&
                    damaState.p2Remaining === 12
                  : roomData.current_mode === 'doodle'
                  ? doodleState.round === 1 &&
                    doodleState.phase === 'word_selection' &&
                    !doodleState.winner &&
                    doodleState.p1Score === 0 &&
                    doodleState.p2Score === 0
                  : !snakesState.lastAnimation &&
                    !snakesState.winner &&
                    snakesState.p1Tile === 1 &&
                    snakesState.p2Tile === 1
              }
              winnerSlot={activeTurnSlot}
              p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
              p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
              onShuffleActiveChange={setIsShufflingActive}
            />

            {/* Unified Victory Celebration Overlay for All Games! */}
            {currentWinner && currentWinner !== 'draw' && (
              <div className="victory-overlay-card">
                <ConfettiCelebrationOverlay />
                <CoupleCatsSceneSvg
                  p1Breed={effectiveP1Avatar.breed}
                  p2Breed={effectiveP2Avatar.breed}
                  p1Accessory={effectiveP1Avatar.accessory}
                  p2Accessory={effectiveP2Avatar.accessory}
                  showTrophy
                  size={140}
                />
                <div className="victory-title">
                  <CrownIcon size={20} />
                  <span>
                    {currentWinner === 'p1' ? p1DisplayName : p2DisplayName}{' '}
                    {roomData.current_mode === 'dama'
                      ? 'Wins Cat Dama!'
                      : roomData.current_mode === 'doodle'
                      ? 'Wins Doodle Clash!'
                      : `Reached ${snakesState.maxTile ?? 100}!`}
                  </span>
                </div>
                <button
                  type="button"
                  className="victory-rematch-btn"
                  onClick={handleHostResetCurrentMatch}
                >
                  <span>Play Rematch</span>
                  <DoubleHeartIcon size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Dock: Centered Sticker Scoreboard Bar + Bottom-Right Cat Messenger Bubble */}
          <footer className="ingame-bottom-dock">
            <button
              type="button"
              className="bottom-scoreboard-bar sticker-press"
              onClick={() => setScoreboardOpen(true)}
              title="Tap to view Match Scoreboard"
            >
              {(['p1', 'p2'] as const).map((slot, idx) => {
                const isP1 = slot === 'p1';
                const active = activeTurnSlot === slot;
                const av = isP1 ? effectiveP1Avatar : effectiveP2Avatar;
                const name = isP1 ? p1DisplayName : p2DisplayName;
                const online = isP1 ? p1Online : p2Online;
                const isLastMover =
                  roomData.current_mode === 'dama' &&
                  damaState.lastAction?.mover === slot;
                const tag =
                  roomData.current_mode === 'dama' ? (
                    <>
                      <PawIcon size={10} /> {isP1 ? p1CapturedCount : p2CapturedCount} eaten
                      {isLastMover && (
                        <span style={{ color: '#ff3366', fontWeight: 800 }}>
                          {' '}• Moved
                        </span>
                      )}
                    </>
                  ) : roomData.current_mode === 'doodle' ? (
                    `R${doodleState.round}/4 • ${isP1 ? doodleState.p1Score : doodleState.p2Score} pts`
                  ) : (
                    `Tile ${isP1 ? snakesState.p1Tile : snakesState.p2Tile}/${snakesState.maxTile ?? 100}`
                  );

                return (
                  <Fragment key={slot}>
                    {idx === 1 && (
                      <div className="bottom-score-center">
                        <TrophyIcon size={14} />
                        <span className="bottom-score-digits">
                          {p1Wins} : {p2Wins}
                        </span>
                      </div>
                    )}
                    <div
                      className={`bottom-player-side ${!isP1 ? 'right ' : ''}${
                        active ? 'active-turn' : 'dim-turn'
                      }`}
                    >
                      {active && (
                        <span
                          className={`turn-speech-bubble ${
                            timerEnabled && timeRemaining <= 5
                              ? 'timer-urgent'
                              : ''
                          }`}
                        >
                          {turnBubbleText}
                          {timerEnabled && (
                            <span className="bubble-timer-tag">
                              <TimerClockIcon size={11} /> {Math.max(0, timeRemaining)}s
                            </span>
                          )}
                        </span>
                      )}
                      <div
                        className={`cat-badge mini ${
                          active ? 'avatar-turn-bounce' : ''
                        }`}
                      >
                        <CatAvatarSvg
                          breed={av.breed}
                          accessory={av.accessory}
                          size={28}
                          animateIdle={false}
                        />
                        <span
                          className={`online-dot ${online ? 'online' : ''}`}
                        />
                      </div>
                      <div className="bottom-player-meta">
                        <span className="bottom-player-name">{name}</span>
                        <span className="bottom-turn-tag">{tag}</span>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </button>

            <QuickChatBar
              messages={chatMessages}
              mySlot={mySlot}
              p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
              p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
              partnerOnline={mySlot === 'p1' ? p2Online : p1Online}
              onSendReaction={handleSendReaction}
            />
          </footer>
        </div>
      )}

      {/* Floating Compositor Sticker/Chat Layer */}
      <div className="floating-layer" aria-live="polite">
        {reactions.map((item) => (
          <div
            key={item.id}
            className={`floating-bubble from-${item.sender} kind-${item.kind}`}
          >
            {item.kind === 'emoji' && VALID_STICKER_IDS.has(item.content) ? (
              <ReactionStickerSvg
                id={item.content as ReactionStickerId}
                size={40}
                animated
              />
            ) : (
              item.content
            )}
          </div>
        ))}
      </div>

      {/* Unified 3-Tab Settings & Cat Customizer Modal */}
      {CustomizerModalComp && (
        <CustomizerModalComp
          isOpen={customizerOpen}
          isInGame={activeScreen === 'play'}
          mySlot={mySlot}
          currentMode={roomData.current_mode}
          snakesMaxTile={snakesState.maxTile ?? 100}
          currentAvatar={myAvatar}
          muted={muted}
          passAndPlay={passAndPlay}
          timerEnabled={timerEnabled}
          timerDurationSec={timerDurationSec}
          onToggleMute={handleToggleMute}
          onTogglePassAndPlay={() => setPassAndPlay((p) => !p)}
          onToggleTimer={handleToggleTimer}
          onChangeTimerDuration={handleChangeTimerDuration}
          onHostSwitchGame={handleHostSwitchMode}
          onHostResetMatch={handleHostResetCurrentMatch}
          onOpenTutorial={() => setTutorialOpen(true)}
          onExitToMenu={() => setActiveScreen('menu')}
          onLeaveJoinedRoom={handleLeaveJoinedRoom}
          isPartnerInRoom={isJoinedWithPartner}
          partnerName={roomData.p2_avatar.name}
          onHostKickPlayer={handleHostKickPlayer}
          onSave={handleSaveProfile}
          onClose={() => setCustomizerOpen(false)}
        />
      )}

      {/* Minimalist Couple Scoreboard Modal */}
      {ScoreboardModalComp && (
        <ScoreboardModalComp
          isOpen={scoreboardOpen}
          roomData={{
            ...roomData,
            p1_avatar: { ...effectiveP1Avatar, name: p1DisplayName },
            p2_avatar: { ...effectiveP2Avatar, name: p2DisplayName },
          }}
          onClose={() => setScoreboardOpen(false)}
        />
      )}

      {/* Auto First-Game & On-Demand Rules Tutorial Modal */}
      {TutorialModalComp && (
        <TutorialModalComp
          isOpen={tutorialOpen}
          gameMode={roomData.current_mode}
          onClose={() => setTutorialOpen(false)}
        />
      )}

      {/* Centered Modal: Removed from Room Notification */}
      {kickedModalOpen && (
        <div
          className="modal-backdrop kicked-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kicked-title"
          onClick={() => {
            playTapPop();
            setKickedModalOpen(false);
          }}
        >
          <div
            className="kicked-popup-card anim-fade-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kicked-popup-icon-wrap">
              <CatAvatarSvg
                breed={myAvatar.breed}
                accessory={myAvatar.accessory}
                size={56}
                dizzy
              />
            </div>
            <h3 id="kicked-title" className="kicked-popup-title">
              Removed from Room
            </h3>
            <p className="kicked-popup-desc">
              You were removed from the room by the host. You can re-enter the
              room code anytime to rejoin and continue the match!
            </p>
            <button
              type="button"
              className="vibrant-play-btn sticker-press"
              style={{ width: '100%', minHeight: '44px' }}
              onClick={() => {
                playTapPop();
                setKickedModalOpen(false);
              }}
              autoFocus
            >
              <span>Understood</span>
              <PawIcon size={15} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
