// REFERENCE: performance/b1-opening-profiles; offline-loader.js. Shared timing lock required.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big2/performance/async-opening';
await mkdir(root, { recursive: true });
const rows = [];
const payloads = await Promise.all(['inline', 'async'].map(async variant => {
 const html = await readFile(`/tmp/cardrpg-big2-${variant}-review-index.html`, 'utf8');
 const compressed = html.match(/<script id="payload" type="application\/octet-stream">([^<]+)<\/script>/)?.[1];
 assert.ok(compressed, `${variant} embedded payload`);
 return JSON.parse(gunzipSync(Buffer.from(compressed, 'base64')).toString());
}));
assert.deepEqual(payloads[0], payloads[1], 'Only loading strategy may differ in this comparison');
const runtimeParity = Object.fromEntries(Object.entries(payloads[0]).map(([key, value]) =>
 [key, createHash('sha256').update(value).digest('hex')]));
for (const variant of ['inline', 'async']) {
 const artifact = `/tmp/cardrpg-big2-${variant}-review-index.html`;
 const build = JSON.parse(await readFile(`/tmp/cardrpg-big2-${variant}-review-build.json`, 'utf8'));
 const code = await new Promise((done, reject) => {
  const child = spawn(process.execPath, ['tools/cardrpg-big2/measure.mjs'], {
   env: { ...process.env, BIG_ARTIFACT: artifact, BIG_OUT: `${root}/${variant}`, BIG_CAPTURE: '0' }, stdio: 'inherit',
  });
  child.once('error', reject); child.once('close', done);
 });
 if (code !== 0) throw Error(`${variant} opening comparison exited ${code}`);
 const measured = JSON.parse(await readFile(`${root}/${variant}/summary.json`, 'utf8'));
 assert.equal(build.sha256, measured.sha256);
 await writeFile(`${root}/${variant}/build.json`, JSON.stringify(build, null, 2));
 rows.push({ variant, sha256: build.sha256, sourceHead: build.head, runtimeDirty: build.runtimeDirty,
  cases: measured.rows.map(r => ({ width: r.width, height: r.height, dpr: r.dpr, cpu: r.throttle,
   wholePageMax: r.max, p95: r.p95, postInteractive: r.postInteractive, postReady: r.postReady,
   loadToInteractiveMs: r.loadToInteractiveMs, battleReadyMs: r.battleReadyMs, errors: r.errors })) });
 await writeFile(`${root}/comparison.json`, JSON.stringify({
  method: 'Identical application JS and CSS verified byte for byte; inline versus asynchronous local blob-backed application script. Two pinned builds, seven fresh-page cold scenarios each, real entry clicks and identical traced observation windows. A small cold sample cannot replace the exhaustive final matrix.', runtimeParity, rows,
 }, null, 2));
 assert.ok(measured.rows.every(r => r.errors.length === 0));
}
