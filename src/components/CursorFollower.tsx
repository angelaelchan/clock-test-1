import type { CSSProperties } from 'react';
import { CONFIG } from '../config';
import type { Bubble, Follower } from '../game/useFeeding';
import { ItemImage } from './itemArt';

// Positioned at a stage point, centered on it. Per-frame values are inline styles.
const at = (f: { x: number; y: number }, extra = ''): CSSProperties => ({
  transform: `translate3d(${f.x}px, ${f.y}px, 0) translate(-50%, -50%) ${extra}`,
});

type Props = {
  follower: Follower | null;
  dropping: Follower | null;
  bubbles: Bubble[];
  onDropDone: () => void;
  onBubbleDone: (id: number) => void;
};

/** Held item under the pointer, its cancel animation, and "+X!" feedback bubbles (SPEC §9.2). */
export function CursorFollower({ follower, dropping, bubbles, onDropDone, onBubbleDone }: Props) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {follower && (
        <div className="absolute top-0 left-0" style={at(follower, `rotate(${follower.tilt}deg)`)}>
          <ItemImage id={follower.itemId} height={CONFIG.FOLLOWER_HEIGHT_PX} />
        </div>
      )}

      {dropping && (
        <div className="absolute top-0 left-0" style={at(dropping, `rotate(${dropping.tilt}deg)`)}>
          <div
            className="animate-follower-drop"
            style={{ animationDuration: `${CONFIG.FOLLOWER_DROP_MS}ms` }}
            onAnimationEnd={onDropDone}
          >
            <ItemImage id={dropping.itemId} height={CONFIG.FOLLOWER_HEIGHT_PX} />
          </div>
        </div>
      )}

      {bubbles.map((b) => (
        <div key={b.id} className="absolute top-0 left-0" style={at(b)}>
          <div
            className="animate-bubble rounded-full bg-bubble px-5 py-2 text-[26px] leading-none font-semibold whitespace-nowrap text-white backdrop-blur-sm motion-reduce:animate-bubble-fade"
            style={{ animationDuration: `${CONFIG.BUBBLE_MS}ms`, '--bubble-rise': `${CONFIG.BUBBLE_RISE_PX}px` } as CSSProperties}
            onAnimationEnd={() => onBubbleDone(b.id)}
          >
            {b.text}
          </div>
        </div>
      ))}
    </div>
  );
}
