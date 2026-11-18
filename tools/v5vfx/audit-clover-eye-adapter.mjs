/** Exercise the actual adapter against the separately passing R5 authored head payload. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const integration = '/Users/bao/taskbar-hero-chain';
const app = resolve(integration, 'apps/web');
const req = createRequire(resolve(root, 'apps/web/package.json'));
const {createServer} = await import(req.resolve('vite'));
const T = req('three');
const sha = data => createHash('sha256').update(data).digest('hex');
const ref = async path => ({path, sha256: sha(await readFile(path))});
const payloadPath = resolve(root, 'reports/v5/CXV/M-clover-eye-delivery-R5.json');
const payloadBytes = await readFile(payloadPath);
assert.equal(sha(payloadBytes), 'c1b2669cb55a90e1c6bad63a92abac5b015419ab265f1a49f43a3b1fb36ce213');
const payload = JSON.parse(payloadBytes);
const sourceBytes = await readFile(payload.sourceReport.path);
assert.equal(sha(sourceBytes), payload.sourceReport.sha256);
const source = JSON.parse(sourceBytes), rawBytes = await readFile(source.raw.path);
assert.equal(sha(rawBytes), source.raw.sha256);
const raw = JSON.parse(rawBytes).centers;
const relativeSources = ['designer-idle-loader.ts', 'designer-idle-actor-loader.ts', 'living-cat-cast.ts', 'config.ts', 'designer-idle-registry.json'];
const sourceFiles = await Promise.all(relativeSources.map(p => ref(resolve(app, 'src/game/cardrpg/spine', p))));
assert.deepEqual(JSON.parse(await readFile(sourceFiles.at(-1).path)), {});
const out = resolve(root, 'work/v5/CXV/batch-m/clover-eye-adapter-R5-r2');
await mkdir(out, {recursive: true});
const server = await createServer({root: app, configFile: false, cacheDir: resolve(out, 'vite-cache'),
  server: {middlewareMode: true, watch: null, fs: {allow: [root, integration]}}, resolve: {dedupe: ['three']}, logLevel: 'error'});
const report = {utc: new Date().toISOString(), payload: await ref(payloadPath), sourceFiles,
  scope: 'Read-only actual CXI adapter arithmetic. Mock video clock/no decode, provisional other anchors, empty registry. No production scene/cast/loop/budget acceptance.',
  samples: 0, castSamples: 0, crossChannelIsolationSamples: 0, maxIdleWorldError: 0, maxCastMeshError: 0, pass: false};
let geometry;
try {
  const {DesignerIdleActorMedia} = await server.ssrLoadModule(resolve(app, 'src/game/cardrpg/spine/designer-idle-actor-loader.ts'));
  const {validateDesignerIdle, DESIGNER_SOCKET_CHANNELS} = await server.ssrLoadModule(resolve(app, 'src/game/cardrpg/spine/designer-idle-loader.ts'));
  const {SPINE_CONFIG} = await server.ssrLoadModule(resolve(app, 'src/game/cardrpg/spine/config.ts'));
  assert(DESIGNER_SOCKET_CHANNELS.includes('head'));
  const manifest = {version: 1, id: 'clover', format: 'h264-rgb-mask', width: 318, height: 390, opaqueHeight: 384,
    video: '/units/clover/designer-idle-ab.mp4', poster: '/units/clover/designer-idle-cd.webp', duration: 10, fps: 30, frames: 300,
    sourceSha256: payload.sourceVideo.sha256, videoSha256: 'b'.repeat(64), posterSha256: 'c'.repeat(64), videoBytes: 1000,
    foot: payload.foot.xy, faceROI: [135, 60, 90, 90],
    sockets: {root: payload.foot.xy, hip: [160, 230], head: [180, 100], 'hp-anchor': [180, -35], 'main-hand': [250, 170], 'off-hand': [150, 180], 'vfx-origin': [245, 170], ...payload.partialManifest.sockets},
    socketTracks: {...payload.partialManifest.socketTracks, prop: Array.from({length: 300}, () => [0, 0]), lantern: Array.from({length: 300}, () => [0, 0])},
    socketChannels: {'main-hand': 'prop', ...payload.partialManifest.socketChannels}};
  validateDesignerIdle(manifest, 'clover');
  geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  const media = {manifest, geometry, basePositions: new Float32Array(6), video: {currentTime: 0}, sample() {}, failure: undefined};
  const actor = {unit: {id: 'clover'}, sockets: new Map(Object.keys(SPINE_CONFIG.sockets).map(k => [k, new T.Object3D()]))};
  const adapter = new DesignerIdleActorMedia(media), clock = {worldTime: 15, paused: true, fixedTime: true, frozen: false};
  const expected = time => {
    const frame = ((time % 10) + 10) % 10 * 30, i = Math.floor(frame), t = frame-i;
    const a = raw[i], b = raw[(i+1)%300], point = a.map((x,j) => x*(1-t)+b[j]*t);
    const delivery = [(point[0]+.5)*421/526*318/409-.5, ((point[1]+.5)*512/640-2)*390/500-.5];
    return [(delivery[0]-manifest.foot[0])*4/3, (manifest.foot[1]-delivery[1])*4/3];
  };
  for (let frame=0; frame<300; frame++) for (const part of [0, .07, .2, .39, .61, .83, .99]) {
    media.video.currentTime = (frame+part)/30;
    adapter.sample(actor, 'idle', 0, 10, false, clock);
    const point = actor.sockets.get('head').position, want = expected(media.video.currentTime);
    const error = Math.max(Math.abs(point.x-want[0]), Math.abs(point.y-want[1]));
    assert(error < 2e-6); report.maxIdleWorldError = Math.max(report.maxIdleWorldError, error); report.samples++;
    assert.deepEqual(actor.sockets.get('feet').position.toArray(), [0, 0, 1]);
    if (part === .39) {
      const before = point.toArray();
      manifest.socketTracks.prop[frame] = [91, -83]; manifest.socketTracks.lantern[frame] = [-97, 89];
      adapter.sample(actor, 'idle', 0, 10, false, clock); assert.deepEqual(point.toArray(), before);
      manifest.socketTracks.prop[frame] = [0, 0]; manifest.socketTracks.lantern[frame] = [0, 0]; report.crossChannelIsolationSamples++;
      media.basePositions.set([0, 0, 0, point.x, point.y, 0]);
      for (const name of ['skill', 'ult']) for (const phase of [.14, .25, .31, .55, .84, 1]) {
        adapter.sample(actor, name, phase, 1, false, clock);
        const p = geometry.attributes.position, error = Math.max(Math.abs(point.x-p.getX(1)), Math.abs(point.y-p.getY(1)));
        assert(error < 5e-5); report.maxCastMeshError = Math.max(report.maxCastMeshError, error); report.castSamples++;
        assert.deepEqual(actor.sockets.get('feet').position.toArray(), [0, 0, 1]);
      }
    }
  }
  report.wrapAndFallback = [];
  for (const [time, reduced, failure] of [[10,false,undefined],[20,false,undefined],[-.01,false,undefined],[6.7,true,undefined],[7.4,false,'decode']]) {
    media.video.currentTime=time; media.failure=failure; adapter.sample(actor, 'idle', 0, 10, reduced, clock);
    const want=expected(reduced||failure?0:time), actual=actor.sockets.get('head').position;
    const error=Math.max(Math.abs(actual.x-want[0]),Math.abs(actual.y-want[1])); assert(error<2e-6);
    report.wrapAndFallback.push({time,reduced,failure:failure??null,error});
  }
  for (const file of sourceFiles) assert.equal(sha(await readFile(file.path)),file.sha256,'Concurrent source change invalidates run');
  report.pass = true;
} finally {
  geometry?.dispose(); await server.close();
  report.harness = await ref(import.meta.filename);
  await writeFile(resolve(root, 'reports/v5/CXV/M-clover-eye-adapter-R5-r2.json'), JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({pass:report.pass,samples:report.samples,castSamples:report.castSamples,crossChannelIsolationSamples:report.crossChannelIsolationSamples,maxIdleWorldError:report.maxIdleWorldError,maxCastMeshError:report.maxCastMeshError}));
