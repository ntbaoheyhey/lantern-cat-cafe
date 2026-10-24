// Generates docs/content-v2.md from the v2 content registry. Run `node scripts/gen-content-docs.mjs`.
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vitestBin = resolve(root, 'packages/game-rules/node_modules/.bin/vitest');

const res = spawnSync(vitestBin, ['run', 'src/v2/content/docs.gen.test.ts'], {
  cwd: resolve(root, 'packages/game-rules'),
  env: { ...process.env, UPDATE_DOCS: '1' },
  stdio: 'inherit',
});

if (res.error) {
  console.error('Failed to run vitest generator:', res.error);
  process.exit(1);
}
if (res.status !== 0) {
  process.exit(res.status ?? 1);
}
console.log('Successfully generated docs/content-v2.md from registry.');
