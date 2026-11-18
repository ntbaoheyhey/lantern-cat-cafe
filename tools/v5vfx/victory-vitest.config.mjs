import {resolve} from 'node:path';
import {demandSource} from './victory-demand-source.mjs';
const target=resolve(import.meta.dirname,'../../apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx');
export default {
 root:resolve(import.meta.dirname,'../../apps/web'),envDir:false,
 esbuild:{jsx:'automatic'},
 plugins:process.env.CXV_VICTORY_TEST_PROTOTYPE==='1'?[{name:'cxv-victory-scheduling-prototype',enforce:'pre',transform(source,id){if(id.split('?')[0]===target)return demandSource(source);}}]:[],
 test:{environment:'jsdom',maxWorkers:2,include:['src/game/cardrpg/battle-v3/VictoryCrew*.test.tsx']},
};
