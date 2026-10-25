import { useId, type JSX } from 'react';
import type { BackdropArt } from './types';

export interface BackdropRect {
  x: number;
  y: number;
  w: number;
  fill: string;
}

type LayerKey = 'far' | 'near';

/** Module-level WeakMap cache so five map cards do not recompute rects. */
const rectsCache = new WeakMap<BackdropArt, Map<LayerKey, BackdropRect[]>>();

/**
 * Computes run-length encoded rectangles per row for the given layer.
 * One rect per run of equal colour, '.' skipped.
 * Memoized per art+layer in a WeakMap.
 */
export function backdropRects(art: BackdropArt, layer: LayerKey): BackdropRect[] {
  let layerMap = rectsCache.get(art);
  if (!layerMap) {
    layerMap = new Map();
    rectsCache.set(art, layerMap);
  }

  const cached = layerMap.get(layer);
  if (cached) {
    return cached;
  }

  const rects: BackdropRect[] = [];
  const backdropLayer = art[layer];
  if (!backdropLayer || !backdropLayer.rows) {
    layerMap.set(layer, rects);
    return rects;
  }

  // Precompute hex strings for palette
  const paletteHex: Record<string, string> = {};
  for (const [char, colorNum] of Object.entries(art.palette)) {
    paletteHex[char] = '#' + colorNum.toString(16).padStart(6, '0').toLowerCase();
  }

  const top = backdropLayer.top ?? 0;
  const rows = backdropLayer.rows;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const y = top + r;
    const len = row.length;
    let x = 0;

    while (x < len) {
      const ch = row[x];
      if (!ch || ch === '.' || !(ch in paletteHex)) {
        x++;
        continue;
      }

      const fill = paletteHex[ch];
      if (!fill) {
        x++;
        continue;
      }
      const startX = x;
      x++;
      while (x < len) {
        const nextCh = row[x];
        if (!nextCh || nextCh === '.' || paletteHex[nextCh] !== fill) {
          break;
        }
        x++;
      }
      const w = x - startX;
      rects.push({ x: startX, y, w, fill });
    }
  }

  layerMap.set(layer, rects);
  return rects;
}

export interface BackdropViewProps {
  art: BackdropArt;
  /** Art pixels to show, default art.width; tiles horizontally. */
  width?: number;
  /** Art pixels offset, default 0. */
  offsetX?: number;
  /** CSS px per art pixel, default 1. */
  scale?: number;
  /** Layers to render, default 'both'. */
  layers?: 'both' | 'far';
  className?: string;
  title?: string;
}

/**
 * BackdropView renders a pixel-art chapter backdrop as a crisp SVG.
 * Run rects are drawn once inside a <symbol> and repeated with <use>
 * for horizontal tiling.
 */
export function BackdropView({
  art,
  width = art.width,
  offsetX = 0,
  scale = 1,
  layers = 'both',
  className,
  title,
}: BackdropViewProps): JSX.Element {
  const rawId = useId();
  const idSuffix = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const symbolId = `backdrop-${art.id}-${layers}-${idSuffix}`;

  const farRects = backdropRects(art, 'far');
  const nearRects = layers === 'both' ? backdropRects(art, 'near') : [];

  const tileWidth = art.width;
  const tileCount = Math.max(1, Math.ceil((width + offsetX) / tileWidth));

  return (
    <svg
      width={width * scale}
      height={96 * scale}
      viewBox={`0 0 ${width} 96`}
      shapeRendering="crispEdges"
      data-backdrop={art.id}
      className={className}
      style={{ display: 'block' }}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {title && <title>{title}</title>}
      <defs>
        <symbol id={symbolId} viewBox={`0 0 ${tileWidth} 96`}>
          {farRects.map((r, i) => (
            <rect
              key={`far-${i}`}
              x={r.x}
              y={r.y}
              width={r.w}
              height={1}
              fill={r.fill}
            />
          ))}
          {layers === 'both' &&
            nearRects.map((r, i) => (
              <rect
                key={`near-${i}`}
                x={r.x}
                y={r.y}
                width={r.w}
                height={1}
                fill={r.fill}
              />
            ))}
        </symbol>
      </defs>
      {Array.from({ length: tileCount }, (_, k) => (
        <use
          key={k}
          href={`#${symbolId}`}
          x={k * tileWidth - offsetX}
          y={0}
          width={tileWidth}
          height={96}
          data-tile={k}
        />
      ))}
    </svg>
  );
}
