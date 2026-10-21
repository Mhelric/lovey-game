import { useState } from 'preact/hooks';
import {
  QUICK_CHAT_PRESETS,
  QUICK_STICKERS,
  ReactionStickerId,
} from '../types/arcade';
import {
  ChatBubbleIcon,
  CloseIcon,
  HeartIcon,
  ReactionStickerSvg,
} from './ArcadeIcons';

interface QuickChatBarProps {
  onSendReaction: (content: string, kind: 'emoji' | 'chat') => void;
}

/**
 * Bottom-Right Sticker Trigger Button + Clean Bottom Sheet with Dimmed Backdrop
 * Prevents covering the board during play and gives sticker chips room to breathe.
 */
export function QuickChatBar({ onSendReaction }: QuickChatBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleSendSticker = (id: ReactionStickerId) => {
    onSendReaction(id, 'emoji');
    setSheetOpen(false);
  };

  const handleSendPreset = (msg: string) => {
    onSendReaction(msg, 'chat');
    setSheetOpen(false);
  };

  const handleCustomSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = customText.trim().slice(0, 36);
    if (!trimmed) return;
    onSendReaction(trimmed, 'chat');
    setCustomText('');
    setSheetOpen(false);
  };

  return (
    <>
      {/* Bottom-Right Sticker Trigger Button (>= 44x44px) */}
      <button
        type="button"
        className="fab-trigger-btn sticker-press"
        onClick={() => setSheetOpen(true)}
        aria-label="Open reactions and quick chat"
        title="Reactions & Quick Chat"
      >
        <ChatBubbleIcon size={23} />
      </button>

      {/* Bottom Sheet Modal with Dimmed Backdrop */}
      {sheetOpen && (
        <div
          className="chat-sheet-backdrop"
          onClick={() => setSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Send Reaction or Note"
        >
          <div
            className="chat-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-sheet-header">
              <span className="chat-sheet-title">Send a Reaction or Note</span>
              <button
                type="button"
                className="cozy-close-btn"
                onClick={() => setSheetOpen(false)}
                aria-label="Close chat sheet"
              >
                <CloseIcon size={15} />
              </button>
            </div>

            {/* Big Animated Cat Reaction Stickers */}
            <div className="chat-sheet-stickers">
              {QUICK_STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className="sheet-sticker-btn sticker-press"
                  onClick={() => handleSendSticker(sticker.id)}
                  aria-label={sticker.label}
                  title={sticker.label}
                >
                  <ReactionStickerSvg id={sticker.id} size={34} animated />
                </button>
              ))}
            </div>

            {/* Plum-Outlined Sticker Phrase Chips */}
            <div className="preset-chips">
              {QUICK_CHAT_PRESETS.map((msg) => (
                <button
                  key={msg}
                  type="button"
                  className="preset-chip sticker-press"
                  onClick={() => handleSendPreset(msg)}
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Custom Note Input Row */}
            <form className="chat-input-row" onSubmit={handleCustomSubmit}>
              <input
                type="text"
                className="chat-text-input"
                value={customText}
                maxLength={36}
                placeholder="Write a sweet note..."
                onInput={(e) =>
                  setCustomText((e.currentTarget as HTMLInputElement).value)
                }
              />
              <button type="submit" className="chat-send-btn sticker-press">
                <span>Send</span>
                <HeartIcon size={13} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
