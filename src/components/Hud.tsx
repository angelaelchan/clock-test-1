import { useLayoutEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { usePrefersReducedMotion } from '../game/usePrefersReducedMotion';
import iconSun from '../assets/icon-sun.svg';
import iconMoon from '../assets/icon-moon.svg';

// Wake count line: Figma's 25.618px less 10%, on one line within the card's
// width minus 24px margins. Longer counts shrink further to fit.
const WAKE_FONT_PX = 25.618 * 0.9;
const WAKE_MAX_W = 384 - 2 * 24;

/** One centered line that never wraps: shrinks below `basePx` only if it must. */
function FitLine({ text, basePx, maxWidth, className }: { text: string; basePx: number; maxWidth: number; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [fontPx, setFontPx] = useState(basePx);

  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      el.style.fontSize = `${basePx}px`; // measure at the base size
      const natural = el.offsetWidth;
      el.style.fontSize = '';
      setFontPx(natural > maxWidth ? (basePx * maxWidth) / natural : basePx);
    };
    fit();
    document.fonts?.ready.then(fit); // re-measure once Figtree has loaded
  }, [text, basePx, maxWidth]);

  return (
    <p ref={ref} className={`w-max whitespace-nowrap ${className}`} style={{ fontSize: fontPx }}>
      {text}
    </p>
  );
}

// Intrinsic sizes of icon-sun.svg / icon-moon.svg (Figma 11:179 / 7:130).
const SUN_PX = 47;
const MOON_PX = 41;

/**
 * Sun 6:00 AM–6:59 PM, moon otherwise. Swaps with a crossfade while the sun
 * spins in 90° and the moon rotates in −30° (SPEC §6.1). The box eases between
 * the two icon widths so the time text doesn't jump.
 */
function TimeIcon({ isDay }: { isDay: boolean }) {
  const reduced = usePrefersReducedMotion();
  const ms = CONFIG.HUD_ICON_SWAP_MS;
  const icon = (src: string, size: number, active: boolean, spinInDeg: number) => (
    <img
      alt=""
      src={src}
      className="absolute top-1/2 left-1/2 block max-w-none transition-[opacity,transform] ease-out"
      style={{
        width: size,
        height: size,
        opacity: active ? 1 : 0,
        transform: `translate(-50%, -50%) rotate(${active || reduced ? 0 : -spinInDeg}deg)`,
        transitionDuration: `${ms}ms`,
      }}
    />
  );
  return (
    <span
      role="img"
      aria-label={isDay ? 'Daytime' : 'Nighttime'}
      className="relative block h-[47px] shrink-0 transition-[width] ease-out"
      style={{ width: isDay ? SUN_PX : MOON_PX, transitionDuration: `${ms}ms` }}
    >
      {icon(iconSun, SUN_PX, isDay, CONFIG.SUN_SPIN_IN_DEG)}
      {icon(iconMoon, MOON_PX, !isDay, CONFIG.MOON_SPIN_IN_DEG)}
    </span>
  );
}

type HudProps = {
  timeText: string;
  isDay: boolean;
  wakeText: string;
  speedLabel: string;
  onSpeedClick: () => void;
  disabled: boolean;
};

// Figma 7:143 (card), 7:129 (time row), 11:62 (wake count). The card is grown
// from 218 to 290 tall to fit the Speed Up button (SPEC §2, §6.3).
export function Hud({ timeText, isDay, wakeText, speedLabel, onSpeedClick, disabled }: HudProps) {
  return (
    <div className="absolute top-[62px] left-[45px] h-[290px] w-[384px] rounded-hud bg-hud">
      <div className="absolute top-[53px] left-1/2 flex h-[56px] w-max -translate-x-1/2 items-center gap-[19.145px]">
        <TimeIcon isDay={isDay} />
        <p className="text-[46.533px] leading-[normal] font-semibold whitespace-nowrap">{timeText}</p>
      </div>
      <FitLine
        text={wakeText}
        basePx={WAKE_FONT_PX}
        maxWidth={WAKE_MAX_W}
        className="absolute top-[135px] left-1/2 -translate-x-1/2 leading-[normal]"
      />
      <button
        type="button"
        onClick={onSpeedClick}
        disabled={disabled}
        className="absolute top-[188px] left-1/2 h-[48px] w-[220px] -translate-x-1/2 cursor-pointer rounded-[14px] bg-hud-button text-[22px] leading-none font-semibold text-white transition-[background-color,scale] duration-150 outline-none hover:bg-hud-button-hover focus-visible:ring-3 focus-visible:ring-white active:scale-97 disabled:cursor-default disabled:opacity-60"
      >
        {speedLabel}
      </button>
    </div>
  );
}
