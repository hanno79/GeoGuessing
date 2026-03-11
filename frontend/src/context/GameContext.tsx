import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { GameState, GameConfig, RoundResult, LatLng } from '../types';

// ─── State ────────────────────────────────────────────────────────────────────

const initialState: GameState = {
  playerName: '',
  difficulty: 'Medium',
  roundsCount: 5,
  gameMode: 'Classic',
  gameCategory: 'SkyView',
  rounds: [],
  currentRoundIndex: 0,
  phase: 'setup',
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'SUBMIT_GUESS'; guess: LatLng; distanceKm: number; score: number; targetLocation: LatLng; timeTakenSeconds: number | null; cityName?: string; countryName?: string }
  | { type: 'TIMEOUT'; targetLocation: LatLng; timeTakenSeconds?: number }
  | { type: 'NEXT_ROUND' }
  | { type: 'END_GAME' }
  | { type: 'STREAK_FAIL' }
  | { type: 'RESET' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        ...action.config,
        phase: 'playing',
      };

    case 'SUBMIT_GUESS': {
      const round: RoundResult = {
        roundNumber: state.currentRoundIndex + 1,
        targetLocation: action.targetLocation,
        playerGuess: action.guess,
        distanceKm: action.distanceKm,
        score: action.score,
        timedOut: false,
        timeTakenSeconds: action.timeTakenSeconds,
        cityName: action.cityName,
        countryName: action.countryName,
      };
      return { ...state, rounds: [...state.rounds, round], phase: 'result' };
    }

    case 'TIMEOUT': {
      const round: RoundResult = {
        roundNumber: state.currentRoundIndex + 1,
        targetLocation: action.targetLocation,
        playerGuess: null,
        distanceKm: null,
        score: 0,
        timedOut: true,
        timeTakenSeconds: action.timeTakenSeconds ?? null,
      };
      return { ...state, rounds: [...state.rounds, round], phase: 'result' };
    }

    case 'NEXT_ROUND': {
      const nextIndex = state.currentRoundIndex + 1;
      // For Streak mode: no fixed end — always continue
      if (state.gameMode !== 'Streak' && nextIndex >= state.roundsCount) {
        return { ...state, currentRoundIndex: nextIndex, phase: 'summary' };
      }
      return { ...state, currentRoundIndex: nextIndex, phase: 'playing' };
    }

    case 'END_GAME':
      return { ...state, phase: 'summary' };

    case 'STREAK_FAIL':
      return { ...state, phase: 'summary', streakFailed: true };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  totalScore: number;
  avgDistance: number | null;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const totalScore = state.rounds.reduce((sum, r) => sum + r.score, 0);

  const guessedRounds = state.rounds.filter((r) => r.distanceKm !== null);
  const avgDistance =
    guessedRounds.length > 0
      ? guessedRounds.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0) / guessedRounds.length
      : null;

  return (
    <GameContext.Provider value={{ state, dispatch, totalScore, avgDistance }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
