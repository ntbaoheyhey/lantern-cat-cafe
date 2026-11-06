// Local non-model measurement sequence, under a single shared timing lock.
import { spawn } from 'node:child_process';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const artifact = '/tmp/cardrpg-big2-b1-index.html';
await copyFile('docs/cardrpg3b/index.html', artifact);
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
await writeFile('/tmp/cardrpg-big2-b1-artifact.json', JSON.stringify({ artifact, sha256 }));
async function run(script, args = [], environment = {}) {
  console.log(JSON.stringify({ started: script, args, artifact, sha256 }));
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      env: { ...process.env, BIG_ARTIFACT: artifact, ...environment }, stdio: 'inherit',
    });
    child.once('error', reject); child.once('close', resolve);
  });
  if (code !== 0) throw new Error(`${script} exited ${code}`);
}
await run('tools/cardrpg-big2/measure.mjs', [], { BIG_CAPTURE: '0', BIG_OUT: 'reports/cardrpg-big2/performance/b1-cold' });
await run('tools/cardrpg-big2/lifecycle.mjs');
await run('tools/cardrpg-big/meta-lifecycle.mjs', [], { BIG_LIFECYCLE_OUT: 'reports/cardrpg-big2/performance/navigation' });
await run('tools/cardrpg-big2/loading-screens.mjs');
await run('tools/cardrpg-big/skill-measure.mjs', [], { BIG_SKILL_OUT: 'reports/cardrpg-big2/performance/b1-skills' });
await run('tools/cardrpg-big/skill-report.mjs', ['reports/cardrpg-big2/performance/b1-skills']);
await run('tools/cardrpg-big/profile-skills.mjs', ['reports/cardrpg-big2/performance/b1-skills']);
