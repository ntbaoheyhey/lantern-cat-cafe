// REFERENCE: reports/cardrpg-big/look-ui/L1-ADOPTION.md. Loaded only by the card-RPG entry.
import { isLookV2 } from '../../squad/turn3d/look-v2';

export interface LookPortraitManifest {
  version: number;
  pathBase: string;
  portraits?: Record<string, { portrait?: { '1x'?: string; '2x'?: string } }>;
}
export interface PortraitProps { src: string | undefined; srcSet: string | undefined }

// An absent/partial published manifest is valid while LOOK delivers its checkpoints.
const manifests = import.meta.glob('../look-assets.json', { eager: true, import: 'default' }) as Record<string, LookPortraitManifest>;
const images = import.meta.glob('../../../../../../assets/cardrpg-look/portraits/*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const urls = Object.fromEntries(Object.entries(images).map(([path, url]) => [path.replace('../../../../../../', ''), url]));

export function selectPortrait(id: string, enabled: boolean, classic: string | undefined,
  manifest: LookPortraitManifest | undefined, sources: Record<string, string>): PortraitProps {
  const fallback = { src: classic, srcSet: undefined };
  if (!enabled || manifest?.version !== 2 || manifest.pathBase !== 'repository-root') return fallback;
  const entry = manifest.portraits?.[id]?.portrait;
  if (!entry?.['1x'] || !entry['2x']) return fallback;
  const one = sources[entry['1x']], two = sources[entry['2x']];
  // Do not replace a complete classic portrait with a partially packaged pair.
  if (!one || !two) return fallback;
  return { src: one, srcSet: `${one} 1x, ${two} 2x` };
}

export const lookPortrait = (id: string, classic: string | undefined): PortraitProps =>
  selectPortrait(id, isLookV2(), classic, manifests['../look-assets.json'], urls);
