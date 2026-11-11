/** Lane B art sub-switch: no renderer/assets and no default changes. */
import { isLookV2 } from './look-v2';
declare global { interface Window { __LOOK_ART__?: 'v2' | 'v3'; __LOOK_ART_PIPELINE__?: 'sculpt' | 'painted' | 'generated' | 'puppet' } }
export function isLookArtV3() { return isLookV2() && window.__LOOK_ART__ === 'v3'; }
export function artPipeline() { return isLookArtV3() ? window.__LOOK_ART_PIPELINE__ ?? 'puppet' : 'v2'; }
