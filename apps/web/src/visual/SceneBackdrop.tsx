import { useId } from 'react';
import { VISUAL_PALETTE as C } from './tokens';
import './scene.css';

/** Original art is drawn at 1 logical pixel, lit separately, and zoomed with the actors. */
export function SceneBackdrop({ chapter, width, scale = 1, foreground = false }: { chapter: number; width: number; scale?: number; foreground?: boolean }) {
  const id = useId().replace(/:/g, '');
  const ch = Math.max(1, Math.min(5, chapter));
  const x = Math.round((width - 256) / 2);
  const light = ch === 3 ? C.aqua : ch === 4 ? C.rose : C.gold;
  return <svg className={`atelier-scene ${foreground ? 'atelier-scene--front' : ''}`} width={width * scale} height={96 * scale} viewBox={`0 0 ${width} 96`} aria-hidden="true" data-visual-chapter={ch} style={{ imageRendering: 'pixelated' }}>
    <defs>
      <radialGradient id={`${id}-pool`}><stop stopColor={light} stopOpacity=".23" /><stop offset="1" stopColor={light} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${id}-edge`}><stop offset=".4" stopColor={C.ink} stopOpacity="0" /><stop offset="1" stopColor={C.ink} stopOpacity=".58" /></radialGradient>
      <linearGradient id={`${id}-ray`} x2=".35" y2="1"><stop stopColor={C.cream} stopOpacity=".14" /><stop offset="1" stopColor={C.cream} stopOpacity="0" /></linearGradient>
    </defs>
    {foreground ? <>
      <image className="atelier-foreground" href={`/art/visual/foreground-${ch}.png`} x={x} width="256" height="96" />
      <g className="atelier-dust" fill={C.cream}>{Array.from({ length: 7 }, (_, i) => <rect key={i} x={Math.round(width * .2) + (i * 31) % Math.round(width * .65)} y={20 + i * 7 % 46} width={i % 3 === 0 ? .7 : .4} height={i % 3 === 0 ? .7 : .4} style={{ animationDelay: `${-i * 1.7}s` }} />)}</g>
      <g className="atelier-steam" fill="none" stroke={C.cream} strokeWidth=".6" opacity=".5"><path d={`M${x + 181} 57 q-2 -2 0 -4 t0 -4`} /><path d={`M${x + 184} 55 q2 -2 0 -4`} /></g>
      <rect width={width} height="96" fill={`url(#${id}-edge)`} />
    </> : <>
      <rect width={width} height="96" fill={C.night} />
      <image className="atelier-room" href={`/art/visual/room-${ch}.png`} x={x} width="256" height="96" />
      <path d={`M${x + 66} 13 L${x + 120} 13 L${x + 181} 84 L${x + 44} 84 Z`} fill={`url(#${id}-ray)`} />
      <ellipse cx={width * .4} cy="82" rx={width * .45} ry="24" fill={`url(#${id}-pool)`} />
      <ellipse className="atelier-lamp" cx={x + 192} cy="24" rx="29" ry="27" fill={`url(#${id}-pool)`} />
    </>}
  </svg>;
}
