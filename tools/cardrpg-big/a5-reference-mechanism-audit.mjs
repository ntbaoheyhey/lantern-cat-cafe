// REFERENCE: reference-mechanism-31. Independent saved-receipt and replay comparison only.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const root = 'reports/cardrpg-big/a5/b2/reference-mechanism-31', receipts = [];
const sha = b => createHash('sha256').update(b).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
async function read(p) { const b = await readFile(p); receipts.push({ path: p, sha256: sha(b) }); return JSON.parse(b); }
const current = await read('reports/cardrpg-big/a5/b2/current-reference-30/results.json');
const old = await read(current.registration.calibration.path);
assert.equal(receipts.at(-1).sha256, current.registration.calibration.sha256);
const dependencies = await read(root + '/DEPENDENCIES.json'), arms = {}, traces = {};
for (const arm of ['fallthrough', 'utility-only', 'current']) {
  const m = await read(`${root}/${arm}/REGISTERED-METHOD.json`);
  assert.equal(m.seedOffset, 0); assert.equal(m.count, 500);
  assert.deepEqual(m.scenarios, current.registration.scenarios);
  assert.deepEqual(m.weights, current.registration.weights);
  for (const [p, h] of Object.entries({ ...m.source, ...dependencies[arm] }))
    assert.equal(sha(await readFile(m.sourceRoot + '/' + p)), h, p);
  for (const [p, h] of Object.entries(current.registration.source))
    if (!p.endsWith('/depth/battle.ts')) assert.equal(m.source[p], h, p);
  assert.equal(sha(await readFile(`${root}/${arm}/battle.ts.txt`)), m.source['packages/game-rules/src/cardrpg/depth/battle.ts']);
  for (const [script, key] of [['matrix', 'scriptSha256'], ['traces', 'traceScriptSha256']])
    assert.equal(sha(await readFile(`${root}/${script}.mjs`)), m[key]);
  const d = arm === 'current' ? current : await read(`${root}/${arm}/results.json`);
  if (arm !== 'current') { assert.deepEqual(d.registration, m); assert.equal(d.methodHash, sha(JSON.stringify(m))); }
  assert.equal(d.rows.length, 8);
  for (const r of d.rows) {
    assert(r.complete); assert.equal(r.outcomes.length, 500); assert.match(r.outcomes, /^[01]+$/);
    assert.equal(r.digest, sha(r.outcomes)); assert.equal(r.wins, [...r.outcomes].filter(c => c === '1').length);
    assert(r.minPowerRatio >= .98 && r.maxPowerRatio <= 1.02);
    if (arm === 'fallthrough') {
      const original = old.rows.find(x => x.scene === r.scene && x.factor === m.scenarios[r.scene].factor);
      assert.equal(r.outcomes, original.outcomes, `Calibration isolation scene${r.scene}`);
    }
  }
  arms[arm] = d.rows;
  const t = await read(`${root}/${arm}/traces.json`); assert.equal(t.methodHash, sha(JSON.stringify(m)));
  assert.deepEqual(t.traces.map(({ scene, seed }) => ({ scene, seed })), m.traceCases);
  for (const r of t.traces) {
    const expected = d.rows.find(x => x.scene === r.scene).outcomes[r.seed - 1] === '1';
    assert.equal(r.battle.result === 'party', expected);
  }
  traces[arm] = t.traces;
}
const transitions = [];
for (const [before, after] of [['fallthrough', 'utility-only'], ['utility-only', 'current']]) {
  const rows = arms[before].map(a => {
    const b = arms[after].find(x => x.scene === a.scene); let improved = 0, worsened = 0;
    for (let i = 0; i < 500; i++) {
      improved += Number(a.outcomes[i] === '0' && b.outcomes[i] === '1');
      worsened += Number(a.outcomes[i] === '1' && b.outcomes[i] === '0');
    }
    return { scene: a.scene, beforeWins: a.wins, afterWins: b.wins, improved, worsened };
  });
  transitions.push({ before, after, rows });
}
const divergent = (a, b) => {
  const index = Array.from({ length: Math.max(a.length, b.length) }, (_, i) => i).find(i => !same(a[i], b[i]));
  return index === undefined ? null : { index, before: a[index] ?? null, after: b[index] ?? null };
};
const examples = [];
for (const [before, after] of [['fallthrough', 'utility-only'], ['utility-only', 'current']])
  for (const a of traces[before]) {
    const b = traces[after].find(x => x.scene === a.scene && x.seed === a.seed);
    assert.deepEqual(a.battle.initial, b.battle.initial);
    const first = divergent(a.battle.log, b.battle.log), round = first?.before?.round ?? first?.after?.round;
    const snapshot = battle => ({ result: battle.result, rounds: battle.round, actions: battle.choices.length,
      firstDeath: battle.firstDeath,
      suppression: battle.log.filter(e => e.kind === 'suppressed'),
      divergenceRound: battle.log.filter(e => e.round === round),
      finalParty: battle.actors.filter(x => x.side === 'party').map(({ id, hp, shield }) => ({ id, hp, shield })) });
    examples.push({ before, after, scene: a.scene, seed: a.seed, firstEvent: first,
      firstChoice: divergent(a.battle.choices, b.battle.choices), beforeSummary: snapshot(a.battle), afterSummary: snapshot(b.battle) });
  }
const report = { status: 'Diagnostic attribution only; runtime and fixture unchanged', calibrationExact: 4000,
  reusedCurrentOutcomes: 4000, newlySampledDiagnosticOutcomes: 8000, explanatoryReplays: 15,
  transitions, examples, receipts, limitations: ['All TRAIN; no kit matrix or fresh acceptance.',
    'Hush can alter RNG consumption and later choices. A local removal of replacement damage does not guarantee a better eventual outcome.',
    'These snapshots explain adopted behavior; no old buggy resolver is proposed for adoption.'] };
await writeFile(root + '/audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ calibrationExact: 4000, transitions }));
