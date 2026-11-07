import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const directory = process.env.BIG_SHARP_OUT || 'reports/cardrpg-big2/stage/sharpness';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  await page.goto('file://' + resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3b/index.html'));
  await page.getByRole('button', { name: 'Watch a battle now' }).click();
  await page.waitForFunction(() => window.__depthScene?.ready || window.__depthReview?.sceneError);
  assert.equal(await page.evaluate(() => window.__depthReview.sceneError), '');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const cdp = await page.context().newCDPSession(page);
  for (const [width, height, dpr] of [[1280, 720, 1], [1280, 720, 2], [1440, 900, 2], [1024, 600, 1], [1280, 720, 3], [1280, 720, 1]]) {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false });
    await page.waitForFunction(({ width, dpr }) => {
      const scene = window.__depthScene;
      return innerWidth === width && scene.renderer.getPixelRatio() === Math.min(dpr, 2)
        && scene.renderer.domElement.width === Math.floor(scene.renderer.domElement.clientWidth * Math.min(dpr, 2));
    }, { width, dpr });
    const result = await page.evaluate(() => {
      const scene = window.__depthScene, canvas = scene.renderer.domElement;
      const textures = new Map();
      scene.scene.traverse(object => {
        for (const material of object.material ? Array.isArray(object.material) ? object.material : [object.material] : []) {
          for (const key of ['map', 'normalMap']) {
            const texture = material[key];
            if (texture?.name.startsWith('original_card_felt')) textures.set(texture.uuid, {
              name: texture.name, width: texture.image.width, height: texture.image.height,
              anisotropy: texture.anisotropy, mipmaps: texture.generateMipmaps,
            });
          }
        }
      });
      return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
        ratio: scene.renderer.getPixelRatio(), canvas: [canvas.width, canvas.height],
        post: [scene.post.sceneTarget.width, scene.post.sceneTarget.height],
        samples: scene.post.sceneTarget.samples, depthTexture: !!scene.post.sceneTarget.depthTexture,
        maxSamples: scene.renderer.capabilities.maxSamples, textures: [...textures.values()],
        faceMeshes: [...scene.puppets.values()].flatMap(puppet => puppet.face?.meshes ?? []).length,
        stats: { ...scene.stats } };
    });
    assert.deepEqual(result.post, result.canvas);
    assert.equal(result.samples, Math.min(4, result.maxSamples));
    assert.equal(result.depthTexture, true);
    assert.equal(result.faceMeshes, 9);
    assert.equal(result.textures.length, 2);
    for (const texture of result.textures) {
      assert.equal(texture.width, 1024);
      assert.equal(texture.height, 1024);
      assert.equal(texture.mipmaps, true);
      assert.ok(texture.anisotropy >= 8);
    }
    results.push(result);
    await page.screenshot({ path: `${directory}/${width}x${height}-dpr${dpr}.png` });
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(`${directory}/checks.json`, JSON.stringify({ results, errors, externalRequests: requests }, null, 2));
  console.log(JSON.stringify({ cases: results.length, errors, externalRequests: requests }));
} finally {
  await browser.close();
}
