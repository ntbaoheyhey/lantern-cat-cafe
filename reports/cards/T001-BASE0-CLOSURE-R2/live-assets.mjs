// Read-only GETs. Keep all response bytes in memory; persist only hashes and sizes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const here = new URL('./', import.meta.url);
const root = new URL('../../../', here);
const proof = JSON.parse(await readFile(new URL('../T014-CURRENT-MAIN-LIVE/artifact-after.json', here)));
const sha = data => createHash('sha256').update(data).digest('hex');
const remoteMain = () => execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], {cwd: root, encoding: 'utf8'}).trim().split(/\s+/)[0];
assert.equal(remoteMain(), proof.expectedHead);
const startedAt = new Date().toISOString();
async function fetchHash(path) {
  const response = await fetch(new URL(path, proof.site), {cache: 'no-store', signal: AbortSignal.timeout(20000)});
  assert.equal(new URL(response.url).origin, proof.site);
  const bytes = Buffer.from(await response.arrayBuffer());
  return {status: response.status, bytes: bytes.length, sha256: sha(bytes)};
}
const before = await fetchHash('/');
assert.equal(before.status, 200);
assert.equal(before.sha256, proof.htmlStartSha256);
const assets = [];
for (const expected of proof.assets) {
  const live = await fetchHash(expected.path);
  assert.equal(live.status, 200, expected.path);
  assert.equal(live.bytes, expected.localBytes, expected.path);
  assert.equal(live.sha256, expected.localSha256, expected.path);
  assets.push({path: expected.path, expectedSha256: expected.localSha256, ...live});
}
const after = await fetchHash('/');
assert.deepEqual(after, before);
assert.equal(remoteMain(), proof.expectedHead);
const result = {
  status: 'PASS', sourceHead: proof.expectedHead, sourceTree: proof.testedTree,
  startedAt, endedAt: new Date().toISOString(), site: proof.site,
  method: 'Fresh read-only fetch of every emitted/public file; compared to the audited T014 exact-current-main in-memory production build hashes. Build/suites were not repeated.',
  buildProof: '../T014-CURRENT-MAIN-LIVE/artifact-after.json',
  assets, assetsMatched: assets.length, htmlBefore: before, htmlAfter: after,
  entryManifestStable: true, liveEntries: proof.liveEntries,
  historicalBASE0Equality: false, responseBytesStored: false,
  limitations: 'Observation window only; frontend equivalence does not establish unique provider commit or Edge Function identity. Prior phased journey is adopted, not rerun.',
};
await writeFile(new URL('live-assets.json', here), JSON.stringify(result, null, 2) + '\n');
console.log(`PASS ${assets.length}/${proof.assets.length} live files match exact current main ${proof.expectedHead}`);
console.log(`PASS stable HTML and entry manifest: ${startedAt} through ${result.endedAt}`);
console.log('PASS no bundle bytes or keys printed/stored; no deploy or source-suite execution');
