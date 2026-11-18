import {resolve} from 'node:path';
import base from './victory-vitest.config.mjs';
import {victoryDensitySource} from './victory-density-source.mjs';
const target=resolve(import.meta.dirname,'../../apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx');
export default {...base,plugins:process.env.CXV_VICTORY_DENSITY_TEST==='1'?[{name:'cxv-victory-density-prototype',enforce:'pre',transform(source,id){if(id.split('?')[0]===target)return victoryDensitySource(source);}}]:[]};
