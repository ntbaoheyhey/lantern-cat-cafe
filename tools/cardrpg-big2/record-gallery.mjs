// REFERENCE: depth/model.ts inspect/tick; motion-measure.mjs. Shared timing lock required.
// These are actual x1 gallery recordings, not natural battles or performance measurements.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const artifact = resolve(process.env.BIG_ARTIFACT || '/tmp/cardrpg-big2-review-index.html');
const out = process.env.BIG_VIDEO_OUT || 'reports/cardrpg-big2/review/video';
await mkdir(out, { recursive: true });
const rows = [], errors = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('file://' + artifact);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  const groups = await page.evaluate(() => {
    const actions = window.__depthReview.galleryActions;
    return [...new Set(actions.filter(a => !a.enemy || ['yarn-giant', 'rain-spool', 'pantry-crown'].includes(a.owner)).map(a => a.owner))]
      .map(owner => ({ owner, ids: actions.filter(a => a.owner === owner).map(a => a.id) }));
  });
  const selected = process.env.BIG_VIDEO_OWNERS?.split(',');
  for (const group of groups.filter(g => !selected || selected.includes(g.owner))) {
    await page.evaluate(id => { const m = window.__depthReview; m.gallerySpeed = 1; m.inspect(id, -1); }, group.ids[0]);
    await page.waitForFunction(() => window.__depthScene?.ready && window.__depthReview.battle.actors.every(a => window.__depthScene.puppets.get(a.id)?.asset === a.catalogId));
    await page.evaluate(() => {
      const canvas = window.__depthScene.renderer.domElement, stream = canvas.captureStream(30);
      const chunks = [], mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1800000 });
      const data = window.__b2Recording = { started: performance.now(), clips: [], done: false, width: canvas.width, height: canvas.height, mimeType };
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { data.elapsed = performance.now() - data.started; data.blob = new Blob(chunks, { type: mimeType }); data.done = true; stream.getTracks().forEach(t => t.stop()); };
      recorder.start();
      setTimeout(() => recorder.stop(), 24000);
    });
    let index = 0;
    while (!await page.evaluate(() => window.__b2Recording.done)) {
      await page.evaluate(id => { const data = window.__b2Recording; data.clips.push({ id, at: performance.now() - data.started }); window.__depthReview.inspect(id, 0, true); }, group.ids[index++ % group.ids.length]);
      await page.waitForFunction(() => !window.__depthReview.plan || window.__b2Recording.done);
    }
    const data = await page.evaluate(async () => {
      const { blob, ...data } = window.__b2Recording, bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      window.__depthReview.paused = true;
      return { ...data, base64: btoa(binary) };
    });
    const bytes = Buffer.from(data.base64, 'base64'); delete data.base64;
    assert.ok(bytes.length > 10000); assert.ok(data.elapsed >= 23900 && data.elapsed <= 26000);
    assert.ok(group.ids.every(id => data.clips.some(clip => clip.id === id)));
    const file = `${out}/${group.owner}-x1.webm`; await writeFile(file, bytes);
    const probe = JSON.parse(execFileSync('nice', ['-n', '10', 'ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'stream=codec_name,width,height,nb_read_frames', '-of', 'json', file], { encoding: 'utf8' }));
    assert.ok(Number(probe.streams[0]?.nb_read_frames) > 100);
    rows.push({ owner: group.owner, file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), ...data, probe });
    console.log(JSON.stringify({ owner: group.owner, seconds: data.elapsed / 1000, clips: data.clips.length, bytes: bytes.length }));
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await writeFile(`${out}/captures.json`, JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), method: 'Silent 24-second native canvas recordings at x1. Repeated isolated gallery actions include each selected unit skill/passive; full stage preserves distant target effects omitted by caster crops. These are presentation fixtures, not natural boss fights and not timing evidence. Videos are external to the demo HTML.', rows, errors }, null, 2));
}
