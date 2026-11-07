// REFERENCE: pinned review HTML and archive. Each browser phase holds the shared machine lock.
// Build/pin first, after accepting the loader comparison and all roster captures.
import { spawn } from 'node:child_process';
import { access, readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const artifact = '/tmp/cardrpg-big2-review-index.html', source = '/tmp/cardrpg-big2-review-validation';
const out = 'reports/cardrpg-big2/review';
const selectedSteps = process.env.BIG_REVIEW_STEPS?.split(',');
const progressPath = `${out}/run-steps.json`;
const receipt = JSON.parse(await readFile('/tmp/cardrpg-big2-review-validation.json', 'utf8'));
assert.equal(receipt.artifact, artifact);
assert.equal(receipt.sha256, createHash('sha256').update(await readFile(artifact)).digest('hex'));
await access(`${source}/tools/cardrpg-big2/validate.mjs`); await mkdir(out, { recursive: true });
const progress = await readFile(progressPath, 'utf8').then(JSON.parse).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return { sha256: receipt.sha256, sourceHead: receipt.head, steps: {} };
});
assert.equal(progress.sha256, receipt.sha256, 'Archive prior progress before changing the artifact');
assert.equal(progress.sourceHead, receipt.head);
const failures = [];
async function step(name, action) {
  if (selectedSteps && !selectedSteps.includes(name)) return;
  if (progress.steps[name]?.status === 'passed') {
    console.log(JSON.stringify({ step: name, resumed: true }));
    return;
  }
  const previous = progress.steps[name];
  const evidenceDirectory = `${out}/${name.startsWith('flag-off') ? 'flag-off' : name}`;
  if (previous && await access(evidenceDirectory).then(() => true, () => false)) {
    const stamp = previous.started.replaceAll(':', '-');
    await cp(evidenceDirectory, `${out}/attempts/${name}-${stamp}`, { recursive: true });
  }
  const attempts = previous?.attempts ?? [];
  if (previous) attempts.push({ ...previous, attempts: undefined });
  const current = { started: new Date().toISOString(), status: 'running', attempts };
  progress.steps[name] = current;
  await writeFile(progressPath, JSON.stringify(progress, null, 2));
  try {
    await action(attempts.length + 1);
    current.status = 'passed';
  } catch (error) {
    current.status = 'failed';
    current.error = String(error);
    failures.push({ name, error: String(error) });
  }
  current.ended = new Date().toISOString();
  await writeFile(progressPath, JSON.stringify(progress, null, 2));
  console.log(JSON.stringify({ step: name, status: current.status, error: current.error }));
}
async function run(args, env = {}, cwd = process.cwd(), polite = false) {
  const code = await new Promise((done, reject) => {
    const child = spawn(polite ? 'nice' : process.execPath, polite ? ['-n', '10', process.execPath, ...args] : args,
      { cwd, env: { ...process.env, BIG_ARTIFACT: artifact, ...env }, stdio: 'inherit' });
    child.once('error', reject); child.once('close', done);
  });
  if (code !== 0) throw Error(`${args.join(' ')} exited ${code}`);
}
async function locked(script, env = {}) {
  await run(['tools/cardrpg-big2/with-timing-lock.mjs', process.execPath, script], env);
  await new Promise(done => setTimeout(done, 6500));
}
async function validate(name, steps, underLock, attempt) {
  const prefix = attempt === 1 ? name : `${name}-retry-${attempt}`;
  const command = [`${source}/tools/cardrpg-big2/validate.mjs`, prefix];
  try {
    await run(underLock ? ['tools/cardrpg-big2/with-timing-lock.mjs', process.execPath, ...command] : command,
      { BIG_VALIDATE_STEPS: steps.join(',') }, underLock ? process.cwd() : source);
  } finally {
    for (const file of [`${prefix}.json`, ...steps.map(name => `${prefix}-${name}.log`)]) {
      const path = `${source}/reports/cardrpg-big2/validation/${file}`;
      if (await access(path).then(() => true, () => false))
        await cp(path, `reports/cardrpg-big2/validation/${file}`);
    }
  }
}
await step('source', attempt => validate('review-source', ['typecheck','demo-types','lint','tests','build'], false, attempt));
await step('e2e', attempt => validate('review-e2e', ['e2e'], true, attempt));
await step('studio', () => locked('tools/cardrpg-big2/studio-check.mjs', { BIG_STUDIO_OUT: `${out}/studio`, BIG_STUDIO_EXPECT_SOUND: '1' }));
await step('gallery-controls', () => locked('tools/cardrpg-big2/gallery-controls-check.mjs', { BIG_GALLERY_CONTROLS_OUT: `${out}/gallery-controls`, BIG_GALLERY_EXPECT_POLISH: '1', BIG_GALLERY_EXPECT_FIT: '1', BIG_GALLERY_EXPECT_FOCUS: '1' }));
await step('image-pack', () => locked('tools/cardrpg-big2/image-pack-check.mjs', { BIG_PACK_RECEIPT: '/tmp/cardrpg-big2-review-build.json', BIG_PACK_OUT: `${out}/image-pack` }));
await step('loading', () => locked('tools/cardrpg-big2/loading-screens.mjs', { BIG_LOADING_OUT: `${out}/loading` }));
await step('stage-life', () => locked('tools/cardrpg-big2/stage-life-check.mjs', { BIG_STAGE_LIFE_FINAL: '1', BIG_STAGE_LIFE_OUT: `${out}/stage-life` }));
await step('mechanics', () => locked('tools/cardrpg-big2/mechanics-check.mjs', { BIG_LAB_OUT: `${out}/mechanics`, BIG_LAB_EXPECT_POLISH: '1' }));
await step('audio', () => locked('tools/cardrpg-big2/audio-check.mjs', { BIG_AUDIO_SOURCE: source, BIG_AUDIO_OUT: `${out}/audio` }));
await step('audio-startup', () => locked('tools/cardrpg-big2/audio-startup-check.mjs', { BIG_AUDIO_STARTUP_RECEIPT: '/tmp/cardrpg-big2-review-validation.json', BIG_AUDIO_STARTUP_OUT: `${out}/audio-startup` }));
await step('hitstop', () => locked('tools/cardrpg-big2/hitstop-check.mjs', { BIG_HITSTOP_OUT: `${out}/hitstop` }));
await step('cold', () => locked('tools/cardrpg-big2/measure.mjs', { BIG_OUT: `${out}/cold`, BIG_CAPTURE: '0' }));
await step('lifecycle', () => locked('tools/cardrpg-big2/lifecycle.mjs', { BIG_LIFECYCLE_OUT: `${out}/lifecycle` }));
await step('navigation', () => locked('tools/cardrpg-big/meta-lifecycle.mjs', { BIG_LIFECYCLE_OUT: `${out}/navigation` }));
await step('flow', () => locked('tools/cardrpg-big/flow-measure.mjs', { BIG_FLOW_OUT: `${out}/flow` }));
await step('video', () => locked('tools/cardrpg-big2/record-gallery.mjs', { BIG_VIDEO_OUT: `${out}/video` }));
await step('boss-battles', () => locked('tools/cardrpg-big2/record-boss-battles.mjs', { BIG_BOSS_VIDEO_OUT: `${out}/boss-battles` }));
const flagOff = { BIG_FLAG_OFF_DIST: '/tmp/cardrpg-big2-review-flag-off-dist', BIG_FLAG_OFF_OUT: resolve(out, 'flag-off'), BIG_FLAG_OFF_HEAD: receipt.head };
await step('flag-off-prepare', () => run(['tools/cardrpg-big2/flag-off-check.mjs', '--prepare'], { ...flagOff, BIG_FLAG_OFF_SOURCE: source }, process.cwd(), true));
// Rebuild only from the original archived source with the corrected final-output
// inventory. Prior builds/failures remain archived by the step runner.
await step('flag-off-browser', () => locked('tools/cardrpg-big2/flag-off-check.mjs', flagOff));
if (failures.length) {
  console.error(JSON.stringify({ failures }));
  process.exitCode = 1;
} else if (!selectedSteps) {
  await writeFile(`${out}/functional-complete.json`, JSON.stringify({ ...receipt, ended: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ reviewFunctionalComplete: true, sha256: receipt.sha256 }));
}
