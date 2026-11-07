// REFERENCE: audio/opening-profile/summary.json. Diagnostic intervention, not a shipped fix.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact = '/tmp/cardrpg-big2-b4-index.html';
const output = 'reports/cardrpg-big2/audio/media-compare';
const receipt = JSON.parse(await readFile('/tmp/cardrpg-big2-b4-validation.json', 'utf8'));
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
assert.equal(sha256, receipt.sha256);
await mkdir(output, { recursive: true });
const rows = [], errors = [];
try {
  for (const [mode, cpu] of [['forced',1],['media',1],['media',4],['forced',4],['forced',1],['media',1]]) {
    const index = rows.length + 1;
    const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      page.on('pageerror', error => errors.push({ index, message: String(error) }));
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      await page.addInitScript(({ mode }) => {
        const data = window.__audioCompare = { mode, frames: [], marks: [], constructors: [], media: [], last: 0, enabled: false };
        const Original = window.AudioContext;
        window.AudioContext = new Proxy(Original, { construct(target, args, newTarget) {
          const originalOptions = args[0];
          const options = { ...originalOptions };
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
      if (mode === 'media') await page.evaluate(() => {
        const owner = window.__depthReview.audio, toggle = owner.toggle.bind(owner);
        owner.toggle = async () => {
          const started = performance.now(), rate = 44100, frames = rate, bytes = new ArrayBuffer(44 + frames * 2), view = new DataView(bytes);
          const text = (offset, value) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
          text(0, 'RIFF'); view.setUint32(4, 36 + frames * 2, true); text(8, 'WAVEfmt '); view.setUint32(16, 16, true);
          view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
          view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, frames * 2, true);
          const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })), audio = new Audio(url);
          audio.volume = 1; audio.preload = 'auto';
          try {
            const play = performance.now(); await audio.play(); const playing = performance.now();
            while (audio.currentTime < .02 && performance.now() - play < 5000) await new Promise(r => setTimeout(r, 5));
            if (audio.currentTime < .02) throw Error('Silent media never advanced');
            const ready = performance.now();
            await toggle();
            window.__audioCompare.media.push({ started, play, playing, ready, ended: performance.now(), currentTime: audio.currentTime, paused: audio.paused });
          } finally { audio.pause(); audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url); }
        };
      });
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
      if (mode === 'media') assert.equal(data.media.length, 1);
      const row = { index, mode, cpu, media: data.media, max: Math.max(...samples), p95: samples[Math.floor(samples.length * .95)], constructors: data.constructors, marks: data.marks };
      rows.push(row); await writeFile(`${output}/${index}-${mode}-cpu${cpu}.json`, JSON.stringify(data, null, 2));
      console.log(JSON.stringify(row));
    } finally { await browser.close(); }
  }
  assert.deepEqual(errors, []);
} finally {
  assert.equal(createHash('sha256').update(await readFile(artifact)).digest('hex'), sha256);
  await writeFile(`${output}/summary.json`, JSON.stringify({ artifact, sha256, source: receipt, method: 'Six fresh Chromium processes at DPR1, native/CPU4. Real Sound click starts silent one-second PCM using HTMLAudioElement, awaits actual playback advance, then constructs the unchanged WebAudio graph. Entire enable wait remains inside raw RAF window. Controls use the same 44.1kHz graph without media priming. No screenshots/tracing; no claim of OS-cold restart or perceptual quality.', rows, errors }, null, 2));
}
