import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const phase = process.argv[2] || 'delivery';
const directory = resolve(root, 'reports/cardrpg-big/validation');
mkdirSync(directory, { recursive: true });
const steps = [
  ['typecheck', ['typecheck']], ['lint', ['lint']], ['tests', ['test']], ['build', ['build']],
  ['e2e', ['--filter', '@taskbar-hero/web', 'test:e2e', '--workers=4']],
];
const results = [];
const { setTimeout: delay } = await import('node:timers/promises');
for (const [name, args] of steps) {
  const path = `${directory}/${phase}-${name}.log`, fd = openSync(path, 'w');
  const started = new Date().toISOString();
  const exit = await new Promise((complete, reject) => {
    const serialized = name === 'e2e' || name === 'tests';
    const command = serialized ? process.execPath : 'nice';
    const commandArgs = serialized ? ['tools/cardrpg-big/with-timing-lock.mjs', `${phase} ${name}`, 'nice', '-n', '10', 'pnpm', ...args] : ['-n', '10', 'pnpm', ...args];
    const child = spawn(command, commandArgs, { cwd: root, env: { ...process.env, E2E_PORT_CLASSIC: '5910', E2E_PORT_V2: '5911', E2E_PORT_SERVER: '5912', E2E_PORT_API: '5913' }, stdio: ['ignore', fd, fd] });
    child.on('error', reject); child.on('close', complete);
  });
  closeSync(fd);
  const log = readFileSync(path, 'utf8');
  const row = { name, args, exit, started, ended: new Date().toISOString(), log: path.replace(root + '/', ''), sha256: createHash('sha256').update(log).digest('hex'), counts: log.split('\n').filter(line => /Tests |Test Files |\d+ passed|\d+ failed|\d+ skipped|expected fail/.test(line)).map(line => line.replace(/\x1b\[[0-9;]*m/g, '')) };
  results.push(row); console.log(JSON.stringify(row));
  writeFileSync(`${directory}/${phase}.json`, JSON.stringify(results, null, 2));
  if (name === 'e2e' || name === 'tests') await delay(Number(process.env.BIG_HANDOFF_MS||6500));
}
process.exitCode = results.some(result => result.exit !== 0) ? 1 : 0;
