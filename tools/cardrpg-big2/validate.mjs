import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const phase = process.argv[2] || 'delivery';
const directory = resolve(root, 'reports/cardrpg-big2/validation');
mkdirSync(directory, { recursive: true });
const steps = [
  ['typecheck', ['typecheck']], ['demo-types', ['--filter','@taskbar-hero/web','exec','tsc','-p','../../tools/cardrpg-big2/tsconfig.json','--noEmit']], ['lint', ['lint']], ['tests', ['test']], ['build', ['build']],
  ['e2e', ['--filter', '@taskbar-hero/web', 'test:e2e', '--workers=4']],
];
const results = [];
for (const [name, args] of steps.filter(([name]) => !process.env.BIG_VALIDATE_STEPS || process.env.BIG_VALIDATE_STEPS.split(',').includes(name))) {
  const path = `${directory}/${phase}-${name}.log`, fd = openSync(path, 'w');
  const started = new Date().toISOString();
  const exit = await new Promise((complete, reject) => {
    const child = spawn('nice', ['-n', '10', 'pnpm', ...args], { cwd: root, env: { ...process.env, E2E_PORT_CLASSIC: '5920', E2E_PORT_V2: '5921', E2E_PORT_SERVER: '5922', E2E_PORT_API: '5923' }, stdio: ['ignore', fd, fd] });
    child.on('error', reject); child.on('close', complete);
  });
  closeSync(fd);
  const log = readFileSync(path, 'utf8');
  const row = { name, args, exit, started, ended: new Date().toISOString(), log: path.replace(root + '/', ''), sha256: createHash('sha256').update(log).digest('hex'), counts: log.split('\n').filter(line => /Tests |Test Files |\d+ passed|\d+ failed|\d+ skipped|expected fail/.test(line)).map(line => line.replace(/\x1b\[[0-9;]*m/g, '')) };
  results.push(row); console.log(JSON.stringify(row));
  writeFileSync(`${directory}/${phase}.json`, JSON.stringify(results, null, 2));
}
process.exitCode = results.some(result => result.exit !== 0) ? 1 : 0;
