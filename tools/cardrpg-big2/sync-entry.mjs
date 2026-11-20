// Single-writer file synchronization. No models, messaging services or schedulers.
import { readFile, appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const cwd = '/Users/bao/taskbar-hero-cardrpg-sync';
const [phase, type, bodyPath] = process.argv.slice(2);
if (!phase || !['CLAIM','DONE','REQUEST','ANSWER','HEADS-UP','CHECKPOINT'].includes(type) || !bodyPath?.startsWith('/tmp/cardrpg-big2-')) throw Error('Usage: phase TYPE /tmp/cardrpg-big2-body.txt');
const body = (await readFile(bodyPath, 'utf8')).trim();
if (body.split('\n').length > 8) throw Error('Outbox entries are limited to eight lines');
await appendFile(`${cwd}/coord/cardrpg-big/B-OUTBOX.md`, `\n## ${new Date().toISOString()} ${phase} ${type}\n${body}\n`);
const git = args => execFileSync('git', args, { cwd, stdio: 'inherit' });
git(['add', 'coord/cardrpg-big/B-OUTBOX.md']); git(['commit', '-m', `sync: B ${phase} ${type}`]);
for (let attempt = 0; ; attempt++) {
  try { git(['pull', '--rebase']); git(['push']); break; }
  catch (error) { if (attempt >= 4) throw error; await new Promise(resolve => setTimeout(resolve, 2000 * 2 ** attempt)); }
}
