import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Layout() {
  const { state } = useGame();
  const location = useLocation();
  const isGameRoute = location.pathname === '/game';

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
        </div>
      </nav>

      <main className={`main-content${isGameRoute ? ' full-width' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
