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
} from './ArcadeIcons';
import { normalizeRoomCode } from '../services/supabaseService';

interface CatCustomizerModalProps {
  isOpen: boolean;
  isInGame: boolean;
  roomCode: string;
  mySlot: PlayerSlot;
  currentMode: GameMode;
  currentAvatar: CatAvatarConfig;
  muted: boolean;
  passAndPlay: boolean;
  onToggleMute: () => void;
  onTogglePassAndPlay: () => void;
  onHostSwitchGame: (mode: GameMode) => void;
  onHostResetMatch: () => void;
  onOpenTutorial: () => void;
  onExitToMenu: () => void;
  onSave: (
    newRoomCode: string,
    newSlot: PlayerSlot,
    newAvatar: CatAvatarConfig
  ) => void;
  onClose: () => void;
}

type SettingsTabId = 'profile' | 'match' | 'rules';

export function CatCustomizerModal({
  isOpen,
  isInGame,
  roomCode,
  mySlot,
  currentMode,
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
  const [draftRoom, setDraftRoom] = useState(roomCode);
  const [draftSlot, setDraftSlot] = useState<PlayerSlot>(mySlot);
  const [draftName, setDraftName] = useState(currentAvatar.name);
  const [draftBreed, setDraftBreed] = useState<CatBreedId>(currentAvatar.breed);
  const [draftAccessory, setDraftAccessory] = useState<CatAccessoryId>(
    currentAvatar.accessory
  );
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftRoom(roomCode);
      setDraftSlot(mySlot);
      setDraftName(currentAvatar.name);
      setDraftBreed(currentAvatar.breed);
      setDraftAccessory(currentAvatar.accessory);
      setShowAbout(false);
    }
  }, [isOpen, roomCode, mySlot, currentAvatar]);

  if (!isOpen) return null;

  const isHost = mySlot === 'p1';
  const currentBreedLabel =
    CAT_BREEDS.find((b) => b.id === draftBreed)?.label ?? 'Strawberry';

  const handleSave = (e: Event) => {
    e.preventDefault();
    const cleanRoom = normalizeRoomCode(draftRoom);
    const cleanName =
      draftName.trim().slice(0, 14) ||
      (draftSlot === 'p1' ? 'Lovey 1' : 'Lovey 2');
    onSave(cleanRoom, draftSlot, {
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
              Profile
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
                    placeholder="Cat nickname..."
                    aria-label="Cat Nickname"
                  />
                  <span className="cat-hero-sub">
                    {currentBreedLabel} •{' '}
                    {isHost ? 'Host (P1)' : 'Invited (P2)'}
                  </span>
                </div>
              </div>

              {/* Cat Breed Picker (Soft Shadow Tiles + Corner Checkmark Badge) */}
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

              {/* Icon-Only Accessory Picker (Consistent Monoline Icons) */}
              <div className="cozy-section">
                <span className="cozy-label">Accessory</span>
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
                        <AccessoryBadgeIcon accessory={acc.id} size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'match' && (
            <div className="cozy-tab-pane">
              {/* Calm Single-Tint Top Chips with Status Dots */}
              <div className="cozy-section">
                <span className="cozy-label">Preferences</span>
                <div className="cozy-chip-row">
                  <button
                    type="button"
                    className="cozy-chip"
                    onClick={onToggleMute}
                  >
                    <span
                      className={`chip-dot ${!muted ? 'on' : 'off'}`}
                      aria-hidden="true"
                    />
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

              {/* Room Code Field (Full Width, Zero Cutoff) */}
              <div className="cozy-section">
                <label className="cozy-label" htmlFor="settings-room-code">
                  Room Code
                </label>
                <input
                  id="settings-room-code"
                  type="text"
                  className="cozy-input"
                  value={draftRoom}
                  maxLength={12}
                  disabled={isInGame && !isHost}
                  onInput={(e) =>
                    setDraftRoom(
                      (
                        e.currentTarget as HTMLInputElement
                      ).value.toUpperCase()
                    )
                  }
                  placeholder="LOVEY"
                />
              </div>

              {/* Game Mode Segmented Toggle (Host Only) */}
              {isHost ? (
                <div className="cozy-section">
                  <span className="cozy-label">Game Mode</span>
                  <div className="segmented-toggle" role="group">
                    <button
                      type="button"
                      className={`seg-option ${
                        currentMode === 'dama' ? 'active' : ''
                      }`}
                      onClick={() => onHostSwitchGame('dama')}
                    >
                      Cat Dama
                    </button>
                    <button
                      type="button"
                      className={`seg-option ${
                        currentMode === 'snakes' ? 'active' : ''
                      }`}
                      onClick={() => onHostSwitchGame('snakes')}
                    >
                      Snakes &amp; Ladders
                    </button>
                  </div>
                </div>
              ) : (
                <p className="cozy-subtle-note">
                  Connected as Invited Partner. Only the Host can switch games.
                </p>
              )}

              {/* Subtle Separated Tertiary / Danger Actions at Bottom of Match Tab */}
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
                    Exit Game
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="cozy-tab-pane">
              <div className="cozy-rules-card">
                <h3 className="cozy-rules-heading">Cat Dama (Filipino Rules)</h3>
                <ul className="cozy-rules-list">
                  <li>
                    <strong>Step Forward:</strong> Normal cats move 1 square
                    diagonally forward onto empty pink tiles.
                  </li>
                  <li>
                    <strong>Forward &amp; Backward Jumps:</strong> Normal cats
                    capture rival cats both forward and backward.
                  </li>
                  <li>
                    <strong>Mayor Rule:</strong> Captures are mandatory—always
                    take the path that captures the most cats!
                  </li>
                  <li>
                    <strong>Flying Dama King:</strong> Reach the back row to
                    slide and jump any distance diagonally.
                  </li>
                </ul>
              </div>

              <div className="cozy-rules-card">
                <h3 className="cozy-rules-heading">Snakes &amp; Ladders</h3>
                <ul className="cozy-rules-list">
                  <li>
                    <strong>100-Tile Race:</strong> Tap the dice button below
                    the board to hop along; ladders climb up and snakes slide
                    down.
                  </li>
                  <li>
                    <strong>Lucky 6:</strong> Rolling a 6 gives you a bonus
                    roll.
                  </li>
                  <li>
                    <strong>Exact 100:</strong> Overshooting tile 100 bounces
                    your cat backward.
                  </li>
                </ul>
              </div>

              <div className="cozy-rules-card">
                <h3 className="cozy-rules-heading">Mystery Twist Tiles</h3>
                <ul className="cozy-rules-list">
                  <li>
                    Every board hides <strong>4 purple sparkle tiles</strong>.
                    Land on one to trigger a surprise:
                  </li>
                  <li>
                    <strong>Catnip Boost:</strong> Jump forward +3 tiles.
                  </li>
                  <li>
                    <strong>Snake Shield:</strong> Blocks the next snake you
                    land on.
                  </li>
                  <li>
                    <strong>Lucky Paw:</strong> Earn an extra roll.
                  </li>
                  <li>
                    <strong>Switcheroo:</strong> Swap places with your partner
                    (or hop +2 if a swap isn't possible).
                  </li>
                </ul>
              </div>

              {/* Minimal 1-Line Collapsible About Link */}
              <div className="cozy-about-wrap">
                <button
                  type="button"
                  className="about-link-btn"
                  onClick={() => setShowAbout((s) => !s)}
                >
                  {showAbout
                    ? 'Hide About'
                    : 'About • Crafted by Mhelric'}
                </button>
                {showAbout && (
                  <p className="cozy-about-text">
                    Cozy couple&apos;s board game arcade. Ephemeral match states
                    sync privately via your room code.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Primary Action Button */}
        <div className="cozy-modal-footer">
          <button type="submit" className="cozy-btn-primary">
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
