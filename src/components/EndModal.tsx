import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { ModalView } from '../game/sequence';
import { usePrefersReducedMotion } from '../game/usePrefersReducedMotion';

type Props = {
  view: ModalView;
  wakeText: string;
  onRestart: () => void;
};

// Figma 11:121 (856×530 at (328, 226)), title 11:116, count 11:119, button 11:123
// (349×86). Offsets below are relative to the modal box. The Figma button is an
// empty rectangle; it's rendered as a real "Restart Game" button (SPEC §2).
export function EndModal({ view, wakeText, onRestart }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reduced = usePrefersReducedMotion(); // plain fade: no pop, no overshoot

  // Focus moves to Restart as soon as it's usable (SPEC §10.2).
  useEffect(() => {
    if (view.interactive) buttonRef.current?.focus();
  }, [view.interactive]);

  // Only one control in the dialog, so keep Tab from leaving it.
  const trapTab = (e: KeyboardEvent) => {
    if (e.key === 'Tab') e.preventDefault();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-title"
      aria-describedby="end-count"
      onKeyDown={trapTab}
      className="absolute top-[226px] left-[328px] h-[530px] w-[856px] rounded-hud bg-hud text-center"
      style={{
        opacity: view.opacity,
        transform: reduced ? undefined : `translateY(${view.y}px) scale(${view.scale})`,
        pointerEvents: view.interactive ? 'auto' : 'none',
      }}
    >
      <h2 id="end-title" className="absolute top-[90px] w-full text-[66.476px] leading-[normal] font-semibold whitespace-nowrap">
        😴 Angela fell asleep
      </h2>
      <p id="end-count" className="absolute top-[196px] w-full text-[46.533px] leading-[normal] whitespace-nowrap">
        {wakeText}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={onRestart}
        disabled={!view.interactive}
        className="absolute top-[333px] left-[254.5px] h-[86px] w-[349px] cursor-pointer rounded-hud bg-hud-button text-[36px] leading-none font-semibold text-white transition-[background-color,scale] duration-150 outline-none hover:bg-hud-button-hover focus-visible:ring-4 focus-visible:ring-white active:scale-97 disabled:cursor-default"
      >
        Restart Game
      </button>
    </div>
  );
}
