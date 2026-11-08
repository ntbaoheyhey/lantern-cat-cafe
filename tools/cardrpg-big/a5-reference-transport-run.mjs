// REFERENCE: current-reference-30 registration. Only the registered reference, never a retune.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { open, readFile, readdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const root = 'reports/cardrpg-big/a5/b2/current-reference-30';
const sha = b => createHash('sha256').update(b).digest('hex');
const method = JSON.parse(await readFile(root + '/REGISTERED-METHOD.json'));
assert.equal(method.seedOffset, 0); assert.equal(method.count, 500);
assert.equal(sha(await readFile(root + '/reference.mjs')), method.scriptSha256);
assert.equal(sha(await readFile(method.calibration.path)), method.calibration.sha256);
const existing = await readdir(root);
assert(!existing.includes('results.json'), 'Completed receipts must be audited, not rerun');
let slice = 1 + Math.max(0, ...existing.map(s => Number(s.match(/^slice-(\d+)\.log$/)?.[1] ?? 0)));
let code;
do {
  for (const [p, h] of Object.entries(method.source))
    assert.equal(sha(await readFile(method.sourceRoot + '/' + p)), h, p);
  const fd = await open(`${root}/slice-${slice++}.log`, 'wx');
  try {
    code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', 'A5 reference30 fixed calibration transport',
        process.execPath, root + '/reference.mjs'], { env: { ...process.env,
        BIG_RULES_ROOT: method.sourceRoot, A5_COMMON_OUT: root }, stdio: ['ignore', fd.fd, fd.fd] });
      child.on('error', reject); child.on('close', resolve);
    });
  } finally { await fd.close(); }
  console.log(JSON.stringify({ slice: slice - 1, code }));
  await delay(7000);
} while (code === 75);
assert.equal(code, 0);
