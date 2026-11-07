import { useRef, useState } from 'preact/hooks';
import {
  CatAvatarConfig,
  CoupleRoomRow,
  FloatingReaction,
  GameMode,
  PlayerSlot,
} from '../types/arcade';
import { CoupleCatsSceneSvg } from './CatAvatarSvg';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CloseIcon,
  CopyIcon,
  CrownIcon,
  DoodleClashIcon,
  EditPenIcon,
  LoveyLogoWordmarkSvg,
  PawIcon,
  SettingsGearIcon,
  SnakeLadderIcon,
  SparkleIcon,
} from './ArcadeIcons';
import { QuickChatBar } from './QuickChatBar';
import { normalizeRoomCode } from '../services/supabaseService';
import { SnakesMaxTile } from '../engines/snakesEngine';
import { playTapPop } from '../services/soundEffects';

interface HomeMenuViewProps {
  roomData: CoupleRoomRow;
  mySlot: PlayerSlot;
  myAvatar: CatAvatarConfig;
  isJoined: boolean;
  p2Online: boolean;
  hasSavedDama: boolean;
  hasSavedSnakes: boolean;
  hasSavedDoodle?: boolean;
  savedSnakesMaxTile: SnakesMaxTile;
  chatMessages: FloatingReaction[];
  onOpenSettings: () => void;
  onChangeMyRoomCode: (newCode: string) => Promise<void>;
  onAttemptJoinAsInvited: (targetCode: string) => Promise<boolean>;
  onLeaveJoinedRoom: () => void;
  onRejoinSavedGame: (mode?: GameMode) => void;
  onHostLaunchGame: (
    mode: GameMode,
    soloPractice?: boolean,
    snakesMaxTile?: SnakesMaxTile,
    forceNewMatch?: boolean
  ) => void;
  onSendReaction: (content: string, kind: 'emoji' | 'chat') => void;
  onHostKickPlayer?: () => void;
}

export function HomeMenuView({
  roomData,
  mySlot,
  myAvatar,
  isJoined,
  p2Online,
  hasSavedDama,
  hasSavedSnakes,
  hasSavedDoodle = false,
  savedSnakesMaxTile,
  chatMessages,
  onOpenSettings,
  onChangeMyRoomCode,
  onAttemptJoinAsInvited,
  onLeaveJoinedRoom,
  onRejoinSavedGame,
  onHostLaunchGame,
  onSendReaction,
  onHostKickPlayer,
}: HomeMenuViewProps) {
  const [pickingGame, setPickingGame] = useState(false);
  const [snakesTiles, setSnakesTiles] = useState<SnakesMaxTile>(
    savedSnakesMaxTile || 100
  );
  const [copied, setCopied] = useState(false);

  // Editable Room Code state on homescreen
  const [editingRoomCode, setEditingRoomCode] = useState(false);
  const [draftMyRoomCode, setDraftMyRoomCode] = useState(roomData.room_code);
  const [roomSaveStatus, setRoomSaveStatus] = useState<
    'idle' | 'saving' | 'saved'
  >('idle');
  const [hostTypingPulse, setHostTypingPulse] = useState(0);

  // Join someone's room expandable button -> textbox state
  const [joinExpanded, setJoinExpanded] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState('');
  const [joinFocused, setJoinFocused] = useState(false);
  const [joinTypingPulse, setJoinTypingPulse] = useState(0);
  const [joinStatus, setJoinStatus] = useState<
    'idle' | 'checking' | 'success' | 'failed'
  >('idle');
  const joinInputRef = useRef<HTMLInputElement | null>(null);

  const isHost = mySlot === 'p1';
  // Only have the resume button when the player is in a room where the host has a past game saved
  const hasSavedAny =
    isJoined && (hasSavedDama || hasSavedSnakes || hasSavedDoodle);
  const activeSavedMode: GameMode =
    roomData.current_mode === 'doodle' && hasSavedDoodle
      ? 'doodle'
      : roomData.current_mode === 'snakes' && hasSavedSnakes
      ? 'snakes'
      : hasSavedDama
      ? 'dama'
      : hasSavedDoodle
      ? 'doodle'
      : 'snakes';
  const savedGameLabel =
    activeSavedMode === 'doodle'
      ? 'Doodle Clash'
      : activeSavedMode === 'snakes'
      ? `Snakes (${savedSnakesMaxTile})`
      : 'Cat Dama';

  const handleExpandJoinBox = () => {
    if (joinExpanded) return;
    playTapPop();
    setJoinExpanded(true);
    setJoinStatus('idle');
    window.setTimeout(() => {
      joinInputRef.current?.focus();
    }, 60);
  };

  const handleCopyCode = () => {
    playTapPop();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(roomData.room_code).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleRoomCodeEditSave = async (e?: Event) => {
    if (e) e.preventDefault();
    const cleaned = normalizeRoomCode(draftMyRoomCode);
    setEditingRoomCode(false);
    setDraftMyRoomCode(cleaned);
    if (cleaned !== roomData.room_code) {
      setRoomSaveStatus('saving');
      await Promise.all([
        onChangeMyRoomCode(cleaned),
        new Promise((r) => window.setTimeout(r, 420)),
      ]);
      setRoomSaveStatus('saved');
      window.setTimeout(() => setRoomSaveStatus('idle'), 1500);
    }
  };

  const handleJoinSubmit = async (e: Event) => {
    e.preventDefault();
    if (!joinExpanded) {
      handleExpandJoinBox();
      return;
    }
    if (joinStatus === 'checking') return;
    if (!joinInputCode.trim()) {
      setJoinStatus('failed');
      joinInputRef.current?.focus();
      return;
    }
    const cleaned = normalizeRoomCode(joinInputCode);
    setJoinStatus('checking');

    // Run room verification with a smooth minimum loading animation (650ms)
    const [ok] = await Promise.all([
      onAttemptJoinAsInvited(cleaned),
      new Promise((resolve) => window.setTimeout(resolve, 650)),
    ]);

    if (ok) {
      setJoinStatus('success');
      setJoinInputCode('');
      setJoinExpanded(false);
      window.setTimeout(() => setJoinStatus('idle'), 1800);
    } else {
      setJoinStatus('failed');
    }
  };

  const visualJoinState =
    joinStatus === 'checking'
      ? 'state-loading'
      : joinStatus === 'failed'
      ? 'state-error'
      : joinStatus === 'success'
      ? 'state-success'
      : joinInputCode.trim().length > 0
      ? 'state-typing'
      : joinFocused
      ? 'state-focused'
      : 'state-idle';

  return (
    <section className="minimal-menu-screen" aria-label="Lovey Game Main Menu">
      {/* Top Bar: Settings Charm Button (Left) + Cat-Vibes Logo (Center) + Spacer (Right, no cat btn) */}
      <header className="menu-top-bar">
        <button
          type="button"
          className="icon-circle-btn settings-charm-btn sticker-press"
          onClick={onOpenSettings}
          aria-label="Open Settings and Customize Cat"
          title="Customize Cat & Settings"
        >
          <SettingsGearIcon size={26} />
        </button>

        <div className="menu-logo-center">
          <LoveyLogoWordmarkSvg />
        </div>

        <div className="menu-top-spacer" aria-hidden="true" />
      </header>

      {/* Center Stage: Clickable Cat(s) + Editable Room Code + Join Textbox + Play Flow */}
      <div className="menu-center-stage">
        <div className="menu-cats-showcase">
          <CoupleCatsSceneSvg
            p1Breed={roomData.p1_avatar.breed}
            p2Breed={roomData.p2_avatar.breed}
            p1Accessory={roomData.p1_avatar.accessory}
            p2Accessory={roomData.p2_avatar.accessory}
            p1Name={roomData.p1_avatar.name}
            p2Name={roomData.p2_avatar.name}
            soloAvatar={myAvatar}
            isJoined={isJoined}
            showRoleLabels={isJoined}
            interactive={true}
            showTrophy={
              roomData.p1_dama_wins +
                roomData.p2_dama_wins +
                roomData.p1_snakes_wins +
                roomData.p2_snakes_wins >
              0
            }
            size={206}
          />
          <span className="showcase-sub-pill">
            {isJoined
              ? 'Connected! Tap cats for cute reactions!'
              : `${myAvatar.name} is solo • Tap cat to pet!`}
          </span>
        </div>

        {/* Room Code & Expandable Join Controls
            Structure:
            [Your Room]
            [Room Code] [Copy Icon only]
            [or]
            [Join a Room] -> smoothly transforms/expands into [Text Box] [Join]
        */}
        <div className="home-room-controls-card">
          {/* 1. [Your Room] Label */}
          <div className="room-label-header">
            <span className="room-code-caption">
              {isHost ? 'YOUR ROOM' : 'IN ROOM'}
            </span>
          </div>

          {/* 2. [Room Code] [Copy Icon only] */}
          <div className="room-code-main-row">
            {editingRoomCode && isHost ? (
              <form
                className="inline-room-edit-form"
                onSubmit={handleRoomCodeEditSave}
              >
                <input
                  key={`host-edit-${hostTypingPulse > 0 ? 'active' : 'init'}`}
                  type="text"
                  className={`inline-room-code-input ${
                    hostTypingPulse % 2 === 1 ? 'typing-pop-a' : 'typing-pop-b'
                  }`}
                  value={draftMyRoomCode}
                  maxLength={12}
                  autoFocus
                  onInput={(e) => {
                    playTapPop();
                    setHostTypingPulse((c) => c + 1);
                    setDraftMyRoomCode(
                      (
                        e.currentTarget as HTMLInputElement
                      ).value.toUpperCase()
                    );
                  }}
                />
                <button
                  type="submit"
                  className="inline-room-save-btn sticker-press"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                type="button"
                className={`room-code-edit-trigger ${
                  roomSaveStatus === 'saved' ? 'saved-flash' : ''
                }`}
                onClick={() => {
                  if (isHost) {
                    playTapPop();
                    setDraftMyRoomCode(roomData.room_code);
                    setEditingRoomCode(true);
                  } else {
                    handleCopyCode();
                  }
                }}
                title={isHost ? 'Tap to edit your Room Code' : 'Room Code'}
              >
                {roomSaveStatus === 'saving' ? (
                  <span className="room-saving-inline">
                    <span className="mini-paw-spinner" />
                    <span>Saving…</span>
                  </span>
                ) : (
                  <>
                    <span className="room-code-big">{roomData.room_code}</span>
                    {roomSaveStatus === 'saved' ? (
                      <CheckCircleIcon size={14} />
                    ) : (
                      isHost && <EditPenIcon size={13} />
                    )}
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              className={`room-copy-icon-btn sticker-press ${
                copied ? 'copied' : ''
              }`}
              onClick={handleCopyCode}
              aria-label={copied ? 'Room code copied' : 'Copy Room Code'}
              title={copied ? 'Copied!' : 'Copy Room Code'}
            >
              {copied ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
            </button>
          </div>

          {/* 3. When someone has joined Host's room, replace "Join a Room" button with Partner Indicator Bar (matching Invited) */}
          {isHost ? (
            isJoined ? (
              <div className="joined-partner-bar host-joined anim-fade-scale">
                <span className="role-pill host">Host</span>
                <span className="joined-bar-text">
                  With <strong>{roomData.p2_avatar.name}</strong> (Invited)
                </span>
                <span
                  className={`host-partner-indicator ${
                    p2Online ? 'online' : 'in-room'
                  }`}
                >
                  <span className="host-partner-dot" aria-hidden="true" />
                  <span>{p2Online ? 'Online' : 'In Room'}</span>
                </span>
                {onHostKickPlayer && (
                  <button
                    type="button"
                    className="leave-room-mini-btn kick-mini-btn sticker-press"
                    onClick={onHostKickPlayer}
                    title={`Kick ${roomData.p2_avatar.name} from room`}
                    aria-label={`Kick ${roomData.p2_avatar.name} from room`}
                  >
                    Kick
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="room-or-divider" aria-hidden="true">
                  <span className="room-or-line" />
                  <span className="room-or-text">or</span>
                  <span className="room-or-line" />
                </div>

                <form
                  className={`join-morph-row ${
                    joinExpanded ? 'is-expanded' : 'is-collapsed'
                  } ${visualJoinState}`}
                  onSubmit={handleJoinSubmit}
                >
                  {/* Morphing Box: "Join a Room" Button when collapsed -> Text Box when expanded */}
                  <div
                    className={`join-morph-box ${
                      joinExpanded && joinTypingPulse > 0
                        ? joinTypingPulse % 2 === 1
                          ? 'key-bounce-a'
                          : 'key-bounce-b'
                        : ''
                    }`}
                    onClick={() => {
                      if (!joinExpanded) {
                        handleExpandJoinBox();
                      }
                    }}
                    role={!joinExpanded ? 'button' : undefined}
                    tabIndex={!joinExpanded ? 0 : -1}
                    onKeyDown={(e) => {
                      if (
                        !joinExpanded &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        handleExpandJoinBox();
                      }
                    }}
                  >
                    {/* Collapsed Button Label (Fades out smoothly when expanded) */}
                    <span
                      className="join-morph-btn-label"
                      aria-hidden={joinExpanded}
                    >
                      <PawIcon size={13} />
                      <span>Join a Room</span>
                    </span>

                    {/* Expanded Code Textbox Input (Fades in smoothly as box expands) */}
                    <div
                      className="join-morph-input-layer"
                      aria-hidden={!joinExpanded}
                    >
                      <span className="join-field-icon" aria-hidden="true">
                        <PawIcon size={13} />
                      </span>
                      <input
                        ref={joinInputRef}
                        type="text"
                        className="home-join-input"
                        value={joinInputCode}
                        maxLength={12}
                        tabIndex={joinExpanded ? 0 : -1}
                        disabled={!joinExpanded || joinStatus === 'checking'}
                        placeholder="Enter partner's code..."
                        onFocus={() => setJoinFocused(true)}
                        onBlur={() => {
                          setJoinFocused(false);
                          // Collapse back smoothly if empty and idle
                          window.setTimeout(() => {
                            if (
                              !joinInputRef.current?.value.trim() &&
                              joinStatus === 'idle'
                            ) {
                              setJoinExpanded(false);
                            }
                          }, 160);
                        }}
                        onInput={(e) => {
                          playTapPop();
                          setJoinStatus('idle');
                          setJoinTypingPulse((c) => c + 1);
                          setJoinInputCode(
                            (
                              e.currentTarget as HTMLInputElement
                            ).value.toUpperCase()
                          );
                        }}
                      />
                      {joinInputCode.trim().length > 0 &&
                        joinStatus !== 'checking' && (
                          <span className="join-char-pill">
                            {joinInputCode.trim().length}/12
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Right-side [Join] Button that slides/expands in beside the Text Box */}
                  <div className="join-morph-submit-wrap">
                    <button
                      type="submit"
                      tabIndex={joinExpanded ? 0 : -1}
                      className={`home-join-submit-btn sticker-press ${visualJoinState} ${
                        joinInputCode.trim().length > 0 ? 'ready' : ''
                      } ${joinStatus === 'checking' ? 'loading' : ''}`}
                      disabled={!joinExpanded || joinStatus === 'checking'}
                    >
                      {joinStatus === 'checking' ? (
                        <span className="join-btn-loading-content">
                          <span className="mini-paw-spinner" />
                          <span>Joining</span>
                        </span>
                      ) : joinStatus === 'success' ? (
                        <span>Joined!</span>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )
          ) : (
            <div className="joined-partner-bar anim-fade-scale">
              <span className="role-pill invited">Invited</span>
              <span className="joined-bar-text">
                With <strong>{roomData.p1_avatar.name}</strong> (Host)
              </span>
              <button
                type="button"
                className="leave-room-mini-btn sticker-press"
                onClick={() => {
                  setJoinStatus('idle');
                  setJoinExpanded(false);
                  onLeaveJoinedRoom();
                }}
              >
                Leave Room
              </button>
            </div>
          )}

          {/* Animated State Feedback Banner Below Textfield */}
          {joinExpanded && joinStatus === 'checking' && isHost && !isJoined && (
            <div className="status-pill-banner loading compact anim-fade-scale">
              <span className="mini-paw-spinner" />
              <span>
                Connecting to room{' '}
                <strong>{normalizeRoomCode(joinInputCode)}</strong>…
              </span>
            </div>
          )}

          {joinExpanded && joinStatus === 'failed' && isHost && !isJoined && (
            <div className="status-pill-banner error compact anim-fade-scale">
              <AlertCircleIcon size={13} />
              <span>
                {joinInputCode.trim()
                  ? 'Room not found—make sure your Host has it open!'
                  : 'Please type a room code first!'}
              </span>
            </div>
          )}
        </div>

        {/* Centered Play Game / Game Picker Flow (No Host/Invited Prompt!) */}
        <div className="menu-flow-card">
          {!isHost ? (
            /* Invited Player automatically waits for Host to pick a game, or can Rejoin Savestate / Leave Room */
            <div className="flow-step-panel invited-waiting-panel anim-fade-scale">
              <div className="status-pill-banner success">
                <CheckCircleIcon size={14} />
                <span>
                  Connected as <strong>Invited</strong>!
                </span>
              </div>
              <p className="waiting-text">
                Waiting for <strong>{roomData.p1_avatar.name}</strong> (Host) to
                pick a game
                <span className="waiting-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </p>

              <div className="invited-panel-actions">
                {hasSavedAny && (
                  <button
                    type="button"
                    className="rejoin-savestate-btn sticker-press"
                    onClick={() => onRejoinSavedGame(activeSavedMode)}
                  >
                    <PawIcon size={13} />
                    <span>Rejoin Saved {savedGameLabel}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="invited-leave-full-btn sticker-press"
                  onClick={() => {
                    setJoinStatus('idle');
                    setJoinExpanded(false);
                    onLeaveJoinedRoom();
                  }}
                >
                  Leave Room
                </button>
              </div>
            </div>
          ) : (
            /* Host clicks Play Game (or Resume Saved Game if a savestate exists!) */
            <div className="host-play-actions-stack">
              {hasSavedAny && (
                <button
                  type="button"
                  className="rejoin-savestate-btn host-resume sticker-press"
                  onClick={() => onRejoinSavedGame(activeSavedMode)}
                >
                  <PawIcon size={14} />
                  <span>Resume Saved {savedGameLabel}</span>
                </button>
              )}

              <button
                type="button"
                className="vibrant-play-btn sticker-press"
                onClick={() => {
                  playTapPop();
                  setPickingGame(true);
                }}
              >
                <span>Play Game</span>
                <PawIcon size={19} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Host Game Picker Pop-Up Modal Window */}
      {isHost && pickingGame && (
        <div
          className="modal-backdrop game-picker-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Pick a Game"
          onClick={() => {
            playTapPop();
            setPickingGame(false);
          }}
        >
          <div
            className="modal-card game-picker-modal-card anim-fade-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h2
                  className="modal-title"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <SparkleIcon size={18} />
                  <span>Pick a Game</span>
                </h2>
                <p className="modal-subtitle">
                  {isJoined
                    ? `Playing with ${roomData.p2_avatar.name}`
                    : 'Choose a game to launch'}
                </p>
              </div>
              <button
                type="button"
                className="cozy-close-btn"
                onClick={() => {
                  playTapPop();
                  setPickingGame(false);
                }}
                aria-label="Close game picker"
              >
                <CloseIcon size={15} />
              </button>
            </div>

            <div className="role-buttons-grid game-picker-modal-grid">
              {/* 1. Cat Dama Card */}
              <button
                type="button"
                className="game-pick-btn dama-pick sticker-press"
                onClick={() => {
                  setPickingGame(false);
                  onHostLaunchGame('dama', !isJoined, 100);
                }}
              >
                <CrownIcon size={26} />
                <span className="role-main-label">Cat Dama</span>
                <span className="role-sub-label">
                  {hasSavedDama && isJoined
                    ? 'Resume Saved Match'
                    : '3D Filipino Checkers'}
                </span>
              </button>

              {/* 3. Doodle Clash Card */}
              <button
                type="button"
                className="game-pick-btn doodle-pick sticker-press"
                onClick={() => {
                  setPickingGame(false);
                  onHostLaunchGame('doodle', !isJoined);
                }}
              >
                <DoodleClashIcon size={26} />
                <span className="role-main-label">Doodle Clash</span>
                <span className="role-sub-label">
                  {hasSavedDoodle && isJoined
                    ? 'Resume Saved Match'
                    : 'Draw & Guess Duel'}
                </span>
              </button>

              {/* 4. Snakes & Ladders Card with 100 / 150 Mode Switch */}
              <div className="game-pick-btn snakes-pick-card">
                <button
                  type="button"
                  className="snakes-launch-hit sticker-press"
                  onClick={() => {
                    setPickingGame(false);
                    onHostLaunchGame('snakes', !isJoined, snakesTiles);
                  }}
                >
                  <SnakeLadderIcon size={24} />
                  <span className="role-main-label">Snakes &amp; Ladders</span>
                  {hasSavedSnakes &&
                    isJoined &&
                    savedSnakesMaxTile === snakesTiles && (
                      <span className="role-sub-label">Resume Saved Match</span>
                    )}
                </button>
                <div
                  className="snakes-mode-pills"
                  role="group"
                  aria-label="Board Size"
                >
                  <button
                    type="button"
                    className={`snakes-size-pill ${
                      snakesTiles === 100 ? 'active' : ''
                    }`}
                    onClick={() => setSnakesTiles(100)}
                  >
                    100 Tiles
                  </button>
                  <button
                    type="button"
                    className={`snakes-size-pill ${
                      snakesTiles === 150 ? 'active' : ''
                    }`}
                    onClick={() => setSnakesTiles(150)}
                  >
                    150 Tiles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar with Real Chat Inbox Button on Homescreen */}
      <footer className="menu-bottom-bar">
        <span className="menu-bottom-caption">
          {roomData.p2_avatar.name && roomData.p2_avatar.name !== 'Lovey 2' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span>{roomData.p1_avatar.name || 'Lovey 1'}</span>
              <span>•</span>
              <span>{roomData.p2_avatar.name}</span>
              <span
                className={`online-dot mini ${p2Online ? 'online' : ''}`}
                style={{ width: '7px', height: '7px', position: 'static', display: 'inline-block' }}
                title={p2Online ? 'Online' : 'Offline'}
              />
            </span>
          ) : isJoined ? (
            `${roomData.p1_avatar.name} • ${roomData.p2_avatar.name}`
          ) : (
            'Made with love for two'
          )}
        </span>
        <QuickChatBar
          messages={chatMessages}
          mySlot={mySlot}
          p1Avatar={roomData.p1_avatar}
          p2Avatar={roomData.p2_avatar}
          partnerOnline={p2Online}
          onSendReaction={onSendReaction}
        />
      </footer>
    </section>
  );
}
