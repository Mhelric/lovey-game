import { useState } from 'preact/hooks';
import {
  CatAccessoryId,
  CatAvatarConfig,
  CatBreedId,
  PlayerSlot,
} from '../types/arcade';
import {
  CAT_ACCESSORIES,
  CAT_BREEDS,
  CatAvatarSvg,
} from './CatAvatarSvg';
import { normalizeRoomCode } from '../services/supabaseService';

interface CatCustomizerModalProps {
  isOpen: boolean;
  roomCode: string;
  mySlot: PlayerSlot;
  currentAvatar: CatAvatarConfig;
  onSave: (
    newRoomCode: string,
    newSlot: PlayerSlot,
    newAvatar: CatAvatarConfig
  ) => void;
  onClose: () => void;
}

export function CatCustomizerModal({
  isOpen,
  roomCode,
  mySlot,
  currentAvatar,
  onSave,
  onClose,
}: CatCustomizerModalProps) {
  const [draftRoom, setDraftRoom] = useState(roomCode);
  const [draftSlot, setDraftSlot] = useState<PlayerSlot>(mySlot);
  const [draftName, setDraftName] = useState(currentAvatar.name);
  const [draftBreed, setDraftBreed] = useState<CatBreedId>(currentAvatar.breed);
  const [draftAccessory, setDraftAccessory] = useState<CatAccessoryId>(
    currentAvatar.accessory
  );

  if (!isOpen) return null;

  const handleSave = (e: Event) => {
    e.preventDefault();
    const cleanRoom = normalizeRoomCode(draftRoom);
    const cleanName = draftName.trim().slice(0, 14) || (draftSlot === 'p1' ? 'Lovey 1' : 'Lovey 2');
    onSave(cleanRoom, draftSlot, {
      name: cleanName,
      breed: draftBreed,
      accessory: draftAccessory,
    });
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Customize Cat & Couple Room">
      <form className="modal-card" onSubmit={handleSave}>
        <div className="modal-header">
          <div className="modal-preview-badge">
            <CatAvatarSvg
              breed={draftBreed}
              accessory={draftAccessory}
              size={52}
              animateIdle
            />
          </div>
          <div className="modal-title-group">
            <h2 className="modal-title">Cat Avatar & Couple Lobby</h2>
            <p className="modal-subtitle">
              Syncs live with your partner via Supabase 🐾
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Room Code + Player Slot Row */}
        <div className="modal-row-two">
          <label className="field-label">
            <span>Room Code</span>
            <input
              type="text"
              className="text-input"
              value={draftRoom}
              maxLength={12}
              onInput={(e) =>
                setDraftRoom((e.currentTarget as HTMLInputElement).value.toUpperCase())
              }
              placeholder="LOVEY"
            />
          </label>

          <div className="field-label">
            <span>Your Seat</span>
            <div className="slot-toggle-group">
              <button
                type="button"
                className={`slot-btn ${draftSlot === 'p1' ? 'active-p1' : ''}`}
                onClick={() => setDraftSlot('p1')}
              >
                P1 (Pink)
              </button>
              <button
                type="button"
                className={`slot-btn ${draftSlot === 'p2' ? 'active-p2' : ''}`}
                onClick={() => setDraftSlot('p2')}
              >
                P2 (Amber)
              </button>
            </div>
          </div>
        </div>

        {/* Cat Nickname */}
        <label className="field-label">
          <span>Your Cat Nickname</span>
          <input
            type="text"
            className="text-input"
            value={draftName}
            maxLength={14}
            onInput={(e) =>
              setDraftName((e.currentTarget as HTMLInputElement).value)
            }
            placeholder="Enter nickname..."
          />
        </label>

        {/* 8 Cat Breeds Grid */}
        <div className="field-label">
          <span>Choose Cat Breed (8 Breeds)</span>
          <div className="breed-grid">
            {CAT_BREEDS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`breed-option ${draftBreed === b.id ? 'selected' : ''}`}
                onClick={() => setDraftBreed(b.id)}
              >
                <CatAvatarSvg
                  breed={b.id}
                  accessory={draftBreed === b.id ? draftAccessory : 'none'}
                  size={30}
                  animateIdle={false}
                />
                <span className="breed-name">{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5 Accessories Row */}
        <div className="field-label">
          <span>Accessory</span>
          <div className="accessory-row">
            {CAT_ACCESSORIES.map((acc) => (
              <button
                key={acc.id}
                type="button"
                className={`acc-option ${draftAccessory === acc.id ? 'selected' : ''}`}
                onClick={() => setDraftAccessory(acc.id)}
              >
                <span className="acc-icon">{acc.icon}</span>
                <span className="acc-label">{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button type="submit" className="save-lobby-btn">
            Save & Sync to Room 💕
          </button>
        </div>
      </form>
    </div>
  );
}
