import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { LoopOnce } from '../../apps/web/node_modules/three/build/three.module.js';

const output = process.env.BIG_MOTION_OUT || 'reports/cardrpg-big/motion';
const strips = process.env.BIG_FILMSTRIP_OUT || 'reports/cardrpg-big/filmstrips';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const temporary = await mkdtemp(resolve(tmpdir(), 'cardrpg-motion-'));
const owners = ['mochi', 'soot', 'clover', 'button-guard', 'sock-skipper', 'spool-ram',
  'needle-moth', 'teacup-healer', 'yarn-giant', 'binding-thread', 'practice-cushion'];
const joints = ['motion', 'head', 'armL', 'armR', 'footL', 'footR', 'tail'];
// Declared before measuring. Angular RMS is in radians. Position RMS is in model heights.
const thresholds = { angleRms: .10, positionRms: .012 };
await mkdir(output, { recursive: true });
await mkdir(strips, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const errors = [], rows = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('file://' + artifact);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  await page.getByRole('button', { name: /Tangled Cafe/ }).click();
  await page.locator('.dp-node:enabled').first().click();
  await page.getByRole('button', { name: 'Fight', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => window.__depthScene?.ready);
  const actions = await page.evaluate(owners => window.__depthReview.galleryActions
    .filter(action => owners.includes(action.owner)), owners);
  for (const action of actions) {
    await page.evaluate(id => window.__depthReview.inspect(id, 0), action.id);
    await page.waitForFunction(() => {
      const model = window.__depthReview, scene = window.__depthScene;
      return model.battle.actors.every(actor => scene.puppets.get(actor.id)?.asset === actor.catalogId);
    });
    const row = await page.evaluate(({ action, joints, loopOnce }) => {
      const scene = window.__depthScene, model = window.__depthReview;
      const puppet = scene.puppets.get(model.plan.actorId);
      const clip = puppet.actions.get(model.plan.skillId);
      if (!clip) throw new Error(`Missing authored clip ${action.id}`);
      puppet.mixer.stopAllAction();
      puppet.head?.quaternion.copy(puppet.headRest);
      puppet.model.updateWorldMatrix(true, true);
      const point = scene.camera.position.clone();
      const quaternion = puppet.model.quaternion.clone();
      const modelInverse = puppet.model.getWorldQuaternion(quaternion.clone()).invert();
      const nodes = joints.map(name => ({ name, node: puppet.model.getObjectByName(`${puppet.role}_${name}`) }));
      if (nodes.some(item => !item.node)) throw new Error(`Missing comparison joints on ${action.owner}`);
      const transform = node => ({
        position: puppet.model.worldToLocal(node.getWorldPosition(point)).toArray(),
        quaternion: node.getWorldQuaternion(quaternion).premultiply(modelInverse).toArray(),
      });
      const rest = Object.fromEntries(nodes.map(({ name, node }) => [name, transform(node)]));
      clip.reset().stopFading().setEffectiveWeight(1).setLoop(loopOnce, 1).play();
      clip.clampWhenFinished = true;
      clip.paused = true;
      const samples = [];
      for (let index = 0; index <= 40; index++) {
        clip.time = clip.getClip().duration * index / 40;
        puppet.mixer.update(0);
        if (clip.getEffectiveWeight() !== 1) throw new Error(`Inactive sample action ${action.id}`);
        puppet.model.updateWorldMatrix(true, true);
        const pose = {};
        for (const { name, node } of nodes) {
          const current = transform(node), before = rest[name];
          const rotation = quaternion.clone().fromArray(before.quaternion).invert()
            .multiply(quaternion.clone().fromArray(current.quaternion));
          pose[name] = {
            position: current.position.map((value, axis) => (value - before.position[axis]) / puppet.height),
            quaternion: rotation.toArray(),
          };
        }
        samples.push({ progress: index / 40, pose });
      }
      puppet.mixer.stopAllAction();
      puppet.clip = '';
      puppet.headPose.copy(puppet.headRest);
      return { action, height: puppet.height, clip: clip.getClip().name, duration: clip.getClip().duration,
        clipNames: [...puppet.actions.keys()], tracks: clip.getClip().tracks.map(track => track.name), rest, samples };
    }, { action, joints, loopOnce: LoopOnce });
    const slug = action.id.replaceAll(':', '-');
    const frames = [];
    row.frameChecks = [];
    for (let index = 0; index < 8; index++) {
      const stage = await page.evaluate(progress => {
        const scene = window.__depthScene, model = window.__depthReview;
        model.animationAt = model.plan.duration * progress;
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 10 });
        const caster = scene.puppets.get(model.plan.actorId);
        if (caster.clip !== model.plan.skillId) {
          throw new Error(`Caster clip ${caster.clip} replaces ${model.plan.skillId} at ${progress}`);
        }
        const heads = [...scene.puppets.values()].filter(puppet => puppet.head);
        const before = heads.map(puppet => puppet.head.quaternion.clone());
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 10 });
        const maxQuaternionLengthError = Math.max(...heads.map(puppet =>
          Math.abs(puppet.head.quaternion.length() - 1)));
        const maxHeadAngle = Math.max(...heads.map((puppet, index) =>
          before[index].normalize().angleTo(puppet.head.quaternion.clone().normalize()) * 180 / Math.PI));
        if (maxHeadAngle > .0001) throw new Error(`Repeated fixed pose drifts by ${maxHeadAngle} degrees`);
        const box = scene.renderer.domElement.getBoundingClientRect();
        const casterBounds = scene.audit().units.find(unit => unit.id === model.plan.actorId).box;
        return { clip: { x: box.x, y: box.y, width: box.width, height: box.height },
          check: { progress, sourceClip: caster.clip, clipTime: caster.actions.get(caster.clip).time,
            casterBounds, maxHeadAngle, maxQuaternionLengthError } };
      }, index / 7);
      const path = resolve(temporary, `${slug}-${index}.png`);
      await page.screenshot({ path, clip: stage.clip });
      const capturedTime = await page.evaluate(() => {
        const caster = window.__depthScene.puppets.get(window.__depthReview.plan.actorId);
        return caster.actions.get(caster.clip).time;
      });
      if (Math.abs(capturedTime - stage.check.clipTime) > .000001) {
        throw new Error(`Screenshot pose changed for ${action.id} at ${index / 7}`);
      }
      stage.check.capturedTime = capturedTime;
      frames.push(path);
      row.frameChecks.push(stage.check);
    }
    row.frames = frames;
    row.filmstrip = `${strips}/${slug}.webp`;
    rows.push(row);
    console.log(JSON.stringify({ action: action.id, clips: row.clipNames.length, frames: frames.length }));
  }
} finally {
  await browser.close();
}

function compare(left, right) {
  let angles = 0, positions = 0, count = 0;
  for (let index = 0; index < left.samples.length; index++) {
    for (const joint of joints) {
      const a = left.samples[index].pose[joint], b = right.samples[index].pose[joint];
      const dot = Math.abs(a.quaternion.reduce((sum, value, axis) => sum + value * b.quaternion[axis], 0))
        / (Math.hypot(...a.quaternion) * Math.hypot(...b.quaternion));
      angles += (2 * Math.acos(Math.min(1, dot))) ** 2;
      positions += a.position.reduce((sum, value, axis) => sum + (value - b.position[axis]) ** 2, 0);
      count++;
    }
  }
  return { angleRms: Math.sqrt(angles / count), positionRms: Math.sqrt(positions / count) };
}

const matrix = rows.map(left => rows.map(right => compare(left, right)));
const pairs = [];
for (let left = 0; left < rows.length; left++) {
  for (let right = left + 1; right < rows.length; right++) {
    const a = rows[left].action, b = rows[right].action;
    const required = !a.enemy && !b.enemy && (a.owner === b.owner || a.id.at(-1) === b.id.at(-1));
    const distance = matrix[left][right];
    pairs.push({ left: a.id, right: b.id, required, ...distance,
      pass: distance.angleRms >= thresholds.angleRms && distance.positionRms >= thresholds.positionRms });
  }
}
const manifest = resolve(temporary, 'frames.json');
await writeFile(manifest, JSON.stringify(rows.map(row => ({ name: row.action.name,
  frames: row.frames, bounds: row.frameChecks.map(frame => frame.casterBounds),
  output: resolve(row.filmstrip) }))));
execFileSync(process.env.BIG_PYTHON || '/tmp/cardrpg-big-tools/bin/python',
  [resolve('tools/cardrpg-big/motion-sheets.py'), manifest], { stdio: 'inherit' });
for (const row of rows) {
  delete row.frames;
  row.filmstripSha256 = createHash('sha256').update(await readFile(row.filmstrip)).digest('hex');
}
const receipt = { artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
  measuredAt: new Date().toISOString(), joints, thresholds, errors, rows, matrix, pairs,
  offenders: pairs.filter(pair => pair.required && !pair.pass),
  method: '41 normalized-time samples of actual AnimationMixer tracks on loaded GLB rigs. Joint world transforms are expressed relative to each model, then relative to its unanimated rest pose. Positions are divided by model height. Quaternion distance is geodesic angular RMS. Every same-cat pair and every same-slot pair across starter cats must pass both thresholds. Colour, silhouette and camera do not enter the metric. Filmstrips use the actual gallery render path at eight equally spaced action times.' };
await writeFile(`${output}/trajectories.json`, JSON.stringify(receipt));
await writeFile(`${output}/variety.json`, JSON.stringify({ ...receipt, rows: rows.map(({ samples, rest, ...row }) => row) }, null, 2));
const motionSources = ['card-motion.ts', 'card-motion-data.ts', 'card-enemy-motion.ts']
  .map(file => `apps/web/src/game/squad/turn3d/${file}`);
const sourceHashes = Object.fromEntries(await Promise.all(motionSources.map(async file =>
  [file, createHash('sha256').update(await readFile(file)).digest('hex')])));
await writeFile('assets/provenance/cardrpg-big-motion.json', JSON.stringify({
  tool: 'Runtime procedural keyframe authoring, createCardClips and tools/cardrpg-big/motion-measure.mjs',
  authorship: 'Original authored gestures on the existing original Taskbar Hero rigid-node rigs',
  sources: sourceHashes, sampledKeys: 41, interpolation: 'Smoothstep between authored pose keys, quaternion tracks',
  secondaryMotion: { lagFraction: .06, weights: { tailTip: .55, tailMid: .4, other: .24 } },
  fidgets: { minimumIntervalSeconds: 4, maximumIntervalSeconds: 8, durationSeconds: 1.5 },
  stopDistance: 1.2, assets: rows.map(row => ({ model: row.action.owner, clip: row.clip,
    duration: row.duration, tracks: row.tracks, filmstrip: row.filmstrip })),
}, null, 2));
await rm(temporary, { recursive: true, force: true });
console.log(JSON.stringify({ actions: rows.length, requiredPairs: pairs.filter(pair => pair.required).length,
  offenders: receipt.offenders, errors }));
if (errors.length || receipt.offenders.length) process.exitCode = 1;
