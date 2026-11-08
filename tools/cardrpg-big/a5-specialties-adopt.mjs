// REFERENCE: PROMPT-A5 B2/C1; preserve and adopt the already prepared specialties23 snapshot.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const draft = 'tools/cardrpg-big/a5-drafts/specialties-23';
const manifest = JSON.parse(await readFile(`${draft}/manifest.json`, 'utf8'));
const sha = data => createHash('sha256').update(data).digest('hex');
const files = [];
for (const [path, hash] of Object.entries(manifest.inputs)) {
  assert.equal(sha(await readFile(path)), hash, `Source changed: ${path}`);
  const bytes = await readFile(`${draft}/source/${path}`);
  assert.equal(sha(bytes), manifest.outputs[path], `Draft changed: ${path}`);
  files.push([path, bytes]);
}
const closure = JSON.parse(await readFile('reports/cardrpg-big/a5/b2-hush-credit/audit.json', 'utf8'));
assert.equal(closure.gates.length, 6);
assert(closure.gates.every(gate => gate.code === 0));
assert.equal(closure.off.offBehavior, 'PASS');
for (const [path, bytes] of files) await writeFile(path, bytes);
console.log(JSON.stringify({ adopted: files.map(([path]) => path), priorVerifiedSource: closure.source }));
