// REFERENCE: turn3d/card-contact.ts, card-stage-life.ts, card-lighting.ts; depth/chapter-stage.ts.
// Pinned visual/geometry checks, not timing measurements. Requires shared timing lock.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const out = process.env.BIG_STAGE_LIFE_OUT || 'reports/cardrpg-big2/stage/life';
const variants = process.env.BIG_STAGE_LIFE_FINAL
  ? [{ name: 'current', artifact: process.env.BIG_ARTIFACT, improved: true }]
  : [{ name: 'before', artifact: '/tmp/cardrpg-big2-b2c-index.html', improved: false },
    { name: 'after', artifact: '/tmp/cardrpg-big2-b3-index.html', improved: true }];
await mkdir(out, { recursive: true });
const rows = [], errors = [], requests = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
async function open(artifact, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await page.goto('file://' + resolve(artifact));
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  return page;
}
async function sample(page, home) {
  return page.evaluate(home => {
    const scene = home ? window.__depthPreviewScene : window.__depthScene;
    const original = scene.view, view = original();
    scene.view = () => ({ ...view, frame: null, fixedTime: 1, paused: true });
    scene.render(scene.view(), 0);
    const contacts = [...scene.puppets].map(([id, p]) => ({ id, asset: p.asset,
      worldHeight: p.shadow.getWorldPosition(scene.camera.position.clone()).y,
      opacity: p.shadow.material.opacity, visible: p.shadow.visible && p.root.visible,
      scale: p.root.scale.toArray(), rootHeight: p.root.position.y }));
    const chapter = scene.stage.children.find(g => g.userData.chapter === view.chapter);
    const capture = (at, calm) => {
      scene.render({ ...view, frame: null, fixedTime: at, paused: true, reducedMotion: calm }, 0);
      const a = chapter.userData.ambient;
      return [...(chapter.userData.cardLife?.leaves.instanceMatrix.array ?? []),
        ...a.dust.position.toArray(), ...a.steam.flatMap(s => [...s.position.toArray(), s.rotation.y]),
        ...a.critters.flatMap(c => [c.body.position.y, ...c.wings.map(w => w.rotation.z)])];
    };
    const motion0 = capture(1, false), motion1 = capture(8, false);
    const calm0 = capture(1, true), calm1 = capture(8, true);
    const difference = (a, b) => Math.max(0, ...a.map((v, i) => Math.abs(v - b[i])));
    scene.render(scene.view(), 0);
    const light = name => scene.scene.getObjectByName(name)?.color.getHexString();
    return { chapter: view.chapter, contacts, rugEmbroideryTop: .0425,
      newMergedProps: chapter.children.filter(c => c.name.startsWith('original-chapter-')).length,
      driftingInstances: chapter.userData.cardLife?.leaves.count ?? 0,
      ambient: { values: motion0.length, movingMaxDifference: difference(motion0, motion1),
        calmMaxDifference: difference(calm0, calm1), motion0, motion1, calm0, calm1 },
      lighting: { key: light('cafe-key'), rim: light('cafe-rim'), fog: scene.scene.fog.color.getHexString(),
        exposure: scene.renderer.toneMappingExposure }, stats: { ...scene.stats },
      overflow: document.documentElement.scrollWidth > innerWidth };
  }, home);
}
try {
  for (const variant of variants) {
    const sha256 = createHash('sha256').update(await readFile(variant.artifact)).digest('hex');
    for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
      const page = await open(variant.artifact, width, height);
      await page.waitForFunction(() => window.__depthPreviewScene?.ready, null, { timeout: 120000 });
      const result = await sample(page, true);
      assert.equal(result.contacts.length, 3); assert.equal(result.overflow, false);
      if (variant.improved) for (const contact of result.contacts) {
        assert.ok(Math.abs(contact.worldHeight - .044) < 1e-6);
        assert.ok(contact.visible && contact.opacity > 0);
      }
      await page.screenshot({ path: `${out}/${variant.name}-${width}-home.png` });
      rows.push({ variant: variant.name, artifact: variant.artifact, sha256, home: true, width, height, ...result });
      await page.close();
    }
    for (const [chapter, id] of [[1, 'enemy:button-guard'], [2, 'enemy:pollen-scout'], [3, 'enemy:crumb-sentinel']]) {
      const page = await open(variant.artifact, 1280, 720);
      await page.evaluate(id => window.__depthReview.inspect(id, 0), id);
      await page.waitForFunction(() => window.__depthScene?.ready && window.__depthReview.battle.actors.every(a => window.__depthScene.puppets.get(a.id)?.asset === a.catalogId), null, { timeout: 120000 });
      const result = await sample(page, false);
      assert.equal(result.chapter, chapter); assert.equal(result.overflow, false);
      assert.ok(result.ambient.movingMaxDifference > .01); assert.equal(result.ambient.calmMaxDifference, 0);
      if (variant.improved) { assert.equal(result.newMergedProps, 3); assert.equal(result.driftingInstances, 12); }
      await page.screenshot({ path: `${out}/${variant.name}-chapter-${chapter}.png` });
      rows.push({ variant: variant.name, artifact: variant.artifact, sha256, home: false, width: 1280, height: 720, ...result });
      await page.close();
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
} finally {
  await browser.close();
  await writeFile(`${out}/checks.json`, JSON.stringify({ rows, errors, requests,
    method: 'Before=B2c, after=B3 or explicit final artifact. Home at three desktop sizes; chapter fixtures at 1280x720. Fixed-time idle render for screenshots. Actual shadow world heights, material opacity and mesh transforms; these do not alone establish perceptual shadow quality. Ambient arrays at 1s/8s with reduced motion off/on. No performance verdict from screenshots.' }, null, 2));
}
console.log(JSON.stringify({ stageLifeCases: rows.length, errors, requests }));
