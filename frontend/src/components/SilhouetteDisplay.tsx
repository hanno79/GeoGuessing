import type { Difficulty } from '../types';
import COUNTRY_PATHS from '../data/countryPaths';

interface SilhouetteDisplayProps {
  countryCode: string;
  continent?: string | null;
  difficulty: Difficulty;
}

export default function SilhouetteDisplay({ countryCode, continent, difficulty }: SilhouetteDisplayProps) {
  const pathData = COUNTRY_PATHS[countryCode];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
        color: '#e6edf3',
        userSelect: 'none',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.9rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
          marginBottom: '1.5rem',
        }}
      >
        Welches Land hat diese Form?
      </div>
      {pathData ? (
        <svg
          viewBox="0 0 100 100"
          style={{
            maxWidth: 'min(80%, 400px)',
            maxHeight: '50%',
            filter: 'drop-shadow(0 4px 16px rgba(31,111,235,0.3))',
          }}
          aria-label="Silhouette eines Landes"
        >
          <path d={pathData} fill="#e6edf3" stroke="none" />
        </svg>
      ) : (
        <div style={{ fontSize: '4rem' }}>🗺</div>
      )}
      {difficulty === 'Easy' && continent && (
        <div
          style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
            color: 'var(--text-muted)',
            marginTop: '1.25rem',
            fontWeight: 400,
          }}
        >
          Kontinent: {continent}
        </div>
      )}
    </div>
  );
}
