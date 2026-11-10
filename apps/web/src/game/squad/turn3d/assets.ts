import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { isLookV2 } from './look-v2';
import { lookModelSources } from './look-models';
import { artPipeline } from './look-art';
import { hasPaintedModel, loadPaintedModel } from './look-painted';
const artFiles = import.meta.glob('../../../../../../assets/cardrpg-look/v3-sculpt/*.glb', { eager:true, query:'?url', import:'default' }) as Record<string,string>;
const artSources = Object.fromEntries(Object.entries(artFiles).map(([path,url])=>[path.split('/').at(-1)!.replace(/\.glb$/,''),url]));
const generatedFiles = import.meta.glob('../../../../../../assets/cardrpg-look/v3-generated/*.glb', { eager:true, query:'?url', import:'default' }) as Record<string,string>;
const generatedSources = Object.fromEntries(Object.entries(generatedFiles).map(([path,url])=>[path.split('/').at(-1)!.replace(/\.glb$/,''),url]));
type ModelAsset = Pick<GLTF,'scene'|'animations'>;
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

declare global { interface Window { __TURN3D_MODELS__?: Record<string, string>; __LOOK_PACKED__?: boolean } }
const sources = new Map<string, string>();
/** Optional assets registered only by the opt-in depth entry. */
export function registerModelSources(entries: Record<string, string>) {
  for (const [id, url] of Object.entries(entries)) sources.set(id, url);
}
const cache = new Map<string, Promise<ModelAsset>>();
/** Same GLBs in the app and offline document. No fetch is needed for file://. */
export function loadModel(role: string): Promise<ModelAsset> {
  const look = isLookV2();
  const pipeline=artPipeline();
  const key = `${look ? 'atelier' : 'classic'}/${pipeline}/${role}`;
  const cached = cache.get(key); if (cached) return cached;
  const loader = new GLTFLoader();
  const packed = look || window.__LOOK_PACKED__;
  if (packed) loader.setMeshoptDecoder(MeshoptDecoder);
  const prepare = packed ? MeshoptDecoder.ready : Promise.resolve();
  const embedded = window.__TURN3D_MODELS__?.[role];
  const original = () => embedded
    ? new Promise<GLTF>((resolve, reject) => {
      const bytes = Uint8Array.from(atob(embedded), c => c.charCodeAt(0));
      loader.parse(bytes.buffer, '', resolve, reject);
    })
    : loader.loadAsync(sources.get(role) ?? `${import.meta.env.BASE_URL}art/turn3d/${role}.glb`);
  const result = prepare.then(async () => {
    if (!look) return original();
    if(pipeline==='painted' && hasPaintedModel(role)) return loadPaintedModel(role);
    const generated = pipeline === 'generated' && generatedSources[role];
    const url = generated || (pipeline==='sculpt' ? artSources[role] ?? lookModelSources[role] : lookModelSources[role]);
    if (!url) return original();
    const model = await loader.loadAsync(url);
    model.scene.userData.lookV2 = true;
    if (generated) {
      model.scene.userData.lookGenerated = true;
      model.scene.traverse(node => {
        if (node.userData.rigVersion) model.scene.userData.rigVersion = node.userData.rigVersion;
      });
      model.scene.userData.lookProps = true;
    }
    return model;
  });
  cache.set(key, result);
  void result.catch(() => { cache.delete(key); });
  return result;
}
