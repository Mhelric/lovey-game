import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  CatAvatarConfig,
  CoupleRoomRow,
  DEFAULT_P1_AVATAR,
  DEFAULT_P2_AVATAR,
  FloatingReaction,
  GameMode,
  PlayerSlot,
} from './types/arcade';
import { CatAvatarSvg } from './components/CatAvatarSvg';
import { CatCustomizerModal } from './components/CatCustomizerModal';
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

const STORAGE_ROOM_KEY = 'lovey_arcade_room_code';
const STORAGE_SLOT_KEY = 'lovey_arcade_player_slot';

export function App() {
  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      return normalizeRoomCode(localStorage.getItem(STORAGE_ROOM_KEY) || 'LOVEY');
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
  const [wsConnected, setWsConnected] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  const channelRef = useRef<CoupleRealtimeChannel | null>(null);

  const spawnFloatingReaction = useCallback((reaction: FloatingReaction) => {
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
        } else if (event.type === 'mode_switch') {
          setRoomData((prev) => ({ ...prev, current_mode: event.mode }));
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
      onConnectionChange: (connected) => {
        setWsConnected(connected);
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
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      window.removeEventListener('online', handleVisibilityOrOnline);
      channel.destroy();
      channelRef.current = null;
    };
  }, [roomCode, mySlot, spawnFloatingReaction, syncFromDatabase]);

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
        `Filipino Dama (${nextState.p1Remaining} - ${nextState.p2Remaining})`
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

  const handleSwitchMode = (newMode: GameMode) => {
    setRoomData((prev) => ({ ...prev, current_mode: newMode }));
    channelRef.current?.sendBroadcast({
      type: 'mode_switch',
      mode: newMode,
      sender: mySlot,
    });
    updateRoomModeInDb(roomCode, newMode);
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

  return (
    <main className="arcade-shell">
      {/* Zone 1: Top Couple Status & Mode Switcher */}
      <header className="top-bar">
        <div className="couple-row">
          <button
            type="button"
            className={`player-pill ${mySlot === 'p1' ? 'is-me' : ''}`}
            onClick={() => setCustomizerOpen(true)}
            title="Tap to customize Cat Avatar or switch seat"
          >
            <div className="cat-badge">
              <CatAvatarSvg
                breed={roomData.p1_avatar.breed}
                accessory={roomData.p1_avatar.accessory}
                size={30}
                animateIdle
              />
              <span
                className={`online-dot ${p1Online ? 'online' : ''}`}
                title={p1Online ? 'Online' : 'Offline'}
              />
            </div>
            <div className="player-meta">
              <span className="player-name">{roomData.p1_avatar.name}</span>
              <span className="player-score">
                P1 {mySlot === 'p1' ? '(You)' : ''} • 🏆 {p1Wins}
              </span>
            </div>
          </button>

          <button
            type="button"
            className="room-center-pill"
            onClick={() => setCustomizerOpen(true)}
            title="Tap to open Couple Room & Cat Customizer"
          >
            <span className="room-code-label">🐾 {roomData.room_code}</span>
            <span className="viewport-tag">
              {wsConnected ? '● Live Sync' : '○ Connecting'}
            </span>
          </button>

          <button
            type="button"
            className={`player-pill right ${mySlot === 'p2' ? 'is-me' : ''}`}
            onClick={() => setCustomizerOpen(true)}
            title="Tap to customize Cat Avatar or switch seat"
          >
            <div className="cat-badge">
              <CatAvatarSvg
                breed={roomData.p2_avatar.breed}
                accessory={roomData.p2_avatar.accessory}
                size={30}
                animateIdle
              />
              <span
                className={`online-dot ${p2Online ? 'online' : ''}`}
                title={p2Online ? 'Online' : 'Offline'}
              />
            </div>
            <div className="player-meta">
              <span className="player-name">{roomData.p2_avatar.name}</span>
              <span className="player-score">
                🏆 {p2Wins} • P2 {mySlot === 'p2' ? '(You)' : ''}
              </span>
            </div>
          </button>
        </div>

        <nav className="mode-tabs" aria-label="Game Switcher">
          <button
            type="button"
            className={`mode-tab ${roomData.current_mode === 'dama' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('dama')}
          >
            <span>👑</span>
            <span>Filipino Dama</span>
          </button>
          <button
            type="button"
            className={`mode-tab ${roomData.current_mode === 'snakes' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('snakes')}
          >
            <span>🐍</span>
            <span>Snakes & Ladders</span>
          </button>
        </nav>
      </header>

      {/* Zone 2: Square Responsive Vector Board Stage */}
      {roomData.current_mode === 'dama' ? (
        <DamaBoardView
          gameState={damaState}
          mySlot={mySlot}
          p1Avatar={roomData.p1_avatar}
          p2Avatar={roomData.p2_avatar}
          passAndPlay={passAndPlay}
          onTogglePassAndPlay={() => setPassAndPlay((p) => !p)}
          onCommitState={handleCommitDamaState}
          onResetMatch={handleResetDamaMatch}
        />
      ) : (
        <SnakesBoardView
          gameState={snakesState}
          mySlot={mySlot}
          p1Avatar={roomData.p1_avatar}
          p2Avatar={roomData.p2_avatar}
          passAndPlay={passAndPlay}
          onTogglePassAndPlay={() => setPassAndPlay((p) => !p)}
          onCommitState={handleCommitSnakesState}
          onNewSeedMatch={handleNewSnakesSeedMatch}
        />
      )}

      {/* Floating Compositor Emoji/Chat Layer */}
      <div className="floating-layer" aria-live="polite">
        {reactions.map((item) => (
          <div
            key={item.id}
            className={`floating-bubble from-${item.sender} kind-${item.kind}`}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Zone 3: Persistent Couple Quick Reactions & Chat Bar */}
      <QuickChatBar onSendReaction={handleSendReaction} />

      {/* Cat Avatar & Couple Lobby Modal */}
      <CatCustomizerModal
        isOpen={customizerOpen}
        roomCode={roomCode}
        mySlot={mySlot}
        currentAvatar={myCurrentAvatar}
        onSave={handleSaveLobby}
        onClose={() => setCustomizerOpen(false)}
      />
    </main>
  );
}
