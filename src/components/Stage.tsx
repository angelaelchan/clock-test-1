import { useEffect, useState, type DOMAttributes, type ReactNode, type Ref } from 'react';
import { CONFIG } from '../config';

function fitScale() {
  return Math.min(window.innerWidth / CONFIG.STAGE_W, window.innerHeight / CONFIG.STAGE_H);
}

type StageProps = {
  children: ReactNode;
  stageRef?: Ref<HTMLDivElement>;
  /** While an item is held the system cursor is hidden over the whole stage. */
  holding?: boolean;
} & Pick<DOMAttributes<HTMLDivElement>, 'onPointerDown' | 'onPointerMove' | 'onPointerUp'>;

/** Fixed 1512×982 design canvas, uniformly scaled and letterboxed to fit the window. */
export function Stage({ children, stageRef, holding, ...pointerHandlers }: StageProps) {
  const [scale, setScale] = useState(fitScale);

  useEffect(() => {
    const onResize = () => setScale(fitScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        ref={stageRef}
        data-stage
        data-holding={holding || undefined}
        className="absolute top-1/2 left-1/2 origin-center touch-none overflow-hidden font-display text-white select-none"
        style={{
          width: CONFIG.STAGE_W,
          height: CONFIG.STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
        {...pointerHandlers}
      >
        {children}
      </div>
    </div>
  );
}
