import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import type { Difficulty, RoundsCount, GameMode } from '../types';
import { DIFFICULTY_TIMER, ZEN_TIME_BONUS_WINDOW } from '../types';

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

export default function Home() {
  const { dispatch } = useGame();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError]   = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [roundsCount, setRoundsCount] = useState<RoundsCount>(5);
  const [gameMode, setGameMode] = useState<GameMode>('Classic');

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
    dispatch({ type: 'START_GAME', config: { playerName: playerName.trim(), difficulty, roundsCount, gameMode } });
    navigate('/game');
  }

  return (
    <div className="home">
      <div className="home-hero">
        <h1>Geo<span>Guessing</span></h1>
        <p>Erkenne den Ort auf dem Satellitenbild und markiere ihn auf der Weltkarte.</p>
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
          </div>
          <span className="difficulty-hint">
            {gameMode === 'Classic'
              ? 'Mit Timer — Zeit läuft ab, dann 0 Punkte'
              : `Ohne Timer — Schnelligkeit gibt bis zu 1.000 Bonuspunkte (${ZEN_TIME_BONUS_WINDOW[difficulty]}s Fenster)`}
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
          <span className="difficulty-hint">
            {gameMode === 'Classic' ? DIFFICULTY_DESC_CLASSIC[difficulty] : DIFFICULTY_DESC_ZEN[difficulty]}
          </span>
        </div>

        {/* Rounds */}
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

        <button className="btn btn-primary btn-full btn-lg" onClick={handleStart} type="button">
          🚀 Spiel starten
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {gameMode === 'Classic' ? (
            <>Zeitlimit: <strong>{DIFFICULTY_TIMER[difficulty]} s</strong> pro Runde · {roundsCount} Runden · Max. <strong>{(roundsCount * 5000).toLocaleString('de-DE')}</strong> Punkte</>
          ) : (
            <>Kein Zeitlimit · {roundsCount} Runden · Max. <strong>{(roundsCount * 6000).toLocaleString('de-DE')}</strong> Punkte</>
          )}
        </p>
      </div>
    </div>
  );
}
