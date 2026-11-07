import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const baseline = process.argv.includes('--baseline');
const directory = process.env.BIG_LAYOUT_OUT || `reports/cardrpg-big2/${baseline ? 'baseline' : 'current'}/layout`;
const presets = baseline ? ['wide'] : JSON.parse(process.env.BIG_CAMERA_PRESETS || '["close","wide","far"]');
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3b/index.html');
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
    const actions = process.env.BIG_LAYOUT_ALL_ACTIONS
      ? await page.evaluate(() => window.__depthReview.galleryActions.map(action => action.id))
      : ['mochi-1', 'soot-3', 'clover-2', 'enemy:yarn-giant', 'enemy:rain-spool', 'enemy:pantry-crown',
        'enemy:button-guard', 'enemy:pollen-scout', 'enemy:crumb-sentinel'];
    for (const preset of presets) {
    await page.evaluate(preset => { window.__depthReview.camera = preset; window.__depthReview.notify(false); }, preset);
    for (let sample = 0; sample < actions.length * 5; sample++) {
      const id = actions[Math.floor(sample / 5)], progress = sample % 5 / 4;
      await page.evaluate(({ id, progress }) => {
        const model = window.__depthReview;
        model.inspect(id, progress);
        // A paused, isolated stress fixture checks the complete six-unit formation.
        // Account state and the live encounter never receive these extra actors.
        if (['enemy:button-guard', 'enemy:pollen-scout', 'enemy:crumb-sentinel'].includes(id)) {
          const battle = model.galleryBattle;
          const enemy = battle.actors.find(actor => actor.side === 'enemy');
          for (let defeated = 0; defeated < 2; defeated++) {
            const previous = structuredClone(enemy);
            previous.id = `${enemy.id}-defeated-${defeated}`;
            previous.hp = 0;
            battle.actors.push(previous);
          }
          for (let slot = 1; slot < 3; slot++) {
            const extra = structuredClone(enemy);
            extra.id = `${enemy.id}-layout-${slot}`;
            extra.row = slot === 1 ? 'rear' : 'front';
            battle.actors.push(extra);
            battle.queue.push(extra.id);
          }
          model.notify(false);
        }
      }, { id, progress });
      await page.waitForFunction(() => {
        const scene = window.__depthScene, model = window.__depthReview;
        return model.battle.actors.every(actor => scene.puppets.get(actor.id)?.asset === actor.catalogId);
      });
      const row = await page.evaluate(({ sample, id, progress, preset }) => {
        const scene = window.__depthScene, model = window.__depthReview;
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 1 });
        const enemyPositions = model.battle.actors.filter(actor => actor.side === 'enemy' && actor.hp > 0)
          .map(actor => scene.puppets.get(actor.id).base.toArray().join(','));
        if (new Set(enemyPositions).size !== enemyPositions.length) throw new Error('Living enemies share a formation slot after replacement');
        const stage = scene.renderer.domElement.getBoundingClientRect();
        const audit = scene.audit();
        const rectangle = element => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        };
        const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
          * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        const hud = [...document.querySelectorAll('.dp-battle-top,.dp-roundbar,.dp-party-card,.dp-enemy,.dp-decision,.dp-skill-banner,.dp-world-plate,.dp-ultimate-moment,.dp-feel-lab>button')]
          .filter(element => element.checkVisibility({ checkVisibilityCSS: true }))
          .map(element => ({ label: element.className, box: rectangle(element) }));
        const units = audit.units.map(unit => {
          const puppet = scene.puppets.get(unit.id);
          const head = puppet.head ?? puppet.model;
          const position = head.getWorldPosition(scene.camera.position.clone());
          const occluded = point => {
            const distance = scene.camera.position.distanceTo(point);
            scene.ray.camera = scene.camera;
            scene.ray.set(scene.camera.position, point.clone().sub(scene.camera.position).normalize());
            return scene.ray.intersectObjects(scene.stage.children.filter(child => child.visible), true)
              .some(hit => hit.object.isMesh && hit.object.material.opacity >= .8 && hit.distance < distance - .08);
          };
          const faceOccluded = occluded(position);
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
          return { ...unit, catalogId: model.battle.actors.find(actor => actor.id === unit.id).catalogId,
            angle, clip: puppet.clip, faceOccluded, horizontalMargin: Math.min(unit.box.x, stage.width - unit.box.x - unit.box.width) / stage.width, verticalMargin: Math.min(unit.box.y, stage.height - unit.box.y - unit.box.height) / stage.height, heightFraction: unit.box.height / stage.height, box: unitBox, faceBox,
            overlaps: hud.map(item => ({ label: item.label, bodyArea: overlap(unitBox, item.box), faceArea: overlap(faceBox, item.box) })).filter(item => item.bodyArea || item.faceArea) };
        });
        return { sample, id, progress, preset, width: innerWidth, height: innerHeight, stage: rectangle(scene.renderer.domElement), stageFraction: stage.height / innerHeight, hud, units, labels: scene.labelAudit, outside: audit.outside, unitIntersections: audit.overlaps, stats: { ...scene.stats } };
      }, { sample, id, progress, preset });
      rows.push(row);
      if (sample % 5 === 0 && !process.env.BIG_LAYOUT_ALL_ACTIONS) await page.screenshot({ path: `${directory}/${width}-${preset}-${id.replace(':', '-')}.png` });
    }
    }
    await page.close();
  }
} finally { await browser.close(); }
const summary = {
  sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method: 'Five fixed poses per action, viewport and camera preset, including three chapter bosses and isolated six-unit stress formations in all three chapters. Defeated actors precede replacement enemies to verify distinct living formation slots. Conservative visible mesh/gear bounds, head-subtree face bounds, camera-to-face-forward angle, actual DOM HUD rectangles. Overlap areas in CSS px squared. Additional formation actors are confined to paused gallery fixtures.',
  frames: rows.length,
  overlapFrames: rows.filter(row => row.units.some(unit => unit.overlaps.length)).length,
  maximumFacing: Math.max(...rows.flatMap(row => row.units.map(unit => unit.angle))),
  presets: presets.map(preset => {
    const samples = rows.filter(row => row.preset === preset);
    const units = samples.flatMap(row => row.units);
    const heroes = units.filter(unit => unit.side === 'party');
      const bosses = units.filter(unit => ['yarn-giant', 'rain-spool', 'pantry-crown'].includes(unit.catalogId));
    const angles = units.map(unit => unit.angle).sort((a, b) => a - b);
    return { preset, frames: samples.length, overlapFrames: samples.filter(row => row.units.some(unit => unit.overlaps.length)).length,
      outsideFrames: samples.filter(row => row.outside.length).length,
      faceOcclusions: units.filter(unit => unit.faceOccluded).length,
      missingPlates: samples.reduce((sum, row) => sum + row.labels.missing.length, 0),
      facing: { median: angles[Math.floor(angles.length * .5)], p95: angles[Math.floor(angles.length * .95)], max: angles.at(-1) },
      minHorizontalMargin: Math.min(...units.map(unit => unit.horizontalMargin)),
      minVerticalMargin: Math.min(...units.map(unit => unit.verticalMargin)),
      heroHeight: { min: Math.min(...heroes.map(unit => unit.heightFraction)), max: Math.max(...heroes.map(unit => unit.heightFraction)) },
      bossHeightMax: Math.max(...bosses.map(unit => unit.heightFraction)),
      peakCalls: Math.max(...samples.map(row => row.stats.calls)),
      peakTriangles: Math.max(...samples.map(row => row.stats.triangles)),
    };
  }),
  rows,
};
await writeFile(`${directory}/measurements.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ frames: summary.frames, overlapFrames: summary.overlapFrames, maximumFacing: summary.maximumFacing, presets: summary.presets }));
