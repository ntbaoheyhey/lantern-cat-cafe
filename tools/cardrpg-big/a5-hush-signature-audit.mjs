// REFERENCE: A5 B2 signature19. Retain the original failures and prove the focused correction's scope.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = 'reports/cardrpg-big/a5/b2/hush-signature-19';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const receipts = [];
async function read(path) {
  const data = await readFile(path); receipts.push({ path, sha256: sha(data) });
  return JSON.parse(data);
}
const before = await read(root + '/before.json'), after = await read(root + '/after.json');
const method = await read(root + '/REGISTERED-METHOD.json');
assert.equal(before.total, 60); assert.equal(after.total, 60);
assert.equal(before.pass, 55); assert.equal(after.pass, 60);
assert.deepEqual(after.source, method.source);
assert.equal(before.methodSha256, sha(JSON.stringify(method)));
assert.equal(after.methodSha256, before.methodSha256);
let exactOff = 0, exactUnaffected = 0;
const repaired = [];
for (let i = 0; i < before.rows.length; i++) {
  const a = before.rows[i], b = after.rows[i];
  for (const key of ['enemyId', 'gameplayV4', 'signature', 'control', 'inputSha256'])
    assert.deepEqual(b[key], a[key], key);
  assert(Object.values(b.checks).every(Boolean));
  assert.deepEqual(b.hits, a.hits, 'The correction must not modify the committed attack');
  if (a.gameplayV4 && !a.signature && a.control === 'hush') {
    assert.equal(a.suppressed, 1); assert.equal(a.crewHeals, 8);
    assert.equal(b.suppressed, 0); assert.equal(b.crewHeals, 0);
    // Removing bookkeeping events renumbers later events; their payloads remain exact.
    const payloads = events => events.map(({ index: _index, ...event }) => event);
    const retained = a.events.filter(event => event.kind !== 'suppressed'
      && !(event.kind === 'heal' && event.actorId === 'inkcap' && event.targetId === 'inkcap'));
    assert.deepEqual(payloads(b.events), payloads(retained));
    repaired.push({ enemyId: a.enemyId, falseSuppressionRemoved: a.suppressed, unearnedHealingRemoved: a.crewHeals });
  } else {
    assert.deepEqual(b.events, a.events);
    if (!a.gameplayV4) exactOff++; else exactUnaffected++;
  }
}
assert.equal(repaired.length, 5); assert.equal(exactOff, 30); assert.equal(exactUnaffected, 25);
const audit = { status: 'PASS', total: 60, originalPass: 55, candidatePass: 60,
  exactOff, exactUnaffected, repaired, receipts,
  limitation: 'Controlled seed5 actions only; wider win-rate and earned-path effects remain separate.' };
await writeFile(root + '/audit.json', JSON.stringify(audit, null, 2));
console.log(JSON.stringify(audit));
