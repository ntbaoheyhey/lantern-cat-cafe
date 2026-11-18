import {resolve} from 'node:path';
export default {
 root:resolve(import.meta.dirname,'../../apps/web'),envDir:false,
 test:{environment:'jsdom',maxWorkers:2,include:[
  'src/game/cardrpg/spine/scene-density.test.ts',
  'src/game/cardrpg/spine/scene-bounds.test.ts',
  'src/game/cardrpg/spine/scene-loading.test.ts',
 ]},
};
