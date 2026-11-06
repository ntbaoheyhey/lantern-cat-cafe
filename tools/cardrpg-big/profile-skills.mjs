import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const directory = process.argv[2] || 'reports/cardrpg-big/baseline/skills';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const ranking = JSON.parse(await readFile(`${directory}/ranked.json`, 'utf8'));
const summary = JSON.parse(await readFile(`${directory}/summary.json`, 'utf8'));
if (!ranking.complete) throw new Error('Finish and rank the full matrix before profiling its offenders');
const hash = createHash('sha256').update(await readFile(artifact)).digest('hex');
if (hash !== ranking.artifactSha256) throw new Error('The profiling artifact differs from the measured matrix');

async function run(script, args = [], environment = {}) {
  const exitCode = await new Promise((resolveExit, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      env: { ...process.env, ...environment }, stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('close', resolveExit);
  });
  if (exitCode !== 0) throw new Error(`${script} failed with exit ${exitCode}`);
}

const selected = ranking.ranked.slice(0, 5);
const results = [];
for (const ranked of selected) {
  const original = summary.rows.find(row => row.name === ranked.name);
  const output = `${directory}/profiles/${original.name}`;
  await mkdir(output, { recursive: true });
  await run('tools/cardrpg-big/skill-measure.mjs', [], {
    BIG_ARTIFACT: artifact,
    BIG_SKILL_OUT: output,
    BIG_SKILL_IDS: original.action.id,
    BIG_SKILL_PROFILE: '1',
    BIG_SKILL_CONFIGS: JSON.stringify([[original.width, original.height, original.dpr, original.cpu, original.quality]]),
  });
  await run('tools/cardrpg-big/trace-report.mjs', [output, original.name]);
  const rerun = JSON.parse(await readFile(`${output}/summary.json`, 'utf8'));
  results.push({ original: ranked, profiled: rerun.rows[0], evidence: `${output}/trace-attribution.json` });
}
await writeFile(`${directory}/profiles/summary.json`, JSON.stringify({
  artifactSha256: hash,
  method: 'Five largest cast MAX cases, breaking ties by page MAX. Separate cold reruns include CPU traces. Profiling can change timing, and a transient cast spike may not recur.',
  results,
}, null, 2));
