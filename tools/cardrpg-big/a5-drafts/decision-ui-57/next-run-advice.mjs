// REFERENCE: A5 retained-route UI failure. Public settlement returns to the OFF next-run preference; no battle samples.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {loadRules} from '../../a4-load.mjs';
const root='reports/cardrpg-big/a5/c1-decisions';
const loader=await loadRules();
try {
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const s=R.importSave((await readFile(root+'/off-retained.save','utf8')).trim(),0),before=JSON.stringify(s);
 assert.equal(s.gameplayV4,false);assert.equal(R.gameplayV4(s),true);
 const settled=R.resultAdviceStateV4(s);assert(settled.ok,settled.error);
 assert.equal(R.gameplayV4(settled.state),false);assert.equal(settled.state.run.complete,true);
 assert.equal(R.recommendBuildV4(settled.state,s.run.battle.initial),null);
 assert.equal(JSON.stringify(s),before);
 await writeFile(root+'/off-preference-settled.json',JSON.stringify(settled.state,null,2)+'\n');
 console.log(JSON.stringify({passed:true,activeMode:true,nextPreference:false,settledMode:false,advice:null,reason:'The next route is OFF; the available primary action is team preparation, with exact public settlement.',newBattleSamples:0}));
}finally{await loader.vite.close();}
