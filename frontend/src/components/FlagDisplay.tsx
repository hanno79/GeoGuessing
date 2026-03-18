import { useState } from 'react';
import type { Difficulty } from '../types';

interface FlagDisplayProps {
  countryCode: string;
  continent?: string | null;
  difficulty: Difficulty;
}

export default function FlagDisplay({ countryCode, continent, difficulty }: FlagDisplayProps) {
  const [imgError, setImgError] = useState(false);
  const flagUrl = `https://flagcdn.com/w640/${countryCode}.png`;

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
        Welches Land zeigt diese Flagge?
      </div>
      {!imgError ? (
        <img
          src={flagUrl}
          alt="Flagge eines Landes"
          onError={() => setImgError(true)}
          style={{
            maxWidth: '80%',
            maxHeight: '50%',
            objectFit: 'contain',
            borderRadius: '4px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        />
      ) : (
        <div style={{ fontSize: '4rem' }}>🏴</div>
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
