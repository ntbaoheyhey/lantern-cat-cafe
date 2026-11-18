import {resolve} from 'node:path';
import {battleContextSource,battleModule} from './battle-context-source.mjs';
const root=resolve(import.meta.dirname,'../..'),target=resolve(root,battleModule);
export default {
 root:resolve(root,'apps/web'),envDir:false,esbuild:{jsx:'automatic'},
 plugins:process.env.CXV_BATTLE_CONTEXT_TEST==='1'?[{name:'cxv-battle-context-candidate',enforce:'pre',transform(source,id){if(id.split('?')[0]===target)return battleContextSource(source);}}]:[],
 test:{environment:'jsdom',maxWorkers:2,include:['src/game/cardrpg/spine/scene-{context,density,loading,bounds}.test.ts','src/game/cardrpg/depth/playback-clock-a6.test.ts']},
};
