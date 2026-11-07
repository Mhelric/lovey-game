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

              {/* Preferences (No Room Code here — Room Code is on Homescreen!) */}
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
              </div>

              {/* Turn Timer Section (Host Editable) */}
              {isHost && (
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

              {/* Game Mode & Snakes Board Size Selector (Host Only) */}
              {isHost ? (
                <div className="cozy-section">
                  <span className="cozy-label">Switch Game Mode</span>
                  <div className="match-mode-grid">
                    <button
                      type="button"
                      className={`match-mode-card ${
                        currentMode === 'dama' ? 'active' : ''
                      }`}
                      onClick={() => onHostSwitchGame('dama', snakesMaxTile)}
                    >
                      <CrownIcon size={20} />
                      <span>Cat Dama</span>
                    </button>
                    <button
                      type="button"
                      className={`match-mode-card ${
                        currentMode === 'doodle' ? 'active' : ''
                      }`}
                      onClick={() => onHostSwitchGame('doodle')}
                    >
                      <DoodleClashIcon size={20} />
                      <span>Doodle Clash</span>
                    </button>
                    <button
                      type="button"
                      className={`match-mode-card ${
                        currentMode === 'snakes' && snakesMaxTile === 100
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => onHostSwitchGame('snakes', 100)}
                    >
                      <SnakeLadderIcon size={20} />
                      <span>Snakes (100)</span>
                    </button>
                    <button
                      type="button"
                      className={`match-mode-card ${
                        currentMode === 'snakes' && snakesMaxTile === 150
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => onHostSwitchGame('snakes', 150)}
                    >
                      <SnakeLadderIcon size={20} />
                      <span>Snakes (150)</span>
                    </button>
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
                      4 Rounds • Secret Word Choices • Speed Scoring
                    </span>
                  </div>
                </div>

                <div className="rules-items-list">
                  <RuleRow
                    color="purple"
                    icon={<DoodleClashIcon size={16} />}
                    title="Take Turns Drawing &amp; Guessing"
                    desc="Players alternate roles each round across 4 rounds. The Drawer selects 1 of 3 secret words to sketch!"
                  />
                  <RuleRow
                    color="sky"
                    icon={<LightbulbIcon size={16} />}
                    title="Letter Hints Over Time"
                    desc="Word length is masked with blanks. As the 50s round timer counts down, hint letters unlock automatically to help the Guesser!"
                  />
                  <RuleRow
                    color="gold"
                    icon={<SparkleIcon size={16} />}
                    title="Co-op Scoring Bonanza"
                    desc="The Guesser earns up to 300 points for fast guesses, and the Drawer earns a 150-point bonus when their partner guesses correctly!"
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

        {/* Pinned Primary Action Button */}
        <div className="cozy-modal-footer">
          <button type="submit" className="cozy-btn-primary">
            Save My Cat Profile
          </button>
        </div>
      </form>
    </div>
  );
}
