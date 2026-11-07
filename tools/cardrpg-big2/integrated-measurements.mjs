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
async function step(name, script, env = {}, args = [], locked = true) {
  if (progress.steps[name]?.status === 'passed') return;
  await verifyArtifact();
  const previous = progress.steps[name];
  if (previous && name !== 'matrix' && await access(`${out}/${name}`).then(() => true, () => false)) {
    await cp(`${out}/${name}`, `${out}/attempts/${name}-${previous.started.replaceAll(':', '-')}`, { recursive: true });
  }
  const attempts = previous?.attempts ?? [];
  if (previous) attempts.push({ ...previous, attempts: undefined });
  const row = progress.steps[name] = { started: new Date().toISOString(), status: 'running', attempts };
  await writeFile(progressPath, JSON.stringify(progress, null, 2));
  const command = locked
    ? ['tools/cardrpg-big2/with-timing-lock.mjs', process.execPath, script, ...args]
    : [script, ...args];
  const code = await new Promise((done, reject) => {
    const child = spawn(process.execPath, command,
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

await step('lifecycle', 'tools/cardrpg-big2/lifecycle.mjs', { BIG_LIFECYCLE_OUT: `${out}/lifecycle` });
await step('audio-startup', 'tools/cardrpg-big2/audio-startup-check.mjs', {
  BIG_AUDIO_STARTUP_OUT: `${out}/audio-startup`, BIG_AUDIO_STARTUP_RECEIPT: `${out}/accepted-source.json`,
});
await step('matrix', 'tools/cardrpg-big2/matrix-series.mjs', {}, ['integrated'], false);
if (failures.length) {
  console.error(JSON.stringify({ failedSteps: failures }));
  process.exitCode = 1;
}
