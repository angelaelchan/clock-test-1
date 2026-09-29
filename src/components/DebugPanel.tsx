import { useState, type Dispatch, type ReactNode } from 'react';
import { CONFIG } from '../config';
import { timeOfDay, type GameAction, type GameState } from '../game/gameState';
import type { SkyWeights } from '../game/sky';
import { formatClock } from '../game/format';
import { DEBUG_OPEN_BY_DEFAULT } from '../game/debug';

const STORAGE_KEY = 'stay-awake:debug-open';

const hhmmToMs = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + m) * 60_000;
};

// Remembered per browser; storage can be unavailable, so never let it throw.
function loadOpen(): boolean {
  if (DEBUG_OPEN_BY_DEFAULT) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
function saveOpen(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  } catch {
    // ignore
  }
}

// Same treatment as the HUD's Speed Up button, scaled down.
const PILL =
  'cursor-pointer rounded-[12px] bg-hud-button text-[16px] leading-none font-semibold text-white transition-[background-color,scale] duration-150 outline-none hover:bg-hud-button-hover focus-visible:ring-2 focus-visible:ring-white active:scale-97 aria-pressed:bg-white aria-pressed:text-[#1d2b4f]';

type PillProps = { onClick: () => void; pressed?: boolean; children: ReactNode };

function Pill({ onClick, pressed, children }: PillProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className={`h-9 px-3 whitespace-nowrap ${PILL}`}>
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[18px] leading-[normal]">
      <span className="text-white/65">{label}</span>
      <span className="font-semibold tabular-nums">{children}</span>
    </div>
  );
}

function Group({ label, grid, children }: { label: string; grid?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[14px] font-semibold tracking-wide text-white/65 uppercase">{label}</div>
      <div className={grid ? 'grid grid-cols-4 gap-2' : 'flex flex-wrap gap-2'}>{children}</div>
    </div>
  );
}

/** Caffeine against the starting level, with the dim and tired thresholds marked. */
function CaffeineBar({ caffeineMin }: { caffeineMin: number }) {
  const max = CONFIG.CAFFEINE_START_MIN;
  const pct = (v: number) => `${(Math.min(v, max) / max) * 100}%`;
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
      <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: pct(caffeineMin) }} />
      {[CONFIG.DIM_START_MIN, CONFIG.TIRED_BELOW_MIN].map((m) => (
        <div key={m} className="absolute inset-y-0 w-0.5 bg-[#1d2b4f]/70" style={{ left: pct(m) }} />
      ))}
    </div>
  );
}

/** Night / sunset / day weights as one stacked bar. */
function SkyBar({ sky }: { sky: SkyWeights }) {
  const seg = (w: number, cls: string) => <div className={`h-full ${cls}`} style={{ width: `${w * 100}%` }} />;
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-white/15">
      {seg(sky.night, 'bg-sky-night')}
      {seg(sky.sunset, 'bg-sky-sunset')}
      {seg(sky.day, 'bg-sky-day')}
    </div>
  );
}

type Props = {
  state: GameState;
  sky: SkyWeights;
  dispatch: Dispatch<GameAction>;
  /** The End modal is up: collapse so the panel doesn't cover it (click to peek). */
  modalShowing: boolean;
};

/**
 * Dev-only debug panel (SPEC §13), styled as a mirror of the HUD card in the
 * stage's empty top-right corner. Rendered above the dim overlay so it stays
 * readable and usable while the screen is dark or the End modal is up.
 */
export function DebugPanel({ state, sky, dispatch, modalShowing }: Props) {
  const [open, setOpen] = useState(loadOpen);
  const [peek, setPeek] = useState(false);
  // Peeking only lasts while the modal is up.
  const [prevModal, setPrevModal] = useState(modalShowing);
  if (prevModal !== modalShowing) {
    setPrevModal(modalShowing);
    if (!modalShowing) setPeek(false);
  }

  const shown = modalShowing ? peek : open;
  const toggle = () => {
    if (modalShowing) return setPeek(!peek); // don't change the saved preference
    setOpen(!open);
    saveOpen(!open);
  };

  if (!shown) {
    return (
      <button type="button" onClick={toggle} className={`absolute top-[62px] right-[45px] h-[48px] px-5 ${PILL}`}>
        Debug
      </button>
    );
  }

  const tod = timeOfDay(state.gameTimeMs);
  const set = (patch: Extract<GameAction, { type: 'debugSet' }>['patch']) => dispatch({ type: 'debugSet', patch });
  const fast = state.speed === CONFIG.DEBUG.SPEED;

  return (
    <section
      aria-label="Debug panel"
      className="absolute top-[62px] right-[45px] w-[384px] space-y-5 rounded-hud bg-hud p-6 backdrop-blur-md"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-[26px] leading-none font-semibold">Debug</h2>
        <button type="button" onClick={toggle} aria-label="Collapse debug panel" className={`h-9 w-9 ${PILL}`}>
          ✕
        </button>
      </header>

      <div className="space-y-2">
        <Row label="Status">{state.status}</Row>
        <Row label="Time">
          {formatClock(tod.h, tod.m).replace(' ', `:${String(tod.s).padStart(2, '0')} `)}
        </Row>
        <Row label="Speed">×{state.speed}</Row>
        <Row label="Caffeine">{state.caffeineMin.toFixed(2)} min</Row>
        <CaffeineBar caffeineMin={state.caffeineMin} />
        <Row label="Sky">
          {sky.night.toFixed(2)} · {sky.sunset.toFixed(2)} · {sky.day.toFixed(2)}
        </Row>
        <SkyBar sky={sky} />
      </div>

      <Group label="Set time" grid>
        {CONFIG.DEBUG.TIMES.map((t) => {
          const [h, m] = t.split(':').map(Number);
          return (
            // Compact label ("5 AM", "5:30 PM") so four fit on one row.
            <button key={t} type="button" onClick={() => set({ gameTimeMs: hhmmToMs(t) })} className={`h-9 px-1 whitespace-nowrap ${PILL}`}>
              {formatClock(h, m).replace(':00', '')}
            </button>
          );
        })}
      </Group>

      <Group label="Set caffeine">
        {CONFIG.DEBUG.CAFFEINE.map((c) => (
          <Pill key={c} onClick={() => set({ caffeineMin: c })}>
            {c}
          </Pill>
        ))}
      </Group>

      <Group label="Speed">
        <Pill pressed={fast} onClick={() => set({ speed: fast ? CONFIG.SPEED_NORMAL : CONFIG.DEBUG.SPEED })}>
          ×{CONFIG.DEBUG.SPEED}
        </Pill>
      </Group>
    </section>
  );
}
