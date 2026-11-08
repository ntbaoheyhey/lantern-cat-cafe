// REFERENCE: A5 B2 current16. Audit the same90 previously earned saves, without resampling.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = 'reports/cardrpg-big/a5/b2/suppression-current-16';
const paths = {
  before: 'reports/cardrpg-big/a5/b3/anchored-validation-03/day7-checks/checks.json',
  after: root + '/day7-checks/checks.json',
  registration: root + '/REGISTERED-METHOD.json',
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const receipts = [], data = {};
for (const [id, path] of Object.entries(paths)) {
  const bytes = await readFile(path);
  receipts.push({ path, sha256: sha(bytes) }); data[id] = JSON.parse(bytes);
}
const { before, after, registration } = data;
assert.equal(before.accounts.length, 90); assert.equal(after.accounts.length, 90);
for (const key of ['inputs', 'accountSeeds', 'firstRouteSeed', 'retrySeed', 'chapter', 'policy', 'gates'])
  assert.deepEqual(after.registration[key], before.registration[key], key);
assert.deepEqual(after.registration.source, registration.combatSource);
const old = new Map(before.accounts.map(row => [`${row.style}:${row.index}`, row]));
assert.equal(old.size, 90);
assert.equal(new Set(after.accounts.map(row => `${row.style}:${row.index}`)).size, 90);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const rows = [];
for (const b of after.accounts) {
  const a = old.get(`${b.style}:${b.index}`); assert(a);
  const path = `${after.registration.inputs}/${b.style}-${b.index}.save`;
  assert.equal(sha(await readFile(path)), registration.savedInputs[path], path);
  assert.equal(b.inputSaveSha256, registration.savedInputs[path]);
  assert.equal(a.inputSaveSha256, b.inputSaveSha256);
  for (const key of ['chapter', 'band', 'levels']) assert.deepEqual(a[key], b[key]);
  rows.push({ style: b.style, index: b.index, inputSaveSha256: b.inputSaveSha256,
    first: { before: a.first.won, after: b.first.won, encountersExact: same(a.first.encounters, b.first.encounters),
      choicesExact: same(a.first.choices, b.first.choices), stateHashExact: a.first.stateHash === b.first.stateHash },
    firstTwo: { before: Boolean(a.first.won || a.second?.won), after: Boolean(b.first.won || b.second?.won) },
    adviceExact: same(a.advice, b.advice), costsExact: same(a.appliedCurrencies, b.appliedCurrencies),
    retry: { before: a.second?.won ?? null, after: b.second?.won ?? null, exact: same(a.second, b.second) },
    withoutAdvice: { before: a.withoutAdvice?.won ?? null, after: b.withoutAdvice?.won ?? null,
      exact: same(a.withoutAdvice, b.withoutAdvice) } });
}
const counts = group => ({ accounts: group.length,
  firstImproved: group.filter(r => !r.first.before && r.first.after).length,
  firstWorsened: group.filter(r => r.first.before && !r.first.after).length,
  firstTwoImproved: group.filter(r => !r.firstTwo.before && r.firstTwo.after).length,
  firstTwoWorsened: group.filter(r => r.firstTwo.before && !r.firstTwo.after).length,
  firstEncountersExact: group.filter(r => r.first.encountersExact).length,
  firstChoicesExact: group.filter(r => r.first.choicesExact).length,
  firstStateHashesExact: group.filter(r => r.first.stateHashExact).length,
  adviceExact: group.filter(r => r.adviceExact).length,
  costsExact: group.filter(r => r.costsExact).length,
  retriesExact: group.filter(r => r.retry.exact).length,
  withoutAdviceExact: group.filter(r => r.withoutAdvice.exact).length });
const report = { scope: 'Same90 previously earned day7 saves, identical route/retry seeds and advice policy. Not a fresh45-day earned cohort.',
  totals: counts(rows), cohorts: ['casual', 'regular', 'heavy'].map(style => ({ style,
    ...counts(rows.filter(row => row.style === style)),
    before: before.cohorts.find(row => row.style === style), after: after.cohorts.find(row => row.style === style) })),
  rows, receipts, gates: after.gates,
  limitations: ['TRAIN progression proxy. No new acceptance seeds or human playtest.',
    'Exact encounter summaries do not establish byte-identical full combat logs.',
    'The heavy cohort may lose more retries with advice than without it; retained in cohort receipts.'] };
await writeFile(root + '/day7-paired.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ totals: report.totals, gates: report.gates }));
