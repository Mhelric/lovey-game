import { useEffect, useState } from 'preact/hooks';
import { CoupleRoomRow, MatchHistoryRow } from '../types/arcade';
import { CatAvatarSvg } from './CatAvatarSvg';
import {
  CloseIcon,
  CrownIcon,
  DoubleHeartIcon,
  SnakeLadderIcon,
  SparkleIcon,
  TrophyIcon,
} from './ArcadeIcons';
import { fetchMatchHistory } from '../services/supabaseService';

interface CoupleScoreboardModalProps {
  isOpen: boolean;
  roomData: CoupleRoomRow;
  onClose: () => void;
}

export function CoupleScoreboardModal({
  isOpen,
  roomData,
  onClose,
}: CoupleScoreboardModalProps) {
  const [history, setHistory] = useState<MatchHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchMatchHistory(roomData.room_code, 6)
      .then((rows) => setHistory(rows))
      .finally(() => setLoading(false));
  }, [isOpen, roomData.room_code]);

  if (!isOpen) return null;

  const p1Total =
    (roomData.p1_dama_wins || 0) + (roomData.p1_snakes_wins || 0);
  const p2Total =
    (roomData.p2_dama_wins || 0) + (roomData.p2_snakes_wins || 0);

  const p1DisplayName = roomData.p1_avatar.name || 'Lovey 1';
  const p2DisplayName =
    roomData.p2_avatar.name && roomData.p2_avatar.name !== p1DisplayName
      ? roomData.p2_avatar.name
      : 'Lovey 2';

  const p1Leading = p1Total >= p2Total && p1Total > 0;
  const p2Leading = p2Total >= p1Total && p2Total > 0;

  return (
    <div
      className="modal-backdrop strong-dim"
      role="dialog"
      aria-modal="true"
      aria-label="Couple Scoreboard"
      onClick={onClose}
    >
      <div
        className="modal-card sticker-score-modal anim-fade-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti Header Strip */}
        <div className="confetti-strip" aria-hidden="true">
          <SparkleIcon size={16} />
          <span className="confetti-dot pink" />
          <span className="confetti-dot mint" />
          <TrophyIcon size={22} />
          <span className="confetti-dot butter" />
          <span className="confetti-dot sky" />
          <SparkleIcon size={16} />
        </div>

        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Couple Scoreboard</h2>
            <p className="modal-subtitle">Room {roomData.room_code}</p>
          </div>
          <button
            type="button"
            className="cozy-close-btn"
            onClick={onClose}
            aria-label="Close scoreboard"
          >
            <CloseIcon size={15} />
          </button>
        </div>

        {/* Head-to-Head Sticker Card with Winner Crowns */}
        <div className="scoreboard-vs-card">
          <div className="score-player-col">
            {p1Leading && (
              <div className="leader-crown-pop">
                <CrownIcon size={22} />
              </div>
            )}
            <div className="cat-badge">
              <CatAvatarSvg
                breed={roomData.p1_avatar.breed}
                accessory={roomData.p1_avatar.accessory}
                size={40}
              />
            </div>
            <span className="score-cat-name">{p1DisplayName}</span>
            <span className="score-big-num">{p1Total}</span>
            <span className="score-breakdown">
              <CrownIcon size={12} /> {roomData.p1_dama_wins} •{' '}
              <SnakeLadderIcon size={12} /> {roomData.p1_snakes_wins}
            </span>
          </div>

          <div className="score-vs-divider">
            <DoubleHeartIcon size={22} />
            <span className="vs-label">VS</span>
          </div>

          <div className="score-player-col">
            {p2Leading && (
              <div className="leader-crown-pop">
                <CrownIcon size={22} />
              </div>
            )}
            <div className="cat-badge">
              <CatAvatarSvg
                breed={roomData.p2_avatar.breed}
                accessory={roomData.p2_avatar.accessory}
                size={40}
              />
            </div>
            <span className="score-cat-name">{p2DisplayName}</span>
            <span className="score-big-num">{p2Total}</span>
            <span className="score-breakdown">
              <CrownIcon size={12} /> {roomData.p2_dama_wins} •{' '}
              <SnakeLadderIcon size={12} /> {roomData.p2_snakes_wins}
            </span>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="cozy-section">
          <span className="cozy-label">Recent Results</span>
          <div className="history-list">
            {loading ? (
              <div className="history-empty">Loading...</div>
            ) : history.length === 0 ? (
              <div className="history-empty">No completed matches yet</div>
            ) : (
              history.map((item) => {
                const winnerName =
                  item.winner === 'p1'
                    ? p1DisplayName
                    : item.winner === 'p2'
                    ? p2DisplayName
                    : 'Draw';
                return (
                  <div key={item.id} className="history-row">
                    <span className="history-icon">
                      {item.game_mode === 'dama' ? (
                        <CrownIcon size={16} />
                      ) : (
                        <SnakeLadderIcon size={16} />
                      )}
                    </span>
                    <div className="history-info">
                      <span className="history-winner">
                        {winnerName} won
                      </span>
                      <span className="history-summary">{item.summary}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
