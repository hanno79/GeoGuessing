import { useEffect, useState } from 'react';
import { formatTime } from '../utils/scoreCalculator';

interface Props {
  running: boolean;
  startTime: number;
}

export default function ElapsedTimer({ running, startTime }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;

    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [running, startTime]);

  const valueClass = elapsed >= 90 ? 'danger' : elapsed >= 45 ? 'warning' : '';

  return (
    <div className="timer" role="timer" aria-label={`Verstrichene Zeit: ${elapsed} Sekunden`}>
      <span className="timer-icon" aria-hidden="true">⏱</span>
      <span className={`timer-value ${valueClass}`} aria-live="polite">{formatTime(elapsed)}</span>
    </div>
  );
}
