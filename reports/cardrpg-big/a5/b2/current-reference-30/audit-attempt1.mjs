// REFERENCE: current-reference-30. Audit saved results, without resampling or selecting a scale.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const root = 'reports/cardrpg-big/a5/b2/current-reference-30', receipts = [];
const sha = b => createHash('sha256').update(b).digest('hex');
async function read(path) { const b = await readFile(path); receipts.push({ path, sha256: sha(b) }); return JSON.parse(b); }
const m = await read(root + '/REGISTERED-METHOD.json');
assert.equal(m.seedOffset, 0); assert.equal(m.count, 500);
assert.deepEqual(m.weights, Array(8).fill(1 / 8));
assert.equal(sha(await readFile(root + '/reference.mjs')), m.scriptSha256);
for (const [p, h] of Object.entries(m.source)) assert.equal(sha(await readFile(m.sourceRoot + '/' + p)), h, p);
const d = await read(root + '/results.json');
assert.deepEqual(d.registration, m); assert.equal(d.methodHash, sha(JSON.stringify(m)));
assert.equal(d.rows.length, 8); assert.equal(new Set(d.rows.map(r => r.scene)).size, 8);
const old = await read(m.calibration.path);
assert.equal(receipts.at(-1).sha256, m.calibration.sha256);
const common = await read('reports/cardrpg-big/a5/b2/common-fixture-04/results.json');
const wilson = wins => {
  const n = 500, p = wins / n, z = 1.959963984540054, den = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / den, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den;
  return [c - h, c + h];
};
const rows = d.rows.map(r => {
  assert.equal(r.kind, 'reference'); assert(r.complete); assert.equal(r.outcomes.length, 500);
  assert.match(r.outcomes, /^[01]+$/); assert.equal(r.digest, sha(r.outcomes));
  assert.equal(r.wins, [...r.outcomes].filter(c => c === '1').length); assert.equal(r.rate, r.wins / 500);
  assert(r.minPowerRatio >= .98 && r.maxPowerRatio <= 1.02);
  const before = old.rows.find(o => o.scene === r.scene && o.factor === m.scenarios[r.scene].factor);
  const prefix = common.rows.find(o => o.kind === 'reference' && o.scene === r.scene);
  assert(before && prefix); assert.equal(before.wins, m.scenarios[r.scene].reference500Wins);
  assert.equal(before.digest, sha(before.outcomes)); assert.equal(prefix.outcomes, before.outcomes.slice(0, 50));
  let improved = 0, worsened = 0;
  for (let i = 0; i < 500; i++) {
    improved += Number(before.outcomes[i] === '0' && r.outcomes[i] === '1');
    worsened += Number(before.outcomes[i] === '1' && r.outcomes[i] === '0');
  }
  return { scene: r.scene, enemies: m.scenarios[r.scene].enemies, factor: m.scenarios[r.scene].factor,
    beforeWins: before.wins, wins: r.wins, rate: r.rate, wilson95: wilson(r.wins), improved, worsened,
    exactPrefix50: prefix.outcomes === r.outcomes.slice(0, 50) };
});
const rates = rows.map(r => r.rate).sort((a, b) => a - b), mean = rates.reduce((a, b) => a + b, 0) / 8;
const median = (rates[3] + rates[4]) / 2;
const audit = { status: 'TRAIN diagnostic only; no combat or fixture change', rows, mean, median,
  improved: rows.reduce((n, r) => n + r.improved, 0), worsened: rows.reduce((n, r) => n + r.worsened, 0),
  referenceMedian55to60: median >= .55 && median <= .60, receipts,
  limitations: ['The same reference and fixed enemy overrides were selected on TRAIN in calibration03.',
    'No new kit/team or acceptance result; this check cannot close cat/set/crew gates.',
    'A reference within its registered range gives no reason to recalibrate difficulty merely to pass another gate.'] };
await writeFile(root + '/audit.json', JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ mean, median, improved: audit.improved, worsened: audit.worsened, referenceMedian55to60: audit.referenceMedian55to60 }));
