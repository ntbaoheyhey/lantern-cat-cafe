// Generates Edge Function import maps. Edit these templates, then run `pnpm gen:deno`.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const functionsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../supabase/functions');

const auth = {
  imports: {
    '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.3',
    'jose': 'npm:jose@6.2.12',
    'viem': 'npm:viem@2.57.4',
    'viem/siwe': 'npm:viem@2.57.4/siwe',
  },
};

const game = {
  imports: {
    ...auth.imports,
    'viem/accounts': 'npm:viem@2.57.4/accounts',
    '@taskbar-hero/api-contract': '../../../packages/api-contract/src/index.ts',
    '../../../packages/api-contract/src/endpoints': '../../../packages/api-contract/src/endpoints.ts',
    '../../../packages/api-contract/src/errors': '../../../packages/api-contract/src/errors.ts',
    '../../../packages/api-contract/src/state': '../../../packages/api-contract/src/state.ts',
    '../../../packages/api-contract/src/types': '../../../packages/api-contract/src/types.ts',
    // chain/src/index.ts reads deployment JSON, which Deno cannot import without import
    // attributes, so the functions get the JSON-free constants module instead.
    '@taskbar-hero/chain': '../../../packages/chain/src/constants.ts',
    '../../../packages/chain/src/abi': '../../../packages/chain/src/abi.ts',
    '@taskbar-hero/game-rules': '../../../packages/game-rules/src/index.ts',
    '../../../packages/game-rules/src/config': '../../../packages/game-rules/src/config.ts',
    '../../../packages/game-rules/src/content': '../../../packages/game-rules/src/content.ts',
    '../../../packages/game-rules/src/rng': '../../../packages/game-rules/src/rng.ts',
    '../../../packages/game-rules/src/rules': '../../../packages/game-rules/src/rules.ts',
    '../../../packages/game-rules/src/sim': '../../../packages/game-rules/src/sim.ts',
    '../../../packages/game-rules/src/types': '../../../packages/game-rules/src/types.ts',
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

console.log(`wrote ${functions.length} Edge Function import maps`);
