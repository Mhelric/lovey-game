import { useEffect, useState } from 'preact/hooks';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { CatAvatarSvg } from './CatAvatarSvg';
import { DEFAULT_P1_AVATAR } from '../types/arcade';

export interface AppVersionInfo {
  version: string;
  apkUrl: string;
  notes: string[];
}

const FALLBACK_APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined) || '1.0.0';

const GITHUB_LATEST_RELEASE_URL =
  'https://api.github.com/repos/Mhelric/lovey-game/releases/latest';

function isNewerVersion(remote: string, local: string): boolean {
  const clean = (v: string) =>
    v
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0);
  const r = clean(remote);
  const l = clean(local);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0;
    const lv = l[i] ?? 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

interface GitHubReleasePayload {
  tag_name?: string;
  html_url?: string;
  body?: string;
  assets?: GitHubReleaseAsset[];
}

export default function ApkUpdateModal() {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      let currentVersion = FALLBACK_APP_VERSION;
      try {
        const info = await CapApp.getInfo();
        if (info?.version) {
          currentVersion = info.version;
        }
      } catch {
        // Fallback to injected VITE_APP_VERSION
      }

      try {
        const res = await fetch(`${GITHUB_LATEST_RELEASE_URL}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) return;
        const data = (await res.json()) as GitHubReleasePayload;
        const remoteTag = data?.tag_name?.trim();
        if (!remoteTag || !isNewerVersion(remoteTag, currentVersion)) return;

        const apkAsset = data.assets?.find((a) =>
          a.name?.toLowerCase().endsWith('.apk')
        );
        const apkUrl = apkAsset?.browser_download_url || data.html_url;
        if (!apkUrl) return;

        const notes = (data.body || '')
          .split('\n')
          .map((line) => line.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 5);

        if (!cancelled) {
          setUpdateInfo({
            version: remoteTag.replace(/^v/i, ''),
            apkUrl,
            notes,
          });
          setModalOpen(true);
        }
      } catch {
        // Offline or GitHub API rate-limited — ignore silently
      }
    }

    void checkForUpdate();

    const stateSub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void checkForUpdate();
      }
    });

    const backSub = CapApp.addListener('backButton', () => {
      setModalOpen((open) => {
        if (open) return false;
        void CapApp.minimizeApp();
        return false;
      });
    });

    return () => {
      cancelled = true;
      void stateSub.then((h) => h.remove());
      void backSub.then((h) => h.remove());
    };
  }, []);

  if (!updateInfo || !modalOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 9999 }}
      onClick={() => setModalOpen(false)}
    >
      <div
        className="modal-card"
        style={{ maxWidth: '330px', padding: '18px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#fff0f5',
              border: '2px solid #ff8fab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CatAvatarSvg
              breed={DEFAULT_P1_AVATAR.breed}
              accessory={DEFAULT_P1_AVATAR.accessory}
              size={36}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 800,
                color: '#432818',
              }}
            >
              Update Available!
            </h2>
            <span
              style={{
                display: 'inline-block',
                marginTop: '2px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#d90429',
                background: '#ffe5ec',
                padding: '1px 8px',
                borderRadius: '999px',
                border: '1px solid #ffb3c6',
              }}
            >
              v{updateInfo.version}
            </span>
          </div>
        </div>

        <p
          style={{
            margin: '0 0 10px 0',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            color: '#6f4e37',
          }}
        >
          A newer Lovey Game APK is ready! Install it right over your current app without losing your room or cat avatar.
        </p>

        {updateInfo.notes.length > 0 && (
          <ul
            style={{
              margin: '0 0 12px 0',
              padding: '8px 10px 8px 22px',
              borderRadius: '12px',
              background: '#fff8f0',
              border: '1.5px solid #ffd6e0',
              fontSize: '0.75rem',
              color: '#5c3a21',
              lineHeight: 1.4,
            }}
          >
            {updateInfo.notes.map((note, idx) => (
              <li key={idx} style={{ marginBottom: idx < updateInfo.notes.length - 1 ? '4px' : 0 }}>
                {note}
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem' }}
            onClick={() => void Browser.open({ url: updateInfo.apkUrl })}
          >
            Download &amp; Install Update
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', padding: '8px 14px', fontSize: '0.78rem' }}
            onClick={() => setModalOpen(false)}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
