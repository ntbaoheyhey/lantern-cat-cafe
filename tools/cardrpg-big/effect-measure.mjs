import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_EFFECT_OUT || 'reports/cardrpg-big/effects';
const framesAt = [.14, .30, .46, .60, .76, .90];
const errors = [], rows = [];
await mkdir(`${output}/frames`, { recursive: true });
await mkdir(`${output}/sheets`, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('file://' + artifact);
  await page.getByRole('button', { name: /Tangled Cafe/ }).click();
  await page.locator('.dp-node:enabled').first().click();
  await page.getByRole('button', { name: 'Fight', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
  const ids = await page.evaluate(() => Object.keys(window.__depthScene.cardEffects.recipes));
  for (const id of ids) {
    await page.evaluate(id => window.__depthReview.inspect(id, 0), id);
    await page.waitForFunction(() => {
      const scene = window.__depthScene, model = window.__depthReview;
      return model.battle.actors.every(actor => scene.puppets.get(actor.id)?.asset === actor.catalogId);
    });
    const row = { id, frames: [], samples: [] };
    for (let index = 0; index < framesAt.length; index++) {
      const sample = await page.evaluate(({ id, progress }) => {
        const scene = window.__depthScene, model = window.__depthReview;
        model.animationAt = model.plan.duration * progress;
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 10 });
        const effects = scene.cardEffects, recipe = effects.recipes[id];
        const realStats = { ...scene.stats }, realEffects = { ...effects.stats };
        const masks = effects.protectedFaces.slice(0, effects.material.uniforms.protectedCount.value)
          .map(mask => mask.toArray());
        const audit = scene.audit();
        const width = scene.renderer.domElement.width, height = scene.renderer.domElement.height;
        const real = scene.renderer.domElement.toDataURL('image/png');
        const frame = model.frame;
        if (frame.plan.presentationId !== id) throw new Error(`Unexpected preview identity for ${id}`);
        effects.root.visible = false;
        scene.post.render(scene.scene, scene.camera, (frame?.shake ?? 0) * .35,
          frame?.progress ?? 0, frame?.color ?? '#ffe6d2', false);
        const without = scene.renderer.domElement.toDataURL('image/png');
        effects.root.visible = true;

        const parent = effects.root.parent;
        const preview = scene.scene.clone(false);
        preview.fog = null;
        preview.background = scene.scene.fog.color.clone().setRGB(0, 0, 0);
        preview.add(effects.root);
        effects.material.uniforms.overdraw.value = 1;
        scene.renderer.setRenderTarget(null);
        scene.renderer.render(preview, scene.camera);
        const overdrawImage = scene.renderer.domElement.toDataURL('image/png');
        const pixels = new Uint8Array(width * height * 4);
        const context = scene.renderer.getContext();
        context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
        let peakOverdraw = 0;
        for (let pixel = 0; pixel < pixels.length; pixel += 4) peakOverdraw = Math.max(peakOverdraw, pixels[pixel]);
        effects.material.uniforms.overdraw.value = 0;
        const camera = scene.camera.clone();
        camera.position.set(0, 4.6, 9);
        camera.lookAt(0, .35, 0);
        camera.fov = 34;
        camera.aspect = 1.5;
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        const canonical = { ...frame, plan: { ...frame.plan, actorId: 'probe-caster', targetIds: ['probe-target'], presentationCues: [] } };
        const actors = [{ id: 'probe-caster', side: 'party' },
          { id: 'probe-target', side: recipe.target === 'friendly' ? 'party' : 'enemy' }];
        const positions = new Map([
          ['probe-caster', camera.position.clone().set(-1.5, 0, 0)],
          ['probe-target', camera.position.clone().set(1.5, 0, 0)],
        ]);
        const ratio = scene.renderer.getPixelRatio();
        scene.renderer.setPixelRatio(1);
        scene.renderer.setSize(960, 640, false);
        effects.protect(0, 960, 640);
        effects.render(canonical, recipe, actors, positions, camera, 'high', false);
        scene.renderer.setRenderTarget(null);
        scene.renderer.render(preview, camera);
        const canonicalImage = scene.renderer.domElement.toDataURL('image/png');
        const canonicalStats = { ...effects.stats };
        parent.add(effects.root);
        scene.renderer.setPixelRatio(ratio);
        scene.renderer.setSize(width / ratio, height / ratio, false);
        scene.render({ ...scene.view(), frame, fixedTime: 10 });
        return { name: recipe.name, recipe, progress, masks, realStats, realEffects, canonicalStats,
          audit, plates: scene.labelAudit, width, height, peakOverdraw, overdrawImage, canonicalImage, real, without };
      }, { id, progress: framesAt[index] });
      const slug = id.replaceAll(':', '-');
      const paths = {};
      for (const name of ['canonicalImage', 'real', 'without', 'overdrawImage']) {
        const path = `${output}/frames/${slug}-${index}-${name}.png`;
        await writeFile(path, Buffer.from(sample[name].split(',')[1], 'base64'));
        paths[name] = path;
        delete sample[name];
      }
      row.name = sample.name;
      row.recipe = sample.recipe;
      delete sample.name;
      delete sample.recipe;
      row.frames.push(paths);
      row.samples.push(sample);
    }
    rows.push(row);
    console.log(JSON.stringify({ id, frames: row.frames.length,
      peakCalls: Math.max(...row.samples.map(sample => sample.realStats.calls)),
      peakTriangles: Math.max(...row.samples.map(sample => sample.realStats.triangles)) }));
  }
} finally {
  await browser.close();
}
const receipt = { artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  measuredAt: new Date().toISOString(), framesAt, errors, rows,
  method: 'Six fixed-time rendered frames per composition. Canonical camera and caster/target positions are identical for every recipe. RGB captures are normalized into grayscale silhouette and edge masks. Real-stage effect-on/effect-off captures separately measure bloom leakage into projected face regions.' };
await writeFile(`${output}/captures.json`, JSON.stringify(receipt, null, 2));
execFileSync(process.env.BIG_PYTHON || '/tmp/cardrpg-big-tools/bin/python',
  [resolve('tools/cardrpg-big/effect-report.py'), output], { stdio: 'inherit' });
if (errors.length) process.exitCode = 1;
