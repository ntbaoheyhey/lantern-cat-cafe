import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { guestCheckpoint, GUEST_KEY } from './guest-checkpoint.mjs';
export function verifyPreparedGuest(prepared, storage) {
  assert.equal(prepared.clockInjection, false, 'Preparation must use real clock');
  assert.equal(prepared.syntheticFixture, false, 'Synthetic fixture is not earned progress');
  assert.equal(prepared.networkWrites, 0, 'Guest preparation must not write to a server');
  assert.match(prepared.head, /^[0-9a-f]{40}$/, 'Preparation source head required');
  assert.ok(Number.isFinite(prepared.preparationSeconds) && prepared.preparationSeconds > 0, 'Completed preparation duration required');
  assert.ok(Array.isArray(prepared.preparation) && prepared.preparation.length > 0, 'Preparation history required');
  const readiness = prepared.preparation.at(-1);
  assert.ok(readiness.fightEnabled === true && readiness.commonCraftReady === true, 'Boss and craft must both be ready');
  assert.ok(Number.isFinite(readiness.power) && Number.isFinite(readiness.recommended) && readiness.recommended > 0 && readiness.power >= readiness.recommended * 1.5, 'Earned boss preparation threshold not reached');
  const earned = guestCheckpoint(storage, 'https://taskbarhero-eight.vercel.app');
  const digest = createHash('sha256').update(JSON.stringify(earned)).digest('hex');
  assert.ok(digest === prepared.earnedSaveSha256, 'Earned snapshot differs from recorded preparation');
  const state = JSON.parse(earned.origins[0].localStorage.find(entry => entry.name === GUEST_KEY).value).state;
  // Persisted demo data has a flat classId; ServerStateV2's cat wrapper is constructed at load.
  assert.equal(state.classId, 'warrior', 'Prepared class must match demonstrated onboarding');
  return { earned, digest, sourceHead: prepared.head, readiness, preparationSeconds: prepared.preparationSeconds };
}
