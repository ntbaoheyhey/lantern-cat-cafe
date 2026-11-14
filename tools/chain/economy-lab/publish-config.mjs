import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {hashConfig,canonical,targetDistances} from './search-core.mjs';
import {T} from '../../../scripts/v3b2/thresholds.mjs';
import {verifiedConfig} from './evidence.mjs';

// Publish only an independently confirmed candidate, preserving every function.
// A dry run prints the exact changed policy paths; --write performs the edit.
const args=process.argv.slice(2),arg=k=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:undefined;
const confirmationPath=resolve(root,arg('confirmation'));
const confirmation=JSON.parse(readFileSync(confirmationPath));
const selected=confirmation.confirmed.find(row=>row.configHash===arg('hash'));
assert(selected,'Select a saved independently confirmed candidate');
verifiedConfig(selected);assert(selected.seeds>=200,'At least 200 confirmation seeds required');
assert(selected.scenarioScores.every(row=>Object.values(targetDistances(row.quantiles.median,row)).every(n=>n===0)
 &&(row.demand!==.5||row.quantiles.p90.burnClaims>=T.robustBurnMin)
 &&row.quantiles.p90.starRatio>=T.robustStarMin&&row.quantiles.p90.starRatio<=T.robustStarMax),
 'All median and tail confirmation gates must pass before publication');
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/prepublication'));
const live=runtime.ECONOMY_LAB,chosen=selected.config;
for(const key of Object.keys(live))if(!['policy','sinks'].includes(key))assert.deepEqual(canonical(chosen[key]),canonical(live[key]),'Unexpected non-policy difference: '+key);
const changes=[];
function diff(a,b,path=''){
 if(a&&b&&typeof a==='object'&&typeof b==='object')for(const key of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[key],b[key],path?path+'.'+key:key);
 else if(a!==b)changes.push({path,before:a,after:b});
}
diff(live,chosen);
const edits=[['policy','ECONOMY_V3','packages/game-rules/src/cardrpg/economy-v3.ts'],['sinks','ECONOMY_SINKS','packages/game-rules/src/cardrpg/economy-sinks-v3.ts']].map(([key,symbol,path])=>{
 const absolute=resolve(root,path),before=readFileSync(absolute,'utf8'),start=before.indexOf('export const '+symbol),end=before.indexOf('} as const;',start);
 assert(start>=0&&end>start,'Expected literal policy declaration: '+symbol);
 const literal='export const '+symbol+'={\n'+Object.entries(chosen[key]).map(([name,value])=>' '+name+':'+JSON.stringify(value)+',').join('\n')+'\n} as const;';
 return {path,absolute,before,after:before.slice(0,start)+literal+before.slice(end+'} as const;'.length)};
});
if(args.includes('--write')){
 try{
  for(const edit of edits)writeFileSync(edit.absolute,edit.after);
  const after=await loadLabRuntime(resolve(root,'work/economy-lab/published-policy'));
  assert.equal(hashConfig(after.ECONOMY_LAB),selected.configHash,'Compiled live policy differs from the measured candidate');
 }catch(error){for(const edit of edits)writeFileSync(edit.absolute,edit.before);throw error;}
 const evidence={date:new Date().toISOString(),configHash:selected.configHash,seeds:selected.seeds,confirmation:{path:relative(root,confirmationPath),sha256:sha(confirmationPath)},changes,sources:edits.map(e=>({path:e.path,sha256:sha(e.absolute)})),sensitivity:'Separate measurement; publication does not claim sensitivity acceptance.'};
 writeFileSync(resolve(root,'reports/v3-shell/b2/econ/PUBLISHED-CONFIG.json'),JSON.stringify(evidence,null,2)+'\n');
}
console.log(JSON.stringify({written:args.includes('--write'),configHash:selected.configHash,changes},null,2));
