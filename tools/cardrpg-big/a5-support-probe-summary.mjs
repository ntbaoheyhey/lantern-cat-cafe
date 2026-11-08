// REFERENCE: A5 B2 probe08. Read-only kit observations; no causal win attribution.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big/a5/b2/support-kit-probe-08';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(root + '/results.json'), data = JSON.parse(bytes);
const method = JSON.parse(await readFile(root + '/REGISTERED-METHOD.json'));
assert.deepEqual(data.registration, method);
assert.equal(data.methodHash, sha(JSON.stringify(method)));
assert.equal(method.seedOffset, 0); assert.equal(method.count, 50);
assert.equal(sha(await readFile(root + '/probe.mjs')), method.probeSha256);
const originalBytes = await readFile(method.original.path);
assert.equal(sha(originalBytes), method.original.sha256);
const original = new Map(JSON.parse(originalBytes).rows.map(row => [row.key, row]));
assert.equal(data.rows.length, 1088);
assert.equal(new Set(data.rows.map(row => row.key)).size, 1088);
for (const row of data.rows) {
  assert(row.complete); assert.equal(row.outcomes.length, 50);
  assert.equal(row.digest, sha(row.outcomes));
  assert.equal(row.outcomes, original.get(row.key).outcomes);
  assert.equal(row.wins, [...row.outcomes].filter(value => value === '1').length);
  assert(row.minPowerRatio >= .98 && row.maxPowerRatio <= 1.02);
  for (const [id, kit] of Object.entries(row.kits)) {
    assert(method.cats.includes(id) && row.team.includes(id));
    assert.equal(kit.actions, Object.values(kit.skills).reduce((sum, count) => sum + count, 0));
  }
}
function sum(rows, id) {
  const result = { cells: rows.length, battles: rows.length * 50, wins: 0, actions: 0, skills: {}, events: {}, fellInBattles: 0 };
  for (const row of rows) {
    const kit = row.kits[id]; assert(kit);
    result.wins += row.wins; result.actions += kit.actions; result.fellInBattles += kit.firstFall;
    for (const [skill, count] of Object.entries(kit.skills)) result.skills[skill] = (result.skills[skill] ?? 0) + count;
    for (const [kind, value] of Object.entries(kit.events)) {
      const event = result.events[kind] ??= { count: 0, amount: 0 };
      event.count += value.count; event.amount += value.amount;
    }
  }
  return { ...result, rate: result.wins / result.battles };
}
const cats = method.cats.map(id => {
  const rows = data.rows.filter(row => row.team.includes(id)); assert.equal(rows.length, 440);
  return { id, ...sum(rows, id), scenes: method.scenarios.map((scenario, scene) =>
    ({ scene, enemies: scenario.enemies, ...sum(rows.filter(row => row.scene === scene), id) })) };
});
const summary = {
  method: 'Read-only TRAIN1–50. Every original commonfixture04 outcome preserved; three overlapping cat cohorts.',
  receipts: [{ path: root + '/results.json', sha256: sha(bytes) }, method.original], cats,
  limitations: [
    'Emitted heal/shield events include direct skills, status ticks, gear and passives; they do not isolate one skill.',
    'Fell-in-battle counts include a cat later revived; they do not identify the first party death.',
    'Status amounts are resulting stacks, not damage or prevented damage.',
    'Overlapping teams are not independent samples. High action counts do not establish a causal win benefit.',
    'No kit/policy adoption, fixture recalibration or fresh acceptance sample.',
  ],
};
await writeFile(root + '/summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(cats.map(({ id, rate, actions, skills }) => ({ id, rate, actions, skills }))));
