import {resolve} from 'node:path';
export default {
 root:resolve(import.meta.dirname,'../../apps/web'),envDir:false,
 esbuild:{jsx:'automatic'},
 test:{environment:'jsdom',include:['src/game/cardrpg/battle-v3/VictoryCrew*.test.tsx','src/game/cardrpg/battle-v3/victory.test.ts']},
};
