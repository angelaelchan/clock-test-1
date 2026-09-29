import { CONFIG } from '../config';
import { asleepDim, MODAL_START_MS, WAKE_TOTAL_MS, wakingDim } from './sequence';

// SPEC §3. Two clocks: real time (dt between frames) and game time (dt × speed).

// 'waking' is the restart transition (SPEC §10.3): the game has been reset but
// time stays frozen until the overlay has cleared.
export type Status = 'playing' | 'fallingAsleep' | 'ended' | 'waking';
export type Speed = number; // SPEED_NORMAL or SPEED_FAST (debug panel can set others)
export type Mood = 'happy' | 'tired' | 'sleeping';

export type GameState = {
  status: Status;
  gameTimeMs: number; // ms since local midnight on the start day; only time-of-day matters
  speed: Speed;
  caffeineMin: number; // caffeine remaining, in GAME minutes
  wakeMs: number; // game time elapsed since this run started
  mood: Mood; // stateful for hysteresis (SPEC §8.1)
  dim: number; // displayed dim-overlay opacity, smoothed toward dimTarget() (SPEC §4)
  seqMs: number; // real ms since the current game-over / restart sequence began (SPEC §10)
  endedWakeMs: number; // wake count frozen at game over, for the End modal
  prevGameTimeMs: number | null; // clock time before a restart, so the hands can fade instead of rewinding
};

export type GameAction =
  | { type: 'tick'; dtReal: number }
  | { type: 'feed'; minutes: number }
  | { type: 'setSpeed'; speed: Speed }
  | { type: 'startFallingAsleep' }
  | { type: 'restart' }
  | { type: 'debugSet'; patch: Partial<Pick<GameState, 'gameTimeMs' | 'caffeineMin' | 'speed'>> };

const MS_PER_MIN = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MIN;

function startTimeMs(): number {
  if (CONFIG.START_TIME_MODE === 'fixed') {
    const [h, m] = CONFIG.FIXED_START.split(':').map(Number);
    return (h * 60 + m) * MS_PER_MIN;
  }
  const now = new Date();
  return ((now.getHours() * 60 + now.getMinutes()) * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
}

export function initialState(): GameState {
  return {
    status: 'playing',
    gameTimeMs: startTimeMs(),
    speed: CONFIG.SPEED_NORMAL,
    caffeineMin: CONFIG.CAFFEINE_START_MIN,
    wakeMs: 0,
    mood: 'happy',
    dim: 0,
    seqMs: 0,
    endedWakeMs: 0,
    prevGameTimeMs: null,
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Dim-overlay opacity the caffeine level calls for: easeInQuad below DIM_START_MIN (SPEC §4). */
export function dimTarget(caffeineMin: number): number {
  const t = clamp01(1 - caffeineMin / CONFIG.DIM_START_MIN);
  return t * t;
}

/** Tired below TIRED_BELOW_MIN, back to happy only above HAPPY_ABOVE_MIN (SPEC §8.1). */
export function nextMood(mood: Mood, caffeineMin: number): Mood {
  if (mood === 'happy' && caffeineMin < CONFIG.TIRED_BELOW_MIN) return 'tired';
  if (mood === 'tired' && caffeineMin > CONFIG.HAPPY_ABOVE_MIN) return 'happy';
  return mood;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick': {
      // Clamp dt so a backgrounded tab doesn't insta-kill.
      const dtReal = Math.min(action.dtReal, CONFIG.MAX_FRAME_DT_MS);

      // Game over (SPEC §10.1): black hold, sleeping swap, fade to the end-screen overlay.
      if (state.status === 'fallingAsleep' || state.status === 'ended') {
        const seqMs = state.seqMs + dtReal;
        return {
          ...state,
          seqMs,
          status: seqMs >= MODAL_START_MS ? 'ended' : 'fallingAsleep',
          mood: seqMs >= CONFIG.SLEEP_HOLD_MS ? 'sleeping' : state.mood,
          dim: asleepDim(seqMs),
        };
      }

      // Restart (SPEC §10.3): modal out, overlay clears, she wakes; then play resumes.
      if (state.status === 'waking') {
        const seqMs = state.seqMs + dtReal;
        if (seqMs >= WAKE_TOTAL_MS) return { ...state, status: 'playing', seqMs: 0, dim: 0, prevGameTimeMs: null };
        return {
          ...state,
          seqMs,
          mood: seqMs >= CONFIG.MODAL_OUT_MS ? 'happy' : 'sleeping',
          dim: wakingDim(seqMs),
        };
      }

      let next = state;
      if (state.status === 'playing') {
        const gameDt = dtReal * state.speed;
        const caffeineMin = Math.max(
          0,
          state.caffeineMin - CONFIG.CAFFEINE_DRAIN_PER_GAME_MIN * (gameDt / MS_PER_MIN),
        );
        next = {
          ...state,
          gameTimeMs: state.gameTimeMs + gameDt,
          wakeMs: state.wakeMs + gameDt,
          caffeineMin,
          mood: nextMood(state.mood, caffeineMin),
        };
        if (caffeineMin === 0) return gameReducer(next, { type: 'startFallingAsleep' });
      }
      // The overlay eases toward its target in REAL time, so feeding brightens
      // the screen over ~600 ms instead of snapping.
      const k = 1 - Math.exp(-dtReal / CONFIG.DIM_SMOOTHING_MS);
      const dim = next.dim + (dimTarget(next.caffeineMin) - next.dim) * k;
      return dim === next.dim ? next : { ...next, dim };
    }
    case 'feed': {
      if (state.status !== 'playing') return state;
      const caffeineMin = Math.min(CONFIG.CAFFEINE_MAX_MIN, state.caffeineMin + action.minutes);
      return { ...state, caffeineMin, mood: nextMood(state.mood, caffeineMin) };
    }
    case 'setSpeed':
      if (state.status !== 'playing') return state;
      return { ...state, speed: action.speed };
    case 'startFallingAsleep':
      // Freeze everything; the overlay is at full black from here (SPEC §10.1 steps 1–2).
      return { ...state, status: 'fallingAsleep', seqMs: 0, dim: 1, endedWakeMs: state.wakeMs };
    case 'restart':
      if (state.status !== 'ended') return state;
      return {
        ...initialState(),
        status: 'waking',
        mood: 'sleeping',
        dim: state.dim,
        endedWakeMs: state.endedWakeMs, // the modal still shows it while fading out
        prevGameTimeMs: state.gameTimeMs,
      };
    case 'debugSet':
      return { ...state, ...action.patch };
  }
}

export type TimeOfDay = { h: number; m: number; s: number; ms: number; hours: number };

/** Breaks game time into local time-of-day parts; `hours` is fractional (0–24). */
export function timeOfDay(gameTimeMs: number): TimeOfDay {
  const t = ((gameTimeMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  const ms = t % 1000;
  const totalS = Math.floor(t / 1000);
  return {
    h: Math.floor(totalS / 3600),
    m: Math.floor(totalS / 60) % 60,
    s: totalS % 60,
    ms,
    hours: t / (60 * MS_PER_MIN),
  };
}

/**
 * Clock hand angles in degrees, clockwise from 12 (SPEC §5). Continuous, so
 * the hands sweep smoothly at any speed.
 */
export function handAngles(gameTimeMs: number) {
  const { h, m, s, ms } = timeOfDay(gameTimeMs);
  const sec = s + ms / 1000;
  return {
    hour: ((h % 12) + m / 60 + sec / 3600) * 30,
    minute: (m + sec / 60) * 6,
    second: sec * 6,
  };
}

export const wakeMinutes =(state: GameState) => state.wakeMs / MS_PER_MIN;
