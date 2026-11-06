import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const baseline = process.argv.includes('--baseline');
const directory = `reports/cardrpg-big/${baseline ? 'baseline' : 'current'}/layout`;
const artifact = resolve('docs/cardrpg3/index.html');
await mkdir(directory, { recursive: true });
const rows = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    await page.evaluate(() => window.__depthReview.inspect('mochi-1'));
    await page.waitForFunction(() => window.__depthScene?.ready);
    const actions = ['mochi-1', 'soot-3', 'clover-2', 'enemy:yarn-giant'];
    for (let sample = 0; sample < 20; sample++) {
      const id = actions[Math.floor(sample / 5)], progress = sample % 5 / 4;
      await page.evaluate(({ id, progress }) => window.__depthReview.inspect(id, progress), { id, progress });
      await page.waitForFunction(() => {
        const scene = window.__depthScene, model = window.__depthReview;
        return model.battle.actors.every(actor => scene.puppets.get(actor.id)?.asset === actor.catalogId);
      });
      const row = await page.evaluate(({ sample, id, progress }) => {
        const scene = window.__depthScene, model = window.__depthReview;
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 1 });
        const stage = scene.renderer.domElement.getBoundingClientRect();
        const audit = scene.audit();
        const rectangle = element => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        };
        const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
          * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        const hud = [...document.querySelectorAll('.dp-battle-top,.dp-roundbar,.dp-party-card,.dp-enemy,.dp-decision,.dp-skill-banner,.dp-world-plate')]
          .filter(element => element.checkVisibility({ checkVisibilityCSS: true }))
          .map(element => ({ label: element.className, box: rectangle(element) }));
        const units = audit.units.map(unit => {
          const puppet = scene.puppets.get(unit.id);
          const head = puppet.model.getObjectByName(puppet.role + '_head') ?? puppet.model;
          const position = head.getWorldPosition(scene.camera.position.clone());
          const direction = head.getWorldDirection(scene.camera.position.clone());
          const angle = direction.angleTo(scene.camera.position.clone().sub(position).normalize()) * 180 / Math.PI;
          const unitBox = { ...unit.box, x: unit.box.x + stage.x, y: unit.box.y + stage.y };
          const bounds = { x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity };
          head.traverseVisible(mesh => {
            if (!mesh.isMesh) return;
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            const box = mesh.geometry.boundingBox;
            const point = scene.camera.position.clone();
            for (let corner = 0; corner < 8; corner++) {
              point.set(corner & 1 ? box.max.x : box.min.x, corner & 2 ? box.max.y : box.min.y, corner & 4 ? box.max.z : box.min.z)
                .applyMatrix4(mesh.matrixWorld).project(scene.camera);
              const x = stage.x + (point.x * .5 + .5) * stage.width;
              const y = stage.y + (-point.y * .5 + .5) * stage.height;
              bounds.x = Math.min(bounds.x, x);
              bounds.y = Math.min(bounds.y, y);
              bounds.right = Math.max(bounds.right, x);
              bounds.bottom = Math.max(bounds.bottom, y);
            }
          });
          const faceBox = { x: bounds.x, y: bounds.y, width: bounds.right - bounds.x, height: bounds.bottom - bounds.y };
          return { ...unit, angle, clip: puppet.clip, heightFraction: unit.box.height / stage.height, box: unitBox, faceBox,
            overlaps: hud.map(item => ({ label: item.label, bodyArea: overlap(unitBox, item.box), faceArea: overlap(faceBox, item.box) })).filter(item => item.bodyArea || item.faceArea) };
        });
        return { sample, id, progress, width: innerWidth, height: innerHeight, stage: rectangle(scene.renderer.domElement), stageFraction: stage.height / innerHeight, hud, units, labels: scene.labelAudit, outside: audit.outside };
      }, { sample, id, progress });
      rows.push(row);
      if (sample % 5 === 0) await page.screenshot({ path: `${directory}/${width}-${id.replace(':', '-')}.png` });
    }
    await page.close();
  }
} finally { await browser.close(); }
const summary = {
  sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method: '20 fixed pose frames per viewport. Conservative visible mesh/gear bounds, head-subtree face bounds, camera-to-face-forward angle, actual DOM HUD rectangles. Overlap areas in CSS px squared. Gallery fixtures use identical baseline source geometry and presentation.',
  frames: rows.length,
  overlapFrames: rows.filter(row => row.units.some(unit => unit.overlaps.length)).length,
  maximumFacing: Math.max(...rows.flatMap(row => row.units.map(unit => unit.angle))),
  rows,
};
await writeFile(`${directory}/measurements.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ frames: summary.frames, overlapFrames: summary.overlapFrames, maximumFacing: summary.maximumFacing }));
