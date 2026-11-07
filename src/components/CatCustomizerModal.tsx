import { useEffect, useState } from 'preact/hooks';
import {
  CatAccessoryId,
  CatAvatarConfig,
  CatBreedId,
  GameMode,
  PlayerSlot,
} from '../types/arcade';
import {
  CAT_ACCESSORIES,
  CAT_BREEDS,
  CatAvatarSvg,
} from './CatAvatarSvg';
import {
  AccessoryBadgeIcon,
  CloseIcon,
  CrownIcon,
  DiceFaceSvg,
  DoodleClashIcon,
  DoubleDiceIcon,
  LightbulbIcon,
  PawIcon,
  PowerupIllustrationSvg,
  SnakeLadderIcon,
  SoundIcon,
  SparkleIcon,
} from './ArcadeIcons';
import { SnakesMaxTile } from '../engines/snakesEngine';
import {
  getMasterVolume,
  playTapPop,
  setMasterVolume,
} from '../services/soundEffects';

interface CatCustomizerModalProps {
  isOpen: boolean;
  isInGame: boolean;
  mySlot: PlayerSlot;
  currentMode: GameMode;
  snakesMaxTile: SnakesMaxTile;
  currentAvatar: CatAvatarConfig;
  muted: boolean;
  passAndPlay: boolean;
  timerEnabled?: boolean;
  timerDurationSec?: number;
  onToggleMute: () => void;
  onTogglePassAndPlay: () => void;
  onToggleTimer?: () => void;
  onChangeTimerDuration?: (sec: number) => void;
  onHostSwitchGame: (mode: GameMode, snakesMaxTile?: SnakesMaxTile) => void;
  onHostResetMatch: () => void;
  onOpenTutorial: () => void;
  onExitToMenu: () => void;
  onLeaveJoinedRoom: () => void;
  isPartnerInRoom?: boolean;
  partnerName?: string;
  onHostKickPlayer?: () => void;
  onSave: (newAvatar: CatAvatarConfig) => void;
  onClose: () => void;
}

type SettingsTabId = 'profile' | 'match' | 'rules';

function RuleRow({
  color,
  icon,
  title,
  desc,
}: {
  color: string;
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="rule-item-row">
      <span className={`rule-icon-badge ${color}`}>{icon}</span>
      <div className="rule-item-text">
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
    </div>
  );
}

const POWERUP_CHIPS = [
  ['boost', 'Catnip Zoomies', '(+4 Tiles)'],
  ['shield_gain', 'Bubble Shield', '(Blocks Snake)'],
  ['extra_roll', 'Lucky Paw', '(Extra Roll)'],
  ['swap', 'Switcheroo', '(Swap Places)'],
] as const;

export function CatCustomizerModal({
  isOpen,
  isInGame,
  mySlot,
  currentMode,
  snakesMaxTile,
  currentAvatar,
  muted,
  passAndPlay,
  timerEnabled = false,
  timerDurationSec = 20,
  onToggleMute,
  onTogglePassAndPlay,
  onToggleTimer,
  onChangeTimerDuration,
  onHostSwitchGame,
  onHostResetMatch,
  onExitToMenu,
  onLeaveJoinedRoom,
  isPartnerInRoom = false,
  partnerName,
  onHostKickPlayer,
  onSave,
  onClose,
}: CatCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [draftName, setDraftName] = useState(currentAvatar.name);
  const [draftBreed, setDraftBreed] = useState<CatBreedId>(currentAvatar.breed);
  const [draftAccessory, setDraftAccessory] = useState<CatAccessoryId>(
    currentAvatar.accessory
  );
  const [showAbout, setShowAbout] = useState(false);
  const [volume, setVolume] = useState<number>(() => getMasterVolume());
  const [switchConfirmTarget, setSwitchConfirmTarget] = useState<{
    mode: GameMode;
    maxTile?: SnakesMaxTile;
    label: string;
  } | null>(null);

  const handleVolumeChange = (newVal: number) => {
    setMasterVolume(newVal);
    setVolume(newVal);
    playTapPop();
  };

  const handleRequestSwitchGame = (
    mode: GameMode,
    targetMaxTile?: SnakesMaxTile,
    label = mode === 'dama' ? 'Cat Dama' : mode === 'doodle' ? 'Doodle Clash' : `Snakes & Ladders (${targetMaxTile ?? 100})`
  ) => {
    playTapPop();
    if (
      currentMode === mode &&
      (mode !== 'snakes' || snakesMaxTile === (targetMaxTile ?? 100))
    ) {
      return;
    }
    setSwitchConfirmTarget({ mode, maxTile: targetMaxTile, label });
  };

  const handleConfirmSwitchGame = () => {
    if (!switchConfirmTarget) return;
    playTapPop();
    const { mode, maxTile } = switchConfirmTarget;
    setSwitchConfirmTarget(null);
    onHostSwitchGame(mode, maxTile);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setDraftName(currentAvatar.name);
      setDraftBreed(currentAvatar.breed);
      setDraftAccessory(currentAvatar.accessory);
      setShowAbout(false);
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  const isHost = mySlot === 'p1';
  const currentBreedLabel =
    CAT_BREEDS.find((b) => b.id === draftBreed)?.label ?? 'Strawberry';

  const handleSave = (e: Event) => {
    e.preventDefault();
    const cleanName =
      draftName.trim().slice(0, 14) ||
      (mySlot === 'p1' ? 'Lovey 1' : 'Lovey 2');
    onSave({
      name: cleanName,
      breed: draftBreed,
      accessory: draftAccessory,
    });
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Settings and Cat Profile"
    >
      <form className="cozy-settings-modal" onSubmit={handleSave}>
        {/* Top Close Button + Clean Segmented Tab Switcher (Profile | Match | Rules) */}
        <div className="cozy-modal-top">
          <div className="cozy-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profile'}
              className={`cozy-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              My Cat
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'match'}
              className={`cozy-tab ${activeTab === 'match' ? 'active' : ''}`}
              onClick={() => setActiveTab('match')}
            >
              Match
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'rules'}
              className={`cozy-tab ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              Rules
            </button>
          </div>

          <button
            type="button"
            className="cozy-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Scrollable Tab Body (Zero Horizontal Overflow) */}
        <div className="cozy-modal-body">
          {activeTab === 'profile' && (
            <div className="cozy-tab-pane">
              {/* Large Live Cat Preview Star Stage */}
              <div className="cat-hero-preview">
                <div className="cat-hero-avatar-ring">
                  <CatAvatarSvg
                    breed={draftBreed}
                    accessory={draftAccessory}
                    size={68}
                    animateIdle
                  />
                </div>
                <div className="cat-hero-info">
                  <input
                    type="text"
                    className="cat-hero-name-input"
                    value={draftName}
                    maxLength={14}
                    onInput={(e) =>
                      setDraftName((e.currentTarget as HTMLInputElement).value)
                    }
                    placeholder="Your default cat name..."
                    aria-label="Cat Nickname"
                  />
                  <span className="cat-hero-sub">
                    {currentBreedLabel} • Saved on this device
                  </span>
                </div>
              </div>

              {/* Cat Breed Picker */}
              <div className="cozy-section">
                <span className="cozy-label">Cat Breed</span>
                <div className="cozy-breed-grid">
                  {CAT_BREEDS.map((b) => {
                    const isSelected = draftBreed === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        className={`cozy-breed-tile ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => setDraftBreed(b.id)}
                      >
                        {isSelected && (
                          <span className="tile-check-badge" aria-hidden="true">
                            ✓
                          </span>
                        )}
                        <CatAvatarSvg
                          breed={b.id}
                          accessory={isSelected ? draftAccessory : 'none'}
                          size={36}
                          animateIdle={false}
                        />
                        <span className="cozy-breed-name">{b.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outfit / Accessory Picker */}
              <div className="cozy-section">
                <span className="cozy-label">Outfit &amp; Accessory</span>
                <div className="cozy-acc-row">
                  {CAT_ACCESSORIES.map((acc) => {
                    const isSelected = draftAccessory === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        className={`cozy-acc-tile ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => setDraftAccessory(acc.id)}
                        title={acc.label}
                        aria-label={acc.label}
                      >
                        <AccessoryBadgeIcon accessory={acc.id} size={22} />
                        <span className="cozy-acc-label">{acc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'match' && (
            <div className="cozy-tab-pane">
              {/* Role & Device Status */}
              <div className="cozy-section">
                <span className="cozy-label">Current Role</span>
                <div className="match-role-status-card">
                  <CatAvatarSvg
                    breed={draftBreed}
                    accessory={draftAccessory}
                    size={38}
                    animateIdle={false}
                  />
                  <div className="match-role-meta">
                    <span className="match-role-badge">
                      {isHost ? 'Host' : 'Invited'}
                    </span>
                    <span className="match-role-desc">
                      {isHost
                        ? 'You control game selection & board resets'
                        : 'Joined partner room • Host controls game mode'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences (Sound + Volume Slider + Pass-and-Play) */}
              <div className="cozy-section">
                <span className="cozy-label">Preferences</span>
                <div className="cozy-chip-row">
                  <button
                    type="button"
                    className="cozy-chip"
                    onClick={onToggleMute}
                  >
                    <SoundIcon muted={muted} size={16} />
                    <span>Sound {muted ? 'Off' : 'On'}</span>
                  </button>

                  <button
                    type="button"
                    className="cozy-chip"
                    onClick={onTogglePassAndPlay}
                  >
                    <span
                      className={`chip-dot ${passAndPlay ? 'on' : 'off'}`}
                      aria-hidden="true"
                    />
                    <span>{passAndPlay ? '1-Phone Mode' : '2-Phone Live'}</span>
                  </button>
                </div>

                {!muted && (
                  <div className="cozy-volume-control" style={{ marginTop: '10px' }}>
                    <div className="cozy-row-between" style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4a2828' }}>
                        Sound Volume:
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#ff5c8a', fontWeight: 800 }}>
                        {Math.round(volume * 100)}%
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="250"
                      step="5"
                      value={Math.round(volume * 100)}
                      onInput={(e) =>
                        handleVolumeChange(
                          parseInt((e.target as HTMLInputElement).value, 10) / 100
                        )
                      }
                      className="cozy-volume-slider"
                      aria-label="Sound volume slider"
                    />
                  </div>
                )}
              </div>

              {/* Turn Timer Section: ONLY visible on Dama and Snakes during active game play */}
              {isInGame && (currentMode === 'dama' || currentMode === 'snakes') && isHost && (
                <div className="cozy-section">
                  <div className="cozy-row-between">
                    <div>
                      <span className="cozy-label">Turn Timer</span>
                      <p className="cozy-subtle-note">
                        Auto-moves randomly if time runs out
                      </p>
                    </div>
                    <button
                      type="button"
                      className="cozy-chip"
                      onClick={onToggleTimer}
                      aria-label="Toggle Turn Timer"
                    >
                      <span
                        className={`chip-dot ${timerEnabled ? 'on' : 'off'}`}
                        aria-hidden="true"
                      />
                      <span>{timerEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  {timerEnabled && (
                    <div style={{ marginTop: '8px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#4a2828',
                          }}
                        >
                          Duration per Turn:
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <button
                            type="button"
                            className="cozy-step-btn"
                            onClick={() =>
                              onChangeTimerDuration?.(
                                Math.max(10, timerDurationSec - 5)
                              )
                            }
                            disabled={timerDurationSec <= 10}
                            aria-label="Decrease timer duration"
                          >
                            -
                          </button>
                          <span
                            style={{
                              fontWeight: 800,
                              minWidth: '38px',
                              textAlign: 'center',
                              color: '#ff5c8a',
                              fontSize: '0.92rem',
                            }}
                          >
                            {timerDurationSec}s
                          </span>
                          <button
                            type="button"
                            className="cozy-step-btn"
                            onClick={() =>
                              onChangeTimerDuration?.(
                                Math.min(60, timerDurationSec + 5)
                              )
                            }
                            disabled={timerDurationSec >= 60}
                            aria-label="Increase timer duration"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          marginTop: '6px',
                        }}
                      >
                        {[15, 20, 30, 45].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            className={`cozy-timer-chip ${
                              timerDurationSec === sec ? 'active' : ''
                            }`}
                            onClick={() => onChangeTimerDuration?.(sec)}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Game Mode Selector (Host Only) - Arranged exactly like Main Menu */}
              {isHost ? (
                <div className="cozy-section">
                  <span className="cozy-label">Switch Game Mode</span>
                  <div className="game-picker-modal-grid" style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Top Row: Dama and Doodle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className={`match-mode-card ${
                          currentMode === 'dama' ? 'active' : ''
                        }`}
                        onClick={() => handleRequestSwitchGame('dama', snakesMaxTile, 'Cat Dama')}
                      >
                        <CrownIcon size={22} />
                        <span>Cat Dama</span>
                      </button>
                      <button
                        type="button"
                        className={`match-mode-card ${
                          currentMode === 'doodle' ? 'active' : ''
                        }`}
                        onClick={() => handleRequestSwitchGame('doodle', undefined, 'Doodle Clash')}
                      >
                        <DoodleClashIcon size={22} />
                        <span>Doodle Clash</span>
                      </button>
                    </div>

                    {/* Bottom Row: Snakes & Ladders with 100/150 Pills */}
                    <div
                      className={`match-mode-card snakes-settings-card ${
                        currentMode === 'snakes' ? 'active' : ''
                      }`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 8px',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        onClick={() => handleRequestSwitchGame('snakes', snakesMaxTile, `Snakes & Ladders (${snakesMaxTile})`)}
                      >
                        <SnakeLadderIcon size={22} />
                        <span style={{ fontWeight: 800 }}>Snakes &amp; Ladders</span>
                      </div>
                      <div className="snakes-mode-pills" style={{ width: '100%', maxWidth: '220px' }}>
                        <button
                          type="button"
                          className={`snakes-size-pill ${
                            currentMode === 'snakes' && snakesMaxTile === 100 ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestSwitchGame('snakes', 100, 'Snakes & Ladders (100 Tiles)');
                          }}
                        >
                          100 Tiles
                        </button>
                        <button
                          type="button"
                          className={`snakes-size-pill ${
                            currentMode === 'snakes' && snakesMaxTile === 150 ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestSwitchGame('snakes', 150, 'Snakes & Ladders (150 Tiles)');
                          }}
                        >
                          150 Tiles
                        </button>
                      </div>
                    </div>
                  </div>

                  {isPartnerInRoom && onHostKickPlayer && (
                    <button
                      type="button"
                      className="tertiary-text-btn danger"
                      style={{ marginTop: '8px' }}
                      onClick={() => {
                        onClose();
                        onHostKickPlayer();
                      }}
                    >
                      Kick {partnerName || 'Partner'} from Room
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {isInGame && (currentMode === 'dama' || currentMode === 'snakes') && (
                    <div className="cozy-section">
                      <div className="cozy-row-between">
                        <div>
                          <span className="cozy-label">Turn Timer</span>
                          <p className="cozy-subtle-note">
                            {timerEnabled
                              ? `${timerDurationSec}s per turn (Host controlled)`
                              : 'Disabled by Host'}
                          </p>
                        </div>
                        <span
                          className={`cozy-chip ${timerEnabled ? 'active' : ''}`}
                          style={{ cursor: 'default' }}
                        >
                          <span
                            className={`chip-dot ${timerEnabled ? 'on' : 'off'}`}
                            aria-hidden="true"
                          />
                          <span>{timerEnabled ? `${timerDurationSec}s` : 'OFF'}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="cozy-section">
                    <p className="cozy-subtle-note">
                      Connected as Invited. Only the Host can switch games. Your
                      savestate is automatically preserved!
                    </p>
                    <button
                      type="button"
                      className="tertiary-text-btn danger"
                      onClick={() => {
                        onClose();
                        onLeaveJoinedRoom();
                      }}
                    >
                      Leave Room
                    </button>
                  </div>
                </>
              )}

              {/* In-Game Actions */}
              {isInGame && (
                <div className="cozy-danger-footer">
                  {isHost && (
                    <button
                      type="button"
                      className="tertiary-text-btn"
                      onClick={() => {
                        onHostResetMatch();
                        onClose();
                      }}
                    >
                      Reset Board
                    </button>
                  )}
                  <button
                    type="button"
                    className="tertiary-text-btn danger"
                    onClick={() => {
                      onClose();
                      onExitToMenu();
                    }}
                  >
                    Exit to Homescreen
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="cozy-tab-pane rules-tab-pane">
              {/* SECTION 1: CAT DAMA */}
              <div className="rules-section-box dama-theme">
                <div className="rules-section-banner">
                  <CrownIcon size={20} />
                  <div>
                    <h3 className="rules-section-title">
                      Cat Dama (3D Filipino Rules)
                    </h3>
                    <span className="rules-section-sub">
                      Mirrored POV • Mandatory Mayor Combos
                    </span>
                  </div>
                </div>

                <div className="rules-items-list">
                  <RuleRow
                    color="pink"
                    icon={<PawIcon size={16} />}
                    title="Diagonal Step & Mirrored POV"
                    desc="Your cat pieces always start at the bottom of your screen. Normal cats (Tao) step 1 tile diagonally forward."
                  />
                  <RuleRow
                    color="coral"
                    icon={<SparkleIcon size={16} />}
                    title="Forward & Backward Pounce"
                    desc="Normal cats can jump over rival cats both forward AND backward diagonally to eat them!"
                  />
                  <RuleRow
                    color="amber"
                    icon={<CrownIcon size={16} />}
                    title="Mayor Mandatory Max Combo"
                    desc="Captures are mandatory! If multiple capture paths exist, you must pick the path that eats the most pieces."
                  />
                  <RuleRow
                    color="gold"
                    icon={<CrownIcon size={16} />}
                    title="Ascended Winged Dama King"
                    desc="Reach the top back row to evolve into a Royal Winged Dama that slides and jumps any distance diagonally!"
                  />
                </div>
              </div>

              {/* SECTION 2: SNAKES & LADDERS */}
              <div className="rules-section-box snakes-theme">
                <div className="rules-section-banner">
                  <SnakeLadderIcon size={20} />
                  <div>
                    <h3 className="rules-section-title">
                      Snakes &amp; Ladders Race
                    </h3>
                    <span className="rules-section-sub">
                      100 or 150 Tiles • Random Mystery Powerups
                    </span>
                  </div>
                </div>

                <div className="rules-items-list">
                  <RuleRow
                    color="sky"
                    icon={<SnakeLadderIcon size={16} />}
                    title="100-Tile Classic & 150-Tile Marathon"
                    desc="Host can pick 100 tiles or 150 tiles (with extra snakes, ladders, and mystery boxes for longer matches)."
                  />
                  <RuleRow
                    color="mint"
                    icon={<DiceFaceSvg value={6} size={18} />}
                    title="No Bonus Roll on 6 & Exact Finish"
                    desc="Rolling a 6 moves 6 tiles with no free bonus turn. Overshooting the final crown tile bounces your cat back!"
                  />
                  <RuleRow
                    color="purple"
                    icon={<DoubleDiceIcon size={18} />}
                    title="New! Twin Paw 2x Dice (2 Turns)"
                    desc="Hold 2 dice in your paw and roll both at once on a single turn for your next 2 turns!"
                  />

                  {/* Mini Powerup Showcase Grid */}
                  <div className="rules-powerup-grid">
                    {POWERUP_CHIPS.map(([kind, name, desc]) => (
                      <div key={kind} className="rules-powerup-chip">
                        <PowerupIllustrationSvg kind={kind as any} size={26} />
                        <span>
                          <strong>{name}</strong> {desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: DOODLE CLASH */}
              <div className="rules-section-box doodle-theme">
                <div className="rules-section-banner">
                  <DoodleClashIcon size={20} />
                  <div>
                    <h3 className="rules-section-title">
                      Doodle Clash (Draw &amp; Guess Duel)
                    </h3>
                    <span className="rules-section-sub">
                      4 Stages (Easy–Final) • 60s Draw • 3 Guesses
                    </span>
                  </div>
                </div>

                <div className="rules-items-list">
                  <RuleRow
                    color="purple"
                    icon={<DoodleClashIcon size={16} />}
                    title="4 Progressive Stages: Easy → Medium → Hard → Final"
                    desc="Players alternate drawing across 4 escalating rounds. The Drawer has 60 seconds (or taps Done early) to finish their sketch!"
                  />
                  <RuleRow
                    color="sky"
                    icon={<LightbulbIcon size={16} />}
                    title="Sequential Guessing (3 Tries)"
                    desc="Once the Drawer finishes drawing, the Guesser gets 3 tries to guess the secret word (with letter hints after a miss)."
                  />
                  <RuleRow
                    color="gold"
                    icon={<SparkleIcon size={16} />}
                    title="+2 / +1 Point Duel for the Cat Doodle Trophy"
                    desc="If the Guesser gets it right in 3 tries: Guesser +2 pts, Drawer +1 pt. If all 3 tries miss: Drawer +2 pts! Highest score after 4 rounds wins."
                  />
                </div>
              </div>

              {/* Minimal 1-Line Collapsible About Link */}
              <div className="cozy-about-wrap">
                <button
                  type="button"
                  className="about-link-btn"
                  onClick={() => setShowAbout((s) => !s)}
                >
                  {showAbout ? 'Hide About' : 'About • Crafted by Mhelric'}
                </button>
                {showAbout && (
                  <p className="cozy-about-text">
                    Cozy couple&apos;s board game arcade. Character profiles stay
                    saved on your device.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Primary Action Button (Hidden on Rules tab so full height is scrollable on small phones) */}
        {activeTab !== 'rules' && (
          <div className="cozy-modal-footer">
            <button type="submit" className="cozy-btn-primary">
              Save My Cat Profile
            </button>
          </div>
        )}

        {/* Switch Game Confirmation Warning Modal */}
        {switchConfirmTarget && (
          <div
            className="modal-backdrop"
            style={{ zIndex: 120, background: 'rgba(91, 42, 78, 0.65)' }}
            onClick={() => setSwitchConfirmTarget(null)}
          >
            <div
              className="modal-card anim-fade-scale"
              style={{
                maxWidth: '320px',
                padding: '18px 16px',
                textAlign: 'center',
                gap: '10px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  border: '2px solid #5B2A4E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <CrownIcon size={24} />
              </div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '15px', color: '#5B2A4E', fontWeight: 800 }}>
                Switch to {switchConfirmTarget.label}?
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'rgba(91, 42, 78, 0.8)', fontWeight: 600, lineHeight: 1.35 }}>
                Switching to a new game starts a new match and your current game will be <strong>reset, not saved</strong>. (Games are only saved if you leave to the menu).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="cozy-btn-secondary"
                  style={{ height: '38px', borderRadius: '12px', fontSize: '12px' }}
                  onClick={() => setSwitchConfirmTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="vibrant-play-btn sticker-press"
                  style={{ height: '38px', borderRadius: '12px', fontSize: '12px' }}
                  onClick={handleConfirmSwitchGame}
                >
                  <span>Switch Game</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
