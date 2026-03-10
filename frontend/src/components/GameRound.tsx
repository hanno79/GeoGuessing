import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { LatLng } from '../types';
import { ZEN_TIME_BONUS_WINDOW } from '../types';
import { haversineDistance } from '../utils/haversine';
import { calculateScore, calculateZenDistanceScore, calculateTimeBonus, formatDistance, formatScore, formatTime } from '../utils/scoreCalculator';
import CountdownTimer from './CountdownTimer';
import ElapsedTimer from './ElapsedTimer';
import ImageryMap from './ImageryMap';
import GuessMap from './GuessMap';
import CityNameDisplay from './CityNameDisplay';

type Phase = 'loading' | 'playing' | 'result' | 'error';

export default function GameRound() {
  const { state, dispatch, totalScore } = useGame();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('loading');
  const [target, setTarget] = useState<LatLng | null>(null);
  const [guess, setGuess]   = useState<LatLng | null>(null);
  const [distKm, setDistKm] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [timeBonus, setTimeBonus] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [cityName, setCityName] = useState<string | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);

  const timedOut = useRef(false);
  const roundStartTime = useRef<number>(Date.now());
  const isZen = state.gameMode === 'Zen';
  const isCityHunt = state.gameCategory === 'CityHunt';

  // Load a new location when the round index changes
  useEffect(() => {
    let cancelled = false;
    timedOut.current = false;
    setPhase('loading');
    setTarget(null);
    setGuess(null);
    setDistKm(null);
    setTimeBonus(0);
    setElapsedSec(0);
    setCityName(null);
    setCountryName(null);

    const usedTargets = state.rounds
      .filter((r) => r.targetLocation)
      .map((r) =>
        isCityHunt
          ? r.cityName
          : `${r.targetLocation!.latitude},${r.targetLocation!.longitude}`,
      );

    const params = new URLSearchParams();
    if (isCityHunt) params.set('difficulty', state.difficulty);
    if (usedTargets.length > 0) params.set('exclude', JSON.stringify(usedTargets));

    const url = isCityHunt ? `/api/city?${params}` : `/api/location?${params}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTarget({ latitude: data.latitude, longitude: data.longitude });
          if (isCityHunt) {
            setCityName(data.city);
            setCountryName(data.country ?? null);
          }
          setPhase('playing');
          roundStartTime.current = Date.now();
        }
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentRoundIndex]);

  const handleGuess = useCallback(
    (ll: LatLng) => {
      if (phase !== 'playing' || !target) return;

      const dist = haversineDistance(ll.latitude, ll.longitude, target.latitude, target.longitude);
      const distScore = isZen ? calculateZenDistanceScore(dist) : calculateScore(dist);
      const elapsed = (Date.now() - roundStartTime.current) / 1000;
      const bonus = isZen ? calculateTimeBonus(elapsed, ZEN_TIME_BONUS_WINDOW[state.difficulty]) : 0;
      const totalRoundScore = distScore + bonus;

      setGuess(ll);
      setDistKm(dist);
      setRoundScore(totalRoundScore);
      setTimeBonus(bonus);
      setElapsedSec(Math.floor(elapsed));
      setPhase('result');

      dispatch({
        type: 'SUBMIT_GUESS',
        guess: ll,
        distanceKm: dist,
        score: totalRoundScore,
        targetLocation: target,
        timeTakenSeconds: Math.floor(elapsed),
        cityName: cityName ?? undefined,
        countryName: countryName ?? undefined,
      });
    },
    [phase, target, dispatch, isZen, state.difficulty]
  );

  const handleTimeout = useCallback(() => {
    if (phase !== 'playing' || timedOut.current || !target) return;
    timedOut.current = true;
    const elapsed = Math.floor((Date.now() - roundStartTime.current) / 1000);
    setDistKm(null);
    setRoundScore(0);
    setPhase('result');
    dispatch({ type: 'TIMEOUT', targetLocation: target, timeTakenSeconds: elapsed });
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
        {/* Left: imagery or city name */}
        <div className="map-pane">
          <div className="map-label" aria-hidden="true">
            {isCityHunt ? '🏙 Welche Stadt?' : '📷 Satellitenansicht'}
          </div>
          {phase === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              {isCityHunt ? 'Lade Stadt …' : 'Lade Standort …'}
            </div>
          )}
          {phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
              {isCityHunt ? '⚠️ Stadt konnte nicht geladen werden.' : '⚠️ Standort konnte nicht geladen werden.'}
            </div>
          )}
          {target && (phase === 'playing' || phase === 'result') && (
            isCityHunt ? (
              <CityNameDisplay city={cityName ?? ''} country={countryName} />
            ) : (
              <ImageryMap
                latitude={target.latitude}
                longitude={target.longitude}
                difficulty={state.difficulty}
              />
            )
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
            hideLabels={isCityHunt}
          />

          {/* Result overlay */}
          {phase === 'result' && (
            <div className="result-overlay">
              {guess ? (
                <>
                  <h3>Deine Distanz</h3>
                  <div className="result-distance">{formatDistance(distKm ?? 0)}</div>
                  <div className="result-score">+{formatScore(roundScore)} Punkte</div>
                  <div className="result-time-bonus" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {formatTime(elapsedSec)}{isZen ? ` · +${formatScore(timeBonus)} Zeitbonus` : ''}
                  </div>
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
            <span>{state.gameMode}</span>
          </div>
          <div className="game-info-item">
            <span>Schwierigkeit</span>
            <span>{state.difficulty}</span>
          </div>
        </div>

        {phase === 'playing' && target && !isZen && (
          <CountdownTimer
            difficulty={state.difficulty}
            running={phase === 'playing'}
            onTimeout={handleTimeout}
          />
        )}

        {phase === 'playing' && target && isZen && (
          <ElapsedTimer
            running={phase === 'playing'}
            startTime={roundStartTime.current}
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
          Karte: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
          {!isCityHunt && (
            <>&nbsp;|&nbsp;Satellit: <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">© Esri</a></>
          )}
        </div>
      </footer>
    </div>
  );
}
