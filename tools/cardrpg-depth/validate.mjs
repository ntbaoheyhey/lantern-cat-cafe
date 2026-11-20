import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'reports/cardrpg-depth/validation');
const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const steps = [
  ['tests', 'pnpm', ['test']],
  ['typecheck', 'pnpm', ['typecheck']],
  ['lint', 'pnpm', ['lint']],
  ['build', 'pnpm', ['build']],
  ['contracts', 'forge', ['test', '--root', 'contracts']],
  ['e2e', 'pnpm', ['--filter', '@taskbar-hero/web', 'test:e2e', '--workers=4'], {
    E2E_PORT_CLASSIC: '5810', E2E_PORT_V2: '5811', E2E_PORT_SERVER: '5812', E2E_PORT_API: '5813',
  }],
  ['combat-final', 'node', ['tools/cardrpg-depth/sim.mjs'], { DEPTH_SEEDS: '150', DEPTH_OFFSET: '0', DEPTH_TRIAL: 'final' }],
  ['combat-heldout', 'node', ['tools/cardrpg-depth/sim.mjs'], { DEPTH_SEEDS: '150', DEPTH_OFFSET: '1000', DEPTH_TRIAL: 'heldout' }],
  ['roster-broad', 'node', ['tools/cardrpg-depth/roster-sim.mjs']],
  ['economy-final', 'node', ['tools/cardrpg-depth/economy.mjs']],
  ['app-check', 'node', ['tools/cardrpg-depth/app-check.mjs']],
  ['path-check', 'node', ['tools/cardrpg-depth/path-check.mjs']],
  ['isolation', 'node', ['tools/cardrpg-depth/isolation.mjs']],
  ['performance', 'node', ['tools/cardrpg-depth/performance.mjs']],
  ['performance-retina', 'node', ['tools/cardrpg-depth/performance.mjs'], { DEPTH_DPR: '2', DEPTH_PERF_OUT: 'reports/cardrpg-depth/performance-retina' }],
  ['safety', 'node', ['tools/cardrpg-depth/safety.mjs']],
];
mkdirSync(output, { recursive: true });
const results = [];
for (const [name, command, args, env = {}] of steps) {
  const started = new Date().toISOString();
  const file = resolve(output, `${name}-delivery.log`);
  const descriptor = openSync(file, 'w');
  const exit = await new Promise((complete, reject) => {
    const child = spawn(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', descriptor, descriptor] });
    child.on('error', reject);
    child.on('close', complete);
  });
  closeSync(descriptor);
  const row = { name, command, args, env, source, started, finished: new Date().toISOString(), exit,
    log: `reports/cardrpg-depth/validation/${name}-delivery.log`,
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex') };
  results.push(row);
  writeFileSync(resolve(output, 'delivery-results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(row));
}
process.exitCode = results.some(row => row.exit !== 0) ? 1 : 0;
