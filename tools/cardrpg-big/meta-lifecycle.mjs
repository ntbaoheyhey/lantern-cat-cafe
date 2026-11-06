import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_LIFECYCLE_OUT || 'reports/cardrpg-big/meta/lifecycle';
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const cpu of [1, 4]) {
    for (let repetition = 0; repetition < 10; repetition++) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      const errors = [];
      page.on('pageerror', error => errors.push(error.stack ?? String(error)));
      await page.goto('file://' + artifact);
      await page.waitForFunction(() => window.__depthPreviewScene?.loading.label === 'Compiling lighting',
        null, { polling: 1, timeout: 60000 });
      await page.evaluate(() => {
        const scene = window.__depthPreviewScene;
        const record = { readyAtNavigation: scene.ready, phase: scene.loading.label,
          settled: false, disposed: 0, disposedEarly: false };
        const dispose = scene.renderer.dispose.bind(scene.renderer);
        scene.warming.then(() => { record.settled = true; });
        scene.renderer.dispose = () => {
          record.disposed++;
          record.disposedEarly ||= !record.settled;
          dispose();
        };
        window.__previewRetirement = { scene, record };
      });
      await page.getByRole('navigation', { name: 'Cafe screens' })
        .getByRole('button', { name: 'Team & cards', exact: true }).click();
      await page.waitForFunction(() => window.__previewRetirement.record.disposed === 1);
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => {
        const { scene, record } = window.__previewRetirement;
        return { ...record, canvasRemoved: !scene.renderer.domElement.isConnected,
          contextLost: scene.renderer.getContext().isContextLost() };
      });
      rows.push({ cpu, repetition, errors, ...result });
      await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
        sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
        method: 'Real navigation while preview lighting is preparing. Observe warmup settlement and renderer disposal without delaying either. Fresh page for each native/CPU4 case.',
        rows }, null, 2));
      assert.equal(errors.length, 0);
      assert.equal(result.readyAtNavigation, false);
      assert.equal(result.disposedEarly, false);
      assert.equal(result.canvasRemoved, true);
      assert.equal(result.contextLost, true);
      console.log(JSON.stringify({ cpu, repetition, errors }));
      await page.close();
    }
  }
} finally { await browser.close(); }
