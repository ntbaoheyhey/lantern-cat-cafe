// REFERENCE: PROMPT-A4 G0, g0/source-snapshot.json. Close only unfinished numeric
// receipts against immutable BEFORE rules; yield multiple windows to lane B.
import { spawn } from 'node:child_process';
import { readFile, open, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
const out = 'reports/cardrpg-big/a4/g0';
const snapshot = JSON.parse(await readFile(`${out}/source-snapshot.json`, 'utf8'));
for (const [path, expected] of Object.entries(snapshot.files)) {
  const actual = createHash('sha256').update(await readFile(`${snapshot.root}/${path}`)).digest('hex');
  if (actual !== expected) throw Error(`Baseline snapshot changed: ${path}`);
}
const receipts = JSON.parse(await readFile(`${out}/close-series.json`, 'utf8').catch(() => '[]'));
const jobs = [
  ['off-baseline', 'a4-baseline', `${out}/off-behavior.json`, {}],
  ['economy', 'a4-economy', `${out}/economy.json`, { BIG_ECONOMY_POLICY: 'auto', BIG_ECONOMY_OUT: `${out}/economy.json` }],
];
// The previous long shard just ended. Give B several short windows first.
await delay(180000);
for (const [name, script, output, env] of jobs) {
  if (await readFile(output).then(() => true, () => false)) continue;
  let code, shard = receipts.filter(row => row.name === name).length;
  do {
    const file = await open(`${out}/${name}-close${++shard}.log`, 'a');
    const start = new Date().toISOString();
    code = await new Promise((done, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A4 G0 ${name} short ${shard}`, 'nice', '-n', '10', process.execPath, `tools/cardrpg-big/${script}.mjs`], {
        env: { ...process.env, ...env, BIG_RULES_ROOT: snapshot.root }, stdio: ['ignore', file.fd, file.fd],
      });
      child.on('error', reject); child.on('close', done);
    });
    await file.close();
    receipts.push({ name, shard, start, end: new Date().toISOString(), code, sourceSnapshot: `${out}/source-snapshot.json` });
    await writeFile(`${out}/close-series.json`, JSON.stringify(receipts, null, 2));
    console.log(JSON.stringify(receipts.at(-1)));
    // Source tools checkpoint after ~2 minutes, between complete cases.
    await delay(120000);
  } while (code === 75);
  if (code !== 0) throw Error(`${name} failed; original log retained`);
}
