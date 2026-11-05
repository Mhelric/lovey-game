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
import { CatAvatarSvg } from './components/CatAvatarSvg';
import {
  CrownIcon,
  PawIcon,
  ReactionStickerSvg,
  SettingsGearIcon,
  SnakeLadderIcon,
  SparkleIcon,
  TrophyIcon,
} from './components/ArcadeIcons';
import { CatCustomizerModal } from './components/CatCustomizerModal';
import { CoupleScoreboardModal } from './components/CoupleScoreboardModal';
import { DamaTutorialModal } from './components/DamaTutorialModal';
import { HomeMenuView } from './components/HomeMenuView';
import { QuickChatBar } from './components/QuickChatBar';
import { DamaBoardView } from './components/DamaBoardView';
import { SnakesBoardView } from './components/SnakesBoardView';
import {
  createInitialDamaState,
  DamaGameState,
} from './engines/damaEngine';
import {
  createInitialSnakesState,
  SnakesGameState,
  SnakesMaxTile,
} from './engines/snakesEngine';
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
}: {
  matchKey: string;
  isFreshMatch: boolean;
  winnerSlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
}) {
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealed'>('idle');
  const [highlightSlot, setHighlightSlot] = useState<PlayerSlot>('p1');
  const lastShuffledKeyRef = useRef<string>('');

  useEffect(() => {
    if (!isFreshMatch) {
      setPhase('idle');
      return;
    }
    if (lastShuffledKeyRef.current === matchKey) return;
    lastShuffledKeyRef.current = matchKey;

    setPhase('shuffling');
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
      }, 2800)
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [matchKey, isFreshMatch, winnerSlot]);

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
          {/* Player 1 Candidate Box */}
          <div
            className={`shuffle-cat-slot p1-theme ${
              highlightSlot === 'p1' ? 'is-lit' : 'is-dim'
            } ${
              phase === 'revealed' && winnerSlot === 'p1' ? 'is-winner' : ''
            }`}
          >
            {highlightSlot === 'p1' && (
              <div className="shuffle-pointer-badge">
                {phase === 'revealed' ? (
                  <CrownIcon size={16} />
                ) : (
                  <PawIcon size={14} />
                )}
              </div>
            )}
            <CatAvatarSvg
              breed={p1Avatar.breed}
              accessory={p1Avatar.accessory}
              size={54}
              animateIdle={false}
              happySquint={phase === 'revealed' && winnerSlot === 'p1'}
            />
            <span className="shuffle-cat-name">{p1Avatar.name}</span>
          </div>

          <div
            className={`shuffle-vs-coin ${
              phase === 'shuffling' ? 'spinning' : ''
            }`}
          >
            <span>VS</span>
          </div>

          {/* Player 2 Candidate Box */}
          <div
            className={`shuffle-cat-slot p2-theme ${
              highlightSlot === 'p2' ? 'is-lit' : 'is-dim'
            } ${
              phase === 'revealed' && winnerSlot === 'p2' ? 'is-winner' : ''
            }`}
          >
            {highlightSlot === 'p2' && (
              <div className="shuffle-pointer-badge">
                {phase === 'revealed' ? (
                  <CrownIcon size={16} />
                ) : (
                  <PawIcon size={14} />
                )}
              </div>
            )}
            <CatAvatarSvg
              breed={p2Avatar.breed}
              accessory={p2Avatar.accessory}
              size={54}
              animateIdle={false}
              happySquint={phase === 'revealed' && winnerSlot === 'p2'}
            />
            <span className="shuffle-cat-name">{p2Avatar.name}</span>
          </div>
        </div>

        <span className="shuffle-sub-hint">
          {phase === 'shuffling'
            ? 'Picking a lucky cat…'
            : 'Get ready to make your first move! 🐾'}
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

function saveLocalGameSavestate<T>(
  roomCode: string,
  mode: GameMode,
  state: T
): void {
  try {
    const key = `${STORAGE_SAVESTATE_PREFIX}${normalizeRoomCode(roomCode)}_${mode}`;
    localStorage.setItem(
      key,
      JSON.stringify({ updatedAt: Date.now(), state })
    );
  } catch {
    // Ignore storage quota errors
  }
}

function loadLocalGameSavestate<T>(roomCode: string, mode: GameMode): T | null {
  try {
    const key = `${STORAGE_SAVESTATE_PREFIX}${normalizeRoomCode(roomCode)}_${mode}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: T };
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

function saveLocalActiveSession(
  roomCode: string,
  screen: 'menu' | 'play',
  mode: GameMode
): void {
  try {
    const key = `${STORAGE_SESSION_PREFIX}${normalizeRoomCode(roomCode)}`;
    localStorage.setItem(key, JSON.stringify({ screen, mode }));
  } catch {
    // Ignore
  }
}

function loadLocalActiveSession(
  roomCode: string
): { screen: 'menu' | 'play'; mode: GameMode } | null {
  try {
    const key = `${STORAGE_SESSION_PREFIX}${normalizeRoomCode(roomCode)}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      screen?: 'menu' | 'play';
      mode?: GameMode;
    };
    if (
      (parsed.screen === 'menu' || parsed.screen === 'play') &&
      (parsed.mode === 'dama' || parsed.mode === 'snakes')
    ) {
      return { screen: parsed.screen, mode: parsed.mode };
    }
  } catch {
    // Ignore
  }
  return null;
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

function damaProgressScore(s: DamaGameState): number {
  const captured = Math.max(0, 24 - (s.p1Remaining + s.p2Remaining));
  const hasAction = s.lastAction ? 1 : 0;
  return captured * 10 + hasAction + (s.winner ? 1000 : 0);
}

function snakesProgressScore(s: SnakesGameState): number {
  return (
    (s.p1Tile - 1) +
    (s.p2Tile - 1) +
    (s.lastAnimation ? 1 : 0) +
    (s.winner ? 1000 : 0)
  );
}

function mergeDamaSavestate(
  local: DamaGameState,
  incoming: DamaGameState
): DamaGameState {
  if (!incoming || !Array.isArray(incoming.board)) return local;
  if (
    (local.matchSeed ?? 0) === (incoming.matchSeed ?? 0) &&
    (local.matchSeed ?? 0) !== 0
  ) {
    return damaProgressScore(incoming) >= damaProgressScore(local)
      ? incoming
      : local;
  }
  // Different matchSeed: if incoming is an unstarted default board while local has an active savestate, keep local only if incoming has no matchSeed
  if (!incoming.matchSeed && isDamaInProgress(local)) {
    return local;
  }
  return incoming;
}

function mergeSnakesSavestate(
  local: SnakesGameState,
  incoming: SnakesGameState
): SnakesGameState {
  if (!incoming || typeof incoming.boardSeed !== 'number') return local;
  if (local.boardSeed === incoming.boardSeed) {
    return snakesProgressScore(incoming) >= snakesProgressScore(local)
      ? incoming
      : local;
  }
  if (incoming.boardSeed === 202610 && isSnakesInProgress(local)) {
    return local;
  }
  return incoming;
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
  const [activeScreen, setActiveScreen] = useState<'menu' | 'play'>(() => {
    const savedSession = loadLocalActiveSession(roomCode);
    if (savedSession?.screen === 'play') {
      const savedDama = loadLocalGameSavestate<DamaGameState>(roomCode, 'dama');
      const savedSnakes = loadLocalGameSavestate<SnakesGameState>(
        roomCode,
        'snakes'
      );
      if (
        (savedSession.mode === 'dama' && savedDama) ||
        (savedSession.mode === 'snakes' && savedSnakes)
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
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  const channelRef = useRef<CoupleRealtimeChannel | null>(null);
  const damaStateRef = useRef<DamaGameState>(damaState);
  damaStateRef.current = damaState;
  const snakesStateRef = useRef<SnakesGameState>(snakesState);
  snakesStateRef.current = snakesState;
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

    const [row, matchRow] = await Promise.all([
      fetchOrCreateCoupleRoom(targetRoom),
      fetchActiveMatch<unknown>(targetRoom),
    ]);

    // Always keep our device's default character authoritative for our own slot!
    const mergedRow: CoupleRoomRow = {
      ...row,
      p1_avatar: slot === 'p1' ? localAv : row.p1_avatar,
      p2_avatar: slot === 'p2' ? localAv : row.p2_avatar,
    };
    setRoomData(mergedRow);

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
      }
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
            currentMode: roomDataRef.current.current_mode,
            isPlaying: activeScreenRef.current === 'play',
            sender: mySlotRef.current,
          });
        } else if (event.type === 'request_savestate') {
          // Partner reloaded or recovered from slow internet — send our latest savestate for both games!
          channelRef.current?.sendBroadcast({
            type: 'savestate_snapshot',
            damaState: damaStateRef.current,
            snakesState: snakesStateRef.current,
            currentMode: roomDataRef.current.current_mode,
            isPlaying: activeScreenRef.current === 'play',
            sender: mySlotRef.current,
          });
        } else if (event.type === 'savestate_snapshot') {
          const inDama = event.damaState as DamaGameState | undefined;
          if (inDama && Array.isArray(inDama.board)) {
            setDamaState((prev) => mergeDamaSavestate(prev, inDama));
          }
          const inSnakes = event.snakesState as SnakesGameState | undefined;
          if (inSnakes && typeof inSnakes.boardSeed === 'number') {
            setSnakesState((prev) => mergeSnakesSavestate(prev, inSnakes));
          }
          if (event.currentMode === 'dama' || event.currentMode === 'snakes') {
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
          }
          if (event.winner === 'p1' || event.winner === 'p2') {
            const winSlot = event.winner;
            setRoomData((prev) => ({
              ...prev,
              p1_dama_wins:
                event.gameMode === 'dama' && winSlot === 'p1'
                  ? prev.p1_dama_wins + 1
                  : prev.p1_dama_wins,
              p2_dama_wins:
                event.gameMode === 'dama' && winSlot === 'p2'
                  ? prev.p2_dama_wins + 1
                  : prev.p2_dama_wins,
              p1_snakes_wins:
                event.gameMode === 'snakes' && winSlot === 'p1'
                  ? prev.p1_snakes_wins + 1
                  : prev.p1_snakes_wins,
              p2_snakes_wins:
                event.gameMode === 'snakes' && winSlot === 'p2'
                  ? prev.p2_snakes_wins + 1
                  : prev.p2_snakes_wins,
            }));
            fetchOrCreateCoupleRoom(roomCode).then((r) => {
              setRoomData((prev) => ({
                ...r,
                p1_dama_wins: Math.max(prev.p1_dama_wins, r.p1_dama_wins),
                p2_dama_wins: Math.max(prev.p2_dama_wins, r.p2_dama_wins),
                p1_snakes_wins: Math.max(prev.p1_snakes_wins, r.p1_snakes_wins),
                p2_snakes_wins: Math.max(prev.p2_snakes_wins, r.p2_snakes_wins),
                p1_avatar: prev.p1_avatar,
                p2_avatar: prev.p2_avatar,
              }));
            });
          }
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
    const updatedRow: CoupleRoomRow = {
      ...row,
      p1_avatar: myAvatarRef.current,
    };
    setRoomData(updatedRow);
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
      // Resume saved game if one is already in progress (unless forceNewMatch is true)
      const shouldResume = !forceNewMatch && isDamaInProgress(damaState);
      const nextDama = shouldResume
        ? damaState
        : createInitialDamaState(pickFairStartingTurn());
      setDamaState(nextDama);
      channelRef.current?.sendBroadcast({
        type: 'match_sync',
        gameMode: 'dama',
        turn: nextDama.turn,
        boardSeed: nextDama.matchSeed ?? 0,
        stateJson: nextDama,
        winner: nextDama.winner,
        sender: mySlot,
      });
      upsertActiveMatch({
        room_code: roomCode,
        game_mode: 'dama',
        turn: nextDama.turn,
        board_seed: nextDama.matchSeed ?? 0,
        state_json: nextDama,
        winner: nextDama.winner,
      });
    } else if (selectedMode === 'snakes') {
      const shouldResume =
        !forceNewMatch &&
        isSnakesInProgress(snakesState) &&
        (snakesState.maxTile ?? 100) === snakesMaxTile;
      const newSeed = Math.floor(100000 + Math.random() * 899999);
      const nextSnakes = shouldResume
        ? snakesState
        : createInitialSnakesState(
            newSeed,
            true,
            snakesMaxTile,
            pickFairStartingTurn()
          );
      setSnakesState(nextSnakes);
      channelRef.current?.sendBroadcast({
        type: 'match_sync',
        gameMode: 'snakes',
        turn: nextSnakes.turn,
        boardSeed: nextSnakes.boardSeed,
        stateJson: nextSnakes,
        winner: nextSnakes.winner,
        sender: mySlot,
      });
      upsertActiveMatch({
        room_code: roomCode,
        game_mode: 'snakes',
        turn: nextSnakes.turn,
        board_seed: nextSnakes.boardSeed,
        state_json: nextSnakes,
        winner: nextSnakes.winner,
      });
    }

    channelRef.current?.sendBroadcast({
      type: 'start_match',
      mode: selectedMode,
      snakesMaxTile,
      sender: 'p1',
    });
    updateRoomModeInDb(roomCode, selectedMode);
  };

  const handleCommitDamaState = async (nextState: DamaGameState) => {
    setDamaState(nextState);

    channelRef.current?.sendBroadcast({
      type: 'match_sync',
      gameMode: 'dama',
      turn: nextState.turn,
      boardSeed: nextState.matchSeed ?? 0,
      stateJson: nextState,
      winner: nextState.winner,
      sender: mySlot,
    });

    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: 'dama',
      turn: nextState.turn,
      board_seed: nextState.matchSeed ?? 0,
      state_json: nextState,
      winner: nextState.winner,
    });

    if (nextState.winner === 'p1' || nextState.winner === 'p2') {
      const winSlot = nextState.winner;
      setRoomData((prev) => ({
        ...prev,
        p1_dama_wins:
          winSlot === 'p1' ? prev.p1_dama_wins + 1 : prev.p1_dama_wins,
        p2_dama_wins:
          winSlot === 'p2' ? prev.p2_dama_wins + 1 : prev.p2_dama_wins,
      }));
      const updatedRoom = await recordMatchWinInDb(
        roomData,
        'dama',
        winSlot,
        `Cat Dama (${nextState.p1Remaining} - ${nextState.p2Remaining})`
      );
      if (updatedRoom) {
        setRoomData((prev) => ({
          ...updatedRoom,
          p1_dama_wins: Math.max(prev.p1_dama_wins, updatedRoom.p1_dama_wins),
          p2_dama_wins: Math.max(prev.p2_dama_wins, updatedRoom.p2_dama_wins),
          p1_avatar: prev.p1_avatar,
          p2_avatar: prev.p2_avatar,
        }));
      }
    }
  };

  const handleResetDamaMatch = async () => {
    const startTurn = pickFairStartingTurn();
    const fresh = createInitialDamaState(startTurn);
    setDamaState(fresh);
    channelRef.current?.sendBroadcast({
      type: 'match_sync',
      gameMode: 'dama',
      turn: fresh.turn,
      boardSeed: fresh.matchSeed ?? 0,
      stateJson: fresh,
      winner: null,
      sender: mySlot,
    });
    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: 'dama',
      turn: fresh.turn,
      board_seed: fresh.matchSeed ?? 0,
      state_json: fresh,
      winner: null,
    });
  };

  const handleCommitSnakesState = async (nextState: SnakesGameState) => {
    setSnakesState(nextState);

    channelRef.current?.sendBroadcast({
      type: 'match_sync',
      gameMode: 'snakes',
      turn: nextState.turn,
      boardSeed: nextState.boardSeed,
      stateJson: nextState,
      winner: nextState.winner,
      sender: mySlot,
    });

    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: 'snakes',
      turn: nextState.turn,
      board_seed: nextState.boardSeed,
      state_json: nextState,
      winner: nextState.winner,
    });

    if (nextState.winner === 'p1' || nextState.winner === 'p2') {
      const winSlot = nextState.winner;
      setRoomData((prev) => ({
        ...prev,
        p1_snakes_wins:
          winSlot === 'p1' ? prev.p1_snakes_wins + 1 : prev.p1_snakes_wins,
        p2_snakes_wins:
          winSlot === 'p2' ? prev.p2_snakes_wins + 1 : prev.p2_snakes_wins,
      }));
      const maxT = nextState.maxTile ?? 100;
      const updatedRoom = await recordMatchWinInDb(
        roomData,
        'snakes',
        winSlot,
        `Snakes ${maxT} (Seed #${nextState.boardSeed})`
      );
      if (updatedRoom) {
        setRoomData((prev) => ({
          ...updatedRoom,
          p1_snakes_wins: Math.max(
            prev.p1_snakes_wins,
            updatedRoom.p1_snakes_wins
          ),
          p2_snakes_wins: Math.max(
            prev.p2_snakes_wins,
            updatedRoom.p2_snakes_wins
          ),
          p1_avatar: prev.p1_avatar,
          p2_avatar: prev.p2_avatar,
        }));
      }
    }
  };

  const handleNewSnakesSeedMatch = async (
    twistsEnabled: boolean,
    maxTile: SnakesMaxTile = snakesState.maxTile ?? 100
  ) => {
    const newSeed = Math.floor(100000 + Math.random() * 899999);
    const startTurn = pickFairStartingTurn();
    const fresh = createInitialSnakesState(
      newSeed,
      twistsEnabled,
      maxTile,
      startTurn
    );
    setSnakesState(fresh);
    channelRef.current?.sendBroadcast({
      type: 'match_sync',
      gameMode: 'snakes',
      turn: fresh.turn,
      boardSeed: fresh.boardSeed,
      stateJson: fresh,
      winner: null,
      sender: mySlot,
    });
    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: 'snakes',
      turn: fresh.turn,
      board_seed: fresh.boardSeed,
      state_json: fresh,
      winner: null,
    });
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
      : roomData.p1_snakes_wins;
  const p2Wins =
    roomData.current_mode === 'dama'
      ? roomData.p2_dama_wins
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
    roomData.current_mode === 'dama' ? damaState.turn : snakesState.turn;

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
    setTurnBubbleText('Your turn!');
  }, [
    roomData.current_mode,
    snakesState.lastAnimation?.id,
    snakesState.lastAnimation?.eventMessage,
  ]);

  const p1CapturedCount = Math.max(0, 12 - damaState.p2Remaining);
  const p2CapturedCount = Math.max(0, 12 - damaState.p1Remaining);

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
          hasSavedDama={isDamaInProgress(damaState)}
          hasSavedSnakes={isSnakesInProgress(snakesState)}
          savedSnakesMaxTile={snakesState.maxTile ?? 100}
          chatMessages={chatMessages}
          onOpenSettings={() => setCustomizerOpen(true)}
          onChangeMyRoomCode={handleChangeMyRoomCode}
          onAttemptJoinAsInvited={handleAttemptJoinAsInvited}
          onLeaveJoinedRoom={handleLeaveJoinedRoom}
          onRejoinSavedGame={handleRejoinSavedGame}
          onHostLaunchGame={handleHostLaunchGame}
          onSendReaction={handleSendReaction}
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
              ) : (
                <>
                  <SnakeLadderIcon size={16} />
                  <span>
                    Snakes &amp; Ladders ({snakesState.maxTile ?? 100})
                  </span>
                </>
              )}
            </div>

            <div className="menu-top-spacer" aria-hidden="true" />
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
                onResetMatch={handleResetDamaMatch}
              />
            ) : (
              <SnakesBoardView
                gameState={snakesState}
                mySlot={mySlot}
                p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
                p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
                passAndPlay={passAndPlay}
                onCommitState={handleCommitSnakesState}
                onNewSeedMatch={handleNewSnakesSeedMatch}
              />
            )}

            <FirstTurnShuffleOverlay
              matchKey={
                roomData.current_mode === 'dama'
                  ? `dama-${damaState.matchSeed ?? 1}`
                  : `snakes-${snakesState.boardSeed}`
              }
              isFreshMatch={
                roomData.current_mode === 'dama'
                  ? !damaState.lastAction &&
                    !damaState.winner &&
                    damaState.p1Remaining === 12 &&
                    damaState.p2Remaining === 12
                  : !snakesState.lastAnimation &&
                    !snakesState.winner &&
                    snakesState.p1Tile === 1 &&
                    snakesState.p2Tile === 1
              }
              winnerSlot={activeTurnSlot}
              p1Avatar={{ ...effectiveP1Avatar, name: p1DisplayName }}
              p2Avatar={{ ...effectiveP2Avatar, name: p2DisplayName }}
            />
          </div>

          {/* Bottom Dock: Centered Sticker Scoreboard Bar + Bottom-Right Cat Messenger Bubble */}
          <footer className="ingame-bottom-dock">
            <button
              type="button"
              className="bottom-scoreboard-bar sticker-press"
              onClick={() => setScoreboardOpen(true)}
              title="Tap to view Match Scoreboard"
            >
              {/* Player 1 Side */}
              <div
                className={`bottom-player-side ${
                  activeTurnSlot === 'p1' ? 'active-turn' : 'dim-turn'
                }`}
              >
                {activeTurnSlot === 'p1' && (
                  <span className="turn-speech-bubble">{turnBubbleText}</span>
                )}
                <div
                  className={`cat-badge mini ${
                    activeTurnSlot === 'p1' ? 'avatar-turn-bounce' : ''
                  }`}
                >
                  <CatAvatarSvg
                    breed={effectiveP1Avatar.breed}
                    accessory={effectiveP1Avatar.accessory}
                    size={28}
                    animateIdle={false}
                  />
                  <span
                    className={`online-dot ${p1Online ? 'online' : ''}`}
                  />
                </div>
                <div className="bottom-player-meta">
                  <span className="bottom-player-name">{p1DisplayName}</span>
                  <span className="bottom-turn-tag">
                    {roomData.current_mode === 'dama' ? (
                      <>
                        <PawIcon size={10} /> {p1CapturedCount} eaten
                      </>
                    ) : (
                      `Tile ${snakesState.p1Tile}/${snakesState.maxTile ?? 100}`
                    )}
                  </span>
                </div>
              </div>

              {/* Center Score Pill */}
              <div className="bottom-score-center">
                <TrophyIcon size={14} />
                <span className="bottom-score-digits">
                  {p1Wins} : {p2Wins}
                </span>
              </div>

              {/* Player 2 Side */}
              <div
                className={`bottom-player-side right ${
                  activeTurnSlot === 'p2' ? 'active-turn' : 'dim-turn'
                }`}
              >
                {activeTurnSlot === 'p2' && (
                  <span className="turn-speech-bubble">{turnBubbleText}</span>
                )}
                <div
                  className={`cat-badge mini ${
                    activeTurnSlot === 'p2' ? 'avatar-turn-bounce' : ''
                  }`}
                >
                  <CatAvatarSvg
                    breed={effectiveP2Avatar.breed}
                    accessory={effectiveP2Avatar.accessory}
                    size={28}
                    animateIdle={false}
                  />
                  <span
                    className={`online-dot ${p2Online ? 'online' : ''}`}
                  />
                </div>
                <div className="bottom-player-meta">
                  <span className="bottom-player-name">{p2DisplayName}</span>
                  <span className="bottom-turn-tag">
                    {roomData.current_mode === 'dama' ? (
                      <>
                        <PawIcon size={10} /> {p2CapturedCount} eaten
                      </>
                    ) : (
                      `Tile ${snakesState.p2Tile}/${snakesState.maxTile ?? 100}`
                    )}
                  </span>
                </div>
              </div>
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
      <CatCustomizerModal
        isOpen={customizerOpen}
        isInGame={activeScreen === 'play'}
        mySlot={mySlot}
        currentMode={roomData.current_mode}
        snakesMaxTile={snakesState.maxTile ?? 100}
        currentAvatar={myAvatar}
        muted={muted}
        passAndPlay={passAndPlay}
        onToggleMute={handleToggleMute}
        onTogglePassAndPlay={() => setPassAndPlay((p) => !p)}
        onHostSwitchGame={handleHostSwitchMode}
        onHostResetMatch={handleHostResetCurrentMatch}
        onOpenTutorial={() => setTutorialOpen(true)}
        onExitToMenu={() => setActiveScreen('menu')}
        onLeaveJoinedRoom={handleLeaveJoinedRoom}
        onSave={handleSaveProfile}
        onClose={() => setCustomizerOpen(false)}
      />

      {/* Minimalist Couple Scoreboard Modal */}
      <CoupleScoreboardModal
        isOpen={scoreboardOpen}
        roomData={{
          ...roomData,
          p1_avatar: { ...effectiveP1Avatar, name: p1DisplayName },
          p2_avatar: { ...effectiveP2Avatar, name: p2DisplayName },
        }}
        onClose={() => setScoreboardOpen(false)}
      />

      {/* Auto First-Game & On-Demand Rules Tutorial Modal */}
      <DamaTutorialModal
        isOpen={tutorialOpen}
        gameMode={roomData.current_mode}
        onClose={() => setTutorialOpen(false)}
      />
    </main>
  );
}
