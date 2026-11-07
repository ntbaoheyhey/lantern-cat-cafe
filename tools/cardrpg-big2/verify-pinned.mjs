// REFERENCE: pin-phase.mjs; build.mjs. Read-only source/artifact provenance audit.
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const rows = [];
for (const file of (await readdir('/tmp')).filter(name => /^cardrpg-big2-.*-validation\.json$/.test(name)).sort()) {
  const receipt = JSON.parse(await readFile(`/tmp/${file}`, 'utf8'));
  if (!receipt.root || !receipt.head || !receipt.artifact) continue;
  const buildPath = receipt.artifact.replace('-index.html', '-build.json');
  const build = JSON.parse(await readFile(buildPath, 'utf8'));
  const source = Object.entries(build.sourceHashes).filter(([path]) => /^(apps\/web\/src\/|packages\/game-rules\/src\/|assets\/)/.test(path));
  const mismatches = [];
  for (const [path, expected] of source) {
    const actual = await readFile(resolve(receipt.root, path)).then(sha256).catch(() => null);
    if (actual !== expected) mismatches.push({ path, expected, actual });
  }
  const actualArtifact = sha256(await readFile(receipt.artifact));
  rows.push({ receipt: `/tmp/${file}`, archive: receipt.root, sourceHead: receipt.head,
    artifact: receipt.artifact, buildHead: build.head, expectedArtifact: build.sha256, actualArtifact,
    artifactMatches: actualArtifact === build.sha256 && actualArtifact === receipt.sha256,
    comparedFiles: source.length, mismatches });
}
const result = { recordedAt: new Date().toISOString(),
  method: 'Compare all application, game-rules and asset file SHA256 values embedded in each saved build receipt with its immutable validation archive. Verify saved HTML against both build and archive receipts. Report tooling is excluded because measurement tools may evolve independently. This proves source identity, not runtime correctness.', rows };
const out = 'reports/cardrpg-big2/validation/pinned-source-audit.json';
await mkdir(resolve(out, '..'), { recursive: true });
await writeFile(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ archives: rows.length, files: rows.reduce((n, row) => n + row.comparedFiles, 0),
  failures: rows.filter(row => !row.artifactMatches || row.mismatches.length).length, out }));
if (!rows.length || rows.some(row => !row.artifactMatches || row.mismatches.length)) process.exitCode = 1;
