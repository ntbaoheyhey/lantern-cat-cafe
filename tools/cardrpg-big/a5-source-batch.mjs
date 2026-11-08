// REFERENCE: PROMPT-A5 phase checks. Run only under with-timing-lock, in one <=20-minute lease.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
const phase = process.argv[2]; assert.match(phase ?? '', /^[a-z0-9-]+$/);
const owner = JSON.parse(await readFile('/tmp/cardrpg-big-locks/timing.lock/owner.json', 'utf8'));
assert.equal(owner.pid, process.ppid, 'A shared timing lock must own this batch directly');
const out = `reports/cardrpg-big/a5/${phase}/gates`; await mkdir(out, { recursive: true });
const rows = JSON.parse(await readFile(`${out}/checks.json`, 'utf8').catch(e => {
  if (e.code === 'ENOENT') return '[]'; throw e;
}));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const steps = [['typecheck', ['typecheck']], ['lint', ['lint']],
  ['web-unit', ['--filter', '@taskbar-hero/web', 'test']], ['rules', ['--filter', '@taskbar-hero/game-rules', 'test']],
  ['e2e', ['--filter', '@taskbar-hero/web', 'test:e2e', '--workers=4']], ['build', ['build']]];
const deadline = Date.now() + 19 * 60000;
for (const [name, args] of steps) {
  if (rows.some(row => row.name === name && row.code === 0)) continue;
  assert(Date.now() < deadline, 'Lease deadline');
  const attempt = rows.filter(row => row.name === name).length + 1;
  assert(attempt <= 3, 'Two correction rounds exhausted: ' + name);
  const log = `${out}/${name}-attempt-${attempt}.log`, fd = await open(log, 'wx'), started = new Date().toISOString();
  let code;
  try {
    code = await new Promise((done, reject) => {
      const child = spawn('pnpm', args, { env: { ...process.env, E2E_PORT_CLASSIC: '5910', E2E_PORT_V2: '5911',
        E2E_PORT_SERVER: '5912', E2E_PORT_API: '5913' }, stdio: ['ignore', fd.fd, fd.fd] });
      const timeout = setTimeout(() => child.kill('SIGTERM'), Math.max(1, deadline - Date.now()));
      child.on('error', error => { clearTimeout(timeout); reject(error); });
      child.on('close', result => { clearTimeout(timeout); done(result); });
    });
  } finally { await fd.close(); }
  const body = await readFile(log, 'utf8');
  rows.push({ name, attempt, code, head, started, ended: new Date().toISOString(), log,
    sha256: createHash('sha256').update(body).digest('hex'),
    counts: body.split('\n').filter(line => /Tests |Test Files |\d+ passed|\d+ failed|\d+ skipped|expected fail/.test(line))
      .map(line => line.replace(/\x1b\[[0-9;]*m/g, '')) });
  await writeFile(`${out}/checks.json`, JSON.stringify(rows, null, 2) + '\n');
  console.log(JSON.stringify(rows.at(-1)));
  if (code !== 0) { process.exitCode = code || 1; break; }
}
