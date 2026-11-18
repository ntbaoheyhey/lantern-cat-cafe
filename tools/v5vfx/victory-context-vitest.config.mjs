import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import base from './victory-vitest.config.mjs';
import {victoryContextSource} from './victory-context-source.mjs';
const target=resolve(import.meta.dirname,'../../apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx');
export default {...base,plugins:process.env.CXV_CONTEXT_TEST==='1'?[{name:'cxv-context-loss-prototype',enforce:'pre',transform(source,id){if(id.split('?')[0]===target)return process.env.CXV_CONTEXT_CANDIDATE?readFileSync(resolve(process.env.CXV_CONTEXT_CANDIDATE),'utf8'):victoryContextSource(source);}}]:[]};
