import { useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../types';
import { DIFFICULTY_TIMER } from '../types';
import { playSound } from '../utils/soundManager';

interface Props {
  difficulty: Difficulty;
  running: boolean;
  onTimeout: () => void;
  durationOverride?: number;
}

export default function CountdownTimer({ difficulty, running, onTimeout, durationOverride }: Props) {
  const total = durationOverride ?? DIFFICULTY_TIMER[difficulty];
  const [remaining, setRemaining] = useState(total);
  const timeoutCalled = useRef(false);

  // Reset when difficulty changes (new round)
  useEffect(() => {
    setRemaining(total);
    timeoutCalled.current = false;
  }, [total]);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!timeoutCalled.current) {
            timeoutCalled.current = true;
            onTimeout();
          }
          return 0;
        }
        const next = prev - 1;
        if (next <= 5 && next > 0) playSound('tick');
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, onTimeout]);

  const pct = Math.max(0, (remaining / total) * 100);
  const valueClass = remaining <= 10 ? 'danger' : remaining <= 20 ? 'warning' : '';
  const barColor = remaining <= 10 ? 'var(--danger)' : remaining <= 20 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="timer" role="timer" aria-label={`Verbleibende Zeit: ${remaining} Sekunden`}>
      <span className="timer-icon" aria-hidden="true">⏱</span>
      <span className={`timer-value ${valueClass}`} aria-live="polite">{remaining}s</span>
      <div className="timer-bar-wrap" aria-hidden="true">
        <div
          className="timer-bar"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
