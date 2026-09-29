import type { ItemId } from '../config';
import coffee from '../assets/item-coffee.png';
import matcha from '../assets/item-matcha.png';
import tea from '../assets/item-tea.png';
import water from '../assets/item-water.png';
import cookie from '../assets/item-cookie.png';

// Box size and image crop per tray item, from Figma 11:40 / 11:44 / 11:45 / 11:48 / 11:53.
// Crop values are percentages of the box, so the art scales cleanly to any height.
type Crop = { left: number; top: number; width: number; height: number } | 'cover';

const ITEM_ART: Record<ItemId, { src: string; w: number; h: number; crop: Crop }> = {
  coffee: { src: coffee, w: 78.47, h: 108.363, crop: { left: -37.07, top: -13.05, width: 174.15, height: 126.11 } },
  matcha: { src: matcha, w: 81, h: 114, crop: 'cover' },
  tea: { src: tea, w: 107, h: 117, crop: { left: -1.01, top: -15.73, width: 102.02, height: 128.09 } },
  water: { src: water, w: 97, h: 99, crop: { left: -10.31, top: -24.55, width: 110.31, height: 149.11 } },
  cookie: { src: cookie, w: 115, h: 106, crop: { left: -1.04, top: -26.42, width: 102.08, height: 152.83 } },
};

/** Renders a tray item's art at its Figma size, or scaled to `height`. */
export function ItemImage({ id, height }: { id: ItemId; height?: number }) {
  const art = ITEM_ART[id];
  const h = height ?? art.h;
  const w = (art.w * h) / art.h;
  const { crop } = art;
  return (
    <span className="relative block overflow-hidden" style={{ width: w, height: h }}>
      {crop === 'cover' ? (
        <img alt="" draggable={false} src={art.src} className="absolute inset-0 size-full max-w-none object-cover" />
      ) : (
        <img
          alt=""
          draggable={false}
          src={art.src}
          className="absolute max-w-none"
          style={{ left: `${crop.left}%`, top: `${crop.top}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
        />
      )}
    </span>
  );
}
