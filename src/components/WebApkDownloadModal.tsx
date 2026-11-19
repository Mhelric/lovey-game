import { useEffect, useState } from 'preact/hooks';

const LATEST_APK_FALLBACK_URL =
  'https://github.com/Mhelric/lovey-game/releases/latest/download/LoveyGame.apk';
const GITHUB_LATEST_RELEASE_URL =
  'https://api.github.com/repos/Mhelric/lovey-game/releases/latest';

interface WebApkDownloadModalProps {
  onClose: () => void;
}

export default function WebApkDownloadModal({ onClose }: WebApkDownloadModalProps) {
  const [version, setVersion] = useState<string>('1.0.1');
  const [apkUrl, setApkUrl] = useState<string>(LATEST_APK_FALLBACK_URL);
  const [sizeLabel, setSizeLabel] = useState<string>('~1.9 MB');

  useEffect(() => {
    let cancelled = false;
    fetch(GITHUB_LATEST_RELEASE_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.tag_name === 'string') {
          setVersion(data.tag_name.replace(/^v/i, ''));
        }
        const asset = Array.isArray(data.assets)
          ? data.assets.find(
              (a: { name?: string }) =>
                typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
            )
          : null;
        if (asset?.browser_download_url) {
          setApkUrl(asset.browser_download_url);
        }
        if (typeof asset?.size === 'number' && asset.size > 0) {
          setSizeLabel(`${(asset.size / (1024 * 1024)).toFixed(2)} MB`);
        }
      })
      .catch(() => {
        // Fallback to direct latest download URL
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '330px', padding: '18px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
          }}
        >
          <img
            src="/game-icon.png"
            alt="Lovey Game Logo"
            width={46}
            height={46}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 800,
                color: '#432818',
              }}
            >
              Get Lovey Game App
            </h2>
            <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#d90429',
                  background: '#ffe5ec',
                  padding: '1px 8px',
                  borderRadius: '999px',
                  border: '1px solid #ffb3c6',
                }}
              >
                v{version}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#1b4332',
                  background: '#d8f3dc',
                  padding: '1px 8px',
                  borderRadius: '999px',
                  border: '1px solid #95d5b2',
                }}
              >
                {sizeLabel} • Android
              </span>
            </div>
          </div>
        </div>

        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: '#6f4e37',
          }}
        >
          Install the lightweight Android APK for smoother full-screen play, Cat Avatar home icon, and automatic in-app update popups!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={apkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="vibrant-play-btn compact sticker-press"
            style={{ textDecoration: 'none' }}
            onClick={onClose}
          >
            Download LoveyGame.apk ({sizeLabel})
          </a>
          <button
            type="button"
            className="saved-confirm-fresh-btn sticker-press"
            onClick={onClose}
          >
            Continue on Web
          </button>
        </div>
      </div>
    </div>
  );
}
