import { useState } from 'preact/hooks';
import { QUICK_CHAT_PRESETS, QUICK_EMOJIS } from '../types/arcade';

interface QuickChatBarProps {
  onSendReaction: (content: string, kind: 'emoji' | 'chat') => void;
}

export function QuickChatBar({ onSendReaction }: QuickChatBarProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleSendPreset = (msg: string) => {
    onSendReaction(msg, 'chat');
    setChatOpen(false);
  };

  const handleCustomSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = customText.trim().slice(0, 36);
    if (!trimmed) return;
    onSendReaction(trimmed, 'chat');
    setCustomText('');
    setChatOpen(false);
  };

  return (
    <footer className="bottom-bar-wrapper">
      {chatOpen && (
        <div className="quick-chat-drawer" role="region" aria-label="Quick Couple Chat">
          <div className="preset-chips">
            {QUICK_CHAT_PRESETS.map((msg) => (
              <button
                key={msg}
                type="button"
                className="preset-chip"
                onClick={() => handleSendPreset(msg)}
              >
                {msg}
              </button>
            ))}
          </div>
          <form className="chat-input-row" onSubmit={handleCustomSubmit}>
            <input
              type="text"
              className="chat-text-input"
              value={customText}
              maxLength={36}
              placeholder="Send a cute note..."
              onInput={(e) =>
                setCustomText((e.currentTarget as HTMLInputElement).value)
              }
            />
            <button type="submit" className="chat-send-btn">
              Send 💌
            </button>
          </form>
        </div>
      )}

      <div className="bottom-bar" aria-label="Quick Couple Reactions">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-btn"
            onClick={() => onSendReaction(emoji, 'emoji')}
            aria-label={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          className={`emoji-btn chat-toggle-btn ${chatOpen ? 'active' : ''}`}
          onClick={() => setChatOpen((prev) => !prev)}
          aria-label="Toggle quick chat bubble drawer"
        >
          💬
        </button>
      </div>
    </footer>
  );
}
