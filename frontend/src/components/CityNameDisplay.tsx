interface CityNameDisplayProps {
  city: string;
  country: string | null;
}

export default function CityNameDisplay({ city, country }: CityNameDisplayProps) {
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
        Wo liegt diese Stadt?
      </div>
      <div
        style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 700,
          lineHeight: 1.2,
          color: 'var(--accent)',
        }}
      >
        {city}
      </div>
      {country && (
        <div
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            color: 'var(--text-muted)',
            marginTop: '0.75rem',
            fontWeight: 400,
          }}
        >
          {country}
        </div>
      )}
    </div>
  );
}
