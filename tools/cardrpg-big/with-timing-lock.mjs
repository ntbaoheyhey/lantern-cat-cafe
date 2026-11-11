import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';

const directory = '/tmp/cardrpg-big-locks/timing.lock';
// A shorter opt-in poll avoids missing brief handoffs between another lane's jobs.
const pollMilliseconds = Math.max(100, Math.min(2000, Number(process.env.CARDRPG_TIMING_POLL_MS) || 2000));
const [task, command, ...args] = process.argv.slice(2);
if (!task || !command) throw new Error('Provide a task label, command and arguments.');
const owner = { lane: 'A', pid: process.pid, startedAt: new Date().toISOString(), task };
let owned = false;
let stopped = false;
let child;

function waitForHandoff() {
  return new Promise(resolve => {
    let watcher;
    const done = () => { clearTimeout(timer); watcher?.close(); resolve(); };
    const timer = setTimeout(done, pollMilliseconds);
    try {
      watcher = watch('/tmp/cardrpg-big-locks', { persistent: false }, (_event, file) => {
        if (!file || String(file) === 'timing.lock') done();
      });
      watcher.once('error', done);
    } catch { /* The bounded polling fallback still wakes this waiter. */ }
  });
}

async function stale() {
  const info = await stat(directory);
  // A live owner is never stale, even after three hours.
  void info;
  const pidText = await readFile(`${directory}/pid`, 'utf8').catch(() => '');
  const json = await readFile(`${directory}/owner.json`, 'utf8').catch(() => '{}');
  let metadata;
  try { metadata = JSON.parse(json); } catch { return false; }
  const pid = Number(pidText.trim() || metadata.pid);
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return false; }
  catch (error) { return error.code === 'ESRCH'; }
}

async function acquire() {
  await mkdir('/tmp/cardrpg-big-locks', { recursive: true });
  while (!stopped) {
    try {
      await mkdir(directory);
      owned = true;
      await writeFile(`${directory}/owner.json`, JSON.stringify(owner, null, 2));
      await writeFile(`${directory}/pid`, String(owner.pid));
      await writeFile(`${directory}/owner`, owner.lane);
      await writeFile(`${directory}/start`, owner.startedAt);
      await writeFile(`${directory}/task`, task);
      console.log(JSON.stringify({ lock: 'acquired', ...owner }));
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    try {
      if (await stale()) {
        const abandoned = `${directory}.stale-${process.pid}-${Date.now()}`;
        await rename(directory, abandoned);
        await rm(abandoned, { recursive: true });
        continue;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      continue;
    }
    await waitForHandoff();
  }
}

function stop(signal) {
  stopped = true;
  if (child?.pid) {
    try { process.kill(-child.pid, signal); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
try {
  await acquire();
  if (!stopped) {
    child = spawn(command, args, { stdio: 'inherit', detached: true });
    process.exitCode = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', code => resolve(code ?? 1));
    });
  }
} finally {
  if (owned) {
    const saved = JSON.parse(await readFile(`${directory}/owner.json`, 'utf8').catch(() => '{}'));
    if (saved.pid === process.pid) await rm(directory, { recursive: true });
    console.log(JSON.stringify({ lock: 'released', pid: process.pid, task }));
  }
}
