import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { LatLng } from '../types';
import { haversineDistance } from '../utils/haversine';
import { calculateScore, formatDistance, formatScore } from '../utils/scoreCalculator';
import CountdownTimer from './CountdownTimer';
import ImageryMap from './ImageryMap';
import GuessMap from './GuessMap';

type Phase = 'loading' | 'playing' | 'result' | 'error';

export default function GameRound() {
  const { state, dispatch, totalScore } = useGame();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [target, setTarget] = useState<LatLng | null>(null);
  const [guess, setGuess]   = useState<LatLng | null>(null);
  const [distKm, setDistKm] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);

  const timedOut = useRef(false);

  // Load a new location when the round index changes
  useEffect(() => {
    let cancelled = false;
    timedOut.current = false;
    setPhase('loading');
    setTarget(null);
    setGuess(null);
    setDistKm(null);

    fetch('/api/location')
      .then((r) => r.json())
      .then((data: LatLng) => {
        if (!cancelled) {
          setTarget(data);
          setPhase('playing');
        }
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });

    return () => { cancelled = true; };
  }, [state.currentRoundIndex]);

  const handleGuess = useCallback(
    (ll: LatLng) => {
      if (phase !== 'playing' || !target) return;

      const dist = haversineDistance(ll.latitude, ll.longitude, target.latitude, target.longitude);
      const score = calculateScore(dist);

      setGuess(ll);
      setDistKm(dist);
      setRoundScore(score);
      setPhase('result');

      dispatch({
        type: 'SUBMIT_GUESS',
        guess: ll,
        distanceKm: dist,
        score,
        targetLocation: target,
      });
    },
    [phase, target, dispatch]
  );

  const handleTimeout = useCallback(() => {
    if (phase !== 'playing' || timedOut.current || !target) return;
    timedOut.current = true;
    setDistKm(null);
    setRoundScore(0);
    setPhase('result');
    dispatch({ type: 'TIMEOUT', targetLocation: target });
  }, [phase, target, dispatch]);

  const handleNext = () => {
    const isLast = state.currentRoundIndex + 1 >= state.roundsCount;
    dispatch({ type: 'NEXT_ROUND' });
    if (isLast) {
      navigate('/summary');
    }
    // phase reset happens via useEffect on currentRoundIndex change
  };

  const roundNum = state.currentRoundIndex + 1;

  return (
    <div className="game-round">
      {/* ── Maps ── */}
      <div className="game-maps">
        {/* Left: imagery */}
        <div className="map-pane">
          <div className="map-label" aria-hidden="true">📷 Satellitenansicht</div>
          {phase === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Lade Standort …
            </div>
          )}
          {phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
              ⚠️ Standort konnte nicht geladen werden.
            </div>
          )}
          {target && (phase === 'playing' || phase === 'result') && (
            <ImageryMap
              latitude={target.latitude}
              longitude={target.longitude}
              difficulty={state.difficulty}
            />
          )}
        </div>

        {/* Right: world map */}
        <div className="map-pane" style={{ position: 'relative' }}>
          <div className="map-label" aria-hidden="true">🌍 Wo ist das?</div>
          <GuessMap
            guess={guess}
            target={phase === 'result' ? target : null}
            interactive={phase === 'playing'}
            showResult={phase === 'result'}
            onGuess={handleGuess}
          />

          {/* Result overlay */}
          {phase === 'result' && (
            <div className="result-overlay">
              {guess ? (
                <>
                  <h3>Deine Distanz</h3>
                  <div className="result-distance">{formatDistance(distKm ?? 0)}</div>
                  <div className="result-score">+{formatScore(roundScore)} Punkte</div>
                </>
              ) : (
                <>
                  <h3>Zeit abgelaufen!</h3>
                  <div className="result-timeout">⏱ Kein Tipp — 0 Punkte</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="game-footer">
        <div className="game-info">
          <div className="game-info-item">
            <span>Runde</span>
            <span>{roundNum} / {state.roundsCount}</span>
          </div>
          <div className="game-info-item">
            <span>Punkte</span>
            <span>{formatScore(totalScore)}</span>
          </div>
          <div className="game-info-item">
            <span>Modus</span>
            <span>{state.difficulty}</span>
          </div>
        </div>

        {phase === 'playing' && target && (
          <CountdownTimer
            difficulty={state.difficulty}
            running={phase === 'playing'}
            onTimeout={handleTimeout}
          />
        )}

        {phase === 'result' && (
          <div className="result-footer-actions">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Gesamt: <strong>{formatScore(totalScore)}</strong>
            </span>
            <button className="btn btn-primary" onClick={handleNext} type="button" autoFocus>
              {roundNum >= state.roundsCount ? '🏁 Ergebnis anzeigen' : '▶ Nächste Runde'}
            </button>
          </div>
        )}

        <div className="attribution">
          Karte: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a> &nbsp;|&nbsp;
          Satellit: <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">© Esri</a>
        </div>
      </footer>
    </div>
  );
}
