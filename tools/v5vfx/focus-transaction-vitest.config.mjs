import config from './focus-read-vitest.config.mjs';
import {root} from './build-hud-production.mjs';
import {transactionSources} from './focus-transaction-source.mjs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const sources=await transactionSources(root),modules=new Map(Object.entries(sources).map(([p,row])=>[resolve(root,p),row]));
export default {...config,plugins:[{name:'cxv-memory-transaction',enforce:'pre',transform(source,id){const row=modules.get(id.split('?')[0]);if(!row)return;assert.equal(source,row.baseline);return{code:row.candidate,map:null};}}],test:{...config.test,include:[...config.test.include,'src/game/cardrpg/battle-v3/focus.test.ts']}};
