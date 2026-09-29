import { CONFIG } from '../config';

// SPEC §7: time-of-day → sky layer weights.

export type SkyWeights = { night: number; sunset: number; day: number };

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Weights for each sky layer at `hours` (0–24). Always sums to 1. */
export function skyWeights(hours: number): SkyWeights {
  const kf = CONFIG.SKY_KEYFRAMES;
  const hr = ((hours % 24) + 24) % 24;
  let i = 0;
  while (i < kf.length - 2 && hr > kf[i + 1][0]) i++;
  const [h0, n0, s0, d0] = kf[i];
  const [h1, n1, s1, d1] = kf[i + 1];
  const t = h1 === h0 ? 0 : easeInOutSine((hr - h0) / (h1 - h0));
  const night = n0 + (n1 - n0) * t;
  const sunset = s0 + (s1 - s0) * t;
  const day = d0 + (d1 - d0) * t;
  const sum = night + sunset + day;
  return { night: night / sum, sunset: sunset / sum, day: day / sum };
}

/**
 * The layers are stacked opaque images (night at the bottom, then sunset, then
 * day), so their CSS opacities aren't the weights themselves. These opacities
 * make the composite an exact weighted mix of the three images.
 */
export function skyLayerOpacities(w: SkyWeights): SkyWeights {
  const belowDay = 1 - w.day;
  return {
    night: 1,
    sunset: belowDay > 1e-6 ? w.sunset / belowDay : 0,
    day: w.day,
  };
}
