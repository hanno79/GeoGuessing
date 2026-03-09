import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import GameRound from './components/GameRound';
import GameSummary from './components/GameSummary';
import Leaderboard from './components/Leaderboard';
import Discover from './components/Discover';
import { useGame } from './context/GameContext';

function GameGuard({ children }: { children: React.ReactNode }) {
  const { state } = useGame();
  if (state.phase === 'setup') return <Navigate to="/" replace />;
  if (state.phase === 'summary') return <Navigate to="/summary" replace />;
  return <>{children}</>;
}

function SummaryGuard({ children }: { children: React.ReactNode }) {
  const { state } = useGame();
  if (state.phase !== 'summary') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route
          path="/game"
          element={
            <GameGuard>
              <GameRound />
            </GameGuard>
          }
        />
        <Route
          path="/summary"
          element={
            <SummaryGuard>
              <GameSummary />
            </SummaryGuard>
          }
        />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
