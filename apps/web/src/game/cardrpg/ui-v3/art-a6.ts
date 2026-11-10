import type { SyntheticEvent } from 'react';
import manifest from '../../../../../../assets/cardrpg-a6/illustrations/manifest.json';
import { portraitProps as classicPortrait } from '../depth/assets';

const images = import.meta.glob('../../../../../../assets/cardrpg-a6/illustrations/*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const sources = Object.fromEntries(Object.entries(images).map(([path, url]) => [path.split('/').at(-1)!, url]));
type ArtEntry = { art: string; face?: string; source: string };
export const ART_A6: Readonly<Record<string, ArtEntry>> = manifest.units;

/** Every DOM view uses the same original art, retaining the existing render if a file is absent. */
export function artPropsA6(id: string, kind: 'art' | 'face' = 'art') {
  const fallback = classicPortrait(id);
  const entry = ART_A6[id];
  const src = entry && sources[(kind === 'face' ? entry.face : undefined) ?? entry.art];
  return {
    src: src ?? fallback.src,
    srcSet: src ? undefined : fallback.srcSet,
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      if (!src || image.dataset.artFallback) return;
      image.dataset.artFallback = 'true';
      image.removeAttribute('srcset');
      if (fallback.src) image.src = fallback.src;
    },
  };
}
