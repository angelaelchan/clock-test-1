# Stay Awake, Angela — Build Spec

A single-screen browser game. A large clock tracks in-game time, the sky behind it shifts from day to sunset to night, and Angela (the avatar) sits at her laptop in the middle. Her caffeine meter drains constantly; as it runs low she looks tired and the screen dims. The player drags drinks and snacks from the tray at the bottom to feed her and push the meter back up. When the screen goes fully black she falls asleep, the game ends, and a modal shows how long she stayed awake.

---

## 0. How to use this spec

1. Set up the project and install Tailwind CSS first (section 1.1). Don't write UI code against a project that isn't scaffolded.
2. Pull the design from Figma with the Figma MCP before writing UI code (section 2). Treat Figma as the source of truth for layout, sizes, colors, radii, and typography. Treat this document as the source of truth for behavior, timing, and animation.
3. Build in the order listed in section 12.
4. All tunable numbers live in one `config.ts` file (section 11). Never hard-code them in components.
5. Items marked **[DECISION]** are assumptions made to fill gaps in the brief. Implement the stated default and keep it configurable.

---

## 1. Tech stack

- Vite + React + TypeScript + **Tailwind CSS**. No component library (no MUI, shadcn, Chakra) — Tailwind utilities only, plus a small amount of hand-written CSS for keyframe animations.
- One `requestAnimationFrame` game loop drives all time-based state. No `setInterval` for game logic.
- Target viewport: design frame is **1512 × 982** (MacBook Pro 14"). Build the scene as a fixed 1512 × 982 stage and scale it uniformly to fit the window (`transform: scale()` with letterboxing), so the Figma coordinates can be used directly.

### 1.1 Project setup (do this first)

Scaffold the project and install Tailwind before writing any UI code:

```bash
npm create vite@latest stay-awake -- --template react-ts
cd stay-awake
npm install
npm install tailwindcss @tailwindcss/vite
```

Wire the Tailwind Vite plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Replace the contents of `src/index.css` with the Tailwind import plus the game's design tokens and keyframes:

```css
@import "tailwindcss";

@theme {
  /* Pull the exact values from Figma (section 2) and register them here
     so they become Tailwind utilities, e.g. bg-hud, text-hud, rounded-hud. */
  --color-hud: rgb(255 255 255 / 0.18);
  --color-hud-border: rgb(255 255 255 / 0.35);
  --radius-hud: 24px;
  --font-display: "<font family from Figma>", system-ui, sans-serif;
}

/* Idle-motion keyframes (section 8.2) live here — Tailwind has no utility
   for multi-step custom animation curves. Expose each as an animate-* utility
   via @theme (--animate-breathe: breathe 3.5s ease-in-out infinite; etc.). */
```

Make sure `src/index.css` is imported once in `src/main.tsx`. Verify the install by running `npm run dev` and confirming a Tailwind utility class takes effect before continuing.

**Note on Tailwind versions:** the above is the Tailwind v4 setup (CSS-first config, `@tailwindcss/vite` plugin, no `tailwind.config.js`). If the installed version resolves to v3, use the v3 setup instead (`npx tailwindcss init -p`, `content` globs in `tailwind.config.js`, and the `@tailwind base/components/utilities` directives) and put the theme tokens in `theme.extend`. Check the installed version with `npm ls tailwindcss` rather than assuming.

### 1.2 How to use Tailwind in this project

- **Layout and static styling:** Tailwind utility classes. Use arbitrary values freely for the Figma coordinates — the stage is a fixed pixel canvas, so `absolute left-[507px] top-[76px] h-[498px] w-[498px]` is the expected style, not a code smell.
- **Per-frame animated values** (overlay opacity, sky layer opacities, clock hand rotations, cursor follower position): these change every frame from game state and must be set as inline `style` props, **never** as Tailwind classes. Do not generate class names from state.
- **Repeated element groups** (tray items, sky layers): extract a React component rather than duplicating long class strings.
- **Looping idle animations:** define keyframes in `index.css` and register them as `--animate-*` theme entries so they're used as utilities (`animate-breathe`, `animate-sway`).
- Use Tailwind's `motion-reduce:` variant to satisfy the `prefers-reduced-motion` requirements in sections 8.2 and 14.

---

## 2. Figma source

- File key: `z0zXGjxUvTlDs6Z5uqjotD`
- URL: https://www.figma.com/design/z0zXGjxUvTlDs6Z5uqjotD/LavaLab-A1--Make-a-Clock?node-id=0-1

Call `get_design_context` on each frame below. Export image assets with `download_assets` (or use the local files the user provides; file names below).

| Purpose | Node ID | Notes |
|---|---|---|
| **Main game screen** | `7:120` "Example Screen" | Primary layout reference |
| Clock face (ring) | `7:127` "Ellipse 2" | 498 × 498 at (507, 76); white stroke |
| Clock center dot | `7:128` "Ellipse 3" | |
| Clock hands (style ref) | `11:63`, `11:65`, `11:67` | Thin white lines with diamond/square end caps. Use for stroke style only; hand lengths in section 5 |
| Avatar slot | `7:122` | ~289 × 290 at (612, 481) |
| HUD card (time + wake count) | `7:143` "Rectangle 2" | 384 × 218 at (45, 62), translucent white, rounded |
| Time row (icon + text) | `7:129` "Frame 1" | Moon instance `7:130`, text `7:131` |
| Wake count text | `11:62` | |
| Food tray bar | `7:142` "Rectangle 1" | Full width, 211 tall, at y = 771 |
| Tray items | `11:57` "Frame 2" | Left→right: `11:40` coffee, `11:44` matcha, `11:45` tea, `11:48` water, `11:53` cookie |
| **Dimming reference** | `11:69` "Dimming" | Full-screen overlay `11:90` "Rectangle 3" |
| **End screen** | `11:91` "End Screen" | Overlay `11:111`, modal `11:121` (856 × 530), button `11:123` (349 × 86), title `11:116`, count `11:119` |
| Day screen reference | `11:5` "Day" | Sun + "8:00 AM" |
| Afternoon/evening reference | `11:25` "Afternoon" | Sun + "6:00 PM" |
| Day background | `11:124` | |
| Sunset background | `11:160` | |
| Night background | `11:139` | |
| Avatar: Tired | `11:175` | |
| Avatar: Happy | `11:176` | |
| Avatar: Sleeping | `11:177` | |
| Sun icon (time row) | `11:179` / `11:21` | |

### Local asset files (provided by the user)

Place in `src/assets/` and rename to kebab-case:

| Provided file | Rename to |
|---|---|
| `Day Background.png` | `bg-day.png` |
| `Sunset Background.png` | `bg-sunset.png` |
| `Night Background.png` | `bg-night.png` |
| `Happy.png` | `avatar-happy.png` |
| `Tired.png` | `avatar-tired.png` |
| `Sleeping.png` | `avatar-sleeping.png` |
| `Sun.svg` | `icon-sun.svg` |
| `Moon.svg` | `icon-moon.svg` |
| (from Figma) coffee, matcha, tea, water, cookie | `item-coffee.png`, `item-matcha.png`, `item-tea.png`, `item-water.png`, `item-cookie.png` |

### Figma discrepancies to resolve in code

- The Example Screen HUD says **"Wake count"**; the Dimming and End Screen background HUDs say **"Awake count"**. Use **"Wake count"** everywhere.
- The End Screen button (`11:123`) is an empty rectangle. Render it as a real button labeled **"Restart Game"**.
- The HUD card has no "Speed Up" button yet. Add one (section 6.3); grow the card's height to fit, keeping its top/left position and padding.

---

## 3. Time model (core of everything)

There are two clocks. Keep them separate.

- **Real time**: wall-clock milliseconds between animation frames (`dt`).
- **Game time**: the time shown on the clock and HUD. Advances by `dt × speed` each frame.

```
speed = 1    // normal: 1 real second = 1 game second
speed = 12   // Speed Up: 1 game hour = 5 real minutes
```

State:

```ts
type GameState = {
  status: 'playing' | 'fallingAsleep' | 'ended';
  gameTimeMs: number;     // absolute game clock (ms since epoch-like origin; only the time-of-day matters)
  speed: 1 | 12;
  caffeineMin: number;    // caffeine remaining, in GAME minutes
  wakeMs: number;         // game-time elapsed since this run started
};
```

Per frame (only while `status === 'playing'`):

```ts
const gameDt = Math.min(dtReal, 250) * state.speed;  // clamp dt so a backgrounded tab doesn't insta-kill
state.gameTimeMs += gameDt;
state.wakeMs     += gameDt;
state.caffeineMin = Math.max(0, state.caffeineMin - CAFFEINE_DRAIN_PER_GAME_MIN * (gameDt / 60000));
if (state.caffeineMin === 0) startFallingAsleep();
```

- **Game start time:** the clock starts at the player's current local time (so at normal speed it behaves like a real clock). Keep `START_TIME_MODE: 'now' | 'fixed'` in config with `FIXED_START = '08:00'` as the alternative.
- **Pause on hidden tab [DECISION]:** when `document.visibilityState === 'hidden'`, stop advancing time. Resume on return. (Otherwise switching tabs ends the game.)

### 3.1 Caffeine drain

The meter starts at **30 minutes** and drains evenly to zero over **30 game minutes** (= 30 real seconds when sped up at 12×, 30 real minutes at normal speed). Drain scales with speed like everything else in game time.

```ts
CAFFEINE_START_MIN = 30
CAFFEINE_DRAIN_PER_GAME_MIN = 1   // 1 caffeine-min per game minute → empties in 30 game minutes
```

- There is no maximum; feeding stacks. **[DECISION]** Keep `CAFFEINE_MAX_MIN = Infinity` in config so a cap can be added later.
- Note that food values (2 hrs, 1 hr, …) are caffeine-minutes, which drain at 1 per game minute. A coffee (+120) buys 120 game minutes (2 game hours) of awake time.

---

## 4. Screen dimming

A full-screen black overlay sits above the whole scene (background, clock, HUD, avatar, tray) and below the cursor follower and modals. It must have `pointer-events: none` so the tray stays clickable while dimmed.

Overlay opacity is derived from `caffeineMin` every frame:

```ts
DIM_START_MIN = 15   // dimming begins below 15 caffeine-minutes (= last 5 game minutes)
t = clamp(1 - caffeineMin / DIM_START_MIN, 0, 1)
overlayOpacity = easeInQuad(t)   // gentle at first, then accelerating to full black
```

- At `caffeineMin = 0` the overlay is fully opaque black → game over (section 8).
- When the player feeds Angela and the meter jumps above the threshold, animate the overlay back to the new target over **600 ms** (ease-out) rather than snapping. Implement as a smoothed value: `displayed += (target - displayed) * (1 - exp(-dt / 150))`.
- Match the overlay look to Figma `11:90` (black). The HUD, clock, and tray darken with everything else.

---

## 5. Clock

Built in SVG, positioned and sized to match `7:127` (498 × 498 at (507, 76); center ≈ (756, 325)).

- **Face:** white ring, stroke width from Figma. Translucent fill as in Figma.
- **Numbers (new):** add 1–12 around the inside of the ring, white, same font family as the HUD time. Place them at radius ≈ 0.80 × ring radius, upright (not rotated). Font size ≈ 28 px at design scale. Optional: small tick marks at each minute, larger at each hour, just inside the ring.
- **Hands**, all white with the Figma end-cap style, rotating around the center dot:

| Hand | Length (× radius) | Stroke | Angle |
|---|---|---|---|
| Hour | 0.45 | 4 px | `(h % 12 + m/60 + s/3600) × 30°` |
| Minute | 0.72 | 3 px | `(m + s/60) × 6°` |
| Second | 0.82 | 1.5 px | `(s + ms/1000) × 6°` |

- All three derive from `gameTimeMs` every frame. Hands move continuously (smooth sweep) so they look right at both 1× and 12×.
- The clock must never "rewind" visually. When a restart resets the time, fade the hands out/in over 300 ms instead of spinning backward.
- Stop the hands when the game ends.

---

## 6. HUD card (top left)

Matches `7:143` / `7:129` / `11:62`.

### 6.1 Time display

- Format: `h:mm AM/PM` (e.g. `8:00 PM`, `12:05 AM`). No leading zero on the hour. Updates whenever the game minute changes.
- Icon to the left of the time:
  - **Sun** (`icon-sun.svg`) from **6:00 AM to 6:59 PM** (morning and afternoon).
  - **Moon** (`icon-moon.svg`) from **7:00 PM to 5:59 AM** (night and early morning before sunrise).
  - Icon swap: crossfade + slight rotate (sun spins in 90°, moon rotates in −30°) over 500 ms.
- Keep these hours in config (`SUN_ICON_START = 6`, `SUN_ICON_END = 19`).

### 6.2 Wake count

- Text: `Wake count: {formatted}` under the time, as in Figma.
- Format from `wakeMs` (game time):
  - under 1 hr → `12 mins` (`1 min` singular)
  - 1 hr or more → `4 hrs 12 mins` (`1 hr`, omit `0 mins`)
- Updates continuously (whenever the displayed minute changes).

### 6.3 Speed Up button (new)

- Placed below the wake count, inside the HUD card, centered. Style it like the End Screen button (`11:123`): translucent white fill, rounded, white label, scaled down to fit the card (≈ 220 × 48).
- Label **"Speed Up"** when `speed === 1`. Click → `speed = 12`, label becomes **"Reset Time"**.
- Click **"Reset Time"** → `speed = 1`, label back to "Speed Up".
- **[DECISION]** "Reset Time" only restores normal speed; the clock continues from the current game time (no jump back to real time). Everything already accumulated (wake count, caffeine) is kept.
- Hover: fill brightens slightly; active: scale 0.97. Keyboard focusable with a visible focus ring.
- Disabled (non-interactive) once the game has ended.

---

## 7. Background (time of day)

Three full-bleed images stacked on top of each other (`bg-night`, `bg-sunset`, `bg-day`). Each frame, compute an opacity for each layer from the game time-of-day so the sky blends continuously. Do **not** use CSS transitions on a class change; derive from time so it also works at 12×.

Keyframes (hour of day → layer weights), linear interpolation between neighbors, weights always sum to 1:

| Hour | Night | Sunset | Day |
|---|---|---|---|
| 0:00 | 1 | 0 | 0 |
| 4:30 | 1 | 0 | 0 |
| 5:30 | 0.3 | 0.7 | 0 |
| 7:00 | 0 | 0 | 1 |
| 16:30 | 0 | 0 | 1 |
| 18:00 | 0 | 1 | 0 |
| 19:00 | 0 | 1 | 0 |
| 20:30 | 1 | 0 | 0 |
| 24:00 | 1 | 0 | 0 |

- **[DECISION]** Dawn briefly borrows the sunset image as a sunrise glow. Remove the 5:30 row if a direct night→day fade is preferred.
- Apply `easeInOutSine` to the interpolation factor within each segment.
- Subtle motion so the sky feels alive: each layer slowly drifts (`background-position` or `transform: translate`, ±12 px over 60 s, looping) and very slowly scales (1.00–1.03). On the night layer, add a faint star twinkle (a handful of absolutely positioned dots with randomized opacity pulses, 2–5 s).
- Put the keyframes table in config.

---

## 8. Avatar

Sits in the avatar slot (`7:122`), overlapping the bottom of the clock and the top of the tray exactly as in the Example Screen. It is also the **drop target** for feeding (hit area = the avatar's bounding box, slightly padded).

### 8.1 States

| State | Image | When |
|---|---|---|
| `happy` | `avatar-happy.png` | `caffeineMin ≥ TIRED_BELOW_MIN` |
| `tired` | `avatar-tired.png` | `0 < caffeineMin < TIRED_BELOW_MIN` |
| `sleeping` | `avatar-sleeping.png` | game over |

```ts
TIRED_BELOW_MIN = 10   // "almost running out" = last ~3.3 game minutes
```

- Add hysteresis so she doesn't flicker at the boundary: switch to tired below 10, back to happy only above 12.
- Transitions: crossfade between images over **500 ms** (two stacked `<img>`s), with a tiny squash (scaleY 0.98 → 1) on change.

### 8.2 Idle motion (subtle, always on, CSS keyframes on a wrapper)

- **Happy:** gentle "breathing" (scaleY 1 → 1.012, transform-origin bottom center, 3.5 s ease-in-out loop) plus a very small head/body bob (translateY 0 → −2 px, 3.5 s, offset phase).
- **Tired:** slower breathing (5 s), slight side-to-side sway (rotate −1° ↔ 1°, 6 s), and an occasional slow "nod" (translateY +4 px then back, every ~7 s).
- **Sleeping:** very slow breathing (6 s, scaleY 1 → 1.02). Optional: small "z" glyphs floating up and fading from above her head every 2 s.
- **Feed reaction:** when fed, a quick happy bounce (translateY −10 px and back, 350 ms, ease-out-back) and a soft glow pulse behind her.
- Respect `prefers-reduced-motion`: disable idle loops and bounces; keep the crossfades.

---

## 9. Feeding (tray + custom cursor)

### 9.1 Items

| Item | Tray node | Adds (caffeine-min) | Feedback text |
|---|---|---|---|
| Coffee | `11:40` | 120 | `+2 hrs!` |
| Matcha | `11:44` | 60 | `+1 hr!` |
| Tea | `11:45` | 30 | `+30 mins!` |
| Water | `11:48` | 10 | `+10 mins!` |
| Cookie | `11:53` | 5 | `+5 mins!` |

Items are unlimited (no inventory or cooldown).

Feedback text is generated from the minute value with the same formatter used for the wake count, prefixed `+` and suffixed `!`.

### 9.2 Interaction flow

1. **Hover** a tray item: lift (translateY −6 px, scale 1.06, 150 ms) with a soft drop shadow. Normal pointer cursor.
2. **Click** an item → it becomes "held":
   - Hide the system cursor over the whole stage (`cursor: none`).
   - Render a **cursor follower**: the item's image (~72 px tall), absolutely positioned at the pointer, centered on it, following every `pointermove`. Use a DOM element with `transform: translate3d()` rather than CSS `cursor: url()` (browsers cap cursor images at ~128 px and can't animate them).
   - The held item's tray slot shows at 40% opacity.
   - Follower has a slight lag-free follow and a small tilt based on horizontal velocity (±8°), for feel.
3. **Hovering the avatar while holding:** avatar gets a soft white glow outline so the player knows it's a valid drop.
4. **Click the avatar while holding** → feed:
   - `caffeineMin += item.minutes` (respect `CAFFEINE_MAX_MIN`).
   - The follower image is replaced by a **feedback bubble** at the same pointer position: small rounded pill, white text (e.g. `+2 hrs!`), translucent dark fill matching the HUD card style.
   - The bubble floats up ~40 px and fades out over **1.2 s**, staying where it was fed (it no longer follows the pointer).
   - The system cursor returns immediately; the held state clears.
   - Avatar plays the feed reaction (8.2); overlay eases back (section 4); avatar returns to happy if above threshold.
5. **Cancel:** clicking anywhere that isn't the avatar or a tray item, or pressing `Esc`, drops the held item (follower shrinks and fades 150 ms, cursor restored). Clicking a different tray item swaps the held item.
6. **Touch:** tap item to hold, tap avatar to feed. Tap-and-drag onto the avatar should also work (use Pointer Events for both).

- Held/feeding interactions are disabled once status is not `playing`.
- Accessibility: tray items are `<button>`s with `aria-label` (e.g. "Feed coffee, adds 2 hours"). Keyboard: Enter/Space on an item feeds Angela directly and shows the bubble above her head.

---

## 10. Game over and End Modal

### 10.1 Sequence

When `caffeineMin` hits 0:

1. `status = 'fallingAsleep'`. Freeze game time, clock, and wake count. Disable tray and Speed Up.
2. The dim overlay is at full black. Hold for **400 ms**.
3. Swap the avatar to `sleeping` (it's hidden under the black, so the swap is invisible).
4. Over **800 ms**, fade the black overlay down to the End Screen overlay (`11:111`, ≈ 85% black) so the scene, including sleeping Angela, is faintly visible underneath (see End Screen reference).
5. Starting 200 ms into step 4, the **End Modal** pops in: opacity 0 → 1 and scale 0.92 → 1, translateY 12 px → 0, over **500 ms** with an ease-out-back curve. `status = 'ended'`.

### 10.2 Modal content (match `11:121`)

- Centered, 856 × 530, translucent gray fill, rounded corners (from Figma).
- Title: `😴 Angela fell asleep` (node `11:116`), large bold white.
- Subtitle: `Wake count: {formatted wakeMs}` (node `11:119`).
- Button: **"Restart Game"** (replaces the empty rectangle `11:123`, 349 × 86). Same hover/active/focus treatment as Speed Up.
- `role="dialog"`, `aria-modal="true"`, focus moves to the Restart button when it appears, `Enter` activates it.

### 10.3 Restart Game

Resets everything from scratch:

- `caffeineMin = CAFFEINE_START_MIN`, `wakeMs = 0`, `speed = 1` (Speed Up label resets), `gameTimeMs` = start time per `START_TIME_MODE`, avatar → `happy`, clear any held item or bubbles.
- Animation: modal fades/scales out (250 ms), then the overlay fades from 85% to 0 over 600 ms while the avatar crossfades to happy with a small "wake up" bounce. Clock hands fade out/in to the new time (don't spin backward). `status = 'playing'` once the overlay is clear.

---

## 11. Config (`src/config.ts`)

```ts
export const CONFIG = {
  STAGE_W: 1512,
  STAGE_H: 982,

  SPEED_NORMAL: 1,
  SPEED_FAST: 12,              // 1 game hr = 5 real min
  START_TIME_MODE: 'now' as 'now' | 'fixed',
  FIXED_START: '08:00',
  MAX_FRAME_DT_MS: 250,

  CAFFEINE_START_MIN: 30,
  CAFFEINE_DRAIN_PER_GAME_MIN: 1,  // drains evenly: 30 caffeine-min over 30 game minutes
  CAFFEINE_MAX_MIN: Infinity,

  DIM_START_MIN: 15,
  TIRED_BELOW_MIN: 10,
  HAPPY_ABOVE_MIN: 12,          // hysteresis
  END_OVERLAY_OPACITY: 0.85,

  SUN_ICON_START_HOUR: 6,
  SUN_ICON_END_HOUR: 19,        // exclusive

  ITEMS: [
    { id: 'coffee', label: 'Coffee', minutes: 120 },
    { id: 'matcha', label: 'Matcha', minutes: 60 },
    { id: 'tea',    label: 'Tea',    minutes: 30 },
    { id: 'water',  label: 'Water',  minutes: 10 },
    { id: 'cookie', label: 'Cookie', minutes: 5 },
  ],

  SKY_KEYFRAMES: [
    // [hour, night, sunset, day]
    [0, 1, 0, 0], [4.5, 1, 0, 0], [5.5, 0.3, 0.7, 0], [7, 0, 0, 1],
    [16.5, 0, 0, 1], [18, 0, 1, 0], [19, 0, 1, 0], [20.5, 1, 0, 0], [24, 1, 0, 0],
  ],
};
```

---

## 12. Suggested structure and build order

```
src/
  index.css           // @import "tailwindcss" + @theme tokens + keyframes
  config.ts
  game/
    useGameLoop.ts      // rAF loop, dt, visibility pause
    gameState.ts        // reducer: tick, feed, setSpeed, startFallingAsleep, restart
    format.ts           // formatClock(h:mm AM/PM), formatDuration(mins/hrs)
    sky.ts              // time-of-day → layer weights
  components/
    Stage.tsx           // fixed 1512×982 stage, scale-to-fit
    Sky.tsx             // 3 background layers + drift + stars
    Clock.tsx           // SVG face, numbers, hands
    Hud.tsx             // time + icon, wake count, Speed Up
    Avatar.tsx          // state crossfade, idle motion, drop target
    Tray.tsx            // 5 item buttons
    CursorFollower.tsx  // held item image + feedback bubbles
    DimOverlay.tsx
    EndModal.tsx
  assets/
```

Build order:

0. Scaffold Vite + React + TS, install and verify Tailwind (section 1.1), drop the assets into `src/assets/`.
1. Stage + static layout from Figma (`7:120`) with all assets in place.
2. Game loop + time model + formatters; wire HUD time and wake count.
3. Clock numbers and moving hands.
4. Sky blending.
5. Caffeine drain, dim overlay, avatar states.
6. Feeding flow, custom cursor, feedback bubble.
7. Speed Up / Reset Time.
8. Game over sequence, End Modal, Restart.
9. Motion polish, reduced-motion, keyboard/touch.

---

## 13. Debug helpers (dev only)

Behind `?debug=1`:

- Small panel showing `caffeineMin`, `speed`, game time, sky weights.
- Buttons: set time to 5:00 / 12:00 / 17:30 / 20:00; set caffeine to 12 / 3 / 0; speed ×60.

---

## 14. Acceptance checklist

- [ ] Layout matches Figma Example Screen at 1512 × 982 and scales cleanly to other window sizes.
- [ ] Clock shows numbers 1–12; hour, minute, and second hands move at correct relative rates and match the HUD time.
- [ ] HUD time format is `h:mm AM/PM`; sun icon 6:00 AM–6:59 PM, moon otherwise.
- [ ] Sky blends smoothly: day in the morning/afternoon, sunset around 18:00, night after ~20:30, with no hard cuts.
- [ ] A fresh game with no feeding: Angela turns tired at 10 caffeine-min, the screen starts dimming at 15, and goes black at 0 (30 game minutes after start).
- [ ] Clicking an item replaces the cursor with its image; clicking Angela adds the right amount, shows `+X!` that floats and fades, and restores the cursor; `Esc` cancels.
- [ ] Feeding while dimmed brightens the screen smoothly and returns Angela to happy.
- [ ] Speed Up makes 1 game hour pass in 5 real minutes (clock, wake count, drain, sky all speed up); label toggles to "Reset Time" and back.
- [ ] Wake count updates continuously and freezes on game over.
- [ ] Game over: black → sleeping Angela visible under a dark overlay → modal eases in with "😴 Angela fell asleep", correct wake count, and a working "Restart Game" button.
- [ ] Restart fully resets state and speed, with no backward-spinning clock.
- [ ] Switching tabs doesn't end the game.
- [ ] `prefers-reduced-motion` disables idle loops.

---

## 15. Decisions

### Confirmed

1. **Water** adds +10 mins.
2. **Drain:** 1 caffeine-min per game minute (a 30-min meter empties evenly in 30 game minutes = 30 real minutes at normal speed).
3. **Start time:** clock starts at the player's current local time.
4. **Thresholds:** tired below 10 caffeine-min, dimming below 15.
5. **Wording:** "Wake count" everywhere (Figma frames that say "Awake count" are outdated).

### Still open (defaults chosen above)

1. **Reset Time** returns to normal speed without jumping the clock back to real time.
2. **Dawn** briefly uses the sunset image as a sunrise glow.
