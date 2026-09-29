import { useEffect, useRef, type CSSProperties } from 'react';
import { CONFIG } from '../config';
import type { Mood } from '../game/gameState';
import happy from '../assets/avatar-happy.png';
import tired from '../assets/avatar-tired.png';
import sleeping from '../assets/avatar-sleeping.png';

const MOODS: { mood: Mood; src: string }[] = [
  { mood: 'happy', src: happy },
  { mood: 'tired', src: tired },
  { mood: 'sleeping', src: sleeping },
];

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Avatar slot height (Figma 7:122). Pixel amounts from config are converted to
// bottom-anchored vertical scales so her head moves that far while the
// cut-off bottom edge of the art stays planted on the tray.
const AVATAR_H = 289.65;
const stretchY = (px: number) => 1 + px / AVATAR_H;

/** Happy hop as a bottom-anchored stretch: the head rises `px`, the base stays put. */
function bounce(el: HTMLElement | null, px: number) {
  el?.animate(
    [{ transform: 'scaleY(1)' }, { transform: `scaleY(${stretchY(px)})`, offset: 0.45 }, { transform: 'scaleY(1)' }],
    { duration: CONFIG.FEED_BOUNCE_MS, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }, // ease-out-back
  );
}

// Idle loops per mood (SPEC §8.2): outer = breathe (+ sway), inner = bob or nod.
// Full literal class names so Tailwind emits them.
const IDLE_OUTER: Record<Mood, string> = {
  happy: 'animate-idle-happy',
  tired: 'animate-idle-tired',
  sleeping: 'animate-idle-sleeping',
};
const IDLE_INNER: Record<Mood, string> = {
  happy: 'animate-idle-bob',
  tired: 'animate-idle-nod',
  sleeping: '',
};

const { IDLE } = CONFIG;
const IDLE_VARS = {
  '--happy-breathe-s': `${IDLE.HAPPY_BREATHE_S}s`,
  '--happy-bob-scale-y': stretchY(IDLE.HAPPY_BOB_PX),
  '--tired-breathe-s': `${IDLE.TIRED_BREATHE_S}s`,
  '--tired-sway-deg': `${IDLE.TIRED_SWAY_DEG}deg`,
  '--tired-sway-s': `${IDLE.TIRED_SWAY_S}s`,
  '--tired-nod-scale-y': stretchY(-IDLE.TIRED_NOD_PX),
  '--tired-nod-s': `${IDLE.TIRED_NOD_EVERY_S}s`,
  '--sleep-breathe-s': `${IDLE.SLEEP_BREATHE_S}s`,
  '--zzz-every-s': `${IDLE.ZZZ_EVERY_S}s`,
} as CSSProperties;

/** Small "z"s drifting up from her head while she sleeps, one every ZZZ_EVERY_S. */
function Zzz() {
  return (
    <div aria-hidden className="absolute top-[4%] left-[62%] motion-reduce:hidden" style={IDLE_VARS}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute animate-zzz font-semibold text-white opacity-0"
          style={{ fontSize: 22 + i * 4, animationDelay: `${i * IDLE.ZZZ_EVERY_S}s` }}
        >
          z
        </span>
      ))}
    </div>
  );
}

// Soft white outline while a held item is over her (SPEC §9.2 step 3).
const DROP_GLOW = 'drop-shadow(0 0 6px rgb(255 255 255 / 0.9)) drop-shadow(0 0 18px rgb(255 255 255 / 0.5))';

type AvatarProps = {
  mood: Mood;
  /** A held item is over her: she's a valid drop target. */
  glow: boolean;
  /** Increments on every feed; each change plays the feed reaction. */
  feedCount: number;
};

// Figma 7:122: avatar slot 288.64×289.65 at (611.68, 481). All three avatar PNGs
// share a 398px-tall canvas with Angela drawn at the same scale, so they're
// fitted to the slot height and bottom-centered (not cover-cropped) to keep her
// the same size across states.
export function Avatar({ mood, glow, feedCount }: AvatarProps) {
  const squashRef = useRef<HTMLDivElement>(null);
  const bounceRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const prevMood = useRef(mood);
  const prevFeeds = useRef(feedCount);

  // Tiny squash (scaleY 0.98 → 1) whenever the mood changes (SPEC §8.1), plus a
  // small "wake up" bounce when she wakes on restart (SPEC §10.3).
  useEffect(() => {
    const from = prevMood.current;
    if (from === mood) return;
    prevMood.current = mood;
    if (prefersReducedMotion()) return;
    squashRef.current?.animate(
      [{ transform: `scaleY(${CONFIG.AVATAR_SQUASH_SCALE_Y})` }, { transform: 'scaleY(1)' }],
      { duration: CONFIG.AVATAR_SQUASH_MS, easing: 'ease-out' },
    );
    if (from === 'sleeping') bounce(bounceRef.current, CONFIG.WAKE_BOUNCE_PX);
  }, [mood]);

  // Feed reaction: quick happy bounce and a soft glow pulse behind her (SPEC §8.2).
  useEffect(() => {
    if (prevFeeds.current === feedCount) return;
    prevFeeds.current = feedCount;
    pulseRef.current?.animate(
      [{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 0.7, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: 'scale(1.15)' }],
      { duration: CONFIG.FEED_GLOW_MS, easing: 'ease-out' },
    );
    if (prefersReducedMotion()) return;
    bounce(bounceRef.current, CONFIG.FEED_BOUNCE_PX);
  }, [feedCount]);

  return (
    <div className="absolute top-[481px] left-[611.68px] h-[289.65px] w-[288.64px]">
      <div
        ref={pulseRef}
        aria-hidden
        className="absolute inset-[-10%] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.55),transparent)] opacity-0"
      />
      <div ref={bounceRef} className="absolute inset-0 origin-bottom">
        {/* Idle loop (breathe/bob/sway/nod), off under reduced motion. */}
        <div
          className={`absolute inset-0 origin-bottom motion-reduce:animate-none ${IDLE_OUTER[mood]}`}
          style={
            {
              ...IDLE_VARS,
              '--breathe-scale-y': mood === 'sleeping' ? IDLE.SLEEP_BREATHE_SCALE_Y : IDLE.BREATHE_SCALE_Y,
            } as CSSProperties
          }
        >
          {/* Bob (happy) or nod (tired), layered under the breathing. */}
          <div
            className={`absolute inset-0 origin-bottom motion-reduce:animate-none ${IDLE_INNER[mood]}`}
            style={IDLE_VARS}
          >
            <div
              ref={squashRef}
              className="absolute inset-0 origin-bottom transition-[filter] duration-150"
              style={{ filter: glow ? DROP_GLOW : 'none' }}
            >
              {/* All three stacked so a mood change crossfades instead of swapping. */}
              {MOODS.map((m) => (
                <img
                  key={m.mood}
                  alt={m.mood === mood ? `Angela, ${mood}` : ''}
                  aria-hidden={m.mood !== mood}
                  draggable={false}
                  src={m.src}
                  className="absolute bottom-0 left-1/2 h-full max-w-none -translate-x-1/2 transition-opacity ease-in-out"
                  style={{ opacity: m.mood === mood ? 1 : 0, transitionDuration: `${CONFIG.AVATAR_CROSSFADE_MS}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {mood === 'sleeping' && <Zzz />}
    </div>
  );
}
