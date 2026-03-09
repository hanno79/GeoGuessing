import { useEffect, useState } from 'react';
import type { DiscoverData } from '../types';

export default function Discover() {
  const [data, setData] = useState<DiscoverData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/discover.json')
      .then((r) => {
        if (!r.ok) throw new Error('Datei nicht gefunden');
        return r.json();
      })
      .then((d: DiscoverData) => setData(d))
      .catch(() => setError('Updates konnten nicht geladen werden.'));
  }, []);

  return (
    <div className="discover">
      <h1>✨ Updates & Entdeckungen</h1>

      {error && (
        <div className="card" style={{ color: 'var(--danger)' }} role="alert">
          ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          {/* Changelog */}
          <section>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
              📋 Changelog
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {data.changelog.map((entry) => (
                <div key={entry.version} className="changelog-entry">
                  <div className="changelog-version">
                    v{entry.version} · {entry.date}
                  </div>
                  <h3 className="changelog-title">{entry.title}</h3>
                  <ul className="changelog-list">
                    {entry.entries.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming modes */}
          {data.upcomingModes?.length > 0 && (
            <section>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                🚀 Demnächst
              </h2>
              <div className="modes-grid">
                {data.upcomingModes.map((mode) => (
                  <div key={mode.title} className="mode-card">
                    <h3>{mode.title}</h3>
                    <p>{mode.description}</p>
                    <span className="mode-badge">Coming soon</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Social sharing */}
          {data.socialSharing && (
            <section>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                📤 Score teilen
              </h2>
              <div className="share-buttons">
                {data.socialSharing.twitter && (
                  <a
                    href={data.socialSharing.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-twitter"
                    aria-label="Auf Twitter teilen"
                  >
                    🐦 Twitter
                  </a>
                )}
                {data.socialSharing.whatsapp && (
                  <a
                    href={data.socialSharing.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn share-whatsapp"
                    aria-label="Auf WhatsApp teilen"
                  >
                    💬 WhatsApp
                  </a>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
