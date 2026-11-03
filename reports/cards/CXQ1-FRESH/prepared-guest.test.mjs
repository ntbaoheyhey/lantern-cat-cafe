import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { GUEST_KEY } from './guest-checkpoint.mjs';
import { verifyPreparedGuest } from './prepared-guest.mjs';
function fixture() {
  const save = { v: 1, founder: false, voucherNonce: 0, lastClaimMs: 1793694000000, counter: 3, state: { classId: 'warrior', level: 8, stacks: { fish: 100 }, items: [] } };
  const storage = { cookies: [], origins: [{ origin: 'https://taskbarhero-eight.vercel.app', localStorage: [{ name: GUEST_KEY, value: JSON.stringify(save) }] }] };
  const prepared = { clockInjection: false, syntheticFixture: false, networkWrites: 0, head: 'a'.repeat(40), preparationSeconds: 3000, preparation: [{ fightEnabled: true, commonCraftReady: true, power: 450, recommended: 300 }], earnedSaveSha256: createHash('sha256').update(JSON.stringify(storage)).digest('hex') };
  return { storage, prepared };
}
test('preserves the exact recorded guest bytes and exposes honest source/duration', () => {
  const f = fixture(), result = verifyPreparedGuest(f.prepared, f.storage);
  assert.deepEqual(result.earned, f.storage); assert.equal(result.preparationSeconds, 3000);
});
test('rejects a different class even when the recorded hash is internally consistent', () => {
  const f = fixture(), entry = f.storage.origins[0].localStorage[0], value = JSON.parse(entry.value);
  value.state.classId = 'archer'; entry.value = JSON.stringify(value);
  f.prepared.earnedSaveSha256 = createHash('sha256').update(JSON.stringify(f.storage)).digest('hex');
  assert.throws(() => verifyPreparedGuest(f.prepared, f.storage), /Prepared class/);
});
for (const [name, change] of [
  ['fake clock', f => { f.prepared.clockInjection = true; }],
  ['synthetic progression', f => { f.prepared.syntheticFixture = true; }],
  ['server writes', f => { f.prepared.networkWrites = 1; }],
  ['unidentified source', f => { f.prepared.head = 'main'; }],
  ['unfinished preparation', f => { delete f.prepared.preparationSeconds; }],
  ['no history', f => { f.prepared.preparation = []; }],
  ['insufficient power', f => { f.prepared.preparation[0].power = 449; }],
  ['invalid zero recommendation', f => { f.prepared.preparation[0].recommended = 0; }],
  ['unaffordable craft', f => { f.prepared.preparation[0].commonCraftReady = false; }],
  ['tampered checkpoint', f => { f.storage.origins[0].localStorage[0].value += ' '; }],
]) test('rejects ' + name, () => { const f = fixture(); change(f); assert.throws(() => verifyPreparedGuest(f.prepared, f.storage)); });
