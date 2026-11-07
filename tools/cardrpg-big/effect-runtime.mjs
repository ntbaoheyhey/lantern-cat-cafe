import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const artifact = resolve('docs/cardrpg3/index.html');
const output = 'reports/cardrpg-big/effects/runtime';
const configurations = [
  { quality: 'high', backend: 'metal', calm: false },
  { quality: 'medium', backend: 'metal', calm: false },
  { quality: 'low', backend: 'metal', calm: true },
  { quality: 'low', backend: 'swiftshader', calm: false },
];
const rows = [];
await mkdir(output, { recursive: true });
for (const configuration of configurations) {
  const { quality, backend, calm } = configuration;
  const name = `${backend}-${quality}-${calm ? 'calm' : 'motion'}`;
  const browser = await chromium.launch({ channel: 'chromium',
    args: [`--use-angle=${backend}`, '--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: /Save & settings/ }).click();
    await page.getByLabel('Quality', { exact: false }).selectOption(quality);
    await page.getByLabel('Reduced motion', { exact: true }).setChecked(calm);
    await page.getByRole('button', { name: 'Cafe', exact: true }).click();
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 180000 });
    const before = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    await page.getByLabel('Preview action', { exact: false }).selectOption('mochi-4');
    await page.getByLabel('Preview speed', { exact: false }).selectOption('0.25');
    await page.getByRole('button', { name: 'Play preview', exact: true }).click();
    await page.waitForFunction(() => window.__depthReview.animationAt > 80);
    const playing = await page.evaluate(() => ({ time: window.__depthReview.animationAt,
      speed: window.__depthReview.gallerySpeed, plan: window.__depthReview.plan?.presentationId }));
    assert.equal(playing.speed, .25);
    assert.equal(playing.plan, 'mochi-4');
    await page.getByLabel('Effect only', { exact: true }).check();
    assert.equal(await page.locator('.dp-effect-only').count(), 1);
    await page.getByLabel('Effect only', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Return to battle', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), before);
    const samples = [];
    const ids = await page.evaluate(() => Object.keys(window.__depthScene.cardEffects.recipes));
    for (const id of ids) {
      await page.evaluate(id => window.__depthReview.inspect(id, .6), id);
      await page.waitForFunction(() => window.__depthReview.battle.actors.every(actor =>
        window.__depthScene.puppets.get(actor.id)?.asset === actor.catalogId));
      const sample = await page.evaluate(() => {
        const scene = window.__depthScene;
        const model = window.__depthReview;
        scene.post.setQuality(model.state.settings.quality);
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 10 });
        return { id: model.plan.presentationId, ...scene.stats, effects: { ...scene.cardEffects.stats },
          duration: model.plan.duration, camera: scene.camera.position.toArray(), zoom: scene.camera.zoom };
      });
      assert.equal(sample.id, id);
      assert.equal(sample.quality, quality);
      assert.ok(sample.effects.instances > 0, `${name}/${id} invisible`);
      assert.ok(sample.effects.instances <= 96);
      assert.ok(sample.effects.primitiveCalls <= 8);
      assert.ok(sample.calls <= 250);
      assert.ok(sample.triangles <= 150000);
      samples.push(sample);
      if (['mochi-4', 'soot-4', 'clover-4'].includes(id)) {
        await page.screenshot({ path: `${output}/${name}-${id}.png` });
      }
    }
    const automaticDegrade = await page.evaluate(() => {
      const post = window.__depthScene.post;
      post.setQuality('high');
      for (let index = 0; index < 360; index++) post.observe(30);
      const first = post.effectiveQuality;
      for (let index = 0; index < 180; index++) post.observe(30);
      const second = post.effectiveQuality;
      post.setQuality(window.__depthReview.state.settings.quality);
      return { inputMilliseconds: 30, samples: [360, 180], tiers: [first, second] };
    });
    assert.deepEqual(automaticDegrade.tiers, ['medium', 'low']);
    await page.evaluate(() => window.__depthReview.inspect('soot-4', .5));
    await page.getByRole('button', { name: 'Skip moment', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__depthReview.plan), null);
    await page.evaluate(() => window.__depthReview.closeGallery());
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), before);
    const renderer = await page.evaluate(() => {
      const gl = window.__depthScene.renderer.getContext();
      const extension = gl.getExtension('WEBGL_debug_renderer_info');
      return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    if (backend === 'swiftshader') assert.match(renderer, /swiftshader/i);
    assert.deepEqual(errors, []);
    rows.push({ ...configuration, renderer, passed: true, errors, samples, automaticDegrade });
    console.log(JSON.stringify({ name, effects: samples.length, renderer, passed: true }));
  } catch (error) {
    rows.push({ ...configuration, passed: false, errors, failure: String(error) });
    throw error;
  } finally {
    await browser.close();
    await writeFile(`${output}/checks.json`, JSON.stringify({
      artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
      method: 'Real clicks verify settings, gallery, quarter-speed preview, effect-only mode, return and ultimate skip. Paused fixtures inspect every composition at progress0.6 in each tier. Synthetic30ms observations exercise automatic degradation. SwiftShader verifies software rendering separately from Metal performance gates.',
      rows,
    }, null, 2));
  }
}
