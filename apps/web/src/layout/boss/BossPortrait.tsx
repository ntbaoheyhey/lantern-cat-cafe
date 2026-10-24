import { useMemo } from 'react';
import { monsterArt } from '../../art/monsters';
import { bossLabel } from './bossGate';
import './boss.css';

export interface BossPortraitProps {
  chapter: number;
  zoom?: number;
}

function colorToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

function buildColorPaths(
  rows: readonly string[],
  palette: Readonly<Record<string, number>>,
): { color: string; d: string }[] {
  const pathsByColor = new Map<string, string>();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (!ch || ch === '.' || !(ch in palette)) continue;
      const color = palette[ch];
      if (color === undefined) continue;
      const hex = colorToHex(color);
      const prev = pathsByColor.get(hex) ?? '';
      pathsByColor.set(hex, `${prev}M${x} ${y}h1v1h-1z`);
    }
  });
  return Array.from(pathsByColor.entries()).map(([color, d]) => ({ color, d }));
}

/**
 * BossPortrait renders the static first idle frame of a chapter boss from monster art.
 * For a chapter with missing/unknown art, renders a neutral silhouette box with the boss name as aria-label.
 */
export function BossPortrait({ chapter, zoom = 2 }: BossPortraitProps) {
  const label = bossLabel(chapter);
  const art = label.id ? monsterArt(label.id) : null;
  const idleFrame = art?.frames?.idle?.[0];

  const colorPaths = useMemo(() => {
    if (!idleFrame || !art) return [];
    return buildColorPaths(idleFrame, art.palette);
  }, [idleFrame, art]);

  if (!art || !idleFrame || colorPaths.length === 0) {
    const size = 48 * zoom;
    return (
      <div
        className="boss-portrait-fallback"
        role="img"
        aria-label={label.name}
        style={{ width: size, height: size }}
      />
    );
  }

  const width = art.size.w * zoom;
  const height = art.size.h * zoom;

  return (
    <svg
      role="img"
      aria-label={label.name}
      viewBox={`0 0 ${art.size.w} ${art.size.h}`}
      width={width}
      height={height}
      shapeRendering="crispEdges"
      className="boss-portrait-svg"
    >
      {colorPaths.map(({ color, d }) => (
        <path key={color} d={d} fill={color} />
      ))}
    </svg>
  );
}
