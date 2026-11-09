// REFERENCE: PROMPT-A5. Source-bound legacy digest, with separate receipts per phase.
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, open, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const phase = process.argv[2];
assert.match(phase ?? '', /^[a-z0-9-]+$/);
const out = `reports/cardrpg-big/skills-v5/${phase}/off`;
await mkdir(out, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = execFileSync('git', ['ls-files', '-co', '--exclude-standard',
  'packages/game-rules/src/cardrpg', 'packages/game-rules/src/rng.ts'], { encoding: 'utf8' }).trim().split('\n');
const hashes = Object.fromEntries(await Promise.all([...new Set(paths)]
  .filter(path => path.endsWith('.ts') && !path.endsWith('.test.ts')).sort()
  .map(async path => [path, sha(await readFile(path))])));
const prior = await readFile(out + '/source.json', 'utf8').catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (prior) assert.deepEqual(JSON.parse(prior), hashes);
else await writeFile(out + '/source.json', JSON.stringify(hashes, null, 2));
let slice = 1 + Math.max(0, ...(await readdir(out)).map(name => Number(name.match(/^slice-(\d+)\.log$/)?.[1] ?? 0)));
let code;
do {
  for (const [path, hash] of Object.entries(hashes)) assert.equal(sha(await readFile(path)), hash, path);
  const fd = await open(`${out}/slice-${slice++}.log`, 'wx');
  try {
    code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `V5A ${phase} OFF digest`,
        process.execPath, 'tools/cardrpg-big/skills-v5/off-baseline.mjs', '--check'],
      { env: { ...process.env, BIG_OFF_OUT: out }, stdio: ['ignore', fd.fd, fd.fd] });
      child.on('error', reject); child.on('close', done);
    });
  } finally { await fd.close(); }
  console.log(JSON.stringify({ slice: slice - 1, code }));
  if (code === 75) await delay(7000);
} while (code === 75);
assert.equal(code, 0);
for (const [path, hash] of Object.entries(hashes)) assert.equal(sha(await readFile(path)), hash, path);
