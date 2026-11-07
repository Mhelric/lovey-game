import { useEffect, useRef, useState } from 'preact/hooks';
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
  DevicePhoneIcon,
  DoodleClashIcon,
  EditPenIcon,
  LoveyLogoWordmarkSvg,
  PawIcon,
  SettingsGearIcon,
  SnakeLadderIcon,
  SparkleIcon,
  UnoCardsIcon,
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
  hasSavedUno?: boolean;
  hasSavedDoodle?: boolean;
  savedSnakesMaxTile: SnakesMaxTile;
  chatMessages: FloatingReaction[];
  passAndPlay?: boolean;
  onTogglePassAndPlay?: (nextVal?: boolean) => void;
  onePhoneP2Avatar?: CatAvatarConfig;
  onSaveOnePhoneP2Avatar?: (avatar: CatAvatarConfig) => void;
  hasSaved1PhoneDama?: boolean;
  hasSaved1PhoneSnakes?: boolean;
  hasSaved1PhoneUno?: boolean;
  hasSaved1PhoneDoodle?: boolean;
  saved1PhoneSnakesMaxTile?: SnakesMaxTile;
  onOpenSettings: () => void;
  onChangeMyRoomCode: (newCode: string) => Promise<void>;
  onAttemptJoinAsInvited: (targetCode: string) => Promise<boolean>;
  onLeaveJoinedRoom: () => void;
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
  hasSavedUno = false,
  hasSavedDoodle = false,
  savedSnakesMaxTile,
  chatMessages,
  passAndPlay = false,
  onTogglePassAndPlay,
  onePhoneP2Avatar = { name: 'Lovey 2', breed: 'calico', accessory: 'ribbon' },
  onSaveOnePhoneP2Avatar,
  hasSaved1PhoneDama = false,
  hasSaved1PhoneSnakes = false,
  hasSaved1PhoneUno = false,
  hasSaved1PhoneDoodle = false,
  saved1PhoneSnakesMaxTile = 100,
  onOpenSettings,
  onChangeMyRoomCode,
  onAttemptJoinAsInvited,
  onLeaveJoinedRoom,
  onHostLaunchGame,
  onSendReaction,
  onHostKickPlayer,
}: HomeMenuViewProps) {
  const [pickingGame, setPickingGame] = useState(false);
  const [snakesTiles, setSnakesTiles] = useState<SnakesMaxTile>(
    savedSnakesMaxTile || 100
  );
  const [copied, setCopied] = useState(false);

  // Lazy Player 2 setup modal for 1-Phone mode
  const [p2SetupOpen, setP2SetupOpen] = useState(false);
  const [P2SetupComp, setP2SetupComp] = useState<any>(null);

  useEffect(() => {
    if (p2SetupOpen && !P2SetupComp) {
      import('./Player2SetupModal').then((m) => {
        setP2SetupComp(() => m.Player2SetupModal);
      });
    }
  }, [p2SetupOpen, P2SetupComp]);

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
  const isOnlineSolo = !passAndPlay && !isJoined;

  const [savedConfirmState, setSavedConfirmState] = useState<{
    mode: GameMode;
    snakesTiles?: SnakesMaxTile;
  } | null>(null);

  const hasSavedMode = (mode: GameMode, tiles: SnakesMaxTile) => {
    if (mode === 'dama') return passAndPlay ? !!hasSaved1PhoneDama : !!(hasSavedDama && isJoined);
    if (mode === 'uno') return passAndPlay ? !!hasSaved1PhoneUno : !!(hasSavedUno && isJoined);
    if (mode === 'doodle') return passAndPlay ? !!hasSaved1PhoneDoodle : !!(hasSavedDoodle && isJoined);
    const tileMatch = (passAndPlay ? saved1PhoneSnakesMaxTile : savedSnakesMaxTile) === tiles;
    return passAndPlay ? !!(hasSaved1PhoneSnakes && tileMatch) : !!(hasSavedSnakes && isJoined && tileMatch);
  };

  const handleGameCardClick = (mode: GameMode, tiles: SnakesMaxTile = snakesTiles) => {
    if (isOnlineSolo) return;
    playTapPop();
    if (hasSavedMode(mode, tiles)) {
      setSavedConfirmState({ mode, snakesTiles: tiles });
    } else {
      setPickingGame(false);
      onHostLaunchGame(mode, passAndPlay, tiles, true);
    }
  };

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
            /* Invited Player automatically waits for Host to pick a game */
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
            </div>
          ) : (
            /* Host clicks Play Game */
            <div className="host-play-actions-stack">
              {/* 1-Phone Mode Menu Toggle Strip */}
              <div className="home-mode-toggle-strip">
                <button
                  type="button"
                  className={`home-mode-toggle-btn ${!passAndPlay ? 'active' : ''}`}
                  onClick={() => {
                    playTapPop();
                    onTogglePassAndPlay?.(false);
                  }}
                >
                  <SparkleIcon size={13} />
                  <span>2 Phones (Online)</span>
                </button>
                <button
                  type="button"
                  className={`home-mode-toggle-btn ${passAndPlay ? 'active' : ''}`}
                  onClick={() => {
                    playTapPop();
                    if (!passAndPlay) {
                      setP2SetupOpen(true);
                    }
                  }}
                >
                  <DevicePhoneIcon size={13} />
                  <span>1 Phone (Local)</span>
                </button>
              </div>

              {isOnlineSolo ? (
                <div className="online-solo-waiting-card anim-fade-scale">
                  <div className="waiting-pill-header">
                    <span className="mini-paw-spinner" aria-hidden="true" />
                    <span>Waiting for partner to join…</span>
                  </div>
                  <p className="waiting-partner-note">
                    Share Room Code <strong>{roomData.room_code}</strong> to connect, or switch to 1-Phone mode above!
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  className="vibrant-play-btn sticker-press"
                  onClick={() => {
                    playTapPop();
                    setPickingGame(true);
                  }}
                >
                  <span>{passAndPlay ? 'Play 1-Phone Game' : 'Play Game'}</span>
                  <PawIcon size={19} />
                </button>
              )}
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
                  {passAndPlay
                    ? `1-Phone Mode • With ${onePhoneP2Avatar.name}`
                    : isJoined
                    ? `Playing with ${roomData.p2_avatar.name}`
                    : 'Waiting for partner to join...'}
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

            {/* Solo Online Warning Banner */}
            {isOnlineSolo && (
              <div className="status-pill-banner warning compact anim-fade-scale" style={{ margin: '4px 0 10px 0' }}>
                <AlertCircleIcon size={13} />
                <span>Waiting for a partner to join room <strong>{roomData.room_code}</strong>. Switch to 1-Phone mode above to play solo!</span>
              </div>
            )}

            {/* 1-Phone Mode Toggle Below Header */}
            <div className="pick-one-phone-card">
              <div className="pick-one-phone-left">
                <div className="pick-one-phone-badge-row">
                  <DevicePhoneIcon size={16} />
                  <span className="pick-one-phone-heading">1-Phone Mode</span>
                  <span
                    className={`pick-one-phone-status-pill ${
                      passAndPlay ? 'on' : 'off'
                    }`}
                  >
                    {passAndPlay ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="pick-one-phone-desc">
                  {passAndPlay
                    ? `Playing with ${onePhoneP2Avatar.name}`
                    : 'Pass & play on this single phone'}
                </p>
              </div>

              <div className="pick-one-phone-controls">
                {passAndPlay && (
                  <button
                    type="button"
                    className="pick-one-phone-edit-btn sticker-press"
                    onClick={() => {
                      playTapPop();
                      setP2SetupOpen(true);
                    }}
                    title="Edit Player 2"
                  >
                    <EditPenIcon size={12} />
                    <span>Edit P2</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`cozy-switch-pill sticker-press ${
                    passAndPlay ? 'active' : ''
                  }`}
                  onClick={() => {
                    playTapPop();
                    if (!passAndPlay) {
                      setP2SetupOpen(true);
                    } else {
                      onTogglePassAndPlay?.(false);
                    }
                  }}
                  aria-label="Toggle 1-Phone mode"
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>

            <div className="role-buttons-grid game-picker-modal-grid">
              {/* 1. Cat Dama Card */}
              <button
                type="button"
                className={`game-pick-btn dama-pick sticker-press ${isOnlineSolo ? 'disabled-pick' : ''}`}
                disabled={isOnlineSolo}
                onClick={() => handleGameCardClick('dama', 100)}
              >
                <CrownIcon size={26} />
                <span className="role-main-label">Cat Dama</span>
                <span className="role-sub-label">3D Filipino Checkers</span>
              </button>

              {/* 2. Cat Uno Card */}
              <button
                type="button"
                className={`game-pick-btn uno-pick sticker-press ${isOnlineSolo ? 'disabled-pick' : ''}`}
                disabled={isOnlineSolo}
                onClick={() => handleGameCardClick('uno')}
              >
                <UnoCardsIcon size={26} />
                <span className="role-main-label">Cat Uno</span>
                <span className="role-sub-label">2P Stacking &amp; 7-Swap</span>
              </button>

              {/* 3. Doodle Clash Card */}
              <button
                type="button"
                className={`game-pick-btn doodle-pick sticker-press ${isOnlineSolo ? 'disabled-pick' : ''}`}
                disabled={isOnlineSolo}
                onClick={() => handleGameCardClick('doodle')}
              >
                <DoodleClashIcon size={26} />
                <span className="role-main-label">Doodle Clash</span>
                <span className="role-sub-label">Draw &amp; Guess Duel</span>
              </button>

              {/* 4. Snakes & Ladders Card with 100 / 150 Mode Switch */}
              <div className={`game-pick-btn snakes-pick-card ${isOnlineSolo ? 'disabled-pick' : ''}`}>
                <button
                  type="button"
                  className="snakes-launch-hit sticker-press"
                  disabled={isOnlineSolo}
                  onClick={() => handleGameCardClick('snakes', snakesTiles)}
                >
                  <SnakeLadderIcon size={24} />
                  <span className="role-main-label">Snakes &amp; Ladders</span>
                  <span className="role-sub-label">{snakesTiles} Tiles Mode</span>
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

      {/* Saved Match Confirmation Modal Window */}
      {savedConfirmState && (() => {
        const title =
          savedConfirmState.mode === 'dama'
            ? 'Cat Dama'
            : savedConfirmState.mode === 'uno'
            ? 'Cat Uno'
            : savedConfirmState.mode === 'doodle'
            ? 'Doodle Clash'
            : `Snakes & Ladders (${savedConfirmState.snakesTiles ?? 100})`;
        return (
          <div
            className="modal-backdrop saved-confirm-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Continue Saved Game"
            onClick={() => {
              playTapPop();
              setSavedConfirmState(null);
            }}
          >
            <div
              className="modal-card saved-confirm-modal-card anim-fade-scale"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-group">
                  <h3
                    className="modal-title"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <SparkleIcon size={18} />
                    <span>Saved Game Found</span>
                  </h3>
                  <p className="modal-subtitle">
                    {title} • {passAndPlay ? '1-Phone' : 'Online'}
                  </p>
                </div>
                <button
                  type="button"
                  className="cozy-close-btn"
                  onClick={() => {
                    playTapPop();
                    setSavedConfirmState(null);
                  }}
                  aria-label="Close modal"
                >
                  <CloseIcon size={15} />
                </button>
              </div>

              <p className="saved-confirm-desc">
                You have an unfinished game of <strong>{title}</strong>. Would you like to continue your saved game or start a fresh match?
              </p>

              <div className="saved-confirm-actions">
                <button
                  type="button"
                  className="saved-confirm-resume-btn sticker-press"
                  onClick={() => {
                    playTapPop();
                    const { mode, snakesTiles: targetTiles } = savedConfirmState;
                    setSavedConfirmState(null);
                    setPickingGame(false);
                    onHostLaunchGame(mode, passAndPlay, targetTiles, false);
                  }}
                >
                  <PawIcon size={15} />
                  <span>Continue Saved Game</span>
                </button>

                <button
                  type="button"
                  className="saved-confirm-fresh-btn sticker-press"
                  onClick={() => {
                    playTapPop();
                    const { mode, snakesTiles: targetTiles } = savedConfirmState;
                    setSavedConfirmState(null);
                    setPickingGame(false);
                    onHostLaunchGame(mode, passAndPlay, targetTiles, true);
                  }}
                >
                  <span>Start New Game</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Player 2 Setup Modal for 1-Phone Mode */}
      {P2SetupComp && p2SetupOpen && (
        <P2SetupComp
          isOpen={p2SetupOpen}
          currentAvatar={onePhoneP2Avatar}
          onSave={(av: CatAvatarConfig) => {
            onSaveOnePhoneP2Avatar?.(av);
            onTogglePassAndPlay?.(true);
            setP2SetupOpen(false);
          }}
          onClose={() => setP2SetupOpen(false)}
        />
      )}

      {/* Bottom Bar with Real Chat Inbox Button on Homescreen */}
      <footer className="menu-bottom-bar">
        <span className="menu-bottom-caption">
          {!passAndPlay && !isJoined ? (
            'Solo'
          ) : isJoined ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span>{roomData.p1_avatar.name || 'Lovey 1'}</span>
              <span>•</span>
              <span>{roomData.p2_avatar.name || 'Lovey 2'}</span>
              <span
                className={`online-dot mini ${p2Online ? 'online' : ''}`}
                style={{ width: '7px', height: '7px', position: 'static', display: 'inline-block' }}
                title={p2Online ? 'Online' : 'Offline'}
              />
            </span>
          ) : (
            '1-Phone Mode'
          )}
        </span>
        <QuickChatBar
          messages={chatMessages}
          mySlot={mySlot}
          p1Avatar={roomData.p1_avatar}
          p2Avatar={roomData.p2_avatar}
          partnerOnline={p2Online}
          isConnected={isJoined}
          onSendReaction={onSendReaction}
        />
      </footer>
    </section>
  );
}
