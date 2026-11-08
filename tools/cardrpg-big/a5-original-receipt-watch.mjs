// REFERENCE: original A5 diagnostics47/49/50 and Home03. Audit only; never launch samples.
import { readFile, writeFile, open } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const out = process.argv[2]; assert(out?.startsWith('/tmp/cardrpg-a5-'));
const json = async path => JSON.parse(await readFile(path));
const tasks = [
  { name: 'threat47', pid: 17707, command: 'node tools/cardrpg-big/a5-threat-beats-run.mjs',
    ready: async () => (await json('reports/cardrpg-big/a5/b1/threat-beats-47/completed.json')).length === 5,
    commands: [['node', 'tools/cardrpg-big/a5-threat-beats-audit.mjs']] },
  { name: 'impact49', pid: 17057, command: 'node tools/cardrpg-big/a5-impact-delay-run.mjs',
    ready: async () => (await json('reports/cardrpg-big/a5/b1/impact-delay-49/completed.json')).length === 4,
    commands: [['node', 'tools/cardrpg-big/a5-impact-delay-audit.mjs']] },
  { name: 'precision50', pid: 18122, command: 'node tools/cardrpg-big/a5-display-precision-run.mjs',
    ready: async () => (await json('reports/cardrpg-big/a5/b1/display-precision-50/complete.json')).complete === true,
    commands: [['python3', 'tools/cardrpg-big/a5-display-precision-audit.py']] },
  { name: 'home03', pid: 12101, command: 'node tools/cardrpg-big/a5-engagement-informed-session.mjs',
    ready: async () => (await json('reports/cardrpg-big/a5/engagement/home-03/session/timeline.json')).complete === true,
    commands: [['node', 'tools/cardrpg-big/a5-engagement-informed-report.mjs'],
      ['python3', 'tools/cardrpg-big/a5-engagement-informed-audit.py']] },
];
const status = [];
const sameProcess = task => {
  try { return execFileSync('ps', ['-p', String(task.pid), '-o', 'command='], { encoding: 'utf8' }).trim() === task.command; }
  catch (error) { if (error.status === 1) return false; throw error; }
};
const record = async row => {
  status.push({ at: new Date().toISOString(), ...row });
  await writeFile(out + '/status.json', JSON.stringify(status, null, 2) + '\n');
  console.log(JSON.stringify(status.at(-1)));
};
while (tasks.length) {
  for (const task of [...tasks]) {
    if (sameProcess(task)) continue;
    let ready;
    try { ready = await task.ready(); }
    catch (error) { if (error.code === 'ENOENT') ready = false; else throw error; }
    tasks.splice(tasks.indexOf(task), 1);
    if (!ready) { await record({ name: task.name, status: 'INCOMPLETE: original process exited without its complete marker' }); continue; }
    for (const [index, command] of task.commands.entries()) {
      const log = out + '/' + task.name + '-' + index + '.log', fd = await open(log, 'wx');
      let code;
      try {
        code = await new Promise((resolve, reject) => {
          const child = spawn(command[0], command.slice(1), { stdio: ['ignore', fd.fd, fd.fd] });
          child.on('error', reject); child.on('close', resolve);
        });
      } finally { await fd.close(); }
      await record({ name: task.name, command, log, code });
      if (code !== 0) break;
    }
  }
  if (tasks.length) await delay(10000);
}
