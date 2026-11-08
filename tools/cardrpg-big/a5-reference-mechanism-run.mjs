// REFERENCE: reference-mechanism-31. Run only its prospective snapshots; never change runtime.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { open, readFile, readdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const root = 'reports/cardrpg-big/a5/b2/reference-mechanism-31';
const sha = b => createHash('sha256').update(b).digest('hex');
const dependencies = JSON.parse(await readFile(root + '/DEPENDENCIES.json'));
for (const arm of ['fallthrough', 'utility-only', 'current']) {
  const out = `${root}/${arm}`, method = JSON.parse(await readFile(out + '/REGISTERED-METHOD.json'));
  for (const step of arm === 'current' ? ['traces'] : ['matrix', 'traces']) {
    const existing = await readdir(out), result = step === 'matrix' ? 'results.json' : 'traces.json';
    if (existing.includes(result)) continue;
    assert.equal(sha(await readFile(`${root}/${step}.mjs`)), method[step === 'matrix' ? 'scriptSha256' : 'traceScriptSha256']);
    let code, slice = 1 + Math.max(0, ...existing.map(s => Number(s.match(new RegExp(`^${step}-(\\d+)\\.log$`))?.[1] ?? 0)));
    do {
      for (const [p, h] of Object.entries(method.source)) assert.equal(sha(await readFile(method.sourceRoot + '/' + p)), h, p);
      for (const [p, h] of Object.entries(dependencies[arm])) assert.equal(sha(await readFile(method.sourceRoot + '/' + p)), h, p);
      const fd = await open(`${out}/${step}-${slice++}.log`, 'wx');
      try {
        code = await new Promise((resolve, reject) => {
          const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A5 reference31 ${arm} ${step}`,
            process.execPath, `${root}/${step}.mjs`], { env: { ...process.env,
            BIG_RULES_ROOT: method.sourceRoot, A5_COMMON_OUT: out }, stdio: ['ignore', fd.fd, fd.fd] });
          child.on('error', reject); child.on('close', resolve);
        });
      } finally { await fd.close(); }
      console.log(JSON.stringify({ arm, step, slice: slice - 1, code }));
      await delay(7000);
    } while (code === 75);
    assert.equal(code, 0);
  }
}
