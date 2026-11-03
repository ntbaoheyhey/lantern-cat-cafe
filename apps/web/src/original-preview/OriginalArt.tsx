import atlas from '../art/generated/original/atlas/atlas.json';
import sheet from '../art/generated/original/atlas/sheet.png';
export type OriginalArtKind = 'stat' | 'item' | 'skill';
/** Static atlas lookup; no animation, recoloring or fractional scaling. Adjacent text is the label. */
export function OriginalArt({ kind, id, scale = 1 }: { kind: OriginalArtKind; id: string; scale?: 1 | 2 | 3 }) {
  const key = `${kind}-${id.toLowerCase()}`;
  const entry = Object.prototype.hasOwnProperty.call(atlas.frames, key) ? atlas.frames[key as keyof typeof atlas.frames] : undefined;
  if (!entry) return <span className="original-art original-art-missing" aria-hidden="true" data-art-missing={key} style={{ width: 32 * scale, height: 32 * scale }} />;
  return <span className="original-art" aria-hidden="true" data-original-art={key} style={{
    width: entry.sourceSize.w * scale, height: entry.sourceSize.h * scale,
    backgroundImage: `url(${sheet})`, backgroundPosition: `${-entry.frame.x * scale}px ${-entry.frame.y * scale}px`,
    backgroundSize: `${atlas.meta.size.w * scale}px ${atlas.meta.size.h * scale}px`,
  }} />;
}
