// Generates Edge Function import maps. Edit these templates, then run `pnpm gen:deno`.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * game-rules imports its own modules without extensions ('./rng', './v2'), which Deno does not
 * resolve. Map every non-test module (and every folder with an index.ts) to its file, so new
 * modules need no edit here.
 */
export function gameRulesImports(projectRoot = root) {
  const src = join(projectRoot, 'packages/game-rules/src');
  const out = {};
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name.startsWith('__')) continue;
        if (existsSync(join(full, 'index.ts'))) out[spec(full)] = `${spec(full)}/index.ts`;
        walk(full);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        // A directory import ('./forge') and an explicit index import
        // ('./index' from forge/craft.ts) are different exact Deno keys.
        out[spec(full.slice(0, -3))] = `${spec(full)}`;
      }
    }
  };
  // Specifier as seen from supabase/functions/<name>/.
  const spec = (p) => `../../../${relative(projectRoot, p).split('\\').join('/')}`;
  walk(src);
  return out;
}

const auth = {
  imports: {
    '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.3',
    'jose': 'npm:jose@6.2.12',
    'viem': 'npm:viem@2.57.4',
    'viem/siwe': 'npm:viem@2.57.4/siwe',
  },
};

export function generateImportMaps(projectRoot = root) {
  const functionsDir = join(projectRoot, 'supabase/functions');
  const game = {
    imports: {
      ...auth.imports,
      'viem/accounts': 'npm:viem@2.57.4/accounts',
      '@taskbar-hero/api-contract': '../../../packages/api-contract/src/index.ts',
      '../../../packages/api-contract/src/endpoints': '../../../packages/api-contract/src/endpoints.ts',
      '../../../packages/api-contract/src/errors': '../../../packages/api-contract/src/errors.ts',
      '../../../packages/api-contract/src/state': '../../../packages/api-contract/src/state.ts',
      '../../../packages/api-contract/src/types': '../../../packages/api-contract/src/types.ts',
      '../../../packages/api-contract/src/v2': '../../../packages/api-contract/src/v2.ts',
      // chain/src/index.ts reads deployment JSON, which Deno cannot import without import
      // attributes, so the functions get the JSON-free constants module instead.
      '@taskbar-hero/chain': '../../../packages/chain/src/constants.ts',
      '../../../packages/chain/src/abi': '../../../packages/chain/src/abi.ts',
      '@taskbar-hero/game-rules': '../../../packages/game-rules/src/index.ts',
      ...gameRulesImports(projectRoot),
    },
  };

  const functions = readdirSync(functionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(functionsDir, name, 'index.ts')))
    .sort();

  for (const name of functions) {
    const template = name.startsWith('auth-') ? auth : game;
    writeFileSync(join(functionsDir, name, 'deno.json'), `${JSON.stringify(template, null, 2)}\n`);
  }

  return functions.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(`wrote ${generateImportMaps()} Edge Function import maps`);
}
