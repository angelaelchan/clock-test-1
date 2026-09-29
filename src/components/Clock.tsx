import { memo } from 'react';
import { CONFIG } from '../config';

// Figma 7:127: 498×498 face at (507, 76) with a 10px outside stroke, so the SVG
// box is 518×518 at (497, 66). Center dot 7:128 is 20.33×19.31.
const BOX = 518;
const C = BOX / 2;
const R = 249; // face radius (inside edge of the ring)
const RING_STROKE = 10;

type HandSpec = { length: number; stroke: number };

function Hand({ spec, angle }: { spec: HandSpec; angle: number }) {
  const L = spec.length * R;
  const h = CONFIG.CLOCK.CAP_HALF_DIAGONAL;
  return (
    <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${C}px ${C}px` }}>
      <line x1={C} y1={C} x2={C} y2={C - L} stroke="white" strokeWidth={spec.stroke} />
      <polygon points={`${C},${C - L - h} ${C + h},${C - L} ${C},${C - L + h} ${C - h},${C - L}`} fill="white" />
    </g>
  );
}

/** Ring, ticks and numbers. Never changes, so it's memoized out of the per-frame render. */
const ClockFace = memo(function ClockFace() {
  const { CLOCK } = CONFIG;
  const numR = CLOCK.NUMBER_RADIUS * R;
  return (
    <>
      <circle cx={C} cy={C} r={R + RING_STROKE / 2} fill="white" fillOpacity={0.1} stroke="white" strokeWidth={RING_STROKE} />

      {CLOCK.SHOW_TICKS &&
        Array.from({ length: 60 }, (_, i) => {
          const hour = i % 5 === 0;
          return (
            <line
              key={i}
              x1={C}
              y1={C - R + 6}
              x2={C}
              y2={C - R + (hour ? 20 : 12)}
              stroke="white"
              strokeOpacity={hour ? 0.7 : 0.35}
              strokeWidth={hour ? 3 : 1.5}
              transform={`rotate(${i * 6} ${C} ${C})`}
            />
          );
        })}

      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        return (
          <text
            key={n}
            x={C + numR * Math.sin(a)}
            y={C - numR * Math.cos(a)}
            fill="white"
            fontSize={CLOCK.NUMBER_FONT_PX}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-display"
          >
            {n}
          </text>
        );
      })}
    </>
  );
});

export type ClockAngles = { hour: number; minute: number; second: number };

export function Clock({ angles, handsOpacity = 1 }: { angles: ClockAngles; handsOpacity?: number }) {
  const { CLOCK } = CONFIG;
  return (
    <svg
      aria-hidden
      className="absolute top-[66px] left-[497px]"
      width={BOX}
      height={BOX}
      viewBox={`0 0 ${BOX} ${BOX}`}
    >
      <ClockFace />
      <g style={{ opacity: handsOpacity }}>
        <Hand spec={CLOCK.HOUR} angle={angles.hour} />
        <Hand spec={CLOCK.MINUTE} angle={angles.minute} />
        <Hand spec={CLOCK.SECOND} angle={angles.second} />
      </g>
      <ellipse cx={C} cy={C + 0.5} rx={10.163} ry={9.655} fill="white" />
    </svg>
  );
}
