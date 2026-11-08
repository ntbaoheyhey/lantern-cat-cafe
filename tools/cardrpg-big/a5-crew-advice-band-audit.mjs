// REFERENCE: advice29. Independent receipt audit; never resamples a battle.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const root = 'reports/cardrpg-big/a5/e1/crew-advice-29', receipts = [];
const sha = b => createHash('sha256').update(b).digest('hex');
async function read(path) { const b = await readFile(path); receipts.push({ path, sha256: sha(b) }); return JSON.parse(b); }
const arms = {};
for (const name of ['baseline', 'candidate']) {
  const reg = await read(`${root}/${name}/REGISTERED-METHOD.json`);
  for (const [p, h] of Object.entries(reg.source)) assert.equal(sha(await readFile(reg.sourceRoot + '/' + p)), h, p);
  for (const [p, h] of Object.entries({ ...reg.scripts, ...reg.savedInputs })) assert.equal(sha(await readFile(p)), h, p);
  const data = await read(`${root}/${name}/day7-checks/checks.json`);
  assert.deepEqual(data.registration.source, reg.combatSource); assert.equal(data.accounts.length, 90);
  assert.equal(new Set(data.accounts.map(a => `${a.style}:${a.index}`)).size, 90);
  for (const row of data.accounts) {
    assert.equal(reg.savedInputs[`${data.registration.inputs}/${row.style}-${row.index}.save`], row.inputSaveSha256);
    for (const retry of [row.second, row.withoutAdvice]) if (retry) assert.equal(retry.band, row.band);
    if (row.advice?.change.kind === 'cat') {
      const card = JSON.parse(row.advice.expectedBuild).cards.find(c => c.cardId === row.advice.change.replacementId);
      assert(card.level >= row.band); assert.deepEqual(row.advice.cost, {});
    }
  }
  arms[name] = data;
}
const old = await read('reports/cardrpg-big/a5/e1/crew-advice-28/day7-checks/checks.json');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let exact = 0, improved = 0, worsened = 0;
for (const row of arms.candidate.accounts) {
  const match = data => data.accounts.find(a => a.style === row.style && a.index === row.index);
  const before = match(arms.baseline), original = match(old); assert(before && original);
  assert.equal(row.inputSaveSha256, original.inputSaveSha256);
  const { band, ...first } = row.first; assert.equal(band, row.band);
  assert.deepEqual(first, original.first); assert.deepEqual(row.first, before.first);
  exact += Number(same(row, before));
  const wonBefore = before.first.won || before.second?.won, wonAfter = row.first.won || row.second?.won;
  improved += Number(!wonBefore && !!wonAfter); worsened += Number(!!wonBefore && !wonAfter);
}
const cohorts = arms.candidate.cohorts;
for (const group of cohorts) {
  const rows = arms.candidate.accounts.filter(a => a.style === group.style);
  assert.equal(group.twoAttemptWins, rows.filter(a => a.first.won || a.second?.won).length);
  assert.equal(group.firstWins, rows.filter(a => a.first.won).length);
  assert.equal(group.availableAdvice, rows.filter(a => !a.first.won && a.advice).length);
}
const [casual, regular, heavy] = cohorts;
const gates = { casualFirstTwoAtLeast50: casual.twoAttemptWinRate >= .5, regularFirstTwoAtLeast70: regular.twoAttemptWinRate >= .7,
  heavyFirstAtMost95: heavy.firstWinRate <= .95, everyLossHasAvailableImprovement: cohorts.every(c => c.availableAdvice === c.losses) };
assert.deepEqual(gates, arms.candidate.gates); assert(Object.values(gates).every(Boolean));
const originalSwaps = old.accounts.filter(a => a.advice?.change.kind === 'cat');
const originalUnderLevel = originalSwaps.filter(a => JSON.parse(a.advice.expectedBuild).cards
  .find(c => c.cardId === a.advice.change.replacementId).level < a.band);
const report = { status: 'Corrected same-band TRAIN progression audit', accountsExact: exact, originalFirstStatesExact: 90,
  improved, worsened, eligibleCatSuggestions: arms.candidate.accounts.filter(a => a.advice?.change.kind === 'cat').length,
  original28: { suggestions: originalSwaps.length, underLevel: originalUnderLevel.length,
    limitation: 'Original retry script omitted challengeLevel. Its +6 comparison is not evidence at unchanged difficulty.' },
  cohorts, gates, receipts, limitations: ['90 old earned saves, not fresh 45-day acceptance.',
    'Original first attempts remain exact; the corrected retry policy is explicit in both arms.',
    'These accounts contain no selected eligible reserve swap, so they do not measure its population benefit.'] };
await writeFile(root + '/audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ accountsExact: exact, improved, worsened, gates, original28: report.original28 }));
