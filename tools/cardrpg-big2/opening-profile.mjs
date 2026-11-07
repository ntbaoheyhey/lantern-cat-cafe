// REFERENCE: performance/b1-skills. Profile opening offenders separately from cast offenders.
// Run only inside with-timing-lock.mjs; retain the original timing and traced rerun separately.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
const input = 'reports/cardrpg-big2/performance/b1-skills';
const output = 'reports/cardrpg-big2/performance/b1-opening-profiles';
const artifact = '/tmp/cardrpg-big2-b1-index.html';
const measured = JSON.parse(await readFile(`${input}/summary.json`, 'utf8'));
const hash = createHash('sha256').update(await readFile(artifact)).digest('hex');
if (!measured.ended || measured.rows.length !== measured.actions.length * 10 || measured.sha256 !== hash) throw Error('Complete matching B1 matrix required');
const selected = [1, 4].map(cpu => measured.rows.filter(row => row.cpu === cpu).sort((a, b) => b.pageOpen.max - a.pageOpen.max)[0]);
const rows = [];
await mkdir(output, { recursive: true });
async function run(script, args = [], env = {}) {
 const code = await new Promise((done, reject) => {
  const child = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...env }, stdio: 'inherit' });
  child.once('error', reject); child.once('close', done);
 });
 if (code !== 0) throw Error(`${script} exited ${code}`);
}
for (const original of selected) {
 const directory = `${output}/${original.name}`;
 await run('tools/cardrpg-big2/skill-measure.mjs', [], {
  BIG_ARTIFACT: artifact, BIG_SKILL_OUT: directory, BIG_SKILL_PROFILE: '1', BIG_SKILL_IDS: original.action.id,
  BIG_SKILL_CONFIGS: JSON.stringify([[original.width, original.height, original.dpr, original.cpu, original.quality]]),
 });
 await run('tools/cardrpg-big/trace-report.mjs', [directory, original.name]);
 const rerun = JSON.parse(await readFile(`${directory}/summary.json`, 'utf8'));
 rows.push({ original, profiled: rerun.rows[0], evidence: `${directory}/trace-attribution.json` });
 await writeFile(`${output}/summary.json`, JSON.stringify({ artifact, sha256: hash, rows,
  method: 'Worst native and CPU4 whole-page cases selected from completed B1 matrix. Traced cold reruns add explicit first-interactive and scene-ready frame windows. Tracing perturbs timing; no substitution of rerun values for original maxima.' }, null, 2));
}
