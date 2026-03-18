/**
 * Sound Manager — synthesizes game sounds via Web Audio API.
 * No external audio files needed.
 */

type SoundType = 'excellent' | 'good' | 'bad' | 'timeout' | 'tick' | 'start';

const STORAGE_KEY = 'sound-enabled';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

/** Play a short tone at the given frequency for `duration` ms. */
function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.18,
  startOffset = 0,
) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime + startOffset);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration / 1000);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + startOffset);
  osc.stop(c.currentTime + startOffset + duration / 1000 + 0.05);
}

const sounds: Record<SoundType, () => void> = {
  /** Ascending chime C5→E5→G5 — great guess (<100 km) */
  excellent() {
    resumeCtx();
    tone(523, 120, 'sine', 0.15, 0);
    tone(659, 120, 'sine', 0.15, 0.1);
    tone(784, 200, 'sine', 0.18, 0.2);
  },

  /** Single ding E5 — decent guess (<500 km) */
  good() {
    resumeCtx();
    tone(659, 200, 'sine', 0.15);
  },

  /** Descending tone C4→G3 — bad guess (≥500 km) */
  bad() {
    resumeCtx();
    tone(262, 180, 'sawtooth', 0.08, 0);
    tone(196, 280, 'sawtooth', 0.06, 0.12);
  },

  /** Low buzzer — timeout */
  timeout() {
    resumeCtx();
    tone(150, 350, 'square', 0.06);
  },

  /** Soft tick — timer warning */
  tick() {
    resumeCtx();
    tone(880, 40, 'sine', 0.08);
  },

  /** Soft whoosh via noise burst — round start */
  start() {
    resumeCtx();
    const c = getCtx();
    const bufferSize = c.sampleRate * 0.12;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
    src.stop(c.currentTime + 0.2);
  },
};

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // localStorage unavailable (private browsing, iframe sandbox, etc.)
  }
  if (next) resumeCtx();
  return next;
}

export function playSound(type: SoundType): void {
  if (!isSoundEnabled()) return;
  try {
    sounds[type]();
  } catch {
    // Ignore audio errors (e.g. browser policy)
  }
}

/** Returns the appropriate sound type for a given distance. */
export function soundForDistance(distKm: number): SoundType {
  if (distKm < 100) return 'excellent';
  if (distKm < 500) return 'good';
  return 'bad';
}
