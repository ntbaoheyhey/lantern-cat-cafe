// REFERENCE: A5 B1. Resume the same registered TRAIN cells under bounded shared leases.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdir, open, readFile, readdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const out = 'reports/cardrpg-big/a5/b1/current-cliffs-24';
const reg = JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(`${out}/logs`, { recursive: true });
for (const [name, script] of [['ablation', 'tools/cardrpg-big/a5-cliffs-current.mjs'],
  ['traces', 'tools/cardrpg-big/a5-drafts/b1-prep/a5-b1-replays.mjs']]) {
  if (await readFile(`${out}/${name}-complete.json`).then(() => true, e => { if(e.code==='ENOENT')return false; throw e; })) continue;
  let code, slice = 1+Math.max(0,...(await readdir(`${out}/logs`)).map(file => Number(file.match(new RegExp(`^${name}-(\\d+)\\.log$`))?.[1] ?? 0)));
  do {
    for (const [path, digest] of Object.entries({ ...reg.source, ...reg.tools })) assert.equal(sha(await readFile(path)), digest, path);
    const log = `${out}/logs/${name}-${slice++}.log`, fd = await open(log, 'wx');
    try {
      code = await new Promise((done, reject) => {
        const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A5 current cliffs24 ${name}`, process.execPath, script],
          { env: { ...process.env, A5_ABLATION_OUT: out }, stdio: ['ignore', fd.fd, fd.fd] });
        child.on('error', reject); child.on('close', done);
      });
    } finally { await fd.close(); }
    console.log(JSON.stringify({ name, slice: slice - 1, code }));
    await delay(7000);
  } while (code === 75);
  assert.equal(code, 0, name);
  await writeFile(`${out}/${name}-complete.json`, JSON.stringify({ name, completedAt: new Date().toISOString() })+'\n');
}
