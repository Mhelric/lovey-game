import { useEffect, useRef, useState } from 'preact/hooks';
import {
  CatAvatarConfig,
  FloatingReaction,
  PlayerSlot,
} from '../types/arcade';
import { CatAvatarSvg } from './CatAvatarSvg';
import {
  ChatBubbleIcon,
  CloseIcon,
  HeartIcon,
} from './ArcadeIcons';

interface QuickChatBarProps {
  messages: FloatingReaction[];
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  partnerOnline?: boolean;
  onSendReaction: (content: string, kind: 'emoji' | 'chat') => void;
}

function formatChatTime(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Real Couple's Chat Inbox (No preset reactions or quick notes).
 * Displays a live scrollable message thread with cat avatars, message bubbles,
 * timestamps, unread badge, and persistent chat input.
 */
export function QuickChatBar({
  messages,
  mySlot,
  p1Avatar,
  p2Avatar,
  partnerOnline = false,
  onSendReaction,
}: QuickChatBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [lastReadCount, setLastReadCount] = useState(messages.length);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const chatMessages = messages.filter((m) => m.kind === 'chat');
  const unreadCount = sheetOpen
    ? 0
    : Math.max(0, chatMessages.length - lastReadCount);

  useEffect(() => {
    if (sheetOpen) {
      setLastReadCount(chatMessages.length);
      window.requestAnimationFrame(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [sheetOpen, chatMessages.length]);

  const handleCustomSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = customText.trim().slice(0, 120);
    if (!trimmed) return;
    onSendReaction(trimmed, 'chat');
    setCustomText('');
  };

  const partnerAvatar = mySlot === 'p1' ? p2Avatar : p1Avatar;

  return (
    <>
      {/* Bottom-Right Cat Messenger Trigger Button with Unread Badge */}
      <button
        type="button"
        className="fab-trigger-btn sticker-press"
        onClick={() => setSheetOpen(true)}
        aria-label="Open Chat Inbox"
        title="Open Chat Inbox"
      >
        <ChatBubbleIcon size={24} />
        {unreadCount > 0 && (
          <span className="chat-unread-badge">{unreadCount}</span>
        )}
      </button>

      {/* Real Chat Inbox Modal Sheet */}
      {sheetOpen && (
        <div
          className="chat-sheet-backdrop"
          onClick={() => setSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Couple Chat Inbox"
        >
          <div
            className="chat-bottom-sheet chat-inbox-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inbox Header with Partner Avatar & Online Status */}
            <div className="chat-sheet-header inbox-header">
              <div className="inbox-partner-info">
                <div className="inbox-avatar-wrap">
                  <CatAvatarSvg
                    breed={partnerAvatar.breed}
                    accessory={partnerAvatar.accessory}
                    size={32}
                    animateIdle={false}
                  />
                  <span
                    className={`online-dot ${partnerOnline ? 'online' : ''}`}
                  />
                </div>
                <div className="inbox-title-col">
                  <span className="chat-sheet-title">Chat Inbox</span>
                  <span className="inbox-sub-status">
                    {partnerOnline
                      ? `${partnerAvatar.name} is online`
                      : `Room chat with ${partnerAvatar.name}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cozy-close-btn"
                onClick={() => setSheetOpen(false)}
                aria-label="Close chat inbox"
              >
                <CloseIcon size={15} />
              </button>
            </div>

            {/* Scrollable Message Thread */}
            <div className="chat-inbox-thread">
              {chatMessages.length === 0 ? (
                <div className="chat-inbox-empty">
                  <CatAvatarSvg
                    breed={partnerAvatar.breed}
                    accessory={partnerAvatar.accessory}
                    size={46}
                    happySquint
                  />
                  <p className="chat-empty-title">No messages yet!</p>
                  <p className="chat-empty-sub">
                    Send a message below to chat with your lovey ♥
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.sender === mySlot;
                  const senderAv = msg.sender === 'p1' ? p1Avatar : p2Avatar;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-msg-row ${
                        isMine ? 'mine' : 'partner'
                      }`}
                    >
                      <div className="chat-msg-avatar">
                        <CatAvatarSvg
                          breed={senderAv.breed}
                          accessory={senderAv.accessory}
                          size={26}
                          animateIdle={false}
                        />
                      </div>
                      <div className="chat-msg-bubble">
                        <div className="chat-msg-meta">
                          <span className="chat-msg-sender">
                            {isMine ? 'You' : senderAv.name}
                          </span>
                          <span className="chat-msg-time">
                            {formatChatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="chat-msg-text">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Message Input Bar */}
            <form className="chat-input-row" onSubmit={handleCustomSubmit}>
              <input
                type="text"
                className="chat-text-input"
                value={customText}
                maxLength={120}
                placeholder="Write a message..."
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
