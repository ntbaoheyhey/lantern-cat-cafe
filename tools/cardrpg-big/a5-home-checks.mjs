// REFERENCE: PROMPT-A5 E2. Targeted Home checks on a separate artifact; preserve elapsed journey01.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const out = 'reports/cardrpg-big/a5/e2-home/ui-checks';
await mkdir(out, { recursive: true });
const rows = JSON.parse(await readFile(out + '/checks.json', 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '[]'; throw error;
}));
const steps = [
  ['fixtures', ['tools/cardrpg-big/a5-home-fixtures.mjs'], {}],
  ['build', ['tools/cardrpg-big/build.mjs'], {
    BIG_OUTPUT_DIR: '/tmp/cardrpg-a5-home-artifact', BIG_GAMEPLAY_V4: '1', BIG_PYTHON: '/tmp/cardrpg-a5-tools/bin/python',
  }],
  ...[1280, 1440, 1024].map(width => ['browser-' + width, ['tools/cardrpg-big/a5-home-browser.mjs', String(width)], {}]),
];
for (const [name, args, env] of steps) {
  if (rows.some(row => row.name === name && row.code === 0)) continue;
  const attempt = rows.filter(row => row.name === name).length + 1;
  assert(attempt <= 3, 'Two correction rounds exhausted: ' + name);
  const log = `${out}/${name}-attempt-${attempt}.log`, fd = await open(log, 'wx'), started = new Date().toISOString();
  let code;
  try {
    code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A5 Home ${name}`, process.execPath, ...args], {
        env: { ...process.env, ...env, A5_HOME_ATTEMPT: String(attempt) }, stdio: ['ignore', fd.fd, fd.fd],
      });
      child.on('error', reject); child.on('close', done);
    });
  } finally { await fd.close(); }
  rows.push({ name, attempt, code, started, ended: new Date().toISOString(), log,
    sha256: createHash('sha256').update(await readFile(log)).digest('hex') });
  await writeFile(out + '/checks.json', JSON.stringify(rows, null, 2) + '\n');
  console.log(JSON.stringify(rows.at(-1)));
  if (code !== 0) { process.exitCode = code || 1; break; }
  await delay(7000);
}
