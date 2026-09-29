import type { CSSProperties, KeyboardEvent } from 'react';
import { CONFIG, type ItemId } from '../config';
import { formatDuration } from '../game/format';
import { ItemImage } from './itemArt';

type TrayItemProps = {
  id: ItemId;
  label: string;
  minutes: number;
  held: boolean;
  disabled: boolean;
  onKeyboardFeed: (id: ItemId) => void;
};

// Hover lift values come from config via CSS vars so the class names stay static.
const HOVER_VARS = {
  '--lift': `${-CONFIG.TRAY_HOVER_LIFT_PX}px`,
  '--hover-scale': CONFIG.TRAY_HOVER_SCALE,
  transitionDuration: `${CONFIG.TRAY_HOVER_MS}ms`,
} as CSSProperties;

function TrayItem({ id, label, minutes, held, disabled, onKeyboardFeed }: TrayItemProps) {
  // Pointer holds are handled on the stage (useFeeding); the keyboard feeds directly.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onKeyboardFeed(id);
  };

  return (
    <button
      type="button"
      data-item-id={id}
      disabled={disabled}
      onKeyDown={onKeyDown}
      aria-label={`Feed ${label.toLowerCase()}, adds ${formatDuration(minutes, { long: true })}`}
      className="shrink-0 cursor-pointer rounded-lg outline-none transition-[translate,scale,filter,opacity] ease-out focus-visible:ring-3 focus-visible:ring-white disabled:cursor-default hover:enabled:translate-y-(--lift) hover:enabled:scale-(--hover-scale) hover:enabled:drop-shadow-[0_10px_12px_rgb(0_0_0/0.35)]"
      style={{ ...HOVER_VARS, opacity: held ? CONFIG.HELD_SLOT_OPACITY : 1 }}
    >
      <ItemImage id={id} />
    </button>
  );
}

// Figma 7:142 (bar) and 11:57 (item row: 50px gap, centered, top 806).
export function Tray({ heldId, disabled, onKeyboardFeed }: { heldId: ItemId | null; disabled: boolean; onKeyboardFeed: (id: ItemId) => void }) {
  return (
    <>
      <div className="absolute top-[771px] left-0 h-[211px] w-[1512px] rounded-t-hud bg-hud" />
      <div className="absolute top-[806px] left-[calc(50%+0.23px)] flex h-[117px] -translate-x-1/2 items-center gap-[50px]">
        {CONFIG.ITEMS.map((item) => (
          <TrayItem
            key={item.id}
            {...item}
            held={heldId === item.id}
            disabled={disabled}
            onKeyboardFeed={onKeyboardFeed}
          />
        ))}
      </div>
    </>
  );
}
