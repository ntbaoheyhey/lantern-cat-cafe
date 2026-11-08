// REFERENCE: A5 B2 eligibility22. Validate complete registered receipts, without new samples.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = 'reports/cardrpg-big/a5/b2';
const roots = { current: `${base}/suppression-current-16`, eligible: `${base}/hush-eligibility-22` };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const receipts = [];
async function read(path) {
  const bytes = await readFile(path);
  receipts.push({ path, sha256: sha(bytes) });
  return JSON.parse(bytes);
}
const arms = {};
for (const [name, root] of Object.entries(roots)) {
  const registration = await read(`${root}/REGISTERED-METHOD.json`);
  const summary = await read(`${root}/summary.json`);
  assert.deepEqual(summary.source, registration.combatSource);
  assert.equal(summary.count, 50);
  assert.equal(summary.pieces.cells, 384);
  assert.equal(summary.tiers.total, 24);
  assert.equal(summary.bands.length, 33);
  assert.equal(summary.sets.length, 8);
  assert.equal(summary.cats.length, 12);
  for (const receipt of summary.receipts)
    assert.equal(sha(await readFile(receipt.path)), receipt.sha256, receipt.path);
  for (const [path, digest] of Object.entries(registration.savedInputs))
    assert.equal(sha(await readFile(path)), digest, path);
  for (const [path, digest] of Object.entries(registration.scripts))
    assert.equal(sha(await readFile(path)), digest, path);
  const day7 = await read(`${root}/day7-checks/checks.json`);
  assert.equal(day7.accounts.length, 90);
  assert.deepEqual(day7.registration.source, registration.combatSource);
  arms[name] = { registration, summary, day7 };
}
assert.deepEqual(arms.current.registration.savedInputs, arms.eligible.registration.savedInputs);
assert.deepEqual(arms.current.registration.scopes, arms.eligible.registration.scopes);
for (const script of ['matrix.mjs', 'cohort.mjs']) {
  const original = await readFile(`${roots.current}/${script}`, 'utf8');
  const candidate = await readFile(`${roots.eligible}/${script}`, 'utf8');
  assert.equal(candidate.replaceAll(roots.eligible, roots.current), original,
    `${script}: fixture or policy changed beyond its receipt path`);
}
const semantic = await read(`${base}/hush-eligibility-21/audit.json`);
assert.equal(semantic.status, 'PASS');
assert.equal(semantic.candidatePass, 144);
assert.equal(semantic.exactOff, 72);
for (const receipt of semantic.receipts)
  assert.equal(sha(await readFile(receipt.path)), receipt.sha256, receipt.path);
const changed = Object.keys(arms.current.registration.combatSource).filter(path =>
  arms.current.registration.combatSource[path] !== arms.eligible.registration.combatSource[path]);
assert.deepEqual(changed.sort(), [
  'packages/game-rules/src/cardrpg/depth/battle.ts',
  'packages/game-rules/src/cardrpg/depth/events-v4.ts',
]);
for (const [path, digest] of Object.entries(arms.eligible.registration.source))
  assert.equal(sha(await readFile(`${arms.eligible.registration.sourceRoot}/${path}`)), digest, path);

const pairs = await read(`${roots.eligible}/train-paired-current16.json`);
assert.equal(pairs.beforeRoot, `${roots.current}/balance`);
assert.equal(pairs.afterRoot, `${roots.eligible}/balance`);
const day7Pairs = await read(`${roots.eligible}/day7-paired.json`);
assert.equal(day7Pairs.totals.accounts, 90);
for (const report of [pairs, day7Pairs]) for (const receipt of report.receipts)
  assert.equal(sha(await readFile(receipt.path)), receipt.sha256, receipt.path);

function brief(summary) {
  return {
    pieceMisses: summary.pieces.misses,
    worstPieceGainPp: summary.pieces.worst.gainPp,
    displayShare: summary.pieces.maxDisplayShare,
    displayCorrelation: summary.pieces.spearmanByChapter,
    tierSteps: summary.tiers.positive,
    tierReversals: summary.tiers.reversals,
    bandMisses: summary.bands.filter(row => row.spreadPp < 15 || row.saturated).length,
    cats: summary.cats.map(({ id, rate, topPickCells }) => ({ id, rate, topPickCells })),
    sets: summary.sets,
    crewGainPp: summary.crew.gainPp,
    bossDiversity: summary.bossDiversity,
  };
}
const report = {
  status: 'Registered TRAIN and saved-input comparison audited; all misses remain visible.',
  method: 'Same 1,321 TRAIN1–50 cells and 90 previously earned saves; no new acceptance samples.',
  changed, before: brief(arms.current.summary), after: brief(arms.eligible.summary),
  semantic: { total: semantic.total, before: semantic.originalPass, after: semantic.candidatePass, exactOff: semantic.exactOff },
  paired: { groups: pairs.groups, crewSelections: pairs.crewSelections },
  savedDay7: { totals: day7Pairs.totals, cohorts: arms.eligible.day7.cohorts, gates: arms.eligible.day7.gates },
  receipts,
  limitations: [
    'The original fixture does not establish elite crew diversity or all set niches.',
    'TRAIN pilots are not the fresh 500-seed acceptance matrix.',
    'Previously earned day7 saves do not establish a fresh 45-day earned progression cohort.',
    'Changes to suppression credit affect Lantern healing timing; this is not only a wording fix.',
    'Exact encounter summaries do not establish byte-identical combat logs or saved states.',
  ],
};
await writeFile(`${roots.eligible}/audit.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, before: report.before, after: report.after,
  paired: report.paired, savedDay7: report.savedDay7 }));
