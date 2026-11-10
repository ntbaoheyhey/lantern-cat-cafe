import type { SyntheticEvent } from 'react';
import manifest from '../../../../../../assets/cardrpg-a6/illustrations/manifest.json';
import puppetManifest from '../../../../../../assets/cardrpg-look/v3-portraits/manifest.json';
import { portraitProps as classicPortrait } from '../depth/assets';

const images = import.meta.glob('../../../../../../assets/cardrpg-a6/illustrations/*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const faces = import.meta.glob('../../../../../../assets/cardrpg-look/v3-portraits/*-face-*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const faceSources = Object.fromEntries(Object.entries(faces).map(([path, url]) => [path.replace('../../../../../../', ''), url]));
const sources = Object.fromEntries(Object.entries(images).map(([path, url]) => [path.split('/').at(-1)!, url]));
type ArtEntry = { art: string; face?: string; source: string };
export const ART_A6: Readonly<Record<string, ArtEntry>> = manifest.units;

/** Every DOM view uses the same original art, retaining the existing render if a file is absent. */
export function artPropsA6(id: string, kind: 'art' | 'face' = 'art') {
  const fallback = classicPortrait(id);
  const entry = ART_A6[id];
  const face = kind === 'face' ? (puppetManifest.portraits as Record<string, { faceIcon?: { '1x': string; '2x': string } }>)[id]?.faceIcon : undefined;
  const faceOne = face && faceSources[face['1x']], faceTwo = face && faceSources[face['2x']];
  const src = faceOne ?? (entry && sources[(kind === 'face' ? entry.face : undefined) ?? entry.art]);
  return {
    src: src ?? fallback.src,
    srcSet: faceOne && faceTwo ? `${faceOne} 1x, ${faceTwo} 2x` : src ? undefined : fallback.srcSet,
    onError: (event: SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      if (!src || image.dataset.artFallback) return;
      image.dataset.artFallback = 'true';
      image.removeAttribute('srcset');
      if (fallback.src) image.src = fallback.src;
    },
  };
}
