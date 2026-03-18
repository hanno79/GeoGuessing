import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import {
  PUZZLE_CORRECT_SCORE,
  PUZZLE_TIME_BONUS_MAX,
  PUZZLE_TIME_WINDOW,
} from '../types';
import type { PuzzleRegion } from '../types';
import { formatScore } from '../utils/scoreCalculator';
import { playSound } from '../utils/soundManager';
import SilhouetteDisplay from './SilhouetteDisplay';
import PuzzleMap from './PuzzleMap';
import CountdownTimer from './CountdownTimer';
import ElapsedTimer from './ElapsedTimer';
import type { GeoJsonObject } from 'geojson';

interface PuzzleCountry {
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

type Phase = 'loading' | 'playing' | 'result' | 'error';

export default function PuzzleRound() {
  const { state, dispatch, totalScore } = useGame();
  const navigate = useNavigate();

  const region = (state.puzzleRegion || 'Europa') as PuzzleRegion;
  const isZen = state.gameMode === 'Zen';
  const isStreak = state.gameMode === 'Streak';
  const showTimer = !isZen && (state.gameMode === 'Classic' || state.gameMode === 'Streak');

  const [phase, setPhase] = useState<Phase>('loading');
  const [countries, setCountries] = useState<PuzzleCountry[]>([]);
  const [geoData, setGeoData] = useState<GeoJsonObject | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCountries, setCorrectCountries] = useState<Set<string>>(new Set());
  const [wrongCountries, setWrongCountries] = useState<Set<string>>(new Set());
  const [roundScore, setRoundScore] = useState(0);
  const [timeBonus, setTimeBonus] = useState(0);
  const [lastWrongCode, setLastWrongCode] = useState<string | null>(null);
  const [showTargetCountryCode, setShowTargetCountryCode] = useState<string | null>(null);
  const [streakBusted, setStreakBusted] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const roundStartTime = useRef<number>(Date.now());
  const timedOut = useRef(false);

  const currentCountry = countries[currentIndex] ?? null;

  // Load puzzle data on mount
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/puzzle/countries?continent=${region}&difficulty=${state.difficulty}`).then((r) => r.json()),
      fetch(`/api/puzzle/geojson?continent=${region}`).then((r) => r.json()),
    ])
      .then(([countriesData, geoJsonData]) => {
        if (cancelled) return;
        const countryList: PuzzleCountry[] = countriesData.countries || [];
        setCountries(countryList);
        setGeoData(geoJsonData);
        setPhase('playing');
        roundStartTime.current = Date.now();
        playSound('start');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryClick = useCallback(
    (clickedCode: string) => {
      if (phase !== 'playing' || !currentCountry) return;

      const elapsed = (Date.now() - roundStartTime.current) / 1000;
      const isCorrect = clickedCode === currentCountry.countryCode;

      if (isCorrect) {
        // Calculate score
        const bonus = isZen
          ? Math.max(0, Math.floor(PUZZLE_TIME_BONUS_MAX * (1 - elapsed / PUZZLE_TIME_WINDOW[state.difficulty])))
          : 0;
        const score = PUZZLE_CORRECT_SCORE + bonus;

        setRoundScore(score);
        setTimeBonus(bonus);
        setLastCorrect(true);
        setLastWrongCode(null);
        setShowTargetCountryCode(null);

        // Mark as correct (green)
        setCorrectCountries((prev) => new Set(prev).add(clickedCode));

        playSound('excellent');

        // Dispatch to game context
        dispatch({
          type: 'SUBMIT_GUESS',
          guess: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
          distanceKm: 0,
          score,
          targetLocation: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
          timeTakenSeconds: Math.floor(elapsed),
          countryName: currentCountry.country,
          cityName: currentCountry.countryCode,
        });

        setPhase('result');
      } else {
        // Wrong country clicked
        setLastCorrect(false);
        setLastWrongCode(clickedCode);

        // Mark the wrong country as wrong (red) — persists across rounds
        setWrongCountries((prev) => new Set(prev).add(clickedCode));

        if (isStreak) {
          // Streak mode: game over
          setStreakBusted(true);
          setShowTargetCountryCode(currentCountry.countryCode);

          dispatch({
            type: 'SUBMIT_GUESS',
            guess: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
            distanceKm: 9999,
            score: 0,
            targetLocation: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
            timeTakenSeconds: Math.floor(elapsed),
            countryName: currentCountry.country,
            cityName: currentCountry.countryCode,
          });

          setRoundScore(0);
          setPhase('result');
          playSound('timeout');
        } else {
          // Classic/Zen: wrong answer, show correct location
          playSound('bad');
          setShowTargetCountryCode(currentCountry.countryCode);

          dispatch({
            type: 'SUBMIT_GUESS',
            guess: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
            distanceKm: 9999,
            score: 0,
            targetLocation: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
            timeTakenSeconds: Math.floor(elapsed),
            countryName: currentCountry.country,
            cityName: currentCountry.countryCode,
          });

          setRoundScore(0);
          setTimeBonus(0);

          // Mark the correct country as "wrong" color (yellow hint) — it was missed
          // The target gets shown via showTargetCountryCode (yellow)
          // But we still mark it as placed so it fills the continent
          setCorrectCountries((prev) => new Set(prev).add(currentCountry.countryCode));
          setPhase('result');
        }
      }
    },
    [phase, currentCountry, dispatch, isZen, isStreak, state.difficulty]
  );

  const handleTimeout = useCallback(() => {
    if (phase !== 'playing' || timedOut.current || !currentCountry) return;
    timedOut.current = true;

    const elapsed = Math.floor((Date.now() - roundStartTime.current) / 1000);
    setRoundScore(0);
    setLastCorrect(false);
    setShowTargetCountryCode(currentCountry.countryCode);
    // Mark as wrong (it was missed)
    setWrongCountries((prev) => new Set(prev).add(currentCountry.countryCode));
    playSound('timeout');

    dispatch({
      type: 'TIMEOUT',
      targetLocation: { latitude: currentCountry.latitude, longitude: currentCountry.longitude },
      timeTakenSeconds: elapsed,
    });

    if (isStreak) {
      setStreakBusted(true);
    }

    setPhase('result');
  }, [phase, currentCountry, dispatch, isStreak]);

  const handleNext = () => {
    if (streakBusted) {
      dispatch({ type: 'STREAK_FAIL' });
      navigate('/summary');
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= countries.length) {
      dispatch({ type: 'END_GAME' });
      navigate('/summary');
      return;
    }

    dispatch({ type: 'NEXT_ROUND' });
    setCurrentIndex(nextIndex);
    setPhase('playing');
    setLastWrongCode(null);
    setShowTargetCountryCode(null);
    setLastCorrect(null);
    timedOut.current = false;
    roundStartTime.current = Date.now();
  };

  const roundNum = currentIndex + 1;
  const totalCountries = countries.length;
  const placedCount = correctCountries.size;
  const correctCount = state.rounds.filter((r) => r.distanceKm === 0).length;

  return (
    <div className="game-round">
      <div className="game-maps">
        {/* Left: Silhouette of current country */}
        <div className="map-pane">
          <div className="map-label" aria-hidden="true">
            🧩 Wo liegt dieses Land?
          </div>
          {phase === 'loading' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Lade Puzzle-Daten ...
            </div>
          )}
          {phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--danger)' }}>
              Puzzle-Daten konnten nicht geladen werden.
            </div>
          )}
          {currentCountry && (phase === 'playing' || phase === 'result') && (
            <SilhouetteDisplay
              countryCode={currentCountry.countryCode}
              difficulty={state.difficulty}
            />
          )}
        </div>

        {/* Right: Puzzle map */}
        <div className="map-pane" style={{ position: 'relative' }}>
          <div className="map-label" aria-hidden="true">
            🗺 {region} — {placedCount}/{totalCountries} platziert
          </div>
          <PuzzleMap
            region={region}
            geoData={geoData}
            correctCountries={correctCountries}
            wrongCountries={wrongCountries}
            interactive={phase === 'playing'}
            onCountryClick={handleCountryClick}
            lastWrongCode={lastWrongCode}
            showTargetCountryCode={showTargetCountryCode}
          />

          {/* Result overlay */}
          {phase === 'result' && (
            <div className="result-overlay">
              {currentCountry && (
                <div className="result-country">{currentCountry.country}</div>
              )}
              {streakBusted ? (
                <>
                  <h3 style={{ color: 'var(--danger)' }}>Game Over!</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Falsches Land angeklickt
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-glow)', marginTop: '0.5rem' }}>
                    🔥 Streak: {correctCount}
                  </div>
                </>
              ) : lastCorrect ? (
                <>
                  <h3 style={{ color: 'var(--success)' }}>Richtig!</h3>
                  <div className="result-score">+{formatScore(roundScore)} Punkte</div>
                  {isZen && timeBonus > 0 && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      +{formatScore(timeBonus)} Zeitbonus
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 style={{ color: 'var(--danger)' }}>
                    {timedOut.current ? 'Zeit abgelaufen!' : 'Falsch!'}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    0 Punkte
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="game-footer">
        <div className="game-info">
          {isStreak ? (
            <>
              <div className="game-info-item">
                <span>Streak</span>
                <span>🔥 {correctCount}</span>
              </div>
              <div className="game-info-item">
                <span>Runde</span>
                <span>{roundNum}</span>
              </div>
            </>
          ) : (
            <div className="game-info-item">
              <span>Land</span>
              <span>{roundNum} / {totalCountries}</span>
            </div>
          )}
          <div className="game-info-item">
            <span>Richtig</span>
            <span style={{ color: 'var(--success)' }}>{correctCount}</span>
          </div>
          <div className="game-info-item">
            <span>Punkte</span>
            <span>{formatScore(totalScore)}</span>
          </div>
          <div className="game-info-item">
            <span>Region</span>
            <span>{region}</span>
          </div>
        </div>

        {phase === 'playing' && currentCountry && showTimer && (
          <CountdownTimer
            difficulty={state.difficulty}
            running={phase === 'playing'}
            onTimeout={handleTimeout}
          />
        )}

        {phase === 'playing' && currentCountry && isZen && (
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
                : currentIndex + 1 >= countries.length
                ? '🏁 Puzzle abschließen'
                : '▶ Nächstes Land'}
            </button>
          </div>
        )}

        <div className="attribution">
          Karte: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
          &nbsp;|&nbsp;<a href="https://carto.com/" target="_blank" rel="noopener noreferrer">© CARTO</a>
        </div>
      </footer>
    </div>
  );
}
