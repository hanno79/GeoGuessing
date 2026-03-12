import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { STREAK_THRESHOLD } from '../types';
import { formatDistance, formatScore, formatTime } from '../utils/scoreCalculator';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'duplicate';

function DailyCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        📅 Nächste Challenge in: <strong style={{ color: 'var(--accent-glow)' }}>{timeLeft}</strong>
      </p>
    </div>
  );
}

export default function GameSummary() {
  const { state, dispatch, totalScore, avgDistance } = useGame();
  const navigate = useNavigate();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');

  const isDaily = state.gameMode === 'Daily';
  const isStreak = state.gameMode === 'Streak';
  const actualRounds = state.rounds.length;
  const streakCount = isStreak
    ? state.rounds.filter((r) => !r.timedOut && r.distanceKm !== null && r.distanceKm <= STREAK_THRESHOLD[state.difficulty]).length
    : 0;

  const isCountryMode = state.gameCategory === 'FlagMode' || state.gameCategory === 'SilhouetteMode';
  const bestRound = [...state.rounds].sort((a, b) => b.score - a.score)[0];
  const totalTimeTaken = state.rounds.reduce((sum, r) => sum + (r.timeTakenSeconds ?? 0), 0);

  async function handleSave() {
    setSaveStatus('saving');
    setSaveError('');

    const payload: Record<string, unknown> = {
      name: state.playerName,
      totalScore,
      difficulty: state.difficulty,
      roundsCount: isStreak ? actualRounds : state.roundsCount,
      avgDistanceKm: avgDistance,
      gameMode: state.gameMode,
      gameCategory: state.gameCategory,
      totalTimeTakenSeconds: totalTimeTaken,
    };

    if (isDaily && state.dailyDate) {
      payload.dailyDate = state.dailyDate;
    }

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

  const modeLabel = isDaily ? '📅 Daily' : isStreak ? '🔥 Streak' : state.gameMode;
  const displayRounds = isStreak ? actualRounds : state.roundsCount;

  return (
    <div className="summary">
      {/* Header */}
      <div className="summary-header card">
        <h1>{isStreak && state.streakFailed ? '💥 Game Over' : '🏁 Spielergebnis'}</h1>
        <div className="summary-total-score">{formatScore(totalScore)}</div>
        <div className="summary-subtitle">
          {state.playerName} · {
            state.gameCategory === 'CityHunt' ? '🏙 CityHunt' :
            state.gameCategory === 'FlagMode' ? '🏴 Flaggen' :
            state.gameCategory === 'SilhouetteMode' ? '🗺 Silhouette' : '🛰 SkyView'
          } · {modeLabel} · {state.difficulty} · {displayRounds} Runden
        </div>
      </div>

      {/* Stats */}
      <div className="summary-stats">
        {isStreak && (
          <div className="stat-card">
            <div className="stat-label">Streak</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              🔥 {streakCount}
            </div>
          </div>
        )}
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

      {/* Daily countdown */}
      {isDaily && <DailyCountdown />}

      {/* Round breakdown */}
      <div className="card">
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Rundenübersicht</h2>
        <div className="summary-rounds">
          {state.rounds.map((r) => (
            <div className="summary-round" key={r.roundNumber}>
              <div className="round-num">#{r.roundNumber}</div>
              <div className="round-location">
                {isCountryMode && r.countryName
                  ? r.countryName
                  : r.cityName
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
          <p className="save-status error">
            {isDaily ? '⚠️ Du hast die heutige Challenge bereits gespielt.' : '⚠️ Dieser Score ist bereits gespeichert.'}
          </p>
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
