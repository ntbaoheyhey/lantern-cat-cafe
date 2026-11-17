import {resolve} from 'node:path';
export default{root:resolve(import.meta.dirname,'../..'),envDir:false,test:{environment:'node',include:['apps/web/src/game/rig/drawing-layer-static.test.ts','apps/web/src/game/rig/cutout.test.ts','apps/web/src/game/rig/secondary-motion.test.ts','apps/web/src/game/rig/living-motion.test.ts','apps/web/src/game/rig/face-depth.test.ts']}};
