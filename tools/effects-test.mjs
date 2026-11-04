// U4 UI benchmark. Run after other browser gates are idle; no screenshot during timing.
// node tools/effects-test.mjs reports/ui/cards/MOTION/performance --port=5350 --dist=dist-v2/e2e-5361
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer as createNetServer } from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, 'apps/web');
const require = createRequire(resolve(web, 'package.json'));
const { chromium } = require('@playwright/test');
const { preview } = await import(pathToFileURL(require.resolve('vite')).href);
const args = process.argv.slice(2);
const output = resolve(root, args.find(arg => !arg.startsWith('--')) ?? 'reports/ui/cards/MOTION/performance');
const port = Number(args.find(arg => arg.startsWith('--port='))?.split('=')[1] ?? 5350);
const dist = args.find(arg => arg.startsWith('--dist='))?.split('=')[1] ?? 'dist-v2/e2e-5361';
assert.ok(port >= 5300 && port <= 5399 && Number.isInteger(port));
assert.match(dist, /^dist-v2\/e2e-53\d\d$/);
assert.ok(output.startsWith(resolve(root, 'reports/ui') + '/') || output.startsWith(resolve(root, 'screenshots/ui') + '/'));
const socket = createNetServer();
await new Promise((ok, fail) => { socket.once('error', fail); socket.listen(port, ok); });
await new Promise(ok => socket.close(ok));
mkdirSync(output, { recursive: true });
let server, browser;
const report = { method: 'requestAnimationFrame over 4 seconds during real HUD, level, loot, forge and confirmation sample cues; no screenshots in timing window; all layout shifts included', target: 'nominal60fps (rounded average >=60), p95 <=20ms, CLS exactly0', samples: [] };
try {
  server = await preview({ root: web, envDir: false, build: { outDir: dist }, preview: { port, strictPort: true } });
  browser = await chromium.launch();
  for (const width of [1280, 1600]) for (const reducedMotion of ['no-preference', 'reduce']) {
    const page = await browser.newPage({ viewport: { width, height: width === 1280 ? 720 : 900 }, reducedMotion });
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.method()); });
    await page.goto(`http://localhost:${port}/motion-fixture/e2e/fixtures/motion-view.html`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const sample = await page.evaluate(() => new Promise(resolve => {
      const intervals = [], shifts = [];
      const observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) shifts.push(entry.value); });
      observer.observe({ type: 'layout-shift' });
      const button = [...document.querySelectorAll('button')].find(node => node.textContent === 'Play sample cues');
      if (!button) throw new Error('Missing real motion trigger');
      let start, last, lastCue = -1000;
      function frame(now) {
        start ??= now;
        if (last !== undefined) intervals.push(now - last);
        last = now;
        if (now - start - lastCue >= 400) { button.click(); lastCue = now - start; }
        if (now - start < 4000) requestAnimationFrame(frame);
        else {
          for (const entry of observer.takeRecords()) shifts.push(entry.value);
          observer.disconnect(); resolve({ intervals, cls: shifts.reduce((sum, value) => sum + value, 0) });
        }
      }
      requestAnimationFrame(frame);
    }));
    const sorted = [...sample.intervals].sort((a, b) => a - b);
    const fps = 1000 / (sample.intervals.reduce((a, b) => a + b, 0) / sample.intervals.length);
    const p95Ms = sorted[Math.floor(sorted.length * .95)];
    const entry = { width, height: width === 1280 ? 720 : 900, reducedMotion, fps, p95Ms, cls: sample.cls, errors, writes, intervals: sample.intervals };
    report.samples.push(entry);
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(output, `motion-${width}-${reducedMotion}.png`) });
    await page.close();
    writeFileSync(resolve(output, 'fps.json'), JSON.stringify(report, null, 2) + '\n');
    assert.ok(Math.round(fps) >= 60, `Nominal60fps target failed: ${fps}`);
    assert.ok(p95Ms <= 20, `p95 frame budget exceeded: ${p95Ms}`);
    assert.equal(sample.cls, 0, 'Motion must introduce no layout shift');
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    console.log(JSON.stringify({ width, reducedMotion, fps, p95Ms, cls: sample.cls }));
  }
} finally {
  await browser?.close();
  if (server) await new Promise(ok => server.httpServer.close(ok));
}
