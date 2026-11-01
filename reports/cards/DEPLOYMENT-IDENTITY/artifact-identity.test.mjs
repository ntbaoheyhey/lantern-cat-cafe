import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryPaths, classifyIdentity } from './artifact-identity.mjs';

test('entry extraction includes same-origin preload/css and excludes external instrumentation', () => {
  assert.deepEqual(entryPaths('<script src="/assets/app-new.js"></script><link rel="stylesheet" href="/assets/new.css"><link rel="modulepreload" href="/assets/shared.js"><script src="https://example.net/stats.js"></script>', 'https://example.org'), ['/assets/app-new.js', '/assets/new.css', '/assets/shared.js']);
});
const entries = ['/assets/new.js'];
const matchingAssets = [{ status: 200, localSha256: 'aaa', liveSha256: 'aaa' }];
test('old live entry cannot pass merely because cached candidate assets remain accessible', () => {
  assert.equal(classifyIdentity(entries, ['/assets/old.js'], matchingAssets, entries), 'ENTRY_MISMATCH');
});
test('deployment change during collection rejects mixed evidence', () => {
  assert.equal(classifyIdentity(entries, entries, matchingAssets, ['/assets/later.js']), 'ENTRY_MISMATCH');
});
test('same filenames with different bytes or HTTP error cannot pass', () => {
  assert.equal(classifyIdentity(entries, entries, [{ status: 200, localSha256: 'aaa', liveSha256: 'bbb' }], entries), 'ASSET_MISMATCH');
  assert.equal(classifyIdentity(entries, entries, [{ status: 404, localSha256: 'aaa', liveSha256: 'aaa' }], entries), 'ASSET_MISMATCH');
});
test('empty evidence is never a match; complete equality is artifact-only evidence', () => {
  assert.equal(classifyIdentity([], [], [], []), 'ENTRY_MISMATCH');
  assert.equal(classifyIdentity(entries, entries, [], entries), 'ASSET_MISMATCH');
  assert.equal(classifyIdentity(entries, entries, matchingAssets, entries), 'ARTIFACT_MATCH');
});
