// REFERENCE: advice29. Both pre-registered advice arms use the UI's unchanged retry band.
import { spawn } from 'node:child_process';
import { open, readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big/a5/e1/crew-advice-29';
const sha = b => createHash('sha256').update(b).digest('hex');
for (const name of ['baseline', 'candidate']) {
  const dir = `${root}/${name}`, reg = JSON.parse(await readFile(dir + '/REGISTERED-METHOD.json'));
  let code, slice = 1;
  do {
    for (const [p, h] of Object.entries(reg.source)) assert.equal(sha(await readFile(reg.sourceRoot + '/' + p)), h, p);
    for (const [p, h] of Object.entries({ ...reg.scripts, ...reg.savedInputs })) assert.equal(sha(await readFile(p)), h, p);
    const fd = await open(`${dir}/cohort-${slice++}.log`, 'wx');
    try {
      code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A5 advice29 ${name}`,
          process.execPath, dir + '/cohort.mjs'], { env: { ...process.env, BIG_RULES_ROOT: reg.sourceRoot,
          A5_DAY7_OUT: dir + '/day7-checks' }, stdio: ['ignore', fd.fd, fd.fd] });
        child.on('error', reject); child.on('close', resolve);
      });
    } finally { await fd.close(); }
    console.log(JSON.stringify({ name, slice: slice - 1, code }));
    await delay(7000);
  } while (code === 75);
  assert.equal(code, 0);
}
