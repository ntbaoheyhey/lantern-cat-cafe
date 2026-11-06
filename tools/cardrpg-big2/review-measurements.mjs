// REFERENCE: pinned review HTML and archive. Each browser phase holds the shared machine lock.
// Build/pin first, after accepting the loader comparison and all roster captures.
import { spawn } from 'node:child_process';
import { access, readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const artifact = '/tmp/cardrpg-big2-review-index.html', source = '/tmp/cardrpg-big2-review-validation';
const out = 'reports/cardrpg-big2/review';
const receipt = JSON.parse(await readFile('/tmp/cardrpg-big2-review-validation.json', 'utf8'));
assert.equal(receipt.artifact, artifact);
assert.equal(receipt.sha256, createHash('sha256').update(await readFile(artifact)).digest('hex'));
await access(`${source}/tools/cardrpg-big2/validate.mjs`); await mkdir(out, { recursive: true });
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
await run(['tools/cardrpg-big2/validate.mjs', 'review-source'],
  { BIG_VALIDATE_STEPS: 'typecheck,demo-types,lint,tests,build' }, source);
await run(['tools/cardrpg-big2/with-timing-lock.mjs', process.execPath, `${source}/tools/cardrpg-big2/validate.mjs`, 'review-e2e'],
  { BIG_VALIDATE_STEPS: 'e2e' });
for (const [prefix, steps] of [['review-source', ['typecheck','demo-types','lint','tests','build']], ['review-e2e', ['e2e']]]) {
  for (const name of [`${prefix}.json`, ...steps.map(step => `${prefix}-${step}.log`)])
    await cp(`${source}/reports/cardrpg-big2/validation/${name}`, `reports/cardrpg-big2/validation/${name}`);
}
await locked('tools/cardrpg-big2/studio-check.mjs', { BIG_STUDIO_OUT: `${out}/studio`, BIG_STUDIO_EXPECT_SOUND: '1' });
await locked('tools/cardrpg-big2/gallery-controls-check.mjs', { BIG_GALLERY_CONTROLS_OUT: `${out}/gallery-controls`, BIG_GALLERY_EXPECT_POLISH: '1', BIG_GALLERY_EXPECT_FIT: '1', BIG_GALLERY_EXPECT_FOCUS: '1' });
await locked('tools/cardrpg-big2/image-pack-check.mjs', { BIG_PACK_RECEIPT: '/tmp/cardrpg-big2-review-build.json', BIG_PACK_OUT: `${out}/image-pack` });
await locked('tools/cardrpg-big2/loading-screens.mjs', { BIG_LOADING_OUT: `${out}/loading` });
await locked('tools/cardrpg-big2/stage-life-check.mjs', { BIG_STAGE_LIFE_FINAL: '1', BIG_STAGE_LIFE_OUT: `${out}/stage-life` });
await locked('tools/cardrpg-big2/mechanics-check.mjs', { BIG_LAB_OUT: `${out}/mechanics`, BIG_LAB_EXPECT_POLISH: '1' });
await locked('tools/cardrpg-big2/audio-check.mjs', { BIG_AUDIO_SOURCE: source, BIG_AUDIO_OUT: `${out}/audio` });
await locked('tools/cardrpg-big2/audio-startup-check.mjs', { BIG_AUDIO_STARTUP_RECEIPT: '/tmp/cardrpg-big2-review-validation.json', BIG_AUDIO_STARTUP_OUT: `${out}/audio-startup` });
await locked('tools/cardrpg-big2/hitstop-check.mjs', { BIG_HITSTOP_OUT: `${out}/hitstop` });
await locked('tools/cardrpg-big2/measure.mjs', { BIG_OUT: `${out}/cold`, BIG_CAPTURE: '0' });
await locked('tools/cardrpg-big2/lifecycle.mjs', { BIG_LIFECYCLE_OUT: `${out}/lifecycle` });
await locked('tools/cardrpg-big/meta-lifecycle.mjs', { BIG_LIFECYCLE_OUT: `${out}/navigation` });
await locked('tools/cardrpg-big/flow-measure.mjs', { BIG_FLOW_OUT: `${out}/flow` });
await locked('tools/cardrpg-big2/record-gallery.mjs', { BIG_VIDEO_OUT: `${out}/video` });
await locked('tools/cardrpg-big2/record-boss-battles.mjs', { BIG_BOSS_VIDEO_OUT: `${out}/boss-battles` });
const flagOff = { BIG_FLAG_OFF_DIST: '/tmp/cardrpg-big2-review-flag-off-dist', BIG_FLAG_OFF_OUT: resolve(out, 'flag-off'), BIG_FLAG_OFF_HEAD: receipt.head };
await run([`${source}/tools/cardrpg-big2/flag-off-check.mjs`, '--prepare'], flagOff, source, true);
await locked(`${source}/tools/cardrpg-big2/flag-off-check.mjs`, flagOff);
await writeFile(`${out}/functional-complete.json`, JSON.stringify({ ...receipt, ended: new Date().toISOString() }, null, 2));
console.log(JSON.stringify({ reviewFunctionalComplete: true, sha256: receipt.sha256 }));
