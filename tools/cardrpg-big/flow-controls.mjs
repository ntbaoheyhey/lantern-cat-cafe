import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

const artifact = resolve('docs/cardrpg3/index.html');
const output = 'reports/cardrpg-big/flow/controls';
await mkdir(output, { recursive: true });
const rows = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const preference of ['saved', 'system']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: preference === 'system' ? 'reduce' : 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: 'Save & settings', exact: true }).click();
    const setting = page.getByRole('checkbox', { name: 'Reduced motion', exact: true });
    if (preference === 'saved') await setting.check();
    assert.equal(await setting.isChecked(), true);
    await page.getByRole('button', { name: 'Cafe', exact: true }).click();
    const animation = await page.locator('.dp-page').evaluate(element => getComputedStyle(element).animationName);
    assert.equal(animation, 'none');
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready);
    for (const preset of ['close', 'wide', 'far']) {
      await page.getByRole('combobox', { name: 'Camera preset', exact: true }).selectOption(preset);
      // Paused gallery fixtures isolate the director. They supply visual checks only.
      const sample = await page.evaluate(preset => {
        const model = window.__depthReview;
        const scene = window.__depthScene;
        model.inspect('soot-4', .5);
        const view = { ...scene.view(), camera: preset, fixedTime: 10 };
        scene.render({ ...view, frame: model.frame });
        const action = { position: scene.camera.position.toArray(), rotation: scene.camera.quaternion.toArray(), zoom: scene.camera.zoom, fov: scene.camera.fov };
        scene.render({ ...view, frame: null });
        const resting = { position: scene.camera.position.toArray(), rotation: scene.camera.quaternion.toArray(), zoom: scene.camera.zoom, fov: scene.camera.fov };
        return { preset, reduced: view.reducedMotion, action, resting };
      }, preset);
      assert.equal(sample.reduced, true);
      assert.deepEqual(sample.action, sample.resting);
      rows.push({ preference, animation, ...sample });
    }
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${output}/${preference}.png` });
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    method: 'Real preference and camera clicks. Six paused ultimate fixtures compare complete camera pose/projection against resting framing under saved and operating-system reduced motion. These captures make no frame-time claims.', rows }, null, 2));
}
console.log(JSON.stringify({ checks: rows.length }));
