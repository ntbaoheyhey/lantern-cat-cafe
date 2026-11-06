import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';

declare global { interface Window { __TURN3D_MODELS__?: Record<string, string> } }
const sources = new Map<string, string>();
/** Optional assets registered only by the opt-in depth entry. */
export function registerModelSources(entries: Record<string, string>) {
  for (const [id, url] of Object.entries(entries)) sources.set(id, url);
}
const cache = new Map<string, Promise<GLTF>>();
/** Same GLBs in the app and offline document. No fetch is needed for file://. */
export function loadModel(role: string): Promise<GLTF> {
  const cached = cache.get(role); if (cached) return cached;
  const loader = new GLTFLoader();
  const embedded = window.__TURN3D_MODELS__?.[role];
  const result = embedded
    ? new Promise<GLTF>((resolve, reject) => {
      const bytes = Uint8Array.from(atob(embedded), c => c.charCodeAt(0));
      loader.parse(bytes.buffer, '', resolve, reject);
    })
    : loader.loadAsync(sources.get(role) ?? `${import.meta.env.BASE_URL}art/turn3d/${role}.glb`);
  cache.set(role, result);
  void result.catch(() => { cache.delete(role); });
  return result;
}
