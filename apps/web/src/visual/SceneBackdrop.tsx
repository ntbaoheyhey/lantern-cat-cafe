import { VISUAL_PALETTE as C } from './tokens';
import './scene.css';

/** Original art is drawn at 1 logical pixel, lit separately, and zoomed with the actors. */
export function SceneBackdrop({ chapter, width, scale = 1, foreground = false }: { chapter: number; width: number; scale?: number; foreground?: boolean }) {
  const ch = Math.max(1, Math.min(5, chapter));
  const x = Math.round((width - 256) / 2);
  return <svg className={`atelier-scene ${foreground ? 'atelier-scene--front' : ''}`} width={width * scale} height={96 * scale} viewBox={`0 0 ${width} 96`} aria-hidden="true" data-visual-chapter={ch} data-backdrop={foreground ? undefined : ['livingroom', 'kitchen', 'bathroom', 'basement', 'rooftops'][ch - 1]} style={{ imageRendering: 'pixelated' }}>
    {foreground ? <>
      <image className="atelier-foreground" href={`/art/visual/foreground-${ch}.png`} x={x} width="256" height="96" />
      <g className="atelier-dust" fill={C.cream}>{Array.from({ length: 7 }, (_, i) => <rect key={i} x={Math.round(width * .2) + (i * 31) % Math.round(width * .65)} y={20 + i * 7 % 46} width="1" height="1" style={{ animationDelay: `${-i * 1.7}s` }} />)}</g>
      <g className="atelier-steam" fill="none" stroke={C.cream} strokeWidth=".6" opacity=".5"><path d={`M${x + 181} 57 q-2 -2 0 -4 t0 -4`} /><path d={`M${x + 184} 55 q2 -2 0 -4`} /></g>
      <g transform={`translate(${width - 24} 84)`}><g className="atelier-mouse">
        <ellipse cx="0" cy="0" rx="3" ry="2" fill={C.ink} /><ellipse cx="-1" cy="-1" rx="2" ry="1.5" fill={C.common} />
        <rect x="-2" y="-3" width="1" height="2" fill={C.rose} /><rect x="-3" y="-1" width="1" height="1" fill={C.ink} />
        <path d="M2 0h4v-1h2" fill="none" stroke={C.coral} strokeWidth="1" />
      </g></g>
      <image href="/art/visual/shade.png" x={x} width="256" height="96" />
    </> : <>
      <rect width={width} height="96" fill={C.night} />
      <image className="atelier-room" href={`/art/visual/room-${ch}.png`} x={x} width="256" height="96" />
      <path d={`M${x + 66} 13 L${x + 120} 13 L${x + 181} 84 L${x + 44} 84 Z`} fill={C.cream} opacity=".07" />
      <image className="atelier-lamp" href={`/art/visual/light-${ch}.png`} x={x} width="256" height="96" />
    </>}
  </svg>;
}
