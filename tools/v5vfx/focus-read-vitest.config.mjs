import {resolve} from 'node:path';
export default {
 root:resolve(import.meta.dirname,'../../apps/web'),envDir:false,
 test:{environment:'jsdom',maxWorkers:2,include:[
  'src/game/cardrpg/battle-v3/banner-layout.test.ts',
  'src/game/cardrpg/battle-v3/world-label-layout.test.ts',
  'src/game/cardrpg/battle-v3/world-label-status.test.ts',
 ]},
};
