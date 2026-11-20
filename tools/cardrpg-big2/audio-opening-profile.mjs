// REFERENCE: audio/checks.json. Preserve the original unprofiled hitch separately.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const artifact = '/tmp/cardrpg-big2-b4-index.html';
const output = 'reports/cardrpg-big2/audio/opening-profile';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [], errors = [];
try {
  for (const cpu of [1, 4]) {
    const name = `1280x720-dpr1-cpu${cpu}`, directory = `${output}/${name}`;
    await mkdir(directory, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', error => errors.push(String(error)));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8,blink.user_timing,gpu,cc,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler', transferMode: 'ReturnAsStream' });
    await page.addInitScript(() => {
      const data = window.__audioOpening = { frames: [], marks: [], constructors: [], last: 0, enabled: false };
      const OriginalContext = window.AudioContext;
      window.AudioContext = new Proxy(OriginalContext, { construct(target, args, newTarget) {
        const at = performance.now(); performance.mark('audio-context-start');
        const result = Reflect.construct(target, args, newTarget);
        data.constructors.push({ at, ms: performance.now() - at }); performance.mark('audio-context-end');
        return result;
      } });
      requestAnimationFrame(function sample(at) {
        if (data.enabled && data.last) data.frames.push({ at, ms: at - data.last });
        data.last = at; requestAnimationFrame(sample);
      });
    });
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.screenshot({ path: `${directory}/before-sound.png` });
    const mark = label => page.evaluate(label => {
      const d = window.__audioOpening; d.marks.push({ label, at: performance.now() }); performance.mark(label);
    }, label);
    await page.evaluate(() => { window.__audioOpening.enabled = true; window.__audioOpening.last = 0; });
    await mark('sound-click-start');
    await page.getByRole('button', { name: 'Sound off', exact: true }).click();
    await page.getByRole('button', { name: 'Sound on', exact: true }).waitFor();
    await mark('sound-enabled');
    const volume = page.getByRole('slider', { name: 'Sound volume', exact: true });
    await volume.focus(); await volume.press('Home');
    for (let i = 0; i < 7; i++) await volume.press('ArrowRight');
    await mark('volume-set');
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByLabel('Playback speed', { exact: true }).selectOption('4');
    await mark('playback-start');
    await page.waitForFunction(() => window.__depthReview.screen === 'result', null, { timeout: 120000 });
    await mark('playback-complete');
    const measurement = await page.evaluate(() => {
      const d = window.__audioOpening; d.enabled = false;
      return { ...d, sound: window.__depthReview.audio.enabled, volume: window.__depthReview.audio.volume };
    });
    assert.equal(measurement.sound, true); assert.equal(measurement.volume, .35);
    const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
    await cdp.send('Tracing.end'); const { stream } = await completed;
    let trace = '';
    for (;;) { const chunk = await cdp.send('IO.read', { handle: stream }); trace += chunk.data; if (chunk.eof) break; }
    await cdp.send('IO.close', { handle: stream });
    await writeFile(`${directory}/${name}-trace.json.gz`, gzipSync(trace));
    await writeFile(`${directory}/${name}.json`, JSON.stringify(measurement, null, 2));
    await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.screenshot({ path: `${directory}/after-sound.png` });
    await page.close();
    await new Promise((done, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/trace-report.mjs', directory, name], { stdio: 'inherit' });
      child.once('error', reject); child.once('close', code => code === 0 ? done() : reject(Error(`Trace report exited ${code}`)));
    });
    const row = { cpu, directory, max: Math.max(...measurement.frames.map(f => f.ms)), marks: measurement.marks, constructors: measurement.constructors };
    rows.push(row); console.log(JSON.stringify(row));
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await writeFile(`${output}/summary.json`, JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), original: '../checks.json', method: 'Focused traced reruns with real sound/volume/resume clicks and constructor marks. Screenshots excluded from the sampled window. Tracing and constructor instrumentation can perturb timing; these do not replace the original 133.5ms observation.', rows, errors }, null, 2));
}
