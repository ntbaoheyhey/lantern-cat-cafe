// Visual/function checks are intentionally separate from frame-time capture.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3b/index.html');
const output = 'reports/cardrpg-big2/performance/screens';
await mkdir(output, { recursive: true });
const rows = [], browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = []; page.on('pageerror', error => errors.push(String(error)));
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    await page.waitForFunction(() => window.__depthPreviewScene?.ready, null, { timeout: 120000 });
    await page.screenshot({ path: `${output}/${width}-home.png` });
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForFunction(() => {
      const progress = document.querySelector('progress[aria-label="Battle preparation"]');
      return progress?.value > 2 && progress.value < progress.max;
    });
    const loading = await page.locator('.dp-loading').textContent();
    await page.screenshot({ path: `${output}/${width}-loading.png` });
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await page.screenshot({ path: `${output}/${width}-battle.png` });
    const result = await page.evaluate(() => {
      const scene = window.__depthScene, canvas = scene.renderer.domElement;
      return { overflow: document.documentElement.scrollWidth - innerWidth,
        loading: scene.loading, stats: scene.stats, pixelRatio: scene.renderer.getPixelRatio(),
        canvas: [canvas.width, canvas.height], samples: scene.post.sceneTarget.samples,
        manualControls: [...document.querySelectorAll('button')].filter(button => /Play card|Pour energy|Defend/.test(button.textContent)).length };
    });
    rows.push({ width, height, errors, loading, ...result });
    assert.deepEqual(errors, []); assert.equal(result.overflow, 0); assert.equal(result.manualControls, 0);
    assert.equal(result.loading.completed, result.loading.total);
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    method: 'Separate screenshot checks. Real home and automatic fight entry, pause then progress/ready samples; no frame-time claims.', rows }, null, 2));
}
