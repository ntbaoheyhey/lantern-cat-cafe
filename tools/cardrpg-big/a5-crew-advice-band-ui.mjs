// REFERENCE: advice29 closure. Preserve every original attempt; acquire one bounded browser lease at a time.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, writeFile, open } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const root = 'reports/cardrpg-big/a5/e1/crew-advice-29';
const sha = b => createHash('sha256').update(b).digest('hex');
const artifact = '/tmp/cardrpg-a5-crew-advice-29/artifact';
// This only follows the original build; it never starts a replacement builder.
const deadline = Date.now() + 20 * 60000;
for (;;) {
  try {
    const build = JSON.parse(await readFile(artifact + '/build.json'));
    assert.equal(sha(await readFile(artifact + '/index.html')), build.sha256);
    break;
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  assert(Date.now() < deadline, 'Original build did not complete within the observation window');
  await delay(2000);
}
await readFile(root + '/browser-fixture.json');
const path = root + '/ui-checks.json';
const rows = JSON.parse(await readFile(path, 'utf8').catch(e => { if (e.code === 'ENOENT') return '[]'; throw e; }));
cases: for (const look of ['baseline', 'look']) for (const width of [1280, 1440, 1024]) {
  const name = `${look}-${width}`;
  if (rows.some(row => row.name === name && row.code === 0)) continue;
  const attempt = rows.filter(row => row.name === name).length + 1;
  assert(attempt <= 3, 'At most two correction rounds');
  const log = `${root}/browser-${name}-attempt-${attempt}.log`, fd = await open(log, 'wx');
  const started = new Date().toISOString();
  let code;
  try {
    code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A5 advice29 ${name}`, process.execPath,
        'tools/cardrpg-big/a5-crew-advice-band-browser.mjs', String(width), look],
      { env: { ...process.env, A5_ADVICE_ATTEMPT: String(attempt) }, stdio: ['ignore', fd.fd, fd.fd] });
      const timer = setTimeout(() => child.kill('SIGTERM'), 19 * 60000);
      child.on('error', e => { clearTimeout(timer); reject(e); });
      child.on('close', result => { clearTimeout(timer); resolve(result); });
    });
  } finally { await fd.close(); }
  rows.push({ name, attempt, code, started, ended: new Date().toISOString(), log, sha256: sha(await readFile(log)) });
  await writeFile(path, JSON.stringify(rows, null, 2) + '\n');
  console.log(JSON.stringify(rows.at(-1)));
  if (code !== 0) { process.exitCode = code || 1; break cases; }
  await delay(7000);
}
