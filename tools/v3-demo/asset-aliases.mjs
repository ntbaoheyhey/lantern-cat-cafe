import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// A's turn-order HUD asks for enemy portraits that B's public rig folders omit.
// Reuse the shipped A portraits in the demo packaging; no generated art or gameplay edits.
export function demoAssetAliases(root) {
  const publicUnits = resolve(root, 'apps/web/public/units');
  // Public folders also contain promotional art; actor membership comes from the registry.
  const {units} = JSON.parse(readFileSync(resolve(root, 'assets/cardrpg-look/spine/slots.json'), 'utf8'));
  return new Map(units.flatMap(({id}) => {
    if (existsSync(resolve(publicUnits, id, 'portrait.webp'))) return [];
    const face = resolve(root, 'assets/cardrpg-a6/illustrations', `${id}-face.webp`);
    const art = resolve(root, 'assets/cardrpg-a6/illustrations', `${id}.webp`);
    const source = existsSync(face) ? face : art;
    if (!existsSync(source)) throw new Error(`Missing demo portrait: ${id}`);
    return [[`/units/${id}/portrait.webp`, source]];
  }));
}
