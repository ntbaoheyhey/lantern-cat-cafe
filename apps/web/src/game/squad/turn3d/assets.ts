import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { Role } from '@taskbar-hero/game-rules/src/squad/types';

declare global { interface Window { __TURN3D_MODELS__?: Record<string, string> } }
const cache = new Map<Role, Promise<GLTF>>();
/** Same GLBs in the app and offline document. No fetch is needed for file://. */
export function loadModel(role: Role): Promise<GLTF> {
  const cached = cache.get(role); if (cached) return cached;
  const loader = new GLTFLoader();
  const embedded = window.__TURN3D_MODELS__?.[role];
  const result = embedded
    ? new Promise<GLTF>((resolve, reject) => {
      const bytes = Uint8Array.from(atob(embedded), c => c.charCodeAt(0));
      loader.parse(bytes.buffer, '', resolve, reject);
    })
    : loader.loadAsync(`${import.meta.env.BASE_URL}art/turn3d/${role}.glb`);
  cache.set(role, result);
  void result.catch(() => { cache.delete(role); });
  return result;
}
