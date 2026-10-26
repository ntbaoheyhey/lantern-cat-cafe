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

    let startX = -1;
    let currentColor: string | null = null;

    for (let x = 0; x < row.length; x++) {
      const char = row[x]!;
      if (char === '.') {
        if (currentColor !== null && startX !== -1) {
          rects.push({
            x: startX,
            y,
            w: x - startX,
            fill: currentColor,
          });
          currentColor = null;
          startX = -1;
        }
      } else {
        const hex = paletteHex[char];
        if (!hex) {
          throw new Error(
            `Backdrop '${art.id}' layer '${layer}' row ${r} col ${x} uses undefined palette key '${char}'`,
          );
        }

        if (currentColor === null) {
          currentColor = hex;
          startX = x;
        } else if (currentColor !== hex) {
          rects.push({
            x: startX,
            y,
            w: x - startX,
            fill: currentColor,
          });
          currentColor = hex;
          startX = x;
        }
      }
    }

    if (currentColor !== null && startX !== -1) {
      rects.push({
        x: startX,
        y,
        w: row.length - startX,
        fill: currentColor,
      });
    }
  }

  layerMap.set(layer, rects);
  return rects;
}

export interface BackdropViewProps {
  art: BackdropArt;
  /** Visible width in art pixels (default art.width). */
  width?: number;
  /** Horizontal scroll offset in art pixels, default 0. */
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
 * Run rects for the wall and floor are drawn once inside a <symbol> and repeated
 * with <use> for horizontal tiling. Hero props are centered in the room without
 * repeating outside the room bounds, flanked by a soft warm light pool and vignette.
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

  // Hero props are centered in the stage when width exceeds tileWidth.
  // Beyond that room width, only the calm wall and floor tile repeat,
  // preventing hero props from repeating unnaturally across wide screens.
  const heroX = width > tileWidth ? Math.round((width - tileWidth) / 2) - offsetX : -offsetX;

  // Floor position for light pool center
  const floorY = art.floorY ?? 84;
  const lightY = Math.round(floorY * 0.45);
  const lightRadiusX = Math.min(Math.round(width * 0.38), 160);

  // Vignette band width (4% of total width each)
  const bandW = Math.max(2, Math.round(width * 0.04));

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
        </symbol>
      </defs>

      {/* Repeating far wall and floor tiles */}
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

      {/* Warm ambient light pool illuminating the wall behind actors (discrete pixel-art ellipses) */}
      <ellipse
        cx={width / 2}
        cy={lightY}
        rx={lightRadiusX}
        ry={30}
        fill="#ffd488"
        opacity={0.12}
        style={{ pointerEvents: 'none' }}
      />
      <ellipse
        cx={width / 2}
        cy={lightY}
        rx={Math.round(lightRadiusX * 0.65)}
        ry={20}
        fill="#ffd488"
        opacity={0.12}
        style={{ pointerEvents: 'none' }}
      />
      <ellipse
        cx={width / 2}
        cy={lightY}
        rx={Math.round(lightRadiusX * 0.35)}
        ry={10}
        fill="#ffe099"
        opacity={0.12}
        style={{ pointerEvents: 'none' }}
      />

      {/* Hero props centered in the room without repeating beyond room width */}
      {layers === 'both' && nearRects.length > 0 && (
        <g className="backdrop-near" transform={`translate(${heroX}, 0)`}>
          {nearRects.map((r, i) => (
            <rect
              key={`near-${i}`}
              x={r.x}
              y={r.y}
              width={r.w}
              height={1}
              fill={r.fill}
            />
          ))}
        </g>
      )}

      {/* Edge vignette darkening outer 12% strips on left and right */}
      {/* Outer 4% */}
      <rect x={0} y={0} width={bandW} height={96} fill="#040206" opacity={0.65} style={{ pointerEvents: 'none' }} />
      <rect x={width - bandW} y={0} width={bandW} height={96} fill="#040206" opacity={0.65} style={{ pointerEvents: 'none' }} />
      {/* 4% - 8% */}
      <rect x={bandW} y={0} width={bandW} height={96} fill="#040206" opacity={0.45} style={{ pointerEvents: 'none' }} />
      <rect x={width - bandW * 2} y={0} width={bandW} height={96} fill="#040206" opacity={0.45} style={{ pointerEvents: 'none' }} />
      {/* 8% - 12% */}
      <rect x={bandW * 2} y={0} width={bandW} height={96} fill="#040206" opacity={0.25} style={{ pointerEvents: 'none' }} />
      <rect x={width - bandW * 3} y={0} width={bandW} height={96} fill="#040206" opacity={0.25} style={{ pointerEvents: 'none' }} />
    </svg>
  );
}
