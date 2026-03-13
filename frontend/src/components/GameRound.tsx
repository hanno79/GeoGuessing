import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { LatLng } from '../types';
import { ZEN_TIME_BONUS_WINDOW, STREAK_THRESHOLD, DIFFICULTY_TIMER, ZOOM_IN_START, ZOOM_IN_END, ZOOM_OUT_START, ZOOM_OUT_END, ZOOM_DURATION } from '../types';
import { haversineDistance } from '../utils/haversine';
import { calculateScore, calculateZenDistanceScore, calculateTimeBonus, calculateZoomBonus, formatDistance, formatScore, formatTime } from '../utils/scoreCalculator';
import CountdownTimer from './CountdownTimer';
import ElapsedTimer from './ElapsedTimer';
import ImageryMap from './ImageryMap';
import ZoomImageryMap from './ZoomImageryMap';
import GuessMap from './GuessMap';
import CityNameDisplay from './CityNameDisplay';
import FlagDisplay from './FlagDisplay';
import SilhouetteDisplay from './SilhouetteDisplay';
import { playSound, soundForDistance } from '../utils/soundManager';

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
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [continent, setContinent] = useState<string | null>(null);
  const [streakBusted, setStreakBusted] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [zoomProgress, setZoomProgress] = useState(0);

  const timedOut = useRef(false);
  const roundStartTime = useRef<number>(Date.now());
  const isZen = state.gameMode === 'Zen';
  const isDaily = state.gameMode === 'Daily';
  const isStreak = state.gameMode === 'Streak';
  const isCityHunt = state.gameCategory === 'CityHunt';
  const isFlagMode = state.gameCategory === 'FlagMode';
  const isSilhouetteMode = state.gameCategory === 'SilhouetteMode';
  const isCountryMode = isFlagMode || isSilhouetteMode;
  const isZoomIn = state.gameCategory === 'ZoomIn';
  const isZoomOut = state.gameCategory === 'ZoomOut';
  const isZoomMode = isZoomIn || isZoomOut;
  const showTimer = !isZen && (state.gameMode === 'Classic' || isDaily || isStreak);

  // Load a new location when the round index changes
  useEffect(() => {
    let cancelled = false;
    timedOut.current = false;
    setStreakBusted(false);
    setOverlayVisible(true);
    setPhase('loading');
    setTarget(null);
    setGuess(null);
    setDistKm(null);
    setTimeBonus(0);
    setElapsedSec(0);
    setCityName(null);
    setCountryName(null);
    setCountryCode(null);
    setContinent(null);
    setZoomProgress(0);

    let url: string;

    if (isDaily) {
      // Daily Challenge: fetch deterministic location
      const date = state.dailyDate || new Date().toISOString().slice(0, 10);
      const params = new URLSearchParams({
        date,
        round: String(state.currentRoundIndex),
        category: state.gameCategory,
      });
      url = `/api/daily?${params}`;
    } else if (isCountryMode) {
      const usedCodes = state.rounds
        .filter((r) => r.targetLocation)
        .map((r) => r.cityName); // we store countryCode in cityName field for exclude tracking
      const params = new URLSearchParams();
      params.set('difficulty', state.difficulty);
      if (usedCodes.length > 0) params.set('exclude', JSON.stringify(usedCodes));
      url = `/api/country?${params}`;
    } else {
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

      url = isCityHunt ? `/api/city?${params}` : `/api/location?${params}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTarget({ latitude: data.latitude, longitude: data.longitude });
          if (isCityHunt) {
            setCityName(data.city ?? null);
            setCountryName(data.country ?? null);
          }
          if (isCountryMode) {
            setCountryCode(data.countryCode ?? null);
            setCountryName(data.country ?? null);
            setContinent(data.continent ?? null);
            setCityName(data.countryCode ?? null); // store countryCode for exclude tracking
          }
          setPhase('playing');
          roundStartTime.current = Date.now();
          playSound('start');
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
      const distScore = (isZen || isZoomMode) ? calculateZenDistanceScore(dist) : calculateScore(dist);
      const elapsed = (Date.now() - roundStartTime.current) / 1000;
      const bonus = isZoomMode ? calculateZoomBonus(zoomProgress) : isZen ? calculateTimeBonus(elapsed, ZEN_TIME_BONUS_WINDOW[state.difficulty]) : 0;
      const totalRoundScore = distScore + bonus;

      setGuess(ll);
      setDistKm(dist);
      setRoundScore(totalRoundScore);
      setTimeBonus(bonus);
      setElapsedSec(Math.floor(elapsed));
      setPhase('result');
      playSound(soundForDistance(dist));

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

      // Streak mode: check if bust
      if (isStreak && dist > STREAK_THRESHOLD[state.difficulty]) {
        setStreakBusted(true);
      }
    },
    [phase, target, dispatch, isZen, isZoomMode, isStreak, state.difficulty, cityName, countryName, zoomProgress]
  );

  const handleTimeout = useCallback(() => {
    if (phase !== 'playing' || timedOut.current || !target) return;
    timedOut.current = true;
    const elapsed = Math.floor((Date.now() - roundStartTime.current) / 1000);
    setDistKm(null);
    setRoundScore(0);
    setPhase('result');
    playSound('timeout');
    dispatch({ type: 'TIMEOUT', targetLocation: target, timeTakenSeconds: elapsed });

    // Streak: timeout = game over
    if (isStreak) {
      setStreakBusted(true);
    }
  }, [phase, target, dispatch, isStreak]);

  const handleNext = () => {
    if (streakBusted) {
      dispatch({ type: 'STREAK_FAIL' });
      navigate('/summary');
      return;
    }
    const isLast = !isStreak && state.currentRoundIndex + 1 >= state.roundsCount;
    dispatch({ type: 'NEXT_ROUND' });
    if (isLast) {
      navigate('/summary');
    }
  };

  const roundNum = state.currentRoundIndex + 1;
  const streakCount = state.rounds.filter((r) => !r.timedOut && r.distanceKm !== null && r.distanceKm <= STREAK_THRESHOLD[state.difficulty]).length;

  // For Daily mode, determine the effective difficulty for imagery
  const effectiveDifficulty = isDaily ? 'Medium' as const : state.difficulty;

  return (
    <div className="game-round">
      {/* ── Maps ── */}
      <div className="game-maps">
        {/* Left: imagery or city name */}
        <div className="map-pane">
          <div className="map-label" aria-hidden="true">
            {isCityHunt
              ? '🏙 Welche Stadt?'
              : isFlagMode
              ? '🏴 Welches Land?'
              : isSilhouetteMode
              ? '🗺 Welches Land?'
              : isZoomIn
              ? '🔍 Zoom In'
              : isZoomOut
              ? '🔭 Zoom Out'
              : '📷 Satellitenansicht'}
          </div>
          {phase === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              {isCountryMode ? 'Lade Land …' : isCityHunt ? 'Lade Stadt …' : 'Lade Standort …'}
            </div>
          )}
          {phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
              ⚠️ Daten konnten nicht geladen werden.
            </div>
          )}
          {target && (phase === 'playing' || phase === 'result') && (
            isFlagMode ? (
              <FlagDisplay countryCode={countryCode ?? ''} continent={continent} difficulty={effectiveDifficulty} />
            ) : isSilhouetteMode ? (
              <SilhouetteDisplay countryCode={countryCode ?? ''} continent={continent} difficulty={effectiveDifficulty} />
            ) : isCityHunt ? (
              <CityNameDisplay city={cityName ?? ''} country={countryName} />
            ) : isZoomMode ? (
              <ZoomImageryMap
                latitude={target.latitude}
                longitude={target.longitude}
                startZoom={isZoomIn ? ZOOM_IN_START[effectiveDifficulty] : ZOOM_OUT_START[effectiveDifficulty]}
                endZoom={isZoomIn ? ZOOM_IN_END[effectiveDifficulty] : ZOOM_OUT_END[effectiveDifficulty]}
                durationSec={ZOOM_DURATION[effectiveDifficulty]}
                running={phase === 'playing'}
                onProgress={setZoomProgress}
              />
            ) : (
              <ImageryMap
                latitude={target.latitude}
                longitude={target.longitude}
                difficulty={effectiveDifficulty}
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
            hideLabels={isCityHunt || isCountryMode}
            distKm={distKm}
          />

          {/* Result overlay — toggleable for mobile */}
          {phase === 'result' && overlayVisible && (
            <div className="result-overlay">
              <button
                className="result-overlay-toggle"
                onClick={() => setOverlayVisible(false)}
                type="button"
                aria-label="Ergebnis ausblenden"
              >
                ✕
              </button>
              {isCountryMode && countryName && (
                <div className="result-country">{countryName}</div>
              )}
              {streakBusted ? (
                <>
                  <h3 style={{ color: 'var(--danger)' }}>Game Over!</h3>
                  <div className="result-distance">{formatDistance(distKm ?? 0)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Threshold: {STREAK_THRESHOLD[state.difficulty]} km
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-glow)', marginTop: '0.5rem' }}>
                    🔥 Streak: {streakCount}
                  </div>
                </>
              ) : guess ? (
                <>
                  <h3>Deine Distanz</h3>
                  <div className="result-distance">{formatDistance(distKm ?? 0)}</div>
                  <div className="result-score">+{formatScore(roundScore)} Punkte</div>
                  <div className="result-time-bonus" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {formatTime(elapsedSec)}{isZen ? ` · +${formatScore(timeBonus)} Zeitbonus` : isZoomMode ? ` · +${formatScore(timeBonus)} Zoom-Bonus` : ''}
                  </div>
                </>
              ) : (
                <>
                  <h3>{isStreak ? 'Game Over!' : 'Zeit abgelaufen!'}</h3>
                  <div className="result-timeout">⏱ Kein Tipp — 0 Punkte</div>
                  {isStreak && (
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-glow)', marginTop: '0.5rem' }}>
                      🔥 Streak: {streakCount}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {phase === 'result' && !overlayVisible && (
            <button
              className="result-overlay-show"
              onClick={() => setOverlayVisible(true)}
              type="button"
              aria-label="Ergebnis einblenden"
            >
              📊
            </button>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="game-footer">
        <div className="game-info">
          {isStreak ? (
            <>
              <div className="game-info-item">
                <span>Streak</span>
                <span>🔥 {streakCount}</span>
              </div>
              <div className="game-info-item">
                <span>Runde</span>
                <span>{roundNum}</span>
              </div>
            </>
          ) : (
            <div className="game-info-item">
              <span>Runde</span>
              <span>{roundNum} / {state.roundsCount}</span>
            </div>
          )}
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
          {isStreak && (
            <div className="game-info-item">
              <span>Max. km</span>
              <span>{STREAK_THRESHOLD[state.difficulty]}</span>
            </div>
          )}
        </div>

        {phase === 'playing' && target && showTimer && (
          <CountdownTimer
            difficulty={isDaily ? 'Medium' : state.difficulty}
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
              {streakBusted
                ? '🏁 Ergebnis anzeigen'
                : !isStreak && roundNum >= state.roundsCount
                ? '🏁 Ergebnis anzeigen'
                : '▶ Nächste Runde'}
            </button>
          </div>
        )}

        <div className="attribution">
          Karte: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
          {!isCityHunt && !isCountryMode && (
            <>&nbsp;|&nbsp;Satellit: <a href="https://www.esri.com" target="_blank" rel="noopener noreferrer">© Esri</a></>
          )}
        </div>
      </footer>
    </div>
  );
}
