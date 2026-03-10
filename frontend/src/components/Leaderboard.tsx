import { useEffect, useState, useCallback } from 'react';
import type { LeaderboardEntry, Difficulty, GameMode, GameCategory } from '../types';
import { formatDistance, formatScore, formatTime } from '../utils/scoreCalculator';

type SortKey = keyof Pick<LeaderboardEntry, 'totalScore' | 'scorePerRound' | 'avgDistanceKm' | 'timestamp' | 'name' | 'roundsCount' | 'totalTimeTakenSeconds'>;
type SortDir = 'asc' | 'desc';

const DIFFICULTIES: (Difficulty | '')[] = ['', 'Easy', 'Medium', 'Hard'];
const ROUNDS_OPTIONS = ['', '3', '5', '7'];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [rounds, setRounds] = useState('');
  const [gameMode, setGameMode] = useState<GameMode | ''>('');
  const [gameCategory, setGameCategory] = useState<GameCategory | ''>('');
  const [sort, setSort] = useState<SortKey>('scorePerRound');
  const [order, setOrder] = useState<SortDir>('desc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (rounds) params.set('roundsCount', rounds);
    if (gameMode) params.set('gameMode', gameMode);
    if (gameCategory) params.set('gameCategory', gameCategory);
    params.set('sort', sort);
    params.set('order', order);

    try {
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error('Server-Fehler');
      const data: LeaderboardEntry[] = await res.json();
      setEntries(data);
    } catch (e) {
      setError('Fehler beim Laden des Leaderboards. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }, [difficulty, rounds, gameMode, gameCategory, sort, order]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(key);
      setOrder(key === 'avgDistanceKm' || key === 'totalTimeTakenSeconds' ? 'asc' : 'desc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sort !== key) return ' ↕';
    return order === 'desc' ? ' ↓' : ' ↑';
  }

  function rankClass(i: number) {
    if (i === 0) return 'gold';
    if (i === 1) return 'silver';
    if (i === 2) return 'bronze';
    return '';
  }

  return (
    <div className="leaderboard">
      <h1>🏆 Bestenliste</h1>

      {/* Filters */}
      <div className="lb-filters card">
        <div className="lb-filter-group">
          <label htmlFor="lb-difficulty">Schwierigkeit</label>
          <select
            id="lb-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}
          >
            <option value="">Alle</option>
            {DIFFICULTIES.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="lb-filter-group">
          <label htmlFor="lb-rounds">Rundenanzahl</label>
          <select
            id="lb-rounds"
            value={rounds}
            onChange={(e) => setRounds(e.target.value)}
          >
            <option value="">Alle</option>
            {ROUNDS_OPTIONS.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r} Runden</option>
            ))}
          </select>
        </div>

        <div className="lb-filter-group">
          <label htmlFor="lb-category">Kategorie</label>
          <select
            id="lb-category"
            value={gameCategory}
            onChange={(e) => setGameCategory(e.target.value as GameCategory | '')}
          >
            <option value="">Alle</option>
            <option value="SkyView">🛰 SkyView</option>
            <option value="CityHunt">🏙 CityHunt</option>
          </select>
        </div>

        <div className="lb-filter-group">
          <label htmlFor="lb-gamemode">Spielmodus</label>
          <select
            id="lb-gamemode"
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode | '')}
          >
            <option value="">Alle</option>
            <option value="Classic">Classic</option>
            <option value="Zen">Zen</option>
          </select>
        </div>

        <button className="btn btn-secondary" onClick={load} type="button" style={{ alignSelf: 'flex-end' }}>
          🔄 Aktualisieren
        </button>
      </div>

      {/* Table */}
      {loading && <div className="lb-loading" aria-live="polite">Lade Daten …</div>}
      {error && <div className="lb-error" role="alert">{error}</div>}

      {!loading && !error && entries.length === 0 && (
        <div className="lb-empty">
          <p>Noch keine Einträge für diese Filter.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Spiel eine Runde und speichere deinen Score!</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="lb-table-wrap">
          <table className="lb-table" aria-label="Bestenliste">
            <thead>
              <tr>
                <th>#</th>
                <th
                  className={sort === 'name' ? 'sorted' : ''}
                  onClick={() => toggleSort('name')}
                  aria-sort={sort === 'name' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Name{sortIndicator('name')}
                </th>
                <th
                  className={sort === 'totalScore' ? 'sorted' : ''}
                  onClick={() => toggleSort('totalScore')}
                  aria-sort={sort === 'totalScore' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Score{sortIndicator('totalScore')}
                </th>
                <th
                  className={sort === 'scorePerRound' ? 'sorted' : ''}
                  onClick={() => toggleSort('scorePerRound')}
                  aria-sort={sort === 'scorePerRound' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  Ø Punkte{sortIndicator('scorePerRound')}
                </th>
                <th>Kategorie</th>
                <th>Modus</th>
                <th>Schwierigkeit</th>
                <th
                  className={sort === 'roundsCount' ? 'sorted' : ''}
                  onClick={() => toggleSort('roundsCount')}
                >
                  Runden{sortIndicator('roundsCount')}
                </th>
                <th
                  className={sort === 'avgDistanceKm' ? 'sorted' : ''}
                  onClick={() => toggleSort('avgDistanceKm')}
                >
                  Ø Distanz{sortIndicator('avgDistanceKm')}
                </th>
                <th
                  className={sort === 'totalTimeTakenSeconds' ? 'sorted' : ''}
                  onClick={() => toggleSort('totalTimeTakenSeconds')}
                >
                  Zeit{sortIndicator('totalTimeTakenSeconds')}
                </th>
                <th
                  className={sort === 'timestamp' ? 'sorted' : ''}
                  onClick={() => toggleSort('timestamp')}
                >
                  Datum{sortIndicator('timestamp')}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id}>
                  <td className={`lb-rank ${rankClass(i)}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td className="lb-name">{e.name}</td>
                  <td className="lb-score">{formatScore(e.totalScore)}</td>
                  <td className="lb-score">{formatScore(Math.round(e.scorePerRound))}</td>
                  <td><span className="lb-category">{e.gameCategory === 'CityHunt' ? '🏙' : '🛰'}</span></td>
                  <td><span className={`lb-mode`}>{e.gameMode ?? 'Classic'}</span></td>
                  <td><span className={`lb-diff ${e.difficulty}`}>{e.difficulty}</span></td>
                  <td>{e.roundsCount}</td>
                  <td>{e.avgDistanceKm !== null ? formatDistance(e.avgDistanceKm) : '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {e.totalTimeTakenSeconds != null ? formatTime(e.totalTimeTakenSeconds) : '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {formatDate(e.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
