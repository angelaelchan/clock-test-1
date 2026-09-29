import { useEffect, useRef } from 'react';

/**
 * The single requestAnimationFrame loop that drives all time-based state.
 * Calls `onFrame(dtRealMs, nowMs)` once per frame. Pauses while the tab is
 * hidden and resumes without a catch-up jump when it becomes visible again.
 */
export function useGameLoop(onFrame: (dtReal: number, now: number) => void) {
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    let raf = 0;
    let last: number | null = null;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (last !== null) onFrameRef.current(now - last, now);
      last = now;
    };
    const start = () => {
      last = null;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => cancelAnimationFrame(raf);
    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : start());

    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
