import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { routesV2, type V2Deps } from '../../functions/_shared/v2/game.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const functions = join(root, 'supabase/functions');
const folders = readdirSync(functions, { withFileTypes: true }).filter(d => d.isDirectory() && d.name.startsWith('v2-')).map(d => d.name).sort();
const v1 = ['auth-nonce', 'auth-verify', 'game-state', 'idle-claim', 'equip', 'boss-fight', 'upgrade', 'relic-forge', 'relic-mint-report'];

it('deploys every v2 folder exactly once and retains the exact v1 list', () => {
  const workflow = readFileSync(join(root, '.github/workflows/deploy-functions.yml'), 'utf8');
  const line = workflow.match(/^\s*FUNCTIONS:\s*(.+)$/m)?.[1];
  expect(line).toBeDefined();
  const deployed = line!.trim().split(/\s+/);
  expect(new Set(deployed).size).toBe(deployed.length);
  expect(deployed.filter(name => name.startsWith('v2-')).sort()).toEqual(folders);
  expect(deployed.filter(name => !name.startsWith('v2-'))).toEqual(v1);
  expect(folders).toHaveLength(9);
});
it('registers exactly the deployed v2 folder names as real routes', () => {
  // Building the route map is pure: handlers capture these dependencies without calling them.
  const keys = Object.keys(routesV2({ store: {} as V2Deps['store'], seedSecret: 'unused-route-test' })).sort();
  expect(keys).toEqual(folders);
});
it('keeps every entrypoint and deno.json byte-identical to the actual generator output', () => {
  const temp = mkdtempSync(join(tmpdir(), 'v2-deploy-map-'));
  try {
    mkdirSync(join(temp, 'scripts'), { recursive: true });
    cpSync(join(root, 'scripts/gen-deno-json.mjs'), join(temp, 'scripts/gen-deno-json.mjs'));
    mkdirSync(join(temp, 'packages/game-rules'), { recursive: true });
    symlinkSync(join(root, 'packages/game-rules/src'), join(temp, 'packages/game-rules/src'), 'dir');
    for (const name of folders) {
      expect(readFileSync(join(functions, name, 'index.ts'), 'utf8').length).toBeGreaterThan(0);
      mkdirSync(join(temp, 'supabase/functions', name), { recursive: true });
      writeFileSync(join(temp, 'supabase/functions', name, 'index.ts'), '// Generator discovers entrypoint existence only.\n');
    }
    execFileSync(process.execPath, [join(temp, 'scripts/gen-deno-json.mjs')], { cwd: temp });
    for (const name of folders) expect(readFileSync(join(functions, name, 'deno.json'), 'utf8'), name).toBe(readFileSync(join(temp, 'supabase/functions', name, 'deno.json'), 'utf8'));
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
it('documents every deployed v2 endpoint by name', () => {
  const docs = readFileSync(join(root, 'docs/api-v2.md'), 'utf8');
  for (const name of folders) expect(docs, name).toContain(name);
});
