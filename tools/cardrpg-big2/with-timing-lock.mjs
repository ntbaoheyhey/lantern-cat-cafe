// Shared-machine timing exclusion. This process owns the lock until its child exits.
import { mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const directory = '/tmp/cardrpg-big-locks/timing.lock';
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('Usage: node with-timing-lock.mjs command ...args');
await mkdir('/tmp/cardrpg-big-locks', { recursive: true });
let acquired = false, child;
const alive = pid => { try { process.kill(Number(pid), 0); return true; } catch { return false; } };
while (!acquired) {
  try {
    await mkdir(directory);
    acquired = true;
    await writeFile(`${directory}/owner.json`, JSON.stringify({ owner: 'B', pid: process.pid,
      started: new Date().toISOString(), command, args }));
    await writeFile(`${directory}/pid`, String(process.pid));
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const info = await stat(directory).catch(() => null);
    if (!info) continue;
    let owner = await readFile(`${directory}/owner.json`, 'utf8').then(JSON.parse).catch(() => null);
    if (!owner) owner = { pid: await readFile(`${directory}/pid`, 'utf8').catch(() => '') };
    // Allow the owner to finish writing its metadata after atomic mkdir.
    const stale = Date.now() - info.mtimeMs > 3 * 3600_000;
    if (stale || (owner.pid && !alive(owner.pid))) {
      console.log(JSON.stringify({ staleLock: true, owner, ageMs: Date.now() - info.mtimeMs }));
      await rm(directory, { recursive: true, force: true });
      continue;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
console.log(JSON.stringify({ timingLock: 'acquired', pid: process.pid, command, args }));
try {
  const code = await new Promise((resolve, reject) => {
    child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject); child.once('close', resolve);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
  });
  process.exitCode = code ?? 1;
} finally {
  const owner = await readFile(`${directory}/owner.json`, 'utf8').then(JSON.parse).catch(() => null);
  if (owner?.pid === process.pid) await rm(directory, { recursive: true, force: true });
}
