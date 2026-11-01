import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gameRulesImports, generateImportMaps } from './gen-deno-json.mjs';

function fixture(t, paths) {
  const root = mkdtempSync(join(tmpdir(), 'tbh-deno-maps-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const path of paths) {
    const file = join(root, path);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, 'export {};\n');
  }
  return root;
}

const source = 'packages/game-rules/src';
const key = (path) => `../../../${source}/${path}`;

test('explicit root and nested index imports resolve to their exact files', (t) => {
  const root = fixture(t, [`${source}/index.ts`, `${source}/v2/forge/index.ts`]);
  const imports = gameRulesImports(root);
  assert.equal(imports[key('index')], key('index.ts'));
  assert.equal(imports[key('v2/forge/index')], key('v2/forge/index.ts'));
});

test('directory aliases coexist with explicit indexes and ordinary modules', (t) => {
  const root = fixture(t, [`${source}/v2/forge/index.ts`, `${source}/v2/forge/craft.ts`]);
  assert.deepEqual(gameRulesImports(root), {
    [key('v2/forge')]: key('v2/forge/index.ts'),
    [key('v2/forge/craft')]: key('v2/forge/craft.ts'),
    [key('v2/forge/index')]: key('v2/forge/index.ts'),
  });
});

test('test modules, fixture folders and non-TypeScript files stay out of deployment maps', (t) => {
  const root = fixture(t, [
    `${source}/rng.ts`, `${source}/rng.test.ts`, `${source}/README.md`,
    `${source}/__fixtures__/index.ts`, `${source}/v2/__snapshots__/sample.ts`,
  ]);
  assert.deepEqual(gameRulesImports(root), { [key('rng')]: key('rng.ts') });
});

test('output order is stable regardless of file creation order', (t) => {
  const paths = [`${source}/z.ts`, `${source}/a/index.ts`, `${source}/a/b.ts`, `${source}/index.ts`];
  const first = fixture(t, paths);
  const second = fixture(t, [...paths].reverse());
  assert.equal(JSON.stringify(gameRulesImports(first)), JSON.stringify(gameRulesImports(second)));
  assert.deepEqual(Object.keys(gameRulesImports(first)), [key('a'), key('a/b'), key('a/index'), key('index'), key('z')]);
});

test('generation preserves auth mappings and ignores shared or non-function directories', (t) => {
  const root = fixture(t, [
    `${source}/index.ts`, `${source}/v2/forge/index.ts`,
    'supabase/functions/auth-nonce/index.ts', 'supabase/functions/game-state/index.ts',
    'supabase/functions/_shared/index.ts', 'supabase/functions/assets/README.md',
  ]);
  assert.equal(generateImportMaps(root), 2);
  const authPath = join(root, 'supabase/functions/auth-nonce/deno.json');
  const gamePath = join(root, 'supabase/functions/game-state/deno.json');
  const auth = JSON.parse(readFileSync(authPath, 'utf8'));
  assert.deepEqual(auth, { imports: {
    '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.3',
    jose: 'npm:jose@6.2.12',
    viem: 'npm:viem@2.57.4',
    'viem/siwe': 'npm:viem@2.57.4/siwe',
  } });
  const game = JSON.parse(readFileSync(gamePath, 'utf8'));
  assert.equal(game.imports[key('v2/forge/index')], key('v2/forge/index.ts'));
  assert.equal(game.imports['@taskbar-hero/chain'], '../../../packages/chain/src/constants.ts');
  const before = readFileSync(gamePath, 'utf8');
  generateImportMaps(root);
  assert.equal(readFileSync(gamePath, 'utf8'), before);
});
