import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUEST_KEY, guestCheckpoint } from './guest-checkpoint.mjs';
const origin = 'https://taskbarhero-eight.vercel.app';
const valid = () => ({ v: 1, founder: false, voucherNonce: 0, lastClaimMs: 1793694000000, counter: 3, state: { level: 2, items: [], stacks: { fish: 26 } } });
const storage = value => ({ cookies: [{ name: 'session', value: 'non-credential-test-marker' }], origins: [{ origin, localStorage: [{ name: GUEST_KEY, value: JSON.stringify(value) }, { name: 'taskbar-hero.howToPlaySeen', value: '1' }, { name: 'auth-token', value: 'non-credential-test-marker' }] }] });
test('preserves exact earned bytes and strips cookies/unrelated auth storage', () => {
  const before = storage(valid()), result = guestCheckpoint(before, origin);
  assert.equal(result.origins[0].localStorage[0].value, before.origins[0].localStorage[0].value);
  assert.deepEqual(result.cookies, []); assert.equal(result.origins[0].localStorage.length, 2);
  assert.ok(!JSON.stringify(result).includes('non-credential-test-marker'));
});
test('refuses credential fields inside nested action results', () => {
  for (const key of ['privateKey', 'secret', 'token', 'signature', 'authorization', 'password', 'session', 'jwt', 'accessToken', 'refreshToken']) {
    const value = valid(); value.actions = { previous: { result: { [key]: 'non-credential-test-marker' } } };
    assert.throws(() => guestCheckpoint(storage(value), origin), /credential field/);
  }
});
test('refuses minted/voucher states and non-guest wallets', () => {
  for (const change of [{ voucherNonce: 1 }, { pending: {} }, { todayRelic: {} }, { state: { wallet: '0x' + '1'.repeat(40) } }]) assert.throws(() => guestCheckpoint(storage({ ...valid(), ...change }), origin));
});
test('refuses missing or duplicate saves and foreign origin', () => {
  assert.throws(() => guestCheckpoint({ origins: [] }, origin));
  const duplicate = storage(valid()); duplicate.origins[0].localStorage.push(duplicate.origins[0].localStorage[0]);
  assert.throws(() => guestCheckpoint(duplicate, origin));
  assert.throws(() => guestCheckpoint(storage(valid()), 'https://example.com'));
});
test('does not accept malformed versions or counters', () => {
  for (const change of [{ v: 2 }, { founder: true }, { lastClaimMs: null }, { counter: -1 }, { counter: 1.5 }]) assert.throws(() => guestCheckpoint(storage({ ...valid(), ...change }), origin));
});

test('validation errors never echo raw guest input', () => {
  const input = storage(valid()); input.origins[0].localStorage[0].value = 'SENSITIVE_FIXTURE_PLACEHOLDER';
  assert.throws(() => guestCheckpoint(input, origin), error => !error.message.includes('SENSITIVE_FIXTURE_PLACEHOLDER'));
  assert.throws(() => guestCheckpoint(storage({ ...valid(), v: 'SENSITIVE_FIXTURE_PLACEHOLDER' }), origin), error => !error.message.includes('SENSITIVE_FIXTURE_PLACEHOLDER'));
});
