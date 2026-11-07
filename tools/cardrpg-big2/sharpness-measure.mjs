// REFERENCE: tools/cardrpg-big/inspect.mjs. M moved home art into a 3D preview; card assets are measured in Team.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const baseline = false;
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3b/index.html');
const errors = [], requests = [];
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
const output = process.env.BIG_CROP_OUT || `reports/cardrpg-big/${baseline ? 'baseline' : 'current'}/sharpness`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [];
try {
  for (const dpr of [1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: dpr });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    const crops = [];
    async function crop(label, rectangle) {
      const clip = { x: Math.max(0, rectangle.x), y: Math.max(0, rectangle.y), width: Math.min(rectangle.width, 1280 - rectangle.x), height: Math.min(rectangle.height, 720 - rectangle.y) };
      const path = `${output}/dpr${dpr}-${label}.png`;
      await page.screenshot({ path, clip }); crops.push({ label, path, clip });
    }
    await crop('hud-text', await page.locator('.cr-topbar > span').first().boundingBox());
    await page.getByRole('button', { name: 'Team & cards', exact: true }).click();
    const portrait = page.locator('.dp-formation-card .cr-portrait img').first();
    await portrait.waitFor();
    await portrait.evaluate(image => image.decode());
    await portrait.scrollIntoViewIfNeeded();
    await crop('portrait', await portrait.boundingBox());
    const cardImages = await page.locator('.dp-formation-card .cr-portrait img').evaluateAll(images => images.map(image => ({
      naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      displayWidth: image.getBoundingClientRect().width, displayHeight: image.getBoundingClientRect().height,
    })));
    await page.evaluate(() => window.__depthReview.go('hub'));
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    if (baseline) {
      await page.getByRole('button', { name: /Tangled Cafe/ }).click();
      await page.locator('.dp-node:enabled').first().click();
    } else await page.getByRole('button', { name: 'Watch a battle now' }).click();
    await page.waitForFunction(() => window.__depthScene?.ready && window.__depthScene.stats.calls > 0, null, { timeout: 120000 });
    const diagnostics = await page.evaluate(() => {
      const m = window.__depthReview, scene = window.__depthScene;
      m.paused = true; m.notify(false);
      scene.render({ ...scene.view(), frame: null, fixedTime: 1 });
      const canvas = scene.renderer.domElement.getBoundingClientRect(), audit = scene.audit();
      const faces = [...scene.puppets].map(([id, p]) => {
        const head = p.model.getObjectByName(p.role + '_head') ?? p.model;
        const position = head.getWorldPosition(scene.camera.position.clone());
        const direction = head.getWorldDirection(scene.camera.position.clone());
        const angle = direction.angleTo(scene.camera.position.clone().sub(position).normalize()) * 180 / Math.PI;
        const point = position.clone().project(scene.camera);
        return { id, angle, x: canvas.x + (point.x * .5 + .5) * canvas.width, y: canvas.y + (-point.y * .5 + .5) * canvas.height };
      });
      const textures = new Map();
      scene.scene.traverse(object => {
        for (const material of object.material ? Array.isArray(object.material) ? object.material : [object.material] : []) {
          for (const key of ['map', 'normalMap', 'roughnessMap']) {
            const texture = material[key];
            if (texture) textures.set(texture.uuid, { name: texture.name, width: texture.image?.width, height: texture.image?.height, anisotropy: texture.anisotropy, mipmaps: texture.generateMipmaps });
          }
        }
      });
      return { faces, audit, stageFraction: canvas.height / innerHeight, stage: { x: canvas.x, y: canvas.y, width: canvas.width, height: canvas.height }, textures: [...textures.values()], post: { samples: scene.post.sceneTarget.samples, width: scene.post.sceneTarget.width, height: scene.post.sceneTarget.height }, pixelRatio: scene.renderer.getPixelRatio(), labels: scene.labelAudit };
    });
    await page.screenshot({ path: `${output}/dpr${dpr}-fixed.png` });
    for (const [label, face] of [['hero-face', diagnostics.faces.find(f => f.id === 'mochi')], ['enemy', diagnostics.faces.find(f => !['mochi', 'soot', 'clover'].includes(f.id))]]) {
      await crop(label, { x: face.x - 32, y: face.y - 32, width: 64, height: 64 });
    }
    if (!baseline) {
      await page.getByRole('button', { name: 'Leave table' }).click();
      await page.getByRole('button', { name: 'Team & cards', exact: true }).click();
    }
    const icon = page.locator(baseline ? '.dp-skill img' : '.dp-skill-summary img').first();
    await icon.waitFor();
    await icon.evaluate(image => image.decode());
    await icon.scrollIntoViewIfNeeded();
    await crop('skill-icon', await icon.boundingBox());
    const displayedImages = await page.locator('img').evaluateAll(images => images.filter(image => image.getBoundingClientRect().width > 0)
      .map(image => ({ src: image.currentSrc.startsWith('data:') ? 'embedded' : image.currentSrc,
        naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
        displayWidth: image.getBoundingClientRect().width, displayHeight: image.getBoundingClientRect().height })));
    diagnostics.displayedImages = displayedImages;
    diagnostics.cardImages = cardImages;
    diagnostics.compositionChanges = ['Portrait: real team-card image replaces removed home image; its display size/layout differ from F0.', 'Skill icon: same skill asset in the automatic-kit summary replaces F0 manual controls.'];
    rows.push({ dpr, crops, ...diagnostics });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/diagnostics.json`, JSON.stringify({ artifact, sha256, errors, requests, method: 'Fixed idle time 1s, 1280x720, native DPR crops, face center projected from original model head node. Scene paused for repeatable capture. Portrait measured on Team at actual CSS size, not a temporary loading placeholder. F0 home portrait composition differs; no perceptual-equivalence claim.', rows }, null, 2));
assert.deepEqual(errors, []); assert.deepEqual(requests, []);
console.log(JSON.stringify(rows.map(r => ({ dpr: r.dpr, stageFraction: r.stageFraction, faces: r.faces.map(f => ({ id: f.id, angle: f.angle })) }))));
