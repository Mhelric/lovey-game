import { playTapPop } from '../services/soundEffects';

interface HotspotRoomPanelProps {
  hotspotStatus: 'idle' | 'waiting' | 'connecting' | 'connected' | 'error';
  hotspotError: string | null;
  onStartHotspotHost?: () => void;
  onJoinHotspotHost?: () => void;
  onLeaveHotspotMode?: () => void;
}

export default function HotspotRoomPanel({
  hotspotStatus,
  hotspotError,
  onStartHotspotHost,
  onJoinHotspotHost,
  onLeaveHotspotMode,
}: HotspotRoomPanelProps) {
  return (
    <>
      <div className="room-label-header">
        <span className="room-code-caption">HOTSPOT ROOM</span>
      </div>
      <div className="room-code-main-row">
        <span className="room-code-edit-trigger" style={{ cursor: 'default' }}>
          <strong className="room-code-text">LOVEY</strong>
        </span>
      </div>

      {hotspotStatus === 'connected' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '100%',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2b9348' }}>
            Connected via Hotspot!
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '0.72rem' }}
            onClick={() => {
              playTapPop();
              onLeaveHotspotMode?.();
            }}
          >
            Disconnect Hotspot
          </button>
        </div>
      ) : hotspotStatus === 'waiting' || hotspotStatus === 'connecting' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '100%',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6f4e37' }}>
            {hotspotStatus === 'waiting'
              ? 'Waiting for Lovey on Hotspot...'
              : 'Searching for Host Hotspot...'}
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '0.72rem' }}
            onClick={() => {
              playTapPop();
              onLeaveHotspotMode?.();
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          {hotspotError && (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#d90429',
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {hotspotError}
            </span>
          )}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button
              type="button"
              className="btn-primary sticker-press"
              style={{ flex: 1, padding: '8px 10px', fontSize: '0.78rem' }}
              onClick={() => onStartHotspotHost?.()}
            >
              Host Hotspot
            </button>
            <button
              type="button"
              className="btn-secondary sticker-press"
              style={{ flex: 1, padding: '8px 10px', fontSize: '0.78rem' }}
              onClick={() => onJoinHotspotHost?.()}
            >
              Join Hotspot
            </button>
          </div>
        </div>
      )}
    </>
  );
}
