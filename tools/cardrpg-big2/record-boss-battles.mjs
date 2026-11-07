// REFERENCE: MechanicsLab.tsx; mechanics-model.ts. Run inside the shared timing lock.
// Real x1 automatic fights in the isolated, default-OFF lab. Recording is not a timing benchmark.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const artifact = resolve(process.env.BIG_ARTIFACT || '/tmp/cardrpg-big2-review-index.html');
const out = process.env.BIG_BOSS_VIDEO_OUT || 'reports/cardrpg-big2/review/boss-battles';
await mkdir(out, { recursive: true });
const rows = [], errors = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const chapter of [1, 2, 3]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: 'Mechanics lab', exact: true }).click();
    const account = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
    assert.equal(await page.locator('.b2-lab input[type=checkbox]:checked').count(), 0);
    // The wrapping labels also contain option text in their accessible names.
    // Scope the two real selects to the existing preparation panel.
    await page.locator('.b2-lab-settings select').nth(0).selectOption('starter');
    await page.locator('.b2-lab-settings select').nth(1).selectOption(String(chapter));
    await page.getByLabel('Seed', { exact: true }).fill('4011');
    await page.getByRole('button', { name: 'Fight experiment', exact: true }).click();
    await page.getByLabel('Playback speed', { exact: true }).selectOption('1');
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    const setup = await page.evaluate(() => ({ initial: window.__mechanicsLab.battle.initial,
      options: window.__mechanicsLab.options, choicesAtStart: window.__mechanicsLab.battle.choices.length }));
    assert.equal(setup.options.autoExtras, false);
    await page.evaluate(() => {
      const canvas = window.__depthScene.renderer.domElement, stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1800000 }), chunks = [];
      const data = window.__bossRecording = { started: performance.now(), done: false, actions: [], resultAt: null, mimeType };
      let previous;
      const sample = () => {
        const m = window.__mechanicsLab, p = m.plan;
        if (p && p.id !== previous) { previous = p.id; data.actions.push({ at: performance.now() - data.started,
          id: p.id, skill: p.presentationId, actor: p.actorId, ultimate: p.ultimate }); }
        if (m.battle.result && !m.watching && data.resultAt === null) data.resultAt = performance.now() - data.started;
        if (!data.done) requestAnimationFrame(sample);
      };
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { data.elapsed = performance.now() - data.started; data.blob = new Blob(chunks, { type: mimeType });
        data.done = true; stream.getTracks().forEach(track => track.stop()); };
      recorder.start(); requestAnimationFrame(sample); setTimeout(() => recorder.stop(), 24000);
    });
    await page.waitForFunction(() => window.__bossRecording.done, null, { timeout: 40000 });
    const capture = await page.evaluate(async () => {
      const { blob, ...data } = window.__bossRecording, bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { ...data, base64: btoa(binary) };
    });
    await page.waitForFunction(() => window.__mechanicsLab.battle.result && !window.__mechanicsLab.watching,
      null, { timeout: 180000 });
    const result = await page.evaluate(() => ({ battle: window.__mechanicsLab.battle,
      account: JSON.stringify(window.__depthReview.state), options: window.__mechanicsLab.options }));
    assert.equal(result.account, account); assert.equal(result.options.autoExtras, false);
    assert.ok(capture.actions.length > 0); assert.ok(capture.elapsed >= 23900 && capture.elapsed <= 26000);
    const bytes = Buffer.from(capture.base64, 'base64'); delete capture.base64;
    assert.ok(bytes.length > 10000);
    const video = `${out}/chapter-${chapter}-boss-x1.webm`; await writeFile(video, bytes);
    const probe = JSON.parse(execFileSync('nice', ['-n', '10', 'ffprobe', '-v', 'error', '-count_frames',
      '-show_entries', 'stream=codec_name,width,height,nb_read_frames', '-of', 'json', video], { encoding: 'utf8' }));
    assert.ok(Number(probe.streams[0]?.nb_read_frames) > 100);
    const detail = { chapter, setup, capture, battle: result.battle, accountUnchanged: true, video,
      videoBytes: bytes.length, videoSha256: createHash('sha256').update(bytes).digest('hex'), probe };
    await writeFile(`${out}/chapter-${chapter}.json`, JSON.stringify(detail, null, 2));
    rows.push({ chapter, video, seconds: capture.elapsed / 1000, result: result.battle.result,
      round: result.battle.round, choices: result.battle.choices.length, accountUnchanged: true });
    console.log(JSON.stringify(rows.at(-1))); await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await writeFile(`${out}/captures.json`, JSON.stringify({ artifact,
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), rows, errors,
    method: 'Three actual x1 automatic boss encounters started through lab UI, with all extras OFF. Each video is a silent 24-second canvas excerpt after scene readiness; the fight continues naturally to its recorded result. No action, animation or result is injected. Default level-1 starter team, chapter boss plus escort, seed4011. This isolated lab setup is not a completed campaign route and does not measure performance or natural campaign balance.' }, null, 2));
}
