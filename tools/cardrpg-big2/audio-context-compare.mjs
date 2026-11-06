// REFERENCE: audio/opening-profile/summary.json. Diagnostic intervention, not a shipped fix.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact = '/tmp/cardrpg-big2-b4-index.html';
const output = 'reports/cardrpg-big2/audio/context-compare';
const receipt = JSON.parse(await readFile('/tmp/cardrpg-big2-b4-validation.json', 'utf8'));
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
assert.equal(sha256, receipt.sha256);
await mkdir(output, { recursive: true });
const rows = [], errors = [];
try {
  for (const mode of ['forced', 'native', 'native', 'forced', 'forced', 'native']) {
    const index = rows.length + 1;
    const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      page.on('pageerror', error => errors.push({ index, message: String(error) }));
      await page.addInitScript(({ mode }) => {
        const data = window.__audioCompare = { mode, frames: [], marks: [], constructors: [], last: 0, enabled: false };
        const Original = window.AudioContext;
        window.AudioContext = new Proxy(Original, { construct(target, args, newTarget) {
          const originalOptions = args[0];
          const options = { ...originalOptions };
          if (mode === 'native') delete options.sampleRate;
          const at = performance.now();
          const context = Reflect.construct(target, [options], newTarget);
          data.constructors.push({ at, ms: performance.now() - at, originalOptions, options, sampleRate: context.sampleRate, baseLatency: context.baseLatency, outputLatency: context.outputLatency });
          return context;
        } });
        requestAnimationFrame(function sample(at) {
          if (data.enabled && data.last) data.frames.push({ at, ms: at - data.last });
          data.last = at; requestAnimationFrame(sample);
        });
      }, { mode });
      await page.goto('file://' + artifact);
      await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
      await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.evaluate(() => { const d = window.__audioCompare; d.enabled = true; d.last = 0; d.marks.push({ label: 'sound-click-start', at: performance.now() }); });
      await page.getByRole('button', { name: 'Sound off', exact: true }).click();
      await page.getByRole('button', { name: 'Sound on', exact: true }).waitFor();
      await page.evaluate(() => window.__audioCompare.marks.push({ label: 'sound-enabled', at: performance.now() }));
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
      await page.getByLabel('Playback speed', { exact: true }).selectOption('4');
      await page.waitForFunction(() => window.__depthReview.screen === 'result', null, { timeout: 120000 });
      const data = await page.evaluate(() => { const d = window.__audioCompare; d.enabled = false; return { ...d, sound: window.__depthReview.audio.enabled }; });
      assert.equal(data.sound, true); assert.equal(data.constructors.length, 1);
      const samples = data.frames.map(f => f.ms).sort((a, b) => a - b);
      const row = { index, mode, max: Math.max(...samples), p95: samples[Math.floor(samples.length * .95)], constructors: data.constructors, marks: data.marks };
      rows.push(row); await writeFile(`${output}/${index}-${mode}.json`, JSON.stringify(data, null, 2));
      console.log(JSON.stringify(row));
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
} finally {
  assert.equal(createHash('sha256').update(await readFile(artifact)).digest('hex'), sha256);
  await writeFile(`${output}/summary.json`, JSON.stringify({ artifact, sha256, source: receipt, method: 'Six fresh Chromium browser processes at native CPU/DPR1. Alternating forced/native sample-rate constructor options on identical pinned HTML; real sound click followed by automatic x4 battle. No screenshots or tracing in sampled window. This comparison does not prove an OS-cold audio service restart.', rows, errors }, null, 2));
}
