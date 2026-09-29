// Every tunable number in the game lives here (SPEC §11).
// Layout coordinates come straight from Figma and live in the components.

export type ItemId = 'coffee' | 'matcha' | 'tea' | 'water' | 'cookie';

export type SkyKeyframe = readonly [hour: number, night: number, sunset: number, day: number];

export const CONFIG = {
  STAGE_W: 1512,
  STAGE_H: 982,

  SPEED_NORMAL: 1,
  SPEED_FAST: 12, // 1 game hr = 5 real min
  START_TIME_MODE: 'now' as 'now' | 'fixed',
  FIXED_START: '08:00',
  MAX_FRAME_DT_MS: 250,

  CAFFEINE_START_MIN: 30,
  CAFFEINE_DRAIN_PER_GAME_MIN: 1, // drains evenly: 30 caffeine-min over 30 game minutes
  CAFFEINE_MAX_MIN: Infinity,

  DIM_START_MIN: 15,
  DIM_SMOOTHING_MS: 150, // time constant for easing the overlay toward its target (≈600 ms to settle)
  TIRED_BELOW_MIN: 10,
  HAPPY_ABOVE_MIN: 12, // hysteresis
  END_OVERLAY_OPACITY: 0.85,

  // Game over and restart (SPEC §10). All in real ms.
  SLEEP_HOLD_MS: 400, // full black before the sleeping swap
  END_OVERLAY_FADE_MS: 800, // black → END_OVERLAY_OPACITY
  MODAL_DELAY_MS: 200, // into the overlay fade
  MODAL_IN_MS: 500,
  MODAL_SCALE_FROM: 0.92,
  MODAL_Y_FROM_PX: 12,
  MODAL_OUT_MS: 250,
  MODAL_SCALE_OUT_TO: 0.96,
  RESTART_OVERLAY_FADE_MS: 600, // END_OVERLAY_OPACITY → 0
  HANDS_FADE_MS: 300, // clock hands fade out/in to the new time instead of spinning back
  WAKE_BOUNCE_PX: 6,

  AVATAR_CROSSFADE_MS: 500,
  AVATAR_SQUASH_SCALE_Y: 0.98,
  AVATAR_SQUASH_MS: 300,
  AVATAR_HIT_PAD_PX: 16, // drop target = avatar box grown by this much (SPEC §8)

  // Avatar idle motion (SPEC §8.2). Seconds / px / deg. Amounts are roughly
  // double the spec's (noted per line), which were too subtle to see at 290px.
  // All motion is anchored at her bottom edge so the art never lifts off the
  // tray: px values are how far her head moves (applied as a vertical stretch),
  // and the sway is a skew.
  IDLE: {
    BREATHE_SCALE_Y: 1.025, // spec 1.012
    HAPPY_BREATHE_S: 3.5,
    HAPPY_BOB_PX: 4, // spec 2
    TIRED_BREATHE_S: 5,
    TIRED_SWAY_DEG: 1.5, // spec 1
    TIRED_SWAY_S: 6,
    TIRED_NOD_PX: 8, // spec 4
    TIRED_NOD_EVERY_S: 7,
    SLEEP_BREATHE_S: 6,
    SLEEP_BREATHE_SCALE_Y: 1.035, // spec 1.02
    ZZZ_EVERY_S: 2,
  },

  // Feeding (SPEC §8.2, §9).
  TRAY_HOVER_LIFT_PX: 6,
  TRAY_HOVER_SCALE: 1.06,
  TRAY_HOVER_MS: 150,
  HELD_SLOT_OPACITY: 0.4,
  FOLLOWER_HEIGHT_PX: 72,
  FOLLOWER_TILT_MAX_DEG: 8,
  FOLLOWER_TILT_DEG_PER_PX_PER_MS: 4, // horizontal velocity → tilt
  FOLLOWER_TILT_SMOOTHING_MS: 80,
  FOLLOWER_DROP_MS: 150,
  BUBBLE_RISE_PX: 40,
  BUBBLE_MS: 1200,
  FEED_BOUNCE_PX: 10,
  FEED_BOUNCE_MS: 350,
  FEED_GLOW_MS: 700,

  SUN_ICON_START_HOUR: 6,
  SUN_ICON_END_HOUR: 19, // exclusive
  HUD_ICON_SWAP_MS: 500, // crossfade + rotate (SPEC §6.1)
  SUN_SPIN_IN_DEG: 90,
  MOON_SPIN_IN_DEG: -30,

  ITEMS: [
    { id: 'coffee', label: 'Coffee', minutes: 120 },
    { id: 'matcha', label: 'Matcha', minutes: 60 },
    { id: 'tea', label: 'Tea', minutes: 30 },
    { id: 'water', label: 'Water', minutes: 10 },
    { id: 'cookie', label: 'Cookie', minutes: 5 },
  ] as const satisfies readonly { id: ItemId; label: string; minutes: number }[],

  SKY_KEYFRAMES: [
    // [hour, night, sunset, day]
    [0, 1, 0, 0], [4.5, 1, 0, 0], [5.5, 0.3, 0.7, 0], [7, 0, 0, 1],
    [16.5, 0, 0, 1], [18, 0, 1, 0], [19, 0, 1, 0], [20.5, 1, 0, 0], [24, 1, 0, 0],
  ] as readonly SkyKeyframe[],

  // Sky idle motion (SPEC §7).
  SKY_DRIFT_PX: 12,
  SKY_DRIFT_PERIOD_S: 60,
  SKY_SCALE_MAX: 1.03,
  STAR_COUNT: 40,
  STAR_TWINKLE_MIN_S: 2,
  STAR_TWINKLE_MAX_S: 5,

  // Dev-only debug panel (SPEC §13): in every dev build, open by default with ?debug=1.
  DEBUG: {
    TIMES: ['05:00', '12:00', '17:30', '20:00'],
    CAFFEINE: [1440, 12, 3, 0],
    SPEED: 60,
  },

  // Clock (SPEC §5). Lengths are fractions of the ring radius.
  CLOCK: {
    NUMBER_RADIUS: 0.8,
    NUMBER_FONT_PX: 28,
    SHOW_TICKS: true,
    HOUR: { length: 0.45, stroke: 4 },
    MINUTE: { length: 0.72, stroke: 3 },
    SECOND: { length: 0.82, stroke: 1.5 },
    CAP_HALF_DIAGONAL: 8.66, // diamond end cap, from Figma 11:63/65/67
  },
};
