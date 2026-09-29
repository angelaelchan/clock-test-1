import { memo, type CSSProperties, type ReactNode } from 'react';
import { CONFIG } from '../config';
import { skyLayerOpacities, type SkyWeights } from '../game/sky';
import bgNight from '../assets/bg-night.png';
import bgSunset from '../assets/bg-sunset.png';
import bgDay from '../assets/bg-day.png';

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Generated once per page load: position, size and twinkle timing per star.
const STARS = Array.from({ length: CONFIG.STAR_COUNT }, () => ({
  left: rand(0, CONFIG.STAGE_W),
  top: rand(0, 760),
  size: rand(1.5, 3),
  duration: rand(CONFIG.STAR_TWINKLE_MIN_S, CONFIG.STAR_TWINKLE_MAX_S),
  delay: -rand(0, CONFIG.STAR_TWINKLE_MAX_S),
}));

const Stars = memo(function Stars() {
  return STARS.map((s, i) => (
    <span
      key={i}
      className="absolute rounded-full bg-white animate-twinkle motion-reduce:animate-none motion-reduce:opacity-60"
      style={{
        left: s.left,
        top: s.top,
        width: s.size,
        height: s.size,
        animationDuration: `${s.duration}s`,
        animationDelay: `${s.delay}s`,
      }}
    />
  ));
});

function SkyLayer({ src, opacity, phase, children }: { src: string; opacity: number; phase: number; children?: ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ opacity }}>
      {/* Oversized by the drift distance so the drift never exposes an edge. */}
      <div
        className="absolute -inset-(--sky-drift) animate-sky-drift motion-reduce:animate-none"
        style={{ animationDelay: `${-phase * CONFIG.SKY_DRIFT_PERIOD_S}s` }}
      >
        <img alt="" draggable={false} src={src} className="absolute inset-0 size-full max-w-none object-cover" />
        {children}
      </div>
    </div>
  );
}

/** Three stacked sky layers blended by game time-of-day (SPEC §7). */
export function Sky({ weights }: { weights: SkyWeights }) {
  const o = skyLayerOpacities(weights);
  const vars = {
    '--sky-drift': `${CONFIG.SKY_DRIFT_PX}px`,
    '--sky-drift-period': `${CONFIG.SKY_DRIFT_PERIOD_S}s`,
    '--sky-scale-max': CONFIG.SKY_SCALE_MAX,
  } as CSSProperties;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={vars}>
      <SkyLayer src={bgNight} opacity={o.night} phase={0}>
        <Stars />
      </SkyLayer>
      <SkyLayer src={bgSunset} opacity={o.sunset} phase={0.33} />
      <SkyLayer src={bgDay} opacity={o.day} phase={0.66} />
    </div>
  );
}
