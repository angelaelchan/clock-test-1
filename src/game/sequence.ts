import { CONFIG } from '../config';
import type { GameState } from './gameState';

// SPEC §10: the game-over and restart timelines. Every visual here is a pure
// function of (status, seqMs), where seqMs is real time since the sequence began
// and is advanced by the one game loop.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

/** When the modal starts popping in, measured from the start of fallingAsleep. */
export const MODAL_START_MS = CONFIG.SLEEP_HOLD_MS + CONFIG.MODAL_DELAY_MS;
/** Length of the restart transition; play resumes once the overlay is clear. */
export const WAKE_TOTAL_MS = CONFIG.MODAL_OUT_MS + CONFIG.RESTART_OVERLAY_FADE_MS;

/** Overlay opacity while falling asleep / ended: hold full black, then fade to the end-screen level. */
export function asleepDim(seqMs: number): number {
  if (seqMs < CONFIG.SLEEP_HOLD_MS) return 1;
  const t = clamp01((seqMs - CONFIG.SLEEP_HOLD_MS) / CONFIG.END_OVERLAY_FADE_MS);
  return lerp(1, CONFIG.END_OVERLAY_OPACITY, easeInOutSine(t));
}

/** Overlay opacity while waking: wait for the modal to leave, then fade to clear. */
export function wakingDim(seqMs: number): number {
  const t = clamp01((seqMs - CONFIG.MODAL_OUT_MS) / CONFIG.RESTART_OVERLAY_FADE_MS);
  return lerp(CONFIG.END_OVERLAY_OPACITY, 0, easeInOutSine(t));
}

export type ModalView = { opacity: number; scale: number; y: number; interactive: boolean };

/** End modal pop-in (ease-out-back) and fade/scale-out. Null when it isn't on screen. */
export function modalView(state: GameState): ModalView | null {
  const { status, seqMs } = state;
  if (status === 'fallingAsleep' || status === 'ended') {
    if (seqMs < MODAL_START_MS) return null;
    const t = clamp01((seqMs - MODAL_START_MS) / CONFIG.MODAL_IN_MS);
    const p = easeOutBack(t);
    return {
      opacity: easeOutCubic(t),
      scale: lerp(CONFIG.MODAL_SCALE_FROM, 1, p),
      y: lerp(CONFIG.MODAL_Y_FROM_PX, 0, p),
      interactive: status === 'ended',
    };
  }
  if (status === 'waking' && seqMs < CONFIG.MODAL_OUT_MS) {
    const t = seqMs / CONFIG.MODAL_OUT_MS;
    return { opacity: 1 - easeOutCubic(t), scale: lerp(1, CONFIG.MODAL_SCALE_OUT_TO, t), y: 0, interactive: false };
  }
  return null;
}

/**
 * Which time the clock hands show, and their opacity. On restart the hands fade
 * out at the old time and back in at the new one, so they never spin backward.
 * The fade runs as the overlay starts clearing, so it's visible.
 */
export function clockView(state: GameState): { timeMs: number; opacity: number } {
  if (state.status === 'waking' && state.prevGameTimeMs !== null) {
    const s = state.seqMs - CONFIG.MODAL_OUT_MS;
    const half = CONFIG.HANDS_FADE_MS / 2;
    if (s < half) return { timeMs: state.prevGameTimeMs, opacity: 1 - clamp01(s / half) };
    if (s < CONFIG.HANDS_FADE_MS) return { timeMs: state.gameTimeMs, opacity: (s - half) / half };
  }
  return { timeMs: state.gameTimeMs, opacity: 1 };
}
