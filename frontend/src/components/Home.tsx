import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { Difficulty, RoundsCount, GameMode, GameCategory, LeaderboardEntry } from '../types';
import { DIFFICULTY_TIMER, ZEN_TIME_BONUS_WINDOW, STREAK_THRESHOLD } from '../types';
import { formatScore } from '../utils/scoreCalculator';

const DIFFICULTY_DESC_CLASSIC: Record<Difficulty, string> = {
  Easy:   '60 s · Weite Ansicht — Landschaften erkennbar',
  Medium: '45 s · Stadtebene — Orientierende Details',
  Hard:   '30 s · Straßenebene — Nur Gebäude & Infrastruktur',
};

const DIFFICULTY_DESC_ZEN: Record<Difficulty, string> = {
  Easy:   'Weite Ansicht — Landschaften erkennbar',
  Medium: 'Stadtebene — Orientierende Details',
  Hard:   'Straßenebene — Nur Gebäude & Infrastruktur',
};

const CITY_DIFFICULTY_DESC_CLASSIC: Record<Difficulty, string> = {
  Easy:   '60 s · Stadtname + Land — Bekannte Metropolen',
  Medium: '45 s · Nur Stadtname — Größere Städte weltweit',
  Hard:   '30 s · Nur Stadtname — Auch weniger bekannte Städte',
};

const CITY_DIFFICULTY_DESC_ZEN: Record<Difficulty, string> = {
  Easy:   'Stadtname + Land — Bekannte Metropolen',
  Medium: 'Nur Stadtname — Größere Städte weltweit',
  Hard:   'Nur Stadtname — Auch weniger bekannte Städte',
};

const COUNTRY_DIFFICULTY_DESC_CLASSIC: Record<Difficulty, string> = {
  Easy:   '60 s · Bekannte Länder · Kontinent als Hinweis',
  Medium: '45 s · Auch weniger bekannte Länder',
  Hard:   '30 s · Alle Länder · Keine Hinweise',
};

const COUNTRY_DIFFICULTY_DESC_ZEN: Record<Difficulty, string> = {
  Easy:   'Bekannte Länder · Kontinent als Hinweis',
  Medium: 'Auch weniger bekannte Länder',
  Hard:   'Alle Länder · Keine Hinweise',
};

const ZOOM_IN_DIFFICULTY_DESC_CLASSIC: Record<Difficulty, string> = {
  Easy:   '60 s · Startet weit weg — zoomt langsam rein',
  Medium: '45 s · Startet sehr weit weg — zoomt auf Stadtebene',
  Hard:   '30 s · Startet sehr weit weg — zoomt auf Straßenebene',
};

const ZOOM_IN_DIFFICULTY_DESC_ZEN: Record<Difficulty, string> = {
  Easy:   'Startet weit weg — zoomt langsam rein',
  Medium: 'Startet sehr weit weg — zoomt auf Stadtebene',
  Hard:   'Startet sehr weit weg — zoomt auf Straßenebene',
};

const ZOOM_OUT_DIFFICULTY_DESC_CLASSIC: Record<Difficulty, string> = {
  Easy:   '60 s · Startet nah dran — zoomt langsam raus',
  Medium: '45 s · Startet sehr nah — zoomt auf Stadtebene',
  Hard:   '30 s · Startet extrem nah — zoomt langsam raus',
};

const ZOOM_OUT_DIFFICULTY_DESC_ZEN: Record<Difficulty, string> = {
  Easy:   'Startet nah dran — zoomt langsam raus',
  Medium: 'Startet sehr nah — zoomt auf Stadtebene',
  Hard:   'Startet extrem nah — zoomt langsam raus',
};

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Home() {
  const { dispatch } = useGame();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError]   = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [roundsCount, setRoundsCount] = useState<RoundsCount>(5);
  const [gameMode, setGameMode] = useState<GameMode>('Classic');
  const [gameCategory, setGameCategory] = useState<GameCategory>('SkyView');
  const [dailyCategory, setDailyCategory] = useState<GameCategory>('SkyView');
  const [showDailyDialog, setShowDailyDialog] = useState(false);
  const [dailyLeaders, setDailyLeaders] = useState<Record<string, LeaderboardEntry | null>>({});
  const [dailyPlayed, setDailyPlayed] = useState<Record<string, boolean>>({});

  // Load daily leaders for all categories
  useEffect(() => {
    const today = todayDateStr();
    for (const cat of ['SkyView', 'CityHunt', 'FlagMode', 'SilhouetteMode', 'ZoomIn', 'ZoomOut'] as GameCategory[]) {
      fetch(`/api/leaderboard?gameMode=Daily&dailyDate=${today}&gameCategory=${cat}&sort=totalScore&order=desc&limit=1`)
        .then((r) => r.json())
        .then((data: LeaderboardEntry[]) => {
          setDailyLeaders((prev) => ({ ...prev, [cat]: data[0] ?? null }));
        })
        .catch(() => {});
    }
  }, []);

  const NAME_REGEX = /^[a-zA-Z0-9\-_]+$/;

  function validateName(value: string): string {
    const t = value.trim();
    if (t.length < 1) return 'Name darf nicht leer sein.';
    if (t.length > 20) return 'Name darf maximal 20 Zeichen haben.';
    if (!NAME_REGEX.test(t)) return 'Nur Buchstaben, Ziffern, - und _ erlaubt.';
    return '';
  }

  function handleStart() {
    const err = validateName(playerName);
    if (err) { setNameError(err); return; }
    dispatch({
      type: 'START_GAME',
      config: {
        playerName: playerName.trim(),
        difficulty,
        roundsCount: gameMode === 'Streak' ? 999 : roundsCount,
        gameMode,
        gameCategory,
      },
    });
    navigate('/game');
  }

  async function handleDailyStart() {
    const err = validateName(playerName);
    if (err) { setNameError(err); return; }

    const name = playerName.trim();
    const today = todayDateStr();

    // Check if player already played this daily challenge
    try {
      const res = await fetch(`/api/daily/check?name=${encodeURIComponent(name)}&date=${today}&category=${dailyCategory}`);
      const data = await res.json();
      if (data.played) {
        setDailyPlayed((prev) => ({ ...prev, [`${name}_${dailyCategory}`]: true }));
        return;
      }
    } catch {
      // If check fails, allow playing (backend will still enforce at save time)
    }

    dispatch({
      type: 'START_GAME',
      config: {
        playerName: name,
        difficulty: 'Medium',
        roundsCount: 5,
        gameMode: 'Daily',
        gameCategory: dailyCategory,
        dailyDate: today,
      },
    });
    setShowDailyDialog(false);
    navigate('/game');
  }

  const isStreak = gameMode === 'Streak';

  const isCountryCategory = gameCategory === 'FlagMode' || gameCategory === 'SilhouetteMode';
  const isZoomCategory = gameCategory === 'ZoomIn' || gameCategory === 'ZoomOut';

  function getDifficultyHint(): string {
    if (isStreak) {
      const threshold = STREAK_THRESHOLD[difficulty];
      const timer = DIFFICULTY_TIMER[difficulty];
      return `${timer} s · Max. ${threshold} km Abweichung`;
    }
    if (isCountryCategory) {
      return gameMode === 'Classic' ? COUNTRY_DIFFICULTY_DESC_CLASSIC[difficulty] : COUNTRY_DIFFICULTY_DESC_ZEN[difficulty];
    }
    if (gameCategory === 'ZoomIn') {
      return gameMode === 'Classic' ? ZOOM_IN_DIFFICULTY_DESC_CLASSIC[difficulty] : ZOOM_IN_DIFFICULTY_DESC_ZEN[difficulty];
    }
    if (gameCategory === 'ZoomOut') {
      return gameMode === 'Classic' ? ZOOM_OUT_DIFFICULTY_DESC_CLASSIC[difficulty] : ZOOM_OUT_DIFFICULTY_DESC_ZEN[difficulty];
    }
    if (gameCategory === 'SkyView') {
      return gameMode === 'Classic' ? DIFFICULTY_DESC_CLASSIC[difficulty] : DIFFICULTY_DESC_ZEN[difficulty];
    }
    return gameMode === 'Classic' ? CITY_DIFFICULTY_DESC_CLASSIC[difficulty] : CITY_DIFFICULTY_DESC_ZEN[difficulty];
  }

  return (
    <div className="home">
      <div className="home-hero">
        <h1>Geo<span>Guessing</span></h1>
        <p>
          {gameCategory === 'SkyView'
            ? 'Erkenne den Ort auf dem Satellitenbild und markiere ihn auf der Weltkarte.'
            : gameCategory === 'CityHunt'
            ? 'Finde die Stadt auf der Weltkarte — nur anhand des Namens!'
            : gameCategory === 'FlagMode'
            ? 'Erkenne das Land anhand seiner Flagge und markiere es auf der Weltkarte.'
            : gameCategory === 'SilhouetteMode'
            ? 'Erkenne das Land anhand seiner Umrisse und markiere es auf der Weltkarte.'
            : gameCategory === 'ZoomIn'
            ? 'Das Bild zoomt langsam rein — rate so früh wie möglich für Bonus-Punkte!'
            : gameCategory === 'ZoomOut'
            ? 'Das Bild zoomt langsam raus — rate so früh wie möglich für Bonus-Punkte!'
            : 'Erkenne den Ort und markiere ihn auf der Weltkarte.'}
        </p>
      </div>

      {/* Daily Challenge Card */}
      <div className="card daily-card" style={{ textAlign: 'center', border: '1px solid var(--accent)', background: 'rgba(31,111,235,0.06)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          📅 Tägliche Challenge
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Jeden Tag 5 gleiche Orte für alle Spieler. Nur ein Versuch!
        </p>
        {!showDailyDialog ? (
          <button className="btn btn-primary" onClick={() => setShowDailyDialog(true)} type="button">
            Heute spielen
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            <div className="option-group" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className={`option-btn ${dailyCategory === 'SkyView' ? 'selected' : ''}`}
                onClick={() => setDailyCategory('SkyView')}
                type="button"
              >
                🛰 SkyView
              </button>
              <button
                className={`option-btn ${dailyCategory === 'CityHunt' ? 'selected' : ''}`}
                onClick={() => setDailyCategory('CityHunt')}
                type="button"
              >
                🏙 CityHunt
              </button>
              <button
                className={`option-btn ${dailyCategory === 'FlagMode' ? 'selected' : ''}`}
                onClick={() => setDailyCategory('FlagMode')}
                type="button"
              >
                🏴 Flaggen
              </button>
              <button
                className={`option-btn ${dailyCategory === 'SilhouetteMode' ? 'selected' : ''}`}
                onClick={() => setDailyCategory('SilhouetteMode')}
                type="button"
              >
                🗺 Silhouette
              </button>
              <button
                className={`option-btn ${dailyCategory === 'ZoomIn' ? 'selected' : ''}`}
                onClick={() => setDailyCategory('ZoomIn')}
                type="button"
              >
                🔍 ZoomIn
              </button>
              <button
                className={`option-btn ${dailyCategory === 'ZoomOut' ? 'selected' : ''}`}
                onClick={() => setDailyCategory('ZoomOut')}
                type="button"
              >
                🔭 ZoomOut
              </button>
            </div>
            {dailyPlayed[`${playerName.trim()}_${dailyCategory}`] ? (
              <p style={{ color: 'var(--warning)', fontSize: '0.85rem', margin: 0 }}>
                Du hast die heutige {dailyCategory === 'FlagMode' ? 'Flaggen' : dailyCategory === 'SilhouetteMode' ? 'Silhouette' : dailyCategory === 'ZoomIn' ? 'ZoomIn' : dailyCategory === 'ZoomOut' ? 'ZoomOut' : dailyCategory} Challenge bereits gespielt.
              </p>
            ) : (
              <button className="btn btn-success" onClick={handleDailyStart} type="button">
                📅 Challenge starten
              </button>
            )}
          </div>
        )}

        {/* Current leader */}
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {(() => {
            const leader = dailyLeaders[dailyCategory];
            if (leader === undefined) return null;
            if (leader === null) return <span>Noch kein Ergebnis heute — sei der Erste!</span>;
            return <span>🥇 <strong>{leader.name}</strong> — {formatScore(leader.totalScore)} Punkte</span>;
          })()}
        </div>

        {/* Link to daily leaderboard */}
        <button
          className="btn btn-secondary"
          style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          onClick={() => navigate('/leaderboard?gameMode=Daily')}
          type="button"
        >
          📊 Alle Ergebnisse
        </button>
      </div>

      <div className="card">
        {/* Player name */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="player-name">Spielername</label>
          <input
            id="player-name"
            type="text"
            maxLength={20}
            placeholder="Dein Name …"
            value={playerName}
            className={nameError ? 'error' : ''}
            onChange={(e) => { setPlayerName(e.target.value); setNameError(''); }}
            onBlur={() => setNameError(validateName(playerName))}
            aria-describedby={nameError ? 'name-error' : undefined}
          />
          {nameError && <span id="name-error" className="form-error" role="alert">{nameError}</span>}
        </div>

        {/* Game Category */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Spielkategorie</label>
          <div className="option-group" role="group" aria-label="Spielkategorie" style={{ flexWrap: 'wrap' }}>
            <button
              className={`option-btn ${gameCategory === 'SkyView' ? 'selected' : ''}`}
              onClick={() => setGameCategory('SkyView')}
              aria-pressed={gameCategory === 'SkyView'}
              type="button"
            >
              🛰 SkyView
            </button>
            <button
              className={`option-btn ${gameCategory === 'CityHunt' ? 'selected' : ''}`}
              onClick={() => setGameCategory('CityHunt')}
              aria-pressed={gameCategory === 'CityHunt'}
              type="button"
            >
              🏙 CityHunt
            </button>
            <button
              className={`option-btn ${gameCategory === 'FlagMode' ? 'selected' : ''}`}
              onClick={() => setGameCategory('FlagMode')}
              aria-pressed={gameCategory === 'FlagMode'}
              type="button"
            >
              🏴 Flaggen
            </button>
            <button
              className={`option-btn ${gameCategory === 'SilhouetteMode' ? 'selected' : ''}`}
              onClick={() => setGameCategory('SilhouetteMode')}
              aria-pressed={gameCategory === 'SilhouetteMode'}
              type="button"
            >
              🗺 Silhouette
            </button>
            <button
              className={`option-btn ${gameCategory === 'ZoomIn' ? 'selected' : ''}`}
              onClick={() => setGameCategory('ZoomIn')}
              aria-pressed={gameCategory === 'ZoomIn'}
              type="button"
            >
              🔍 ZoomIn
            </button>
            <button
              className={`option-btn ${gameCategory === 'ZoomOut' ? 'selected' : ''}`}
              onClick={() => setGameCategory('ZoomOut')}
              aria-pressed={gameCategory === 'ZoomOut'}
              type="button"
            >
              🔭 ZoomOut
            </button>
          </div>
          <span className="difficulty-hint">
            {gameCategory === 'SkyView'
              ? 'Erkenne Orte anhand von Satellitenbildern'
              : gameCategory === 'CityHunt'
              ? 'Finde Städte auf der Weltkarte anhand ihres Namens'
              : gameCategory === 'FlagMode'
              ? 'Erkenne Länder anhand ihrer Flagge'
              : gameCategory === 'SilhouetteMode'
              ? 'Erkenne Länder anhand ihrer Umrisse'
              : gameCategory === 'ZoomIn'
              ? 'Das Bild zoomt rein — rate früh für mehr Punkte'
              : gameCategory === 'ZoomOut'
              ? 'Das Bild zoomt raus — rate früh für mehr Punkte'
              : 'Erkenne Orte anhand von Satellitenbildern'}
          </span>
        </div>

        {/* Game Mode */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Spielmodus</label>
          <div className="option-group" role="group" aria-label="Spielmodus">
            <button
              className={`option-btn ${gameMode === 'Classic' ? 'selected' : ''}`}
              onClick={() => setGameMode('Classic')}
              aria-pressed={gameMode === 'Classic'}
              type="button"
            >
              ⏱ Classic
            </button>
            <button
              className={`option-btn ${gameMode === 'Zen' ? 'selected' : ''}`}
              onClick={() => setGameMode('Zen')}
              aria-pressed={gameMode === 'Zen'}
              type="button"
            >
              🧘 Zen
            </button>
            <button
              className={`option-btn ${gameMode === 'Streak' ? 'selected' : ''}`}
              onClick={() => setGameMode('Streak')}
              aria-pressed={gameMode === 'Streak'}
              type="button"
            >
              🔥 Streak
            </button>
          </div>
          <span className="difficulty-hint">
            {gameMode === 'Classic'
              ? 'Mit Timer — Zeit läuft ab, dann 0 Punkte'
              : gameMode === 'Zen'
              ? `Ohne Timer — Schnelligkeit gibt bis zu 1.000 Bonuspunkte (${ZEN_TIME_BONUS_WINDOW[difficulty]}s Fenster)`
              : `Endlosmodus — Ein Fehler und es ist vorbei! Max. ${STREAK_THRESHOLD[difficulty]} km Abweichung`}
          </span>
        </div>

        {/* Difficulty */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label>Schwierigkeitsgrad</label>
          <div className="option-group" role="group" aria-label="Schwierigkeitsgrad">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`option-btn ${difficulty === d ? 'selected' : ''}`}
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                type="button"
              >
                {d === 'Easy' ? '😊 Leicht' : d === 'Medium' ? '🔥 Mittel' : '💀 Schwer'}
              </button>
            ))}
          </div>
          <span className="difficulty-hint">{getDifficultyHint()}</span>
        </div>

        {/* Rounds (hidden for Streak) */}
        {!isStreak && (
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Rundenanzahl</label>
            <div className="option-group" role="group" aria-label="Rundenanzahl">
              {([3, 5, 7] as RoundsCount[]).map((r) => (
                <button
                  key={r}
                  className={`option-btn ${roundsCount === r ? 'selected' : ''}`}
                  onClick={() => setRoundsCount(r)}
                  aria-pressed={roundsCount === r}
                  type="button"
                >
                  {r} Runden
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-full btn-lg" onClick={handleStart} type="button">
          🚀 Spiel starten
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {isStreak ? (
            <>Endlosmodus · Max. <strong>{STREAK_THRESHOLD[difficulty]} km</strong> Abweichung · Timer: <strong>{DIFFICULTY_TIMER[difficulty]} s</strong></>
          ) : gameMode === 'Classic' ? (
            <>Zeitlimit: <strong>{DIFFICULTY_TIMER[difficulty]} s</strong> pro Runde · {roundsCount} Runden · Max. <strong>{(roundsCount * 5000).toLocaleString('de-DE')}</strong> Punkte</>
          ) : (
            <>Kein Zeitlimit · {roundsCount} Runden · Max. <strong>{(roundsCount * 5000).toLocaleString('de-DE')}</strong> Punkte</>
          )}
        </p>
      </div>
    </div>
  );
}
