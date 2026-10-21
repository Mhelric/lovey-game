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
import {
  createInitialDamaState,
  DamaGameState,
} from './engines/damaEngine';
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
      <g stroke="#8b5a2b" strokeWidth="1.1" strokeLinecap="round">
        <line x1="23" y1="85" x2="43" y2="45" />
        <line x1="27" y1="85" x2="47" y2="45" />
        <line x1="25" y1="78" x2="29" y2="78" strokeWidth="0.8" />
        <line x1="29" y1="70" x2="33" y2="70" strokeWidth="0.8" />
        <line x1="33" y1="62" x2="37" y2="62" strokeWidth="0.8" />
        <line x1="37" y1="54" x2="41" y2="54" strokeWidth="0.8" />
      </g>
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
      fetchActiveMatch<DamaGameState>(targetRoom),
    ]);
    setRoomData(row);
    if (
      matchRow &&
      matchRow.game_mode === 'dama' &&
      matchRow.state_json &&
      Array.isArray(matchRow.state_json.board)
    ) {
      setDamaState(matchRow.state_json);
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
        } else if (event.type === 'match_sync' && event.gameMode === 'dama') {
          const incoming = event.stateJson as DamaGameState;
          if (incoming && Array.isArray(incoming.board)) {
            setDamaState(incoming);
            if (incoming.winner) {
              fetchOrCreateCoupleRoom(roomCode).then(setRoomData);
            }
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
        <section className="board-stage">
          <SnakesPreviewBoard />
          <div className="shell-overlay-banner">
            Phase 2: Seeded Snakes & Ladders Coming Up Next!
          </div>
        </section>
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
