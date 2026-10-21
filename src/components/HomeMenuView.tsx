import { useState } from 'preact/hooks';
import { CoupleRoomRow, GameMode } from '../types/arcade';
import { CatAvatarSvg, CoupleCatsSceneSvg } from './CatAvatarSvg';
import {
  AlertCircleIcon,
  ArrowBackIcon,
  CheckCircleIcon,
  CopyIcon,
  CrownIcon,
  LoveyLogoWordmarkSvg,
  PawIcon,
  SettingsGearIcon,
  SnakeLadderIcon,
} from './ArcadeIcons';
import { normalizeRoomCode } from '../services/supabaseService';

interface HomeMenuViewProps {
  roomData: CoupleRoomRow;
  p2Online: boolean;
  onOpenSettings: () => void;
  onStartAsHost: () => Promise<void>;
  onAttemptJoinAsInvited: (targetCode: string) => Promise<boolean>;
  onHostLaunchGame: (mode: GameMode, soloPractice?: boolean) => void;
}

type MenuFlowStep = 'idle' | 'role' | 'host' | 'join';

export function HomeMenuView({
  roomData,
  p2Online,
  onOpenSettings,
  onStartAsHost,
  onAttemptJoinAsInvited,
  onHostLaunchGame,
}: HomeMenuViewProps) {
  const [flowStep, setFlowStep] = useState<MenuFlowStep>('idle');
  const [copied, setCopied] = useState(false);
  const [joinInputCode, setJoinInputCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<
    'idle' | 'checking' | 'success' | 'failed'
  >('idle');
  const [hostOverrideReady, setHostOverrideReady] = useState(false);

  const handleCopyCode = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(roomData.room_code).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleChooseHost = async () => {
    setHostOverrideReady(false);
    setFlowStep('host');
    await onStartAsHost();
  };

  const handleChooseJoin = () => {
    setJoinStatus('idle');
    setJoinInputCode('');
    setFlowStep('join');
  };

  const handleJoinSubmit = async (e: Event) => {
    e.preventDefault();
    const cleaned = normalizeRoomCode(joinInputCode);
    if (!joinInputCode.trim()) {
      setJoinStatus('failed');
      return;
    }
    setJoinStatus('checking');
    const ok = await onAttemptJoinAsInvited(cleaned);
    setJoinStatus(ok ? 'success' : 'failed');
  };

  const partnerReady = p2Online || hostOverrideReady;

  return (
    <section className="minimal-menu-screen" aria-label="Lovey Game Main Menu">
      {/* Top Bar: Top-Left Sticker Paw Settings Button + Top-Center Chunky Logo */}
      <header className="menu-top-bar">
        <button
          type="button"
          className="icon-circle-btn sticker-press"
          onClick={onOpenSettings}
          aria-label="Open Settings"
          title="Settings"
        >
          <SettingsGearIcon size={22} />
        </button>

        <div className="menu-logo-center">
          <LoveyLogoWordmarkSvg />
        </div>

        <div className="menu-top-spacer" aria-hidden="true" />
      </header>

      {/* Center Stage: Large Animated Couple Cats + Sticker Room Code + Flow */}
      <div className="menu-center-stage">
        <div className="menu-cats-showcase">
          <CoupleCatsSceneSvg
            p1Breed={roomData.p1_avatar.breed}
            p2Breed={roomData.p2_avatar.breed}
            showTrophy={
              roomData.p1_dama_wins +
                roomData.p2_dama_wins +
                roomData.p1_snakes_wins +
                roomData.p2_snakes_wins >
              0
            }
            size={218}
          />
        </div>

        {/* Highlighted Room Code Sticker Badge with "Copied!" Pop */}
        <button
          type="button"
          className={`room-code-hero-badge sticker-press ${
            copied ? 'copied-pop' : ''
          }`}
          onClick={handleCopyCode}
          title="Tap to copy Room Code"
        >
          <span className="room-code-caption">ROOM CODE</span>
          <span className="room-code-big">{roomData.room_code}</span>
          <span className="room-code-copy-tag">
            <CopyIcon size={13} />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </span>
        </button>

        {/* Centered Flow Panel */}
        <div className="menu-flow-card">
          {flowStep === 'idle' && (
            <button
              type="button"
              className="vibrant-play-btn sticker-press"
              onClick={() => setFlowStep('role')}
            >
              <span>Play Game</span>
              <PawIcon size={19} />
            </button>
          )}

          {flowStep === 'role' && (
            <div className="flow-step-panel anim-fade-scale">
              <div className="flow-panel-header">
                <button
                  type="button"
                  className="flow-back-btn sticker-press"
                  onClick={() => setFlowStep('idle')}
                  aria-label="Back"
                >
                  <ArrowBackIcon size={16} />
                </button>
                <span className="flow-panel-title">Choose Your Role</span>
                <span className="flow-back-spacer" />
              </div>

              <div className="role-buttons-grid">
                <button
                  type="button"
                  className="role-choice-btn host-role sticker-press"
                  onClick={handleChooseHost}
                >
                  <CatAvatarSvg
                    breed={roomData.p1_avatar.breed}
                    accessory="crown"
                    size={46}
                    animateIdle
                  />
                  <span className="role-main-label">Host / Inviter</span>
                  <span className="role-sub-label">Share code &amp; pick game</span>
                </button>

                <button
                  type="button"
                  className="role-choice-btn join-role sticker-press"
                  onClick={handleChooseJoin}
                >
                  <CatAvatarSvg
                    breed={roomData.p2_avatar.breed}
                    accessory="sakura"
                    size={46}
                    animateIdle
                  />
                  <span className="role-main-label">Invited</span>
                  <span className="role-sub-label">Enter partner&apos;s code</span>
                </button>
              </div>
            </div>
          )}

          {flowStep === 'host' && (
            <div className="flow-step-panel anim-fade-scale">
              <div className="flow-panel-header">
                <button
                  type="button"
                  className="flow-back-btn sticker-press"
                  onClick={() => setFlowStep('role')}
                  aria-label="Back to roles"
                >
                  <ArrowBackIcon size={16} />
                </button>
                <span className="flow-panel-title">
                  {partnerReady ? 'Lovey Connected!' : 'Host Lobby'}
                </span>
                <span className="flow-back-spacer" />
              </div>

              {!partnerReady ? (
                <div className="waiting-box">
                  <div className="cat-loader-bob">
                    <CatAvatarSvg
                      breed={roomData.p1_avatar.breed}
                      accessory={roomData.p1_avatar.accessory}
                      size={52}
                      happySquint
                    />
                  </div>
                  <p className="waiting-text">
                    Waiting for your lovey to join{' '}
                    <strong>{roomData.room_code}</strong>
                    <span className="waiting-dots" aria-hidden="true">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </p>
                  <button
                    type="button"
                    className="solo-bypass-btn sticker-press"
                    onClick={() => setHostOverrideReady(true)}
                  >
                    Play on 1 Phone / Pick Game Now
                  </button>
                </div>
              ) : (
                <div className="host-game-picker">
                  <div className="status-pill-banner success">
                    <CheckCircleIcon size={15} />
                    <span>
                      {p2Online
                        ? `${roomData.p2_avatar.name} is ready!`
                        : 'Select a game to launch'}
                    </span>
                  </div>
                  <div className="role-buttons-grid">
                    <button
                      type="button"
                      className="game-pick-btn dama-pick sticker-press"
                      onClick={() =>
                        onHostLaunchGame('dama', !p2Online && hostOverrideReady)
                      }
                    >
                      <CrownIcon size={28} />
                      <span className="role-main-label">Cat Dama</span>
                      <span className="role-sub-label">Filipino Checkers</span>
                    </button>

                    <button
                      type="button"
                      className="game-pick-btn snakes-pick sticker-press"
                      onClick={() =>
                        onHostLaunchGame(
                          'snakes',
                          !p2Online && hostOverrideReady
                        )
                      }
                    >
                      <SnakeLadderIcon size={28} />
                      <span className="role-main-label">Snakes &amp; Ladders</span>
                      <span className="role-sub-label">100-Tile Race</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {flowStep === 'join' && (
            <div className="flow-step-panel anim-fade-scale">
              <div className="flow-panel-header">
                <button
                  type="button"
                  className="flow-back-btn sticker-press"
                  onClick={() => setFlowStep('role')}
                  aria-label="Back to roles"
                >
                  <ArrowBackIcon size={16} />
                </button>
                <span className="flow-panel-title">Join Partner&apos;s Room</span>
                <span className="flow-back-spacer" />
              </div>

              {joinStatus !== 'success' ? (
                <form className="join-code-form" onSubmit={handleJoinSubmit}>
                  <input
                    type="text"
                    className="join-code-input"
                    value={joinInputCode}
                    maxLength={12}
                    placeholder="ENTER CODE (e.g. LOVEY)"
                    onInput={(e) => {
                      setJoinStatus('idle');
                      setJoinInputCode(
                        (e.currentTarget as HTMLInputElement).value.toUpperCase()
                      );
                    }}
                  />
                  <button
                    type="submit"
                    className="vibrant-play-btn compact sticker-press"
                    disabled={joinStatus === 'checking'}
                  >
                    <span>
                      {joinStatus === 'checking' ? 'Checking...' : 'Join Room'}
                    </span>
                    <PawIcon size={16} />
                  </button>

                  {joinStatus === 'failed' && (
                    <div className="status-pill-banner error">
                      <AlertCircleIcon size={15} />
                      <span>Room not found—check the code with your Host!</span>
                    </div>
                  )}
                </form>
              ) : (
                <div className="waiting-box">
                  <div className="status-pill-banner success">
                    <CheckCircleIcon size={15} />
                    <span>Joined Room {roomData.room_code}!</span>
                  </div>
                  <div className="cat-loader-bob">
                    <CatAvatarSvg
                      breed={roomData.p2_avatar.breed}
                      accessory={roomData.p2_avatar.accessory}
                      size={52}
                      happySquint
                    />
                  </div>
                  <p className="waiting-text">
                    Waiting for <strong>{roomData.p1_avatar.name}</strong> to
                    pick a game
                    <span className="waiting-dots" aria-hidden="true">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="menu-bottom-caption">
        <span>Made with love for two</span>
      </footer>
    </section>
  );
}
