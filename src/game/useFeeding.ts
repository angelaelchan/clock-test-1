import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { CONFIG, type ItemId } from '../config';
import { formatDuration } from './format';

// SPEC §9: held item, cursor follower, feedback bubbles. Positions are in stage
// (design) coordinates, so they line up regardless of the stage's scale.

export type Point = { x: number; y: number };
export type Follower = Point & { itemId: ItemId; tilt: number };
export type Bubble = Point & { id: number; text: string };

// Figma 7:122 avatar slot. Also the drop target, padded (SPEC §8).
export const AVATAR_BOX = { x: 611.68, y: 481, w: 288.64, h: 289.65 };
const BUBBLE_ABOVE_HEAD: Point = { x: AVATAR_BOX.x + AVATAR_BOX.w / 2, y: AVATAR_BOX.y - 10 };

function isOverAvatar(p: Point) {
  const pad = CONFIG.AVATAR_HIT_PAD_PX;
  const b = AVATAR_BOX;
  return p.x >= b.x - pad && p.x <= b.x + b.w + pad && p.y >= b.y - pad && p.y <= b.y + b.h + pad;
}

const itemMinutes = (id: ItemId) => CONFIG.ITEMS.find((i) => i.id === id)!.minutes;
const feedbackText = (minutes: number) => `+${formatDuration(minutes)}!`;

type Options = {
  playing: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  onFeed: (minutes: number) => void;
};

export function useFeeding({ playing, stageRef, onFeed }: Options) {
  const [held, setHeld] = useState<ItemId | null>(null);
  const [follower, setFollower] = useState<Follower | null>(null);
  const [dropping, setDropping] = useState<Follower | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [overAvatar, setOverAvatar] = useState(false);
  const [feedCount, setFeedCount] = useState(0);

  const pointer = useRef<Point>({ x: 0, y: 0 });
  const motion = useRef({ prevX: 0, tilt: 0 });
  const heldRef = useRef(held);
  const followerRef = useRef(follower);
  const nextId = useRef(0);
  useEffect(() => {
    heldRef.current = held;
    followerRef.current = follower;
  });

  const toStage = (e: PointerEvent): Point => {
    const r = stageRef.current!.getBoundingClientRect();
    const scale = r.width / CONFIG.STAGE_W;
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };

  const addBubble = useCallback((at: Point, minutes: number) => {
    const id = nextId.current++;
    setBubbles((bs) => [...bs, { id, ...at, text: feedbackText(minutes) }]);
  }, []);

  const feed = useCallback(
    (itemId: ItemId, at: Point) => {
      const minutes = itemMinutes(itemId);
      onFeed(minutes);
      addBubble(at, minutes);
      setFeedCount((n) => n + 1);
    },
    [onFeed, addBubble],
  );

  const hold = (itemId: ItemId, at: Point) => {
    motion.current = { prevX: at.x, tilt: 0 };
    setDropping(null);
    setHeld(itemId);
    setFollower({ itemId, ...at, tilt: 0 });
  };

  /** Let go without feeding: the follower shrinks and fades where it is. */
  const drop = useCallback(() => {
    if (followerRef.current) setDropping(followerRef.current);
    setHeld(null);
    setFollower(null);
    setOverAvatar(false);
  }, []);

  /** Feeding needs to hand the cursor back immediately: no drop animation. */
  const release = () => {
    setHeld(null);
    setFollower(null);
    setOverAvatar(false);
  };

  // Called from the game loop once per frame: follow the pointer, tilt with velocity.
  const onFrame = useCallback((dtReal: number) => {
    if (!heldRef.current || dtReal <= 0) return;
    const p = pointer.current;
    const m = motion.current;
    const vx = (p.x - m.prevX) / dtReal;
    const max = CONFIG.FOLLOWER_TILT_MAX_DEG;
    const target = Math.max(-max, Math.min(max, vx * CONFIG.FOLLOWER_TILT_DEG_PER_PX_PER_MS));
    m.tilt += (target - m.tilt) * (1 - Math.exp(-dtReal / CONFIG.FOLLOWER_TILT_SMOOTHING_MS));
    m.prevX = p.x;
    const f = followerRef.current;
    if (f && f.x === p.x && f.y === p.y && Math.abs(f.tilt - m.tilt) < 0.01) return;
    setFollower({ itemId: heldRef.current, x: p.x, y: p.y, tilt: m.tilt });
  }, []);

  // Esc cancels; ending the game drops anything held.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && heldRef.current && drop();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drop]);
  useEffect(() => {
    if (!playing && heldRef.current) drop();
  }, [playing, drop]);

  const stageHandlers = {
    onPointerDown(e: PointerEvent) {
      const p = toStage(e);
      pointer.current = p;
      const itemEl = (e.target as Element).closest<HTMLElement>('[data-item-id]');
      if (itemEl && playing) {
        hold(itemEl.dataset.itemId as ItemId, p); // also swaps a different held item
        return;
      }
      if (heldRef.current && !isOverAvatar(p)) drop();
    },
    onPointerMove(e: PointerEvent) {
      const p = toStage(e);
      pointer.current = p;
      const over = isOverAvatar(p);
      setOverAvatar((prev) => (prev === over ? prev : over));
    },
    // Release over Angela feeds: covers click-then-click and touch drag-and-drop.
    onPointerUp(e: PointerEvent) {
      const p = toStage(e);
      pointer.current = p;
      const itemId = heldRef.current;
      if (itemId && playing && isOverAvatar(p)) {
        release();
        feed(itemId, p);
      }
    },
  };

  /** Keyboard: Enter/Space on a tray item feeds directly, bubble above her head. */
  const feedFromKeyboard = (itemId: ItemId) => {
    if (playing) feed(itemId, BUBBLE_ABOVE_HEAD);
  };

  return {
    held,
    follower,
    dropping,
    bubbles,
    glow: held !== null && overAvatar,
    feedCount,
    stageHandlers,
    onFrame,
    feedFromKeyboard,
    clearDropping: () => setDropping(null),
    /** Restart: clear any held item, cancel animation and bubbles (SPEC §10.3). */
    reset: () => {
      setHeld(null);
      setFollower(null);
      setDropping(null);
      setBubbles([]);
      setOverAvatar(false);
    },
    removeBubble: (id: number) => setBubbles((bs) => bs.filter((b) => b.id !== id)),
  };
}
