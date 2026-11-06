// Execute only inside with-timing-lock.mjs. Artifacts are captured before queuing.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const artifact = process.env.BIG_ARTIFACT;
if (!artifact?.startsWith('/tmp/cardrpg-big2-')) throw Error('Explicit pinned Lane B artifact required');
const phase = process.env.BIG_PHASE || 'batch1';
const out = `reports/cardrpg-big2/cats/${phase}`;
console.log(JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), phase }));
async function run(script, args = [], environment = {}) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { env: { ...process.env, ...environment }, stdio: 'inherit' });
    child.once('error', reject); child.once('close', resolve);
  });
  if (code !== 0) throw Error(`${script} exited ${code}`);
}
await run('tools/cardrpg-big2/validate.mjs', [`${phase}-e2e`], { BIG_VALIDATE_STEPS: 'e2e' });
await run('tools/cardrpg-big2/gallery-filmstrips.mjs', [], { BIG_BEFORE_OUT: `${out}/before` });
await run('tools/cardrpg-big2/motion-measure.mjs', [], { BIG_MOTION_OUT: `${out}/motion`, BIG_FILMSTRIP_OUT: `${out}/filmstrips`, BIG_PROVENANCE: `assets/provenance/cardrpg-big2-motion-${phase}.json` });
await run('tools/cardrpg-big2/effect-measure.mjs', [], { BIG_EFFECT_OUT: `${out}/effects` });
await run('tools/cardrpg-big2/measure.mjs', [], { BIG_OUT: `${out}/cold`, BIG_CAPTURE: '0' });
await run('tools/cardrpg-big/skill-measure.mjs', [], { BIG_SKILL_OUT: `${out}/skills` });
await run('tools/cardrpg-big/skill-report.mjs', [`${out}/skills`]);
await run('tools/cardrpg-big/profile-skills.mjs', [`${out}/skills`]);
