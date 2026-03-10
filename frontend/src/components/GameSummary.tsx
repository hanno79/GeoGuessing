import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { formatDistance, formatScore, formatTime } from '../utils/scoreCalculator';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'duplicate';

export default function GameSummary() {
  const { state, dispatch, totalScore, avgDistance } = useGame();
  const navigate = useNavigate();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');

  async function handleSave() {
    setSaveStatus('saving');
    setSaveError('');

    const payload = {
      name: state.playerName,
      totalScore,
      difficulty: state.difficulty,
      roundsCount: state.roundsCount,
      avgDistanceKm: avgDistance,
      gameMode: state.gameMode,
      gameCategory: state.gameCategory,
      totalTimeTakenSeconds: totalTimeTaken,
    };

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        setSaveStatus('saved');
      } else if (res.status === 409) {
        setSaveStatus('duplicate');
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || 'Unbekannter Fehler.');
        setSaveStatus('error');
      }
    } catch {
      setSaveError('Netzwerkfehler. Bitte Verbindung prüfen.');
      setSaveStatus('error');
    }
  }

  function handlePlayAgain() {
    dispatch({ type: 'RESET' });
    navigate('/');
  }

  const bestRound = [...state.rounds].sort((a, b) => b.score - a.score)[0];
  const isZen = state.gameMode === 'Zen';
  const totalTimeTaken = state.rounds.reduce((sum, r) => sum + (r.timeTakenSeconds ?? 0), 0);

  return (
    <div className="summary">
      {/* Header */}
      <div className="summary-header card">
        <h1>🏁 Spielergebnis</h1>
        <div className="summary-total-score">{formatScore(totalScore)}</div>
        <div className="summary-subtitle">
          {state.playerName} · {state.gameCategory === 'CityHunt' ? '🏙 CityHunt' : '🛰 SkyView'} · {state.gameMode} · {state.difficulty} · {state.roundsCount} Runden
        </div>
      </div>

      {/* Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-label">Gesamtscore</div>
          <div className="stat-value" style={{ color: 'var(--accent-glow)' }}>
            {formatScore(totalScore)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ø Distanz</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            {avgDistance !== null ? formatDistance(avgDistance) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Beste Runde</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {bestRound ? formatScore(bestRound.score) : '0'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gesamtzeit</div>
          <div className="stat-value" style={{ color: 'var(--accent-glow)' }}>
            {formatTime(totalTimeTaken)}
          </div>
        </div>
      </div>

      {/* Round breakdown */}
      <div className="card">
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Rundenübersicht</h2>
        <div className="summary-rounds">
          {state.rounds.map((r) => (
            <div className="summary-round" key={r.roundNumber}>
              <div className="round-num">#{r.roundNumber}</div>
              <div className="round-location">
                {r.cityName
                  ? (r.countryName ? `${r.cityName}, ${r.countryName}` : r.cityName)
                  : r.targetLocation
                    ? `${r.targetLocation.latitude.toFixed(2)}°, ${r.targetLocation.longitude.toFixed(2)}°`
                    : '—'}
              </div>
              <div className="round-dist">
                {r.distanceKm !== null ? formatDistance(r.distanceKm) : 'Kein Tipp'}
              </div>
              <div className="round-time" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {r.timeTakenSeconds !== null ? formatTime(r.timeTakenSeconds) : '—'}
              </div>
              <div className={`round-score-val ${r.score === 0 ? 'zero' : ''}`}>
                +{formatScore(r.score)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save to leaderboard */}
      <div className="card save-form">
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>💾 In Bestenliste speichern</h2>
        {saveStatus === 'saved' ? (
          <p className="save-status success">✅ Dein Score wurde gespeichert!</p>
        ) : saveStatus === 'duplicate' ? (
          <p className="save-status error">⚠️ Dieser Score ist bereits gespeichert.</p>
        ) : (
          <>
            <div className="save-row">
              <input
                type="text"
                value={state.playerName}
                readOnly
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)', padding: '0.6rem 0.9rem' }}
              />
              <button
                className="btn btn-success"
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                type="button"
              >
                {saveStatus === 'saving' ? '…' : '💾 Speichern'}
              </button>
            </div>
            {saveStatus === 'error' && (
              <p className="save-status error">❌ {saveError}</p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={handlePlayAgain} type="button">
          🔄 Nochmal spielen
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={() => navigate('/leaderboard')}
          type="button"
        >
          🏆 Bestenliste
        </button>
      </div>
    </div>
  );
}
