import { useEffect, useState } from 'preact/hooks';
import { CoupleRoomRow, MatchHistoryRow } from '../types/arcade';
import { CatAvatarSvg } from './CatAvatarSvg';
import { fetchMatchHistory } from '../services/supabaseService';

interface CoupleScoreboardModalProps {
  isOpen: boolean;
  roomData: CoupleRoomRow;
  onClose: () => void;
  onOpenCustomizer: () => void;
}

export function CoupleScoreboardModal({
  isOpen,
  roomData,
  onClose,
  onOpenCustomizer,
}: CoupleScoreboardModalProps) {
  const [history, setHistory] = useState<MatchHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchMatchHistory(roomData.room_code, 10)
      .then((rows) => setHistory(rows))
      .finally(() => setLoading(false));
  }, [isOpen, roomData.room_code]);

  if (!isOpen) return null;

  const p1Total = (roomData.p1_dama_wins || 0) + (roomData.p1_snakes_wins || 0);
  const p2Total = (roomData.p2_dama_wins || 0) + (roomData.p2_snakes_wins || 0);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Couple Lifetime Scoreboard"
    >
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">🏆 Couple Lifetime Scoreboard</h2>
            <p className="modal-subtitle">
              Room <strong>{roomData.room_code}</strong> • Persistent Match History
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close scoreboard"
          >
            ✕
          </button>
        </div>

        {/* Head-to-Head Cat Comparison Card */}
        <div className="scoreboard-vs-card">
          <div className="score-player-col">
            <div className="cat-badge">
              <CatAvatarSvg
                breed={roomData.p1_avatar.breed}
                accessory={roomData.p1_avatar.accessory}
                size={34}
              />
            </div>
            <span className="score-cat-name">{roomData.p1_avatar.name}</span>
            <span className="score-big-num">{p1Total}</span>
            <span className="score-breakdown">
              👑 {roomData.p1_dama_wins} • 🐍 {roomData.p1_snakes_wins}
            </span>
          </div>

          <div className="score-vs-divider">
            <span className="vs-heart">💕</span>
            <span className="vs-label">VS</span>
          </div>

          <div className="score-player-col">
            <div className="cat-badge">
              <CatAvatarSvg
                breed={roomData.p2_avatar.breed}
                accessory={roomData.p2_avatar.accessory}
                size={34}
              />
            </div>
            <span className="score-cat-name">{roomData.p2_avatar.name}</span>
            <span className="score-big-num">{p2Total}</span>
            <span className="score-breakdown">
              👑 {roomData.p2_dama_wins} • 🐍 {roomData.p2_snakes_wins}
            </span>
          </div>
        </div>

        {/* Recent Matches List */}
        <div className="field-label">
          <span>Recent Matches</span>
          <div className="history-list">
            {loading ? (
              <div className="history-empty">Loading match history... 🐾</div>
            ) : history.length === 0 ? (
              <div className="history-empty">
                No completed matches yet—finish a game to log your first win! 🎉
              </div>
            ) : (
              history.map((item) => {
                const winnerName =
                  item.winner === 'p1'
                    ? item.p1_name
                    : item.winner === 'p2'
                    ? item.p2_name
                    : 'Draw';
                return (
                  <div key={item.id} className="history-row">
                    <span className="history-icon">
                      {item.game_mode === 'dama' ? '👑' : '🐍'}
                    </span>
                    <div className="history-info">
                      <span className="history-winner">
                        {winnerName} won!
                      </span>
                      <span className="history-summary">{item.summary}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ gap: '6px' }}>
          <button
            type="button"
            className="save-lobby-btn"
            style={{ background: '#ff9f1c' }}
            onClick={() => {
              onClose();
              onOpenCustomizer();
            }}
          >
            🎨 Edit Cat Avatar & Room
          </button>
          <button
            type="button"
            className="save-lobby-btn"
            onClick={onClose}
          >
            Back to Game 🐾
          </button>
        </div>
      </div>
    </div>
  );
}
