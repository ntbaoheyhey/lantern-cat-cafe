// No browser, no timing claims. Sample the real GLB hierarchy and runtime clips.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { root, web, requireWeb } from '../visual-support.mjs';
import * as T from '../../apps/web/node_modules/three/build/three.module.js';
import { GLTFLoader } from '../../apps/web/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
const { createServer } = await import(requireWeb.resolve('vite'));
const server = await createServer({ configFile: false, root: web, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
const owners = (process.env.BIG_OWNERS || 'mochi,soot,clover,panko,mallow,sorrel').split(',');
const output = process.env.BIG_RIG_OUT || 'reports/cardrpg-big2/cats/batch1/rig';
const joints = ['motion', 'head', 'armL', 'armR', 'footL', 'footR', 'tail'];
const rows = [], hashes = {}, draftSources = {};
try {
  if (process.env.BIG_DRAFT_MOTION) {
    const { ROSTER_SKILL_CLIPS } = await server.ssrLoadModule('/src/game/squad/turn3d/card-roster-motion.ts');
    for (const path of process.env.BIG_DRAFT_MOTION.split(',')) {
      const definitions = await server.ssrLoadModule('/@fs' + path);
      for (const value of Object.values(definitions)) Object.assign(ROSTER_SKILL_CLIPS, value);
      draftSources[path] = createHash('sha256').update(await readFile(path)).digest('hex');
    }
  }
  const { createCardClips } = await server.ssrLoadModule('/src/game/squad/turn3d/card-motion.ts');
  for (const owner of owners) {
    const bytes = await readFile(`${root}/assets/cardrpg2/models/${owner}.glb`);
    hashes[owner] = createHash('sha256').update(bytes).digest('hex');
    const jsonSize = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString());
    // Keep node/accessor/mesh/animation bytes exactly. Drop materials only so the
    // headless transform probe never invokes DOM Image/TextureLoader.
    delete json.materials; delete json.textures; delete json.images;
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
    const body = bytes.subarray(20 + jsonSize), bodyJson = Buffer.from(JSON.stringify(json));
    const padded = Buffer.alloc(Math.ceil(bodyJson.length / 4) * 4, 32); bodyJson.copy(padded);
    const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
    header.writeUInt32LE(20 + padded.length + body.length, 8); header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
    const binary = Buffer.concat([header, padded, body]);
    const gltf = await new GLTFLoader().parseAsync(binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength), '');
    const model = gltf.scene;
    let role; model.traverse(node => { if (node.name.endsWith('_motion')) role = node.name.slice(0, -7); });
    const height = new T.Box3().setFromObject(model).max.y;
    const clips = (await createCardClips(model, role, owner)).filter(clip => /^[a-z]+-[1-4]$/.test(clip.name));
    for (const definition of clips) {
      const nodes = joints.map(name => ({ name, node: model.getObjectByName(`${role}_${name}`) }));
      if (nodes.some(({ node }) => !node)) throw Error(`Missing joints ${owner}`);
      const mixer = new T.AnimationMixer(model), inverse = model.getWorldQuaternion(new T.Quaternion()).invert();
      const transform = node => ({ position: model.worldToLocal(node.getWorldPosition(new T.Vector3())).toArray(),
        quaternion: node.getWorldQuaternion(new T.Quaternion()).premultiply(inverse).toArray() });
      model.updateWorldMatrix(true, true);
      const rest = Object.fromEntries(nodes.map(({ name, node }) => [name, transform(node)]));
      const clip = mixer.clipAction(definition).setLoop(T.LoopOnce, 1).setEffectiveWeight(1).play();
      clip.clampWhenFinished = true; clip.paused = true;
      const samples = [];
      for (let index = 0; index <= 40; index++) {
        clip.time = definition.duration * index / 40; mixer.update(0); model.updateWorldMatrix(true, true);
        const pose = {};
        for (const { name, node } of nodes) {
          const current = transform(node), before = rest[name];
          const quaternion = new T.Quaternion().fromArray(before.quaternion).invert().multiply(new T.Quaternion().fromArray(current.quaternion));
          pose[name] = { position: current.position.map((v, axis) => (v - before.position[axis]) / height), quaternion: quaternion.toArray() };
        }
        samples.push({ progress: index / 40, pose });
      }
      rows.push({ id: definition.name, owner, role, height, samples });
      mixer.stopAllAction(); mixer.uncacheRoot(model);
    }
  }
} finally { await server.close(); }
const pairs = [];
for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
  const a = rows[i], b = rows[j]; let angle = 0, position = 0, count = 0;
  for (let k = 0; k <= 40; k++) for (const joint of joints) {
    const x = a.samples[k].pose[joint], y = b.samples[k].pose[joint];
    angle += new T.Quaternion().fromArray(x.quaternion).angleTo(new T.Quaternion().fromArray(y.quaternion)) ** 2;
    position += x.position.reduce((sum, v, n) => sum + (v - y.position[n]) ** 2, 0); count++;
  }
  const angleRms = Math.sqrt(angle / count), positionRms = Math.sqrt(position / count);
  pairs.push({ left: a.id, right: b.id, required: a.owner === b.owner || a.id.at(-1) === b.id.at(-1),
    angleRms, positionRms, pass: angleRms >= .10 && positionRms >= .012 });
}
const offenders = pairs.filter(pair => pair.required && !pair.pass);
await mkdir(output, { recursive: true });
await writeFile(`${output}/trajectories.json`, JSON.stringify({ method: 'Real GLB rigid hierarchy; materials omitted only to remove DOM dependencies;41 runtime AnimationMixer samples. Not a rendering or timing proof.', hashes, draftSources, joints, rows, pairs, offenders }));
await writeFile(`${output}/summary.json`, JSON.stringify({ owners, draftSources, clips: rows.length, pairs: pairs.length,
  required: pairs.filter(p => p.required).length, minimumRequiredAngle: Math.min(...pairs.filter(p => p.required).map(p => p.angleRms)),
  minimumRequiredPosition: Math.min(...pairs.filter(p => p.required).map(p => p.positionRms)), offenders }, null, 2));
console.log(JSON.stringify({ clips: rows.length, required: pairs.filter(p => p.required).length, offenders }));
if (offenders.length) process.exitCode = 1;
