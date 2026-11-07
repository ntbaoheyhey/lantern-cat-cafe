// Original game only. Six stills per shared timing window, immutable artifact hash.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
const sourceArtifact = resolve(process.env.LOOK_ARTIFACT || 'docs/cardrpg3/index.html');
const snapshot = await mkdtemp('/tmp/cardrpg-look-capture-');
const artifact = resolve(snapshot, 'index.html');
await writeFile(artifact, await readFile(sourceArtifact));
const output = resolve(process.env.LOOK_OUT || 'reports/cardrpg-look/baseline');
const sampleTime = Number(process.env.LOOK_TIME || '3.5');
const dimensions = JSON.parse(process.env.LOOK_SIZES || '[[1280,720],[1440,900]]');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const receipt = { artifact: sourceArtifact, snapshot: artifact, sha256: hash(await readFile(artifact)), startedAt: new Date().toISOString(), dpr: 2, sampleTime,
  method: 'Paused gallery fixtures, progress .46; fixed time recorded in sampleTime. Units use the actual game model viewer at yaw-.12. No account mutation. Six captures per shared timing window. Crops derive from projected game meshes.', rows: [] };
await mkdir(output, { recursive: true });
if (process.env.LOOK_RESUME === '1') {
  const previous = JSON.parse(await readFile(`${output}/captures.json`, 'utf8'));
  assert.equal(previous.sha256, receipt.sha256);
  for (const row of previous.rows) assert.equal(hash(await readFile(`${output}/${row.file}`)), row.sha256);
  receipt.rows = previous.rows;
}
let actions;
await withTimingLock('LOOK capture inventory', async () => {
  const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
  try {
    const page = await browser.newPage(); await page.goto('file://' + artifact);
    await page.waitForFunction(() => window.__depthReview?.galleryActions, null, { timeout: 120000 });
    actions = await page.evaluate(() => window.__depthReview.galleryActions);
  } finally { await browser.close(); }
});
const owners = [...new Set(actions.map(a => a.owner))];
const requested = process.env.LOOK_OWNERS?.split(',');
let targets = [
  { name: 'hub', kind: 'hub' }, { name: 'studio', kind: 'studio' },
  ...owners.map(owner => ({ name: `unit-${owner}`, kind: 'unit', owner, id: actions.find(a => a.owner === owner).id })),
  ...[1,2,3].flatMap(chapter => ['close','wide','far'].map(camera => ({ name: `stage-${chapter}-${camera}`, kind: 'stage', chapter, camera, id: 'mochi-1' }))),
  ...actions.map(a => ({ name: `effect-${a.id.replaceAll(':','-')}`, kind: 'effect', owner: a.owner, id: a.id })),
];
if (requested) targets = targets.filter(t => requested.includes(t.owner) || requested.includes(t.kind));
if (process.env.LOOK_KINDS) targets = targets.filter(t => process.env.LOOK_KINDS.split(',').includes(t.kind));
const queue = dimensions.flatMap(([width,height]) => targets.map(target => ({ ...target, width, height,
  file: `${width}x${height}-${target.name}.png` }))).filter(t => !receipt.rows.some(r => r.file === t.file));
receipt.inventory = { owners, actions, targets: queue.length + receipt.rows.length };
await writeFile(`${output}/captures.json`, JSON.stringify(receipt, null, 2));
for (let start = 0; start < queue.length; start += 6) {
  await withTimingLock(`LOOK stills ${start+1}-${Math.min(queue.length,start+6)}/${queue.length}`, async () => {
    const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
    let page, size;
    try {
      for (const target of queue.slice(start,start+6)) {
        const key = `${target.width}x${target.height}`;
        if (key !== size || !page) {
          await page?.close(); size = key;
          page = await browser.newPage({ viewport: { width: target.width, height: target.height }, deviceScaleFactor: 2 });
          await page.goto('file://' + artifact);
          await page.waitForFunction(() => window.__depthReview?.galleryActions, null, { timeout: 120000 });
        }
        const errors = [];
        const onError = error => errors.push(String(error)); page.on('pageerror', onError);
        if (target.kind === 'hub') {
          await page.waitForFunction(() => window.__depthPreviewScene?.ready, null, { timeout: 120000 });
          await page.waitForTimeout(200);
        }
        if (target.kind !== 'hub') {
          if (!await page.evaluate(() => !!window.__b2Gallery)) {
            await page.getByRole('button', { name: 'Review studio', exact: true }).click();
            await page.waitForFunction(() => window.__b2Gallery && (window.__depthScene?.ready || window.__b2Gallery.sceneError), null, { timeout: 120000 });
            const sceneError = await page.evaluate(() => window.__b2Gallery.sceneError);
            if (sceneError) throw Error(sceneError);
          }
          if (target.id) {
            await page.evaluate(t => {
              const m = window.__b2Gallery; m.camera = t.camera || 'wide';
              m.state.settings.quality = 'high'; m.state.settings.reducedMotion = false;
              m.inspect(t.id, t.kind === 'effect' ? .46 : -1);
              if (t.chapter) { m.galleryBattle.chapter = t.chapter; m.notify(false); }
            }, target);
            await page.waitForFunction(() => {
              const m = window.__b2Gallery, s = window.__depthScene;
              return s.ready && m.battle.actors.every(a => s.puppets.get(a.id)?.asset === a.catalogId);
            });
          }
          await page.waitForTimeout(160);
        }
        const detail = target.kind === 'hub' ? {} : await page.evaluate(t => {
          const s = window.__depthScene, m = window.__b2Gallery;
          const view = { ...s.view(), fixedTime: t.sampleTime, paused: true };
          if (t.kind === 'unit') {
            const actor = view.actors.find(a => view.models[a.id] === t.owner);
            view.actors = [actor]; view.frame = null; view.currentId = null;
            view.model = { role: actor.role, clip: 'idle', angle: -.12 };
            view.modelProgress = .35; view.targetIds = []; view.legalIds = [];
          }
          s.render(view,0); s.dirty = false;
          const rect = s.renderer.domElement.getBoundingClientRect();
          const crops = [];
          for (const [id,p] of s.puppets) {
            if (!view.actors.some(a => a.id === id)) continue;
            let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
            p.model.updateMatrixWorld(true);
            p.model.traverse(o => {
              if (!o.isMesh || !o.visible) return;
              o.geometry.computeBoundingBox(); const b=o.geometry.boundingBox;
              for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
                const v=s.camera.position.clone().set(x,y,z).applyMatrix4(o.matrixWorld).project(s.camera);
                const px=rect.x+(v.x*.5+.5)*rect.width,py=rect.y+(.5-v.y*.5)*rect.height;
                x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);
              }
            });
            if(Number.isFinite(x0))crops.push({ id, asset:p.asset, box:[x0,y0,x1,y1] });
          }
          return { canvas: { x:rect.x,y:rect.y,width:rect.width,height:rect.height }, crops,
            stats:{...s.stats}, camera:{position:s.camera.position.toArray(),fov:s.camera.fov,target:s.cameraTarget.toArray()},
            plan:m.galleryId, progress:t.kind==='effect'?.46:0 };
        }, {...target, sampleTime});
        await page.screenshot({ path: `${output}/${target.file}`, animations: 'disabled' });
        page.off('pageerror',onError);
        const bytes = await readFile(`${output}/${target.file}`);
        const row = { ...target, ...detail, bytes:bytes.length, sha256:hash(bytes), errors };
        receipt.rows.push(row); await writeFile(`${output}/captures.json`, JSON.stringify(receipt,null,2));
        assert.deepEqual(errors,[]); console.log(JSON.stringify({ capture:target.file, bytes:bytes.length }));
      }
    } finally { await browser.close(); }
  });
}
receipt.endedAt = new Date().toISOString();
await writeFile(`${output}/captures.json`, JSON.stringify(receipt,null,2));
await rm(snapshot, { recursive: true });
