// REFERENCE: reports/cardrpg-big/memory/PROMPT.md F7; integration/delivery/checks receipts.
// Verify saved evidence without starting browsers or changing the accepted artifact.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = 'reports/cardrpg-big/integration/delivery';
const artifact = 'docs/cardrpg3/index.html';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(artifact);
const artifactSha256 = sha(bytes);
assert.equal(artifactSha256, '9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
const allowPending = process.argv.includes('--allow-pending');
const expected = { studio: 3, gallery: 3, comparisons: 93, lab: 3, meta: 3,
  reveal: 8, invitations: 4, designs: 3, 'path-resume': 3, 'mechanics-resume': 4 };
const receipts = [], pending = [];
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

function checkFailures(value, path) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const location = `${path}.${key}`;
    if (['errors', 'requests', 'remoteRequests', 'overflowElements', 'rightOverflow'].includes(key)) {
      assert.deepEqual(child, [], location);
    }
    if (['overflow', 'pageOverflow', 'panelOverflow', 'bodyOverflow'].includes(key)) {
      assert(child === 0 || child === false, `${location}: ${child}`);
    }
    if (['passed', 'accountUnchanged', 'accountRestored', 'local'].includes(key)) {
      assert.equal(child, true, location);
    }
    checkFailures(child, location);
  }
}

for (const [name, count] of Object.entries(expected)) {
  const path = `${root}/${name}/checks.json`;
  let raw;
  try { raw = await readFile(path); } catch (error) {
    if (allowPending && error.code === 'ENOENT') { pending.push(name); continue; }
    throw error;
  }
  const receipt = JSON.parse(raw);
  assert.equal(receipt.sha256, artifactSha256, path);
  if (allowPending && receipt.rows.length < count) { pending.push(name); continue; }
  assert.equal(receipt.rows.length, count, path);
  checkFailures(receipt, name);
  const screenshots = [];
  for (const file of (await readdir(`${root}/${name}`)).filter(f => /\.(png|webp)$/.test(f)).sort()) {
    const imagePath = `${root}/${name}/${file}`;
    const image = await readFile(imagePath);
    screenshots.push({ path: imagePath, bytes: image.length, sha256: sha(image) });
  }
  receipts.push({ name, path, sha256: sha(raw), rows: count, screenshots });
}

const source = await readJson(`${root}/source-acceptance.json`);
assert.equal(source.sha256, artifactSha256);
const sourceGates = [];
for (const gate of source.gates) {
  assert.equal(gate.exit, 0);
  assert.equal(sha(await readFile(gate.log)), gate.sha256, gate.log);
  sourceGates.push({ name: gate.name, log: gate.log, sha256: gate.sha256, exit: 0 });
}
const old = await readJson(`${root}/functional.json`);
assert.equal(old.sha256, artifactSha256);
assert.equal(old.rows.length, 8);
assert(old.rows.every(row => row.exit === 0));
const summary = {
  at: new Date().toISOString(), artifact, artifactSha256, artifactBytes: bytes.length,
  method: 'Audit existing successful receipts and screenshot bytes. This is not a new browser or performance run. Original partial attempts remain separate.',
  functionalComplete: pending.length === 0, pending, receipts, sourceGates,
  originalSuccessfulSteps: old.rows.map(row => row.name),
  screenshotCount: receipts.reduce((sum, receipt) => sum + receipt.screenshots.length, 0),
};
const output = `${root}/functional-audit.json`;
await writeFile(output, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ output: resolve(output), functionalComplete: summary.functionalComplete,
  verifiedReceipts: receipts.length, screenshotCount: summary.screenshotCount, pending }));
