import { mkdir, readFile, writeFile, rm, stat, rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const directory = '/tmp/cardrpg-big-locks/timing.lock';
export async function withTimingLock(task, fn) {
  await mkdir('/tmp/cardrpg-big-locks', { recursive: true });
  let owned = false;
  const owner = { lane: 'B-LOOK', pid: process.pid, startedAt: new Date().toISOString(), task };
  while (!owned) {
    try {
      await mkdir(directory); owned = true; owner.startedAt = new Date().toISOString();
      await writeFile(`${directory}/owner.json`, JSON.stringify(owner));
      await writeFile(`${directory}/pid`, String(process.pid));
      await writeFile(`${directory}/owner`, 'B-LOOK');
      await writeFile(`${directory}/start`, owner.startedAt);
      await writeFile(`${directory}/task`, task);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const info = await stat(directory);
        const saved = JSON.parse(await readFile(`${directory}/owner.json`, 'utf8'));
        if (Date.now() - info.mtimeMs > 10000 && Number.isInteger(saved.pid)) {
          try { process.kill(saved.pid, 0); }
          catch (err) {
            if (err.code === 'ESRCH') {
              const stale = `${directory}.look-stale-${process.pid}`;
              await rename(directory, stale); await rm(stale, { recursive: true });
            }
          }
        }
      } catch (err) { if (!['ENOENT', 'SyntaxError'].includes(err.code ?? err.name)) throw err; }
      await delay(2000);
    }
  }
  console.log(JSON.stringify({ lock: 'acquired', ...owner }));
  try { return await fn(); }
  finally {
    const saved = JSON.parse(await readFile(`${directory}/owner.json`, 'utf8').catch(() => '{}'));
    if (saved.pid === process.pid) await rm(directory, { recursive: true });
    console.log(JSON.stringify({ lock: 'released', task }));
    await delay(6500);
  }
}
