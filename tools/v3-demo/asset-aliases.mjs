import {existsSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

// A's turn-order HUD asks for enemy portraits that B's public rig folders omit.
// Reuse the shipped A portraits in the demo packaging; no generated art or gameplay edits.
export function demoAssetAliases(root) {
  const publicUnits = resolve(root, 'apps/web/public/units');
  return new Map(readdirSync(publicUnits, {withFileTypes: true}).flatMap(entry => {
    if (!entry.isDirectory() || existsSync(resolve(publicUnits, entry.name, 'portrait.webp'))) return [];
    const face = resolve(root, 'assets/cardrpg-a6/illustrations', `${entry.name}-face.webp`);
    const art = resolve(root, 'assets/cardrpg-a6/illustrations', `${entry.name}.webp`);
    const source = existsSync(face) ? face : art;
    if (!existsSync(source)) throw new Error(`Missing demo portrait: ${entry.name}`);
    return [[`/units/${entry.name}/portrait.webp`, source]];
  }));
}
