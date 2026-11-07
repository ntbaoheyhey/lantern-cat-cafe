import { existsSync } from 'node:fs';
// Execute only inside with-timing-lock.mjs. Artifacts are captured before queuing.
import { spawn } from 'node:child_process';
import { readFile, cp, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const artifact = process.env.BIG_ARTIFACT;
if (!artifact?.startsWith('/tmp/cardrpg-big2-')) throw Error('Explicit pinned Lane B artifact required');
const phase = process.env.BIG_PHASE || 'batch1';
const out = `reports/cardrpg-big2/cats/${phase}`;
console.log(JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), phase }));
async function run(script, args = [], environment = {}, cwd = process.cwd()) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, env: { ...process.env, ...environment }, stdio: 'inherit' });
    child.once('error', reject); child.once('close', resolve);
  });
  if (code !== 0) throw Error(`${script} exited ${code}`);
}
// Quick isolated lab proof before the long batch1 matrix. A failure is recorded
// without discarding this unrelated cat phase's measurement queue.
if (phase === 'batch1') {
  await run('tools/cardrpg-big2/opening-profile.mjs');
  const labArtifact = '/tmp/cardrpg-big2-b5-index.html';
  if (await access(labArtifact).then(() => true, () => false)) {
    try { await run('tools/cardrpg-big2/mechanics-check.mjs', [], { BIG_ARTIFACT: labArtifact }); }
    catch (error) { console.log(JSON.stringify({ mechanicsCheckFailed: String(error) })); }
  }
}
if (phase === 'batch1' && await access('/tmp/cardrpg-big2-b4-index.html').then(() => true, () => false)) {
  try { await run('tools/cardrpg-big2/audio-check.mjs', [], { BIG_ARTIFACT: '/tmp/cardrpg-big2-b4-index.html' }); }
  catch (error) { console.log(JSON.stringify({ audioCheckFailed: String(error) })); }
}
const validationRoot = process.env.BIG_VALIDATION_ROOT || (phase === 'batch1' ? '/tmp/cardrpg-big2-batch1-validation' : process.cwd());
await run(resolve(validationRoot, 'tools/cardrpg-big2/validate.mjs'), [`${phase}-e2e`], { BIG_VALIDATE_STEPS: 'e2e' }, validationRoot);
if (validationRoot !== process.cwd()) for (const file of [`${phase}-e2e.json`, `${phase}-e2e-e2e.log`]) await cp(resolve(validationRoot, 'reports/cardrpg-big2/validation', file), resolve('reports/cardrpg-big2/validation', file));
await run('tools/cardrpg-big2/gallery-filmstrips.mjs', [], { BIG_BEFORE_OUT: `${out}/before` });
await run('tools/cardrpg-big2/motion-measure.mjs', [], { BIG_MOTION_OUT: `${out}/motion`, BIG_FILMSTRIP_OUT: `${out}/filmstrips`, BIG_PROVENANCE: `assets/provenance/cardrpg-big2-motion-${phase}.json` });
await run('tools/cardrpg-big2/effect-measure.mjs', [], { BIG_EFFECT_OUT: `${out}/effects` });
await run('tools/cardrpg-big2/measure.mjs', [], { BIG_OUT: `${out}/cold`, BIG_CAPTURE: '0' });
if (!existsSync('/tmp/cardrpg-big2-defer-matrices')) {
await run('tools/cardrpg-big2/skill-measure.mjs', [], { BIG_SKILL_OUT: `${out}/skills` });
await run('tools/cardrpg-big/skill-report.mjs', [`${out}/skills`]);
await run('tools/cardrpg-big/profile-skills.mjs', [`${out}/skills`]);

} else console.log(JSON.stringify({matrixDeferred: true, artifact, out, phase: typeof phase === 'undefined' ? 'b3' : phase}));
