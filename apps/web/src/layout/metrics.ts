import { useEffect, useState } from 'react';

export type LayoutKind = 'phone' | 'tablet' | 'desktop';

export const PHONE_MAX = 600;
export const DESKTOP_MIN = 1024;
/** Height of the Phaser scene. Keep in sync with SCENE_HEIGHT in game/StripScene.ts (not imported: that file pulls in Phaser). */
export const SCENE_HEIGHT = 96;

const MIN_ZOOM = 2;
const MIN_STAGE_HEIGHT = 320;
const STAGE_SHARE = 0.6; // of the viewport height
const MIN_LOGICAL_WIDTH = 160;

export function layoutKind(width: number): LayoutKind {
  if (width <= PHONE_MAX) return 'phone';
  return width >= DESKTOP_MIN ? 'desktop' : 'tablet';
}

/** Stage height in px: 16:9 on a phone, ~60% of the viewport height (min 320 px) elsewhere, never taller than 60% of its width. */
export function stageHeight(width: number, height: number): number {
  if (width <= PHONE_MAX) return Math.round((width * 9) / 16);
  return Math.min(Math.max(MIN_STAGE_HEIGHT, Math.round(height * STAGE_SHARE)), Math.round(width * 0.6));
}

/**
 * Whole-number zoom of the 96 px scene for a stage of that height, so pixel art stays crisp. The canvas sits at the
 * bottom of the stage: spare room above is filled with the night sky, and an overshoot crops a little sky.
 */
export function stageZoom(width: number, stageH: number): number {
  const zoom = Math.round(stageH / SCENE_HEIGHT);
  return Math.max(MIN_ZOOM, Math.min(zoom, Math.floor(width / MIN_LOGICAL_WIDTH)));
}

export interface Viewport {
  width: number;
  height: number;
}

export function useViewport(): Viewport {
  const [size, setSize] = useState<Viewport>(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    const onResize = () =>
      setSize((prev) =>
        prev.width === window.innerWidth && prev.height === window.innerHeight
          ? prev
          : { width: window.innerWidth, height: window.innerHeight },
      );
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}
