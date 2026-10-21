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
  playReactionChime,
  playTapPop,
  setSoundMuted,
} from './services/soundEffects';

const STORAGE_ROOM_KEY = 'lovey_arcade_room_code';
const STORAGE_SLOT_KEY = 'lovey_arcade_player_slot';
const STORAGE_TUTORIAL_PREFIX = 'lovey_seen_tutorial_';

const VALID_STICKER_IDS = new Set<string>(QUICK_STICKERS.map((s) => s.id));

export function App() {
  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      return normalizeRoomCode(
        localStorage.getItem(STORAGE_ROOM_KEY) || 'LOVEY'
      );
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

  const [roomData, setRoomData] = useState<CoupleRoomRow>({
    room_code: roomCode,
    p1_avatar: DEFAULT_P1_AVATAR,
    p2_avatar: DEFAULT_P2_AVATAR,
    p1_dama_wins: 0,
    p2_dama_wins: 0,
    p1_snakes_wins: 0,
    p2_snakes_wins: 0,
    current_mode: 'dama',
    updated_at: new Date().toISOString(),
  });

  const [activeScreen, setActiveScreen] = useState<'menu' | 'play'>('menu');
  const [damaState, setDamaState] = useState<DamaGameState>(() =>
    createInitialDamaState()
  );
  const [snakesState, setSnakesState] = useState<SnakesGameState>(() =>
    createInitialSnakesState(202610, true)
  );
  const [passAndPlay, setPassAndPlay] = useState<boolean>(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [onlineSeen, setOnlineSeen] = useState<Record<PlayerSlot, number>>({
    p1: Date.now(),
    p2: 0,
  });
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());

  const channelRef = useRef<CoupleRealtimeChannel | null>(null);

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
    window.setTimeout(() => {
      setReactions((prev) => prev.filter((item) => item.id !== reaction.id));
    }, 2150);
  }, []);

  const syncFromDatabase = useCallback(async (targetRoom: string) => {
    const [row, matchRow] = await Promise.all([
      fetchOrCreateCoupleRoom(targetRoom),
      fetchActiveMatch<unknown>(targetRoom),
    ]);
    setRoomData(row);
    if (matchRow && matchRow.state_json) {
      if (matchRow.game_mode === 'dama') {
        const maybeDama = matchRow.state_json as DamaGameState;
        if (Array.isArray(maybeDama.board)) {
          setDamaState(maybeDama);
        }
      } else if (matchRow.game_mode === 'snakes') {
        const maybeSnakes = matchRow.state_json as SnakesGameState;
        if (typeof maybeSnakes.boardSeed === 'number') {
          setSnakesState(maybeSnakes);
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
        } else if (event.type === 'partner_joined') {
          setOnlineSeen((prev) => ({ ...prev, [event.slot]: Date.now() }));
          setRoomData((prev) =>
            event.slot === 'p1'
              ? { ...prev, p1_avatar: event.avatar }
              : { ...prev, p2_avatar: event.avatar }
          );
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
          if (event.winner) {
            fetchOrCreateCoupleRoom(roomCode).then(setRoomData);
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

  const handleStartAsHost = async () => {
    playTapPop();
    setMySlot('p1');
    try {
      localStorage.setItem(STORAGE_SLOT_KEY, 'p1');
    } catch {
      // Ignore
    }
    channelRef.current?.updateSlot('p1');
    const row = await fetchOrCreateCoupleRoom(roomCode);
    setRoomData(row);
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

    setMySlot('p2');
    setRoomCode(cleaned);
    setRoomData(room);
    try {
      localStorage.setItem(STORAGE_ROOM_KEY, cleaned);
      localStorage.setItem(STORAGE_SLOT_KEY, 'p2');
    } catch {
      // Ignore
    }

    window.setTimeout(() => {
      channelRef.current?.updateSlot('p2');
      channelRef.current?.sendBroadcast({
        type: 'partner_joined',
        slot: 'p2',
        avatar: room.p2_avatar,
      });
    }, 380);

    return true;
  };

  const handleHostLaunchGame = (
    selectedMode: GameMode,
    soloPractice = false
  ) => {
    playTapPop();
    if (soloPractice) {
      setPassAndPlay(true);
    }
    setRoomData((prev) => ({ ...prev, current_mode: selectedMode }));
    setActiveScreen('play');
    checkAutoOpenTutorial(selectedMode);

    channelRef.current?.sendBroadcast({
      type: 'start_match',
      mode: selectedMode,
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
      boardSeed: 0,
      stateJson: nextState,
      winner: nextState.winner,
      sender: mySlot,
    });

    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: 'dama',
      turn: nextState.turn,
      board_seed: 0,
      state_json: nextState,
      winner: nextState.winner,
    });

    if (nextState.winner === 'p1' || nextState.winner === 'p2') {
      const updatedRoom = await recordMatchWinInDb(
        roomData,
        'dama',
        nextState.winner,
        `Cat Dama (${nextState.p1Remaining} - ${nextState.p2Remaining})`
      );
      if (updatedRoom) {
        setRoomData(updatedRoom);
      }
    }
  };

  const handleResetDamaMatch = async () => {
    const fresh = createInitialDamaState();
    setDamaState(fresh);
    channelRef.current?.sendBroadcast({
      type: 'match_sync',
      gameMode: 'dama',
      turn: fresh.turn,
      boardSeed: 0,
      stateJson: fresh,
      winner: null,
      sender: mySlot,
    });
    await upsertActiveMatch({
      room_code: roomCode,
      game_mode: 'dama',
      turn: fresh.turn,
      board_seed: 0,
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
      const updatedRoom = await recordMatchWinInDb(
        roomData,
        'snakes',
        nextState.winner,
        `Snakes & Ladders (Seed #${nextState.boardSeed})`
      );
      if (updatedRoom) {
        setRoomData(updatedRoom);
      }
    }
  };

  const handleNewSnakesSeedMatch = async (twistsEnabled: boolean) => {
    const newSeed = Math.floor(100000 + Math.random() * 899999);
    const fresh = createInitialSnakesState(newSeed, twistsEnabled);
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

  const handleHostSwitchMode = (newMode: GameMode) => {
    if (mySlot !== 'p1') return;
    playTapPop();
    setRoomData((prev) => ({ ...prev, current_mode: newMode }));
    checkAutoOpenTutorial(newMode);
    channelRef.current?.sendBroadcast({
      type: 'mode_switch',
      mode: newMode,
      sender: 'p1',
    });
    updateRoomModeInDb(roomCode, newMode);
  };

  const handleHostResetCurrentMatch = () => {
    if (roomData.current_mode === 'dama') {
      handleResetDamaMatch();
    } else {
      handleNewSnakesSeedMatch(snakesState.twistsEnabled);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = setSoundMuted(!muted);
    setMuted(nextMuted);
  };

  const handleSaveLobby = async (
    newRoomCode: string,
    newSlot: PlayerSlot,
    newAvatar: CatAvatarConfig
  ) => {
    setCustomizerOpen(false);
    try {
      localStorage.setItem(STORAGE_ROOM_KEY, newRoomCode);
      localStorage.setItem(STORAGE_SLOT_KEY, newSlot);
    } catch {
      // Ignore storage errors
    }

    if (newRoomCode !== roomCode) {
      setRoomCode(newRoomCode);
    }
    if (newSlot !== mySlot) {
      setMySlot(newSlot);
      channelRef.current?.updateSlot(newSlot);
    }

    setRoomData((prev) =>
      newSlot === 'p1'
        ? { ...prev, p1_avatar: newAvatar }
        : { ...prev, p2_avatar: newAvatar }
    );

    channelRef.current?.sendBroadcast({
      type: 'avatar_update',
      slot: newSlot,
      avatar: newAvatar,
    });

    await updatePlayerAvatarInDb(newRoomCode, newSlot, newAvatar);
  };

  const now = Date.now();
  const p1Online = mySlot === 'p1' || now - (onlineSeen.p1 || 0) < 16000;
  const p2Online = mySlot === 'p2' || now - (onlineSeen.p2 || 0) < 16000;

  const p1Wins =
    roomData.current_mode === 'dama'
      ? roomData.p1_dama_wins
      : roomData.p1_snakes_wins;
  const p2Wins =
    roomData.current_mode === 'dama'
      ? roomData.p2_dama_wins
      : roomData.p2_snakes_wins;

  const myCurrentAvatar =
    mySlot === 'p1' ? roomData.p1_avatar : roomData.p2_avatar;

  const p1DisplayName = roomData.p1_avatar.name || 'Lovey 1';
  const p2DisplayName =
    roomData.p2_avatar.name && roomData.p2_avatar.name !== p1DisplayName
      ? roomData.p2_avatar.name
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
            p1_avatar: { ...roomData.p1_avatar, name: p1DisplayName },
            p2_avatar: { ...roomData.p2_avatar, name: p2DisplayName },
          }}
          p2Online={p2Online}
          onOpenSettings={() => setCustomizerOpen(true)}
          onStartAsHost={handleStartAsHost}
          onAttemptJoinAsInvited={handleAttemptJoinAsInvited}
          onHostLaunchGame={handleHostLaunchGame}
        />
      ) : (
        <div className="ingame-screen-layout">
          {/* Minimal In-Game Top Bar: Top-Left Settings Button + Centered Game Sticker Pill */}
          <header className="ingame-top-bar">
            <button
              type="button"
              className="icon-circle-btn sticker-press"
              onClick={() => setCustomizerOpen(true)}
              aria-label="Open Settings"
              title="Settings"
            >
              <SettingsGearIcon size={22} />
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
                  <span>Snakes &amp; Ladders</span>
                </>
              )}
            </div>

            <div className="menu-top-spacer" aria-hidden="true" />
          </header>

          {/* Center Stage: Game Board */}
          <div className="ingame-board-center">
            {roomData.current_mode === 'dama' ? (
              <DamaBoardView
                gameState={damaState}
                mySlot={mySlot}
                p1Avatar={{ ...roomData.p1_avatar, name: p1DisplayName }}
                p2Avatar={{ ...roomData.p2_avatar, name: p2DisplayName }}
                passAndPlay={passAndPlay}
                onCommitState={handleCommitDamaState}
                onResetMatch={handleResetDamaMatch}
              />
            ) : (
              <SnakesBoardView
                gameState={snakesState}
                mySlot={mySlot}
                p1Avatar={{ ...roomData.p1_avatar, name: p1DisplayName }}
                p2Avatar={{ ...roomData.p2_avatar, name: p2DisplayName }}
                passAndPlay={passAndPlay}
                onCommitState={handleCommitSnakesState}
                onNewSeedMatch={handleNewSnakesSeedMatch}
              />
            )}
          </div>

          {/* Bottom Dock: Centered Sticker Scoreboard Bar + Bottom-Right Chat Sheet Button */}
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
                    breed={roomData.p1_avatar.breed}
                    accessory={roomData.p1_avatar.accessory}
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
                        <PawIcon size={10} /> {p1CapturedCount} captured
                      </>
                    ) : (
                      `Tile ${snakesState.p1Tile}`
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
                    breed={roomData.p2_avatar.breed}
                    accessory={roomData.p2_avatar.accessory}
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
                        <PawIcon size={10} /> {p2CapturedCount} captured
                      </>
                    ) : (
                      `Tile ${snakesState.p2Tile}`
                    )}
                  </span>
                </div>
              </div>
            </button>

            <QuickChatBar onSendReaction={handleSendReaction} />
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
        roomCode={roomCode}
        mySlot={mySlot}
        currentMode={roomData.current_mode}
        currentAvatar={myCurrentAvatar}
        muted={muted}
        passAndPlay={passAndPlay}
        onToggleMute={handleToggleMute}
        onTogglePassAndPlay={() => setPassAndPlay((p) => !p)}
        onHostSwitchGame={handleHostSwitchMode}
        onHostResetMatch={handleHostResetCurrentMatch}
        onOpenTutorial={() => setTutorialOpen(true)}
        onExitToMenu={() => setActiveScreen('menu')}
        onSave={handleSaveLobby}
        onClose={() => setCustomizerOpen(false)}
      />

      {/* Minimalist Couple Scoreboard Modal */}
      <CoupleScoreboardModal
        isOpen={scoreboardOpen}
        roomData={roomData}
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
