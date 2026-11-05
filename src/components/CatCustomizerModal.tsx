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
  DoubleDiceIcon,
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
  onToggleMute: () => void;
  onTogglePassAndPlay: () => void;
  onHostSwitchGame: (mode: GameMode, snakesMaxTile?: SnakesMaxTile) => void;
  onHostResetMatch: () => void;
  onOpenTutorial: () => void;
  onExitToMenu: () => void;
  onSave: (newAvatar: CatAvatarConfig) => void;
  onClose: () => void;
}

type SettingsTabId = 'profile' | 'match' | 'rules';

export function CatCustomizerModal({
  isOpen,
  isInGame,
  mySlot,
  currentMode,
  snakesMaxTile,
  currentAvatar,
  muted,
  passAndPlay,
  onToggleMute,
  onTogglePassAndPlay,
  onHostSwitchGame,
  onHostResetMatch,
  onExitToMenu,
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
                </div>
              ) : (
                <p className="cozy-subtle-note">
                  Connected as P-2 (Invited). Only P-1 (Host) can switch games.
                </p>
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
                  <div className="rule-item-row">
                    <span className="rule-icon-badge pink">
                      <PawIcon size={16} />
                    </span>
                    <div className="rule-item-text">
                      <strong>Diagonal Step &amp; Mirrored POV</strong>
                      <p>
                        Your cat pieces always start at the bottom of your
                        screen. Normal cats (<em>Tao</em>) step 1 tile
                        diagonally forward.
                      </p>
                    </div>
                  </div>

                  <div className="rule-item-row">
                    <span className="rule-icon-badge coral">
                      <SparkleIcon size={16} />
                    </span>
                    <div className="rule-item-text">
                      <strong>Forward &amp; Backward Pounce</strong>
                      <p>
                        Normal cats can jump over rival cats both forward AND
                        backward diagonally to eat them!
                      </p>
                    </div>
                  </div>

                  <div className="rule-item-row">
                    <span className="rule-icon-badge amber">
                      <CrownIcon size={16} />
                    </span>
                    <div className="rule-item-text">
                      <strong>Mayor Mandatory Max Combo</strong>
                      <p>
                        Captures are mandatory! If multiple capture paths exist,
                        you must pick the path that eats the most pieces.
                      </p>
                    </div>
                  </div>

                  <div className="rule-item-row">
                    <span className="rule-icon-badge gold">
                      <CrownIcon size={16} />
                    </span>
                    <div className="rule-item-text">
                      <strong>Ascended Winged Dama King</strong>
                      <p>
                        Reach the top back row to evolve into a Royal Winged
                        Dama that slides and jumps any distance diagonally!
                      </p>
                    </div>
                  </div>
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
                  <div className="rule-item-row">
                    <span className="rule-icon-badge sky">
                      <SnakeLadderIcon size={16} />
                    </span>
                    <div className="rule-item-text">
                      <strong>100-Tile Classic &amp; 150-Tile Marathon</strong>
                      <p>
                        Host can pick 100 tiles or 150 tiles (with extra snakes,
                        ladders, and mystery boxes for longer matches).
                      </p>
                    </div>
                  </div>

                  <div className="rule-item-row">
                    <span className="rule-icon-badge mint">
                      <DiceFaceSvg value={6} size={18} />
                    </span>
                    <div className="rule-item-text">
                      <strong>No Bonus Roll on 6 &amp; Exact Finish</strong>
                      <p>
                        Rolling a 6 moves 6 tiles with no free bonus turn.
                        Overshooting the final crown tile bounces your cat back!
                      </p>
                    </div>
                  </div>

                  <div className="rule-item-row">
                    <span className="rule-icon-badge purple">
                      <DoubleDiceIcon size={18} />
                    </span>
                    <div className="rule-item-text">
                      <strong>New! Twin Paw 2x Dice (2 Turns)</strong>
                      <p>
                        Hold 2 dice in your paw and roll both at once on a
                        single turn for your next 2 turns!
                      </p>
                    </div>
                  </div>

                  {/* Mini Powerup Showcase Grid */}
                  <div className="rules-powerup-grid">
                    <div className="rules-powerup-chip">
                      <PowerupIllustrationSvg kind="boost" size={26} />
                      <span>
                        <strong>Catnip Zoomies</strong> (+4 Tiles)
                      </span>
                    </div>
                    <div className="rules-powerup-chip">
                      <PowerupIllustrationSvg kind="shield_gain" size={26} />
                      <span>
                        <strong>Bubble Shield</strong> (Blocks Snake)
                      </span>
                    </div>
                    <div className="rules-powerup-chip">
                      <PowerupIllustrationSvg kind="extra_roll" size={26} />
                      <span>
                        <strong>Lucky Paw</strong> (Extra Roll)
                      </span>
                    </div>
                    <div className="rules-powerup-chip">
                      <PowerupIllustrationSvg kind="swap" size={26} />
                      <span>
                        <strong>Switcheroo</strong> (Swap Places)
                      </span>
                    </div>
                  </div>
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
