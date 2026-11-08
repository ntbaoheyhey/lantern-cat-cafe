// REFERENCE: A5 set activation11. Audit existing receipts without rerunning battles.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big/a5/b2/set-activation-11';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const raw = await readFile(root + '/results.json'), data = JSON.parse(raw);
const method = JSON.parse(await readFile(root + '/REGISTERED-METHOD.json'));
assert.deepEqual(data.registration, method); assert.equal(data.methodHash, sha(JSON.stringify(method)));
assert.equal(method.count, 50); assert.equal(method.seedOffset, 0);
assert.equal(sha(await readFile(root + '/probe.mjs')), method.probeSha256);
const originalRaw = await readFile(method.original.path);
assert.equal(sha(originalRaw), method.original.sha256);
const original = new Map(JSON.parse(originalRaw).rows.map(row => [row.key, row]));
assert.equal(data.rows.length, 64); assert.equal(new Set(data.rows.map(row => row.key)).size, 64);
for (const row of data.rows) {
  assert.equal(row.outcomes.length, 50); assert.equal(row.digest, sha(row.outcomes));
  assert.equal(row.outcomes, original.get(row.key).outcomes);
  assert.equal(row.key, JSON.stringify({ kind: 'sets', setId: row.setId, scene: row.scene }));
}
const sets = [...new Set(data.rows.map(row => row.setId))].map(setId => {
  const rows = data.rows.filter(row => row.setId === setId); assert.equal(rows.length, 8);
  const actors = ['mochi', 'soot', 'clover'].map(id => {
    const first = rows[0].actors[id]; assert(first);
    for (const row of rows) assert.deepEqual(row.actors[id].skills, first.skills);
    const gear = {};
    for (const row of rows) for (const [effect, event] of Object.entries(row.actors[id].gear)) {
      const bucket = gear[effect] ??= { count: 0, amount: 0 };
      bucket.count += event.count; bucket.amount += event.amount;
    }
    return { id, skills: first.skills.map(s => s.id),
      scaldSkills: first.skills.filter(s => s.effects.some(e => e.status === 'scald')).map(s => s.id),
      successfulScaldApplications: rows.reduce((n, row) => n + row.actors[id].scald, 0), gear };
  });
  return { setId, battles: 400, wins: rows.reduce((n, row) => n + [...row.outcomes].filter(c => c === '1').length, 0), actors };
});
const summary = { method: 'Read-only original common04 set fixture,64cells/3200battles; every outcome exact.',
  receipts: [{ path: root + '/results.json', sha256: sha(raw) }, method.original], sets,
  limitations: ['Gear-trigger events do not cover every permanent modifier, reach or status extension.',
    'Scald in these totals means successful party applications, not Scald applied by enemies.',
    'No carrier substitution, fixture revision, balance change or fresh acceptance sample.'] };
await writeFile(root + '/summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(sets.map(s => ({ setId: s.setId, wins: s.wins, battles: s.battles,
  scaldSkills: s.actors.flatMap(a => a.scaldSkills), successfulScaldApplications: s.actors.reduce((n, a) => n + a.successfulScaldApplications, 0) }))));
