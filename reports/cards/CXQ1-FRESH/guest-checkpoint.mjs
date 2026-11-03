import assert from 'node:assert/strict';
export const GUEST_KEY = 'taskbar-hero:v2-demo:1';
const secretKey = /(?:private.?key|secret|token|signature|authorization|password|session|jwt)/i;
function inspect(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!secretKey.test(key), 'Guest checkpoint contains a forbidden credential field');
    if (key === 'wallet' && typeof child === 'string') assert.ok(child.toLowerCase() === '0x' + '0'.repeat(40), 'Non-guest wallet in checkpoint');
    inspect(child);
  }
}
/** Keep the exact UI-earned guest-save bytes; discard cookies and all other storage. */
export function guestCheckpoint(storage, origin) {
  assert.ok(origin === 'https://taskbarhero-eight.vercel.app', 'Wrong guest origin');
  const site = storage.origins.find(entry => entry.origin === origin);
  assert.ok(site, 'Guest origin missing');
  const matches = site.localStorage.filter(entry => entry.name === GUEST_KEY);
  assert.equal(matches.length, 1, 'Exactly one guest save required');
  const entry = matches[0]; let value;
  try { value = JSON.parse(entry.value); } catch { throw new Error('Invalid guest save JSON'); }
  assert.ok(value.v === 1 && value.founder === false && value.voucherNonce === 0, 'Invalid guest recovery fields');
  assert.ok(value.state && typeof value.state === 'object');
  assert.ok(Number.isFinite(value.lastClaimMs) && Number.isSafeInteger(value.counter) && value.counter >= 0);
  assert.ok(value.pending == null && value.todayRelic == null, 'Relic voucher state is not part of guest recovery');
  inspect(value);
  const seen = site.localStorage.find(item => item.name === 'taskbar-hero.howToPlaySeen' && item.value === '1');
  return { cookies: [], origins: [{ origin, localStorage: [entry, ...(seen ? [seen] : [])] }] };
}
