// REFERENCE: A5 B3. Separate bounded checks; preserve every original attempt.
import { spawn, execFileSync } from 'node:child_process';
import { open, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const out = 'reports/cardrpg-big/a5/b3/closure/checks';
await mkdir(out, { recursive: true });
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const buildDir = '/tmp/cardrpg-a5-b3-closure-artifact';
const steps = [
  ['build', ['tools/cardrpg-big/build.mjs'], { BIG_OUTPUT_DIR: buildDir, BIG_GAMEPLAY_V4: '1', BIG_PYTHON: '/tmp/cardrpg-a5-tools/bin/python' }],
  ['day7-x1', ['tools/cardrpg-big/a5-drafts/b3-closure/anchored/day7-x1.mjs'], {}],
  ['paired-route', ['tools/cardrpg-big/a5-drafts/b3-closure/anchored/day7-paired-route.mjs'], {}],
  ...[1280, 1440, 1024].map(width => ['opening-' + width, ['tools/cardrpg-big/a5-e3-browser.mjs', String(width)],
    { A5_E3_ARTIFACT: buildDir + '/index.html', A5_E3_OUT: 'reports/cardrpg-big/a5/b3/closure/opening' }]),
];
const rows = JSON.parse(await readFile(out + '/checks.json', 'utf8').catch(e => { if (e.code === 'ENOENT') return '[]'; throw e; }));
for (const [name, args, env] of steps) {
  if (rows.some(r => r.name === name && r.code === 0)) continue;
  const attempt = rows.filter(r => r.name === name).length + 1;
  assert(attempt <= 3, 'Two correction rounds exhausted: ' + name);
  const log = `${out}/${name}-attempt${attempt}.log`, fd = await open(log, 'wx');
  let code;
  try {
    code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', 'A5 B3 closure ' + name, process.execPath, ...args],
        { env: { ...process.env, ...env }, stdio: ['ignore', fd.fd, fd.fd] });
      child.on('error', reject); child.on('close', done);
    });
  } finally { await fd.close(); }
  rows.push({ name, attempt, head, code, log, sha256: createHash('sha256').update(await readFile(log)).digest('hex') });
  await writeFile(out + '/checks.json', JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows.at(-1)));
  if (code !== 0) { process.exitCode = code; break; }
  await delay(7000);
}
