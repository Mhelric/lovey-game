import { useState } from 'preact/hooks';
import {
  CatAccessoryId,
  CatAvatarConfig,
  CatBreedId,
} from '../types/arcade';
import {
  CAT_ACCESSORIES,
  CAT_BREEDS,
  CatAvatarSvg,
} from './CatAvatarSvg';
import {
  AccessoryBadgeIcon,
  CloseIcon,
  PawIcon,
} from './ArcadeIcons';
import { playTapPop } from '../services/soundEffects';

interface Player2SetupModalProps {
  isOpen: boolean;
  currentAvatar: CatAvatarConfig;
  onSave: (avatar: CatAvatarConfig) => void;
  onClose: () => void;
}

export function Player2SetupModal({
  isOpen,
  currentAvatar,
  onSave,
  onClose,
}: Player2SetupModalProps) {
  if (!isOpen) return null;

  const [draftName, setDraftName] = useState(currentAvatar.name || 'Lovey 2');
  const [draftBreed, setDraftBreed] = useState<CatBreedId>(currentAvatar.breed || 'calico');
  const [draftAccessory, setDraftAccessory] = useState<CatAccessoryId>(
    currentAvatar.accessory || 'ribbon'
  );

  return (
    <div
      className="modal-backdrop kicked-modal-backdrop p2-setup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="p2-setup-title"
      onClick={onClose}
    >
      <div
        className="one-phone-p2-card anim-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header compact">
          <div className="modal-title-group">
            <h3 id="p2-setup-title" className="modal-title">
              Player 2 (1-Phone Mode)
            </h3>
            <p className="modal-subtitle">
              Choose nickname &amp; avatar for your partner
            </p>
          </div>
          <button
            type="button"
            className="cozy-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Live Cat Preview Ring */}
        <div className="p2-setup-hero-ring">
          <CatAvatarSvg
            breed={draftBreed}
            accessory={draftAccessory}
            size={64}
            animateIdle
          />
        </div>

        {/* Name Input */}
        <div className="p2-setup-input-wrap">
          <input
            type="text"
            className="cat-hero-name-input p2-name-input"
            value={draftName}
            maxLength={14}
            placeholder="Partner's cat name..."
            onInput={(e) =>
              setDraftName((e.currentTarget as HTMLInputElement).value)
            }
          />
        </div>

        {/* Breed Picker */}
        <div className="p2-setup-section">
          <span className="cozy-label">Cat Breed</span>
          <div className="p2-breed-mini-grid">
            {CAT_BREEDS.map((b) => {
              const isSelected = draftBreed === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`p2-breed-mini-tile ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => setDraftBreed(b.id)}
                  title={b.label}
                >
                  <CatAvatarSvg
                    breed={b.id}
                    accessory={isSelected ? draftAccessory : 'none'}
                    size={28}
                    animateIdle={false}
                  />
                  <span className="p2-mini-label">{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessory Picker */}
        <div className="p2-setup-section">
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
                >
                  <AccessoryBadgeIcon accessory={acc.id} size={20} />
                  <span className="cozy-acc-label">{acc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          className="popup-btn-primary sticker-press p2-confirm-btn"
          onClick={() => {
            playTapPop();
            const finalName = draftName.trim().slice(0, 14) || 'Lovey 2';
            onSave({
              name: finalName,
              breed: draftBreed,
              accessory: draftAccessory,
            });
            onClose();
          }}
        >
          <span>Ready to Play!</span>
          <PawIcon size={15} />
        </button>
      </div>
    </div>
  );
}
