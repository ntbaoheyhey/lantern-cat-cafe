import { readdirSync, readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { expect, it } from 'vitest';

const root = resolve(process.cwd(), '../..');
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? sources(path) : /\.[cm]?[jt]sx?$/.test(path) && !/\.(test|spec)\./.test(path) ? [path] : [];
  });
}

it('greps runtime sources: only the preview store and export/mount boundaries may reference pets', () => {
  // Broad allowlist makes all power, combat, drops, forge and server modules fail
  // if they start consuming this registry (including through v2.PET_DEFS).
  const violations: string[] = [];
  for (const path of ['packages/game-rules/src', 'apps/web/src', 'supabase/functions'].flatMap(dir => sources(resolve(root, dir)))) {
    const name = relative(root, path), source = readFileSync(path, 'utf8');
    if (name.startsWith('packages/game-rules/src/v2/meta/pets/') || name === 'apps/web/src/pets/state.ts') continue;
    const permitted = name === 'apps/web/src/game/v2/storeV2.ts' ? source.replace("import { bindPetsToLoop } from '../../pets/state';", '').replace('bindPetsToLoop(store.loop);', '') : source;
    if (/\b(PET_DEFS|PET_PREVIEW_RULES|PET_PREVIEW_STATUS|PET_KILL_TARGET|petProgress|equipPet|PetsStore|getPetsStore|bindPetsToLoop)\b|['"][^'"\n]*(?:meta\/pets|pets\/state)['"]/.test(permitted)) violations.push(name);
  }
  expect(violations).toEqual([]);
});
