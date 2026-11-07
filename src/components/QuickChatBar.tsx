import { useEffect, useRef, useState } from 'preact/hooks';
import {
  CatAvatarConfig,
  FloatingReaction,
  PlayerSlot,
  QUICK_STICKERS,
  ReactionStickerId,
} from '../types/arcade';
import { CatAvatarSvg } from './CatAvatarSvg';
import {
  ChatBubbleIcon,
  CloseIcon,
  HeartIcon,
  ReactionStickerSvg,
} from './ArcadeIcons';

interface QuickChatBarProps {
  messages: FloatingReaction[];
  mySlot: PlayerSlot;
  p1Avatar: CatAvatarConfig;
  p2Avatar: CatAvatarConfig;
  partnerOnline?: boolean;
  isConnected?: boolean;
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
 * Couple's Chat Inbox with Live Thread, Quick Cat Emoticon Stickers,
 * and Clear Solo / Offline Connection Indicator.
 */
export function QuickChatBar({
  messages,
  mySlot,
  p1Avatar,
  p2Avatar,
  partnerOnline = false,
  isConnected = true,
  onSendReaction,
}: QuickChatBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [lastReadCount, setLastReadCount] = useState(messages.length);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Both text messages and sticker reactions appear in the thread
  const displayMessages = messages.filter(
    (m) => m.kind === 'chat' || m.kind === 'emoji'
  );
  const unreadCount = sheetOpen
    ? 0
    : Math.max(0, displayMessages.length - lastReadCount);

  useEffect(() => {
    if (sheetOpen) {
      setLastReadCount(displayMessages.length);
      window.requestAnimationFrame(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [sheetOpen, displayMessages.length]);

  const handleCustomSubmit = (e: Event) => {
    e.preventDefault();
    if (!isConnected) return;
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
                    breed={isConnected ? partnerAvatar.breed : (mySlot === 'p1' ? p1Avatar.breed : p2Avatar.breed)}
                    accessory={isConnected ? partnerAvatar.accessory : (mySlot === 'p1' ? p1Avatar.accessory : p2Avatar.accessory)}
                    size={32}
                    animateIdle={false}
                  />
                  <span
                    className={`online-dot ${
                      isConnected && partnerOnline ? 'online' : ''
                    }`}
                  />
                </div>
                <div className="inbox-title-col">
                  <span className="chat-sheet-title">Chat Inbox</span>
                  <span
                    className={`inbox-sub-status ${
                      !isConnected ? 'solo-status' : ''
                    }`}
                  >
                    {!isConnected
                      ? 'No partner connected (Solo)'
                      : partnerOnline
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
              {displayMessages.length === 0 ? (
                <div className="chat-inbox-empty">
                  <CatAvatarSvg
                    breed={
                      isConnected
                        ? partnerAvatar.breed
                        : mySlot === 'p1'
                        ? p1Avatar.breed
                        : p2Avatar.breed
                    }
                    accessory={
                      isConnected
                        ? partnerAvatar.accessory
                        : mySlot === 'p1'
                        ? p1Avatar.accessory
                        : p2Avatar.accessory
                    }
                    size={46}
                    happySquint={isConnected}
                  />
                  <p className="chat-empty-title">
                    {isConnected ? 'No messages yet!' : 'Not connected yet'}
                  </p>
                  <p className="chat-empty-sub">
                    {isConnected
                      ? 'Send a message or cute emoticon below to chat with your lovey '
                      : 'You do not have a connection established with another user. Share your room code so your partner can join!'}
                  </p>
                </div>
              ) : (
                <>
                  {!isConnected && (
                    <div className="chat-solo-thread-banner">
                      Connection not established • Solo Mode
                    </div>
                  )}
                  {displayMessages.map((msg) => {
                    const isMine = msg.sender === mySlot;
                    const senderAv = msg.sender === 'p1' ? p1Avatar : p2Avatar;
                    const isSticker = QUICK_STICKERS.some(
                      (s) => s.id === msg.content
                    );
                    return (
                      <div
                        key={msg.id}
                        className={`chat-msg-row ${
                          isMine ? 'mine' : 'partner'
                        } ${isSticker ? 'sticker-msg' : ''}`}
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
                          {isSticker ? (
                            <div className="chat-sticker-content">
                              <ReactionStickerSvg
                                id={msg.content as ReactionStickerId}
                                size={36}
                                animated
                              />
                            </div>
                          ) : (
                            <p className="chat-msg-text">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Quick Cat Emoticon Stickers Row */}
            <div className="chat-emoticon-strip" role="group" aria-label="Cat Emoticon Stickers">
              {QUICK_STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className={`chat-emoticon-btn sticker-press ${
                    !isConnected ? 'disabled' : ''
                  }`}
                  onClick={() => {
                    if (!isConnected) return;
                    onSendReaction(sticker.id, 'emoji');
                  }}
                  disabled={!isConnected}
                  title={sticker.label}
                  aria-label={sticker.label}
                >
                  <ReactionStickerSvg id={sticker.id} size={24} animated={false} />
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form className="chat-input-row" onSubmit={handleCustomSubmit}>
              <input
                type="text"
                className="chat-text-input"
                value={customText}
                maxLength={120}
                placeholder={
                  isConnected
                    ? 'Write a message...'
                    : 'Connect with partner to chat...'
                }
                disabled={!isConnected}
                onInput={(e) =>
                  setCustomText((e.currentTarget as HTMLInputElement).value)
                }
              />
              <button
                type="submit"
                className={`chat-send-btn sticker-press ${
                  !isConnected ? 'disabled' : ''
                }`}
                disabled={!isConnected || !customText.trim()}
              >
                <span>Send</span>
                <HeartIcon size={13} />
              </button>
            </form>
            {!isConnected && (
              <div className="chat-solo-warning-note">
                Messaging is disabled while solo. Partner must join to chat!
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
