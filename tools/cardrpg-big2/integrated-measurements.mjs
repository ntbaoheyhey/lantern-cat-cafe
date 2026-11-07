// REFERENCE: reports/cardrpg-big2/integration/accepted-source.json
// Measurements of the accepted main demo; standalone B receipts stay separate.
import { spawn } from 'node:child_process';
import { access, cp, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const out = 'reports/cardrpg-big2/integration';
const accepted = JSON.parse(await readFile(`${out}/accepted-source.json`, 'utf8'));
assert.equal(accepted.sourceAccepted, true);
const verifyArtifact = async () => assert.equal(
  createHash('sha256').update(await readFile(accepted.artifact)).digest('hex'), accepted.sha256);
await verifyArtifact();
const progressPath = `${out}/measurement-steps.json`;
const progress = await readFile(progressPath, 'utf8').then(JSON.parse).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return { integrationHead: accepted.integrationHead, sha256: accepted.sha256, steps: {} };
});
assert.equal(progress.sha256, accepted.sha256);
const failures = [];
async function step(name, script, env = {}, args = [], locked = true, polite = false) {
  if (progress.steps[name]?.status === 'passed') return;
  await verifyArtifact();
  const previous = progress.steps[name];
  const evidenceDirectory = `${out}/${name.startsWith('flag-off') ? 'flag-off' : name}`;
  if (previous && name !== 'matrix' && await access(evidenceDirectory).then(() => true, () => false)) {
    await cp(evidenceDirectory, `${out}/attempts/${name}-${previous.started.replaceAll(':', '-')}`, { recursive: true });
  }
  const attempts = previous?.attempts ?? [];
  if (previous) attempts.push({ ...previous, attempts: undefined });
  const row = progress.steps[name] = { started: new Date().toISOString(), status: 'running', attempts };
  await writeFile(progressPath, JSON.stringify(progress, null, 2));
  const command = locked
    ? ['tools/cardrpg-big2/with-timing-lock.mjs', process.execPath, script, ...args]
    : [script, ...args];
  const code = await new Promise((done, reject) => {
    const child = spawn(polite ? 'nice' : process.execPath,
      polite ? ['-n', '10', process.execPath, ...command] : command,
      { env: { ...process.env, BIG_ARTIFACT: accepted.artifact, ...env }, stdio: 'inherit' });
    child.once('error', reject); child.once('close', done);
  });
  row.exit = code;
  row.status = code === 0 ? 'passed' : 'failed';
  row.ended = new Date().toISOString();
  await verifyArtifact();
  await writeFile(progressPath, JSON.stringify(progress, null, 2));
  if (code !== 0) failures.push(name);
  console.log(JSON.stringify({ integratedStep: name, ...row }));
  await new Promise(done => setTimeout(done, 6500));
}

await step('loading', 'tools/cardrpg-big2/loading-screens.mjs', { BIG_LOADING_OUT: `${out}/loading` });
await step('cold', 'tools/cardrpg-big2/measure.mjs', { BIG_OUT: `${out}/cold`, BIG_CAPTURE: '0' });
await step('lifecycle', 'tools/cardrpg-big2/lifecycle.mjs', { BIG_LIFECYCLE_OUT: `${out}/lifecycle` });
await step('audio-startup', 'tools/cardrpg-big2/audio-startup-check.mjs', {
  BIG_AUDIO_STARTUP_OUT: `${out}/audio-startup`, BIG_AUDIO_STARTUP_RECEIPT: `${out}/accepted-source.json`,
});
const flagOff = {
  BIG_FLAG_OFF_DIST: '/tmp/cardrpg-big2-integrated-flag-off-dist',
  BIG_FLAG_OFF_OUT: `${out}/flag-off`, BIG_FLAG_OFF_HEAD: accepted.integrationHead,
};
await step('flag-off-prepare', 'tools/cardrpg-big2/flag-off-check.mjs', flagOff, ['--prepare'], false, true);
await step('flag-off-browser', 'tools/cardrpg-big2/flag-off-check.mjs', flagOff);
// Lane A requested its short functional/video windows before the long matrix.
// This observes its single-writer receipt only; it never modifies the A checkout.
const videoReceipt = process.env.BIG_INTEGRATED_A_VIDEO_RECEIPT
  || '/Users/bao/taskbar-hero-cardrpg-big-delivery/reports/cardrpg-big/video/delivery/series.json';
console.log(JSON.stringify({ waitingForLaneAVideoReceipt: videoReceipt }));
for (;;) {
  const video = await readFile(videoReceipt, 'utf8').then(JSON.parse).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (video) {
    assert.equal(video.sha256, accepted.sha256, 'Lane A video receipt must name the accepted artifact');
    if (video.complete) {
      assert.equal(video.completed.length, video.expected.length);
      assert.deepEqual([...video.completed].sort(), [...video.expected].sort());
      await writeFile(`${out}/lane-a-video-handoff.json`, JSON.stringify({
        observedAt: new Date().toISOString(), source: videoReceipt, ...video,
      }, null, 2));
      break;
    }
  }
  await new Promise(done => setTimeout(done, 5000));
}
await step('matrix', 'tools/cardrpg-big2/matrix-series.mjs', {}, ['integrated'], false);
await step('raw-audit', 'tools/cardrpg-big2/audit-integrated-skills.mjs', {}, [], false, true);
if (failures.length) {
  console.error(JSON.stringify({ failedSteps: failures }));
  process.exitCode = 1;
}
