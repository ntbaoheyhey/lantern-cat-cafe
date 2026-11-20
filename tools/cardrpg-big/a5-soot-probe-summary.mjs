// REFERENCE: PROMPT-A5 B2. Audit the registered read-only Soot probe, without retuning.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = 'reports/cardrpg-big/a5/b2/soot-kit-probe-05';
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
assert.equal(data.rows.length, 440);
assert.equal(new Set(data.rows.map(row => row.key)).size, 440);
for (const row of data.rows) {
  assert(row.complete && row.team.includes('soot'));
  assert.equal(row.outcomes.length, method.count);
  assert.match(row.outcomes, /^[01]+$/);
  assert.equal(sha(row.outcomes), row.digest);
  assert.equal(row.outcomes, original.get(row.key).outcomes);
  assert.equal(row.wins, [...row.outcomes].filter(n => n === '1').length);
  assert.equal(row.rate, row.wins / method.count);
  assert(row.minPowerRatio >= .98 && row.maxPowerRatio <= 1.02);
  assert(row.firstReplay && row.firstReplay.sootActions.length > 0);
  for (const action of row.firstReplay.sootActions) {
    assert.equal(action.kind, 'action'); assert.equal(action.actorId, 'soot');
    assert(row.skills[action.skillId] > 0);
  }
  for (const count of [...Object.values(row.skills), row.moonTriggers])
    assert(Number.isSafeInteger(count) && count >= 0);
}
function group(rows) {
  const skills = {};
  for (const row of rows) for (const [id, count] of Object.entries(row.skills))
    skills[id] = (skills[id] ?? 0) + count;
  return {
    cells: rows.length, battles: rows.length * method.count,
    wins: rows.reduce((n, row) => n + row.wins, 0),
    actions: Object.values(skills).reduce((a, b) => a + b, 0), skills,
    moonHealTriggers: rows.reduce((n, row) => n + row.moonTriggers, 0),
  };
}
const summary = {
  method: 'Read-only TRAIN1–50, all55 Soot triples on eight equally weighted calibrated scenes; every battle outcome matches commonfixture04.',
  receipts: [{ path: root + '/results.json', sha256: sha(bytes) }, method.original],
  overall: group(data.rows),
  scenes: method.scenarios.map((scene, index) => ({ scene: index, enemies: scene.enemies, ...group(data.rows.filter(row => row.scene === index)) })),
  withVelvet: group(data.rows.filter(row => row.team.includes('velvet'))),
  withoutVelvet: group(data.rows.filter(row => !row.team.includes('velvet'))),
  limitations: [
    'Action counts measure Black cup selection, not successful Scent applications; the registered probe did not count status events.',
    'The marked-break damage effect emits no gear-trigger event. The named event total measures Moonwick healing, not all Moonwick contribution.',
    'A zero or low selection rate alone does not show that choosing the skill would improve wins. A paired candidate is still required.',
    'The source is the registered pre-anchored snapshot; no production edit or fresh acceptance sample.',
  ],
};
await writeFile(root + '/summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
