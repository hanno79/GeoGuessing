import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { isSoundEnabled, toggleSound } from '../utils/soundManager';

export default function Layout() {
  const { state } = useGame();
  const location = useLocation();
  const isGameRoute = location.pathname === '/game';
  const [soundOn, setSoundOn] = useState(isSoundEnabled);

  function handleSoundToggle() {
    const next = toggleSound();
    setSoundOn(next);
  }

  return (
    <div className="layout">
      <nav className="navbar" role="navigation" aria-label="Hauptnavigation">
        <NavLink to="/" className="navbar-brand" aria-label="GeoGuessing Startseite">
          <span role="img" aria-hidden="true">🌍</span> GeoGuessing
        </NavLink>
        <div className="navbar-links">
          <NavLink to="/" end aria-label="Startseite">
            <span aria-hidden="true">🏠</span> <span>Start</span>
          </NavLink>
          {state.phase !== 'setup' && (
            <NavLink to="/game" aria-label="Spiel">
              <span aria-hidden="true">🎮</span> <span>Spiel</span>
            </NavLink>
          )}
          <NavLink to="/leaderboard" aria-label="Bestenliste">
            <span aria-hidden="true">🏆</span> <span>Bestenliste</span>
          </NavLink>
          <NavLink to="/discover" aria-label="Entdecken">
            <span aria-hidden="true">✨</span> <span>Entdecken</span>
          </NavLink>
          <button
            className="sound-toggle"
            onClick={handleSoundToggle}
            aria-label={soundOn ? 'Sound ausschalten' : 'Sound einschalten'}
            title={soundOn ? 'Sound ausschalten' : 'Sound einschalten'}
            type="button"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </nav>

      <main className={`main-content${isGameRoute ? ' full-width' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
