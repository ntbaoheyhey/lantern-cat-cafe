import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {root,sha,loadLabRuntime} from './runtime.mjs';
import {hashConfig} from './search-core.mjs';
import {assumptions} from './assumptions.mjs';

const args=process.argv.slice(2),arg=k=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:undefined;
const folder='reports/v3-shell/b2/econ/',signed=path=>({path:relative(root,resolve(root,path)),sha256:sha(resolve(root,path))});
const confirmationPath=arg('confirmation'),confirmation=JSON.parse(readFileSync(resolve(root,confirmationPath)));
const selected=confirmation.confirmed.find(r=>r.configHash===arg('hash'));
assert(selected,'Select an actual independently confirmed config');assert(selected.seeds>=200);assert.equal(selected.scenarioScores.length,18);
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/final-live-policy'));
assert.equal(hashConfig(runtime.ECONOMY_LAB),selected.configHash,'Publish the exact measured config to production rules first');
assert.equal(sha(resolve(root,confirmation.bank.path)),confirmation.bank.sha256,'Native progression records changed');
const sensitivityPath=arg('sensitivity');
const sensitivity=sensitivityPath&&existsSync(resolve(root,sensitivityPath))?JSON.parse(readFileSync(resolve(root,sensitivityPath))):null;
if(sensitivity){
 const measuredConfig=JSON.parse(readFileSync(resolve(root,sensitivity.configSource.path)));
 assert.equal(hashConfig(measuredConfig),selected.configHash,'Sensitivity belongs to another candidate');
}
const allAssumptions=assumptions(selected.config).map(a=>{
 const row=sensitivity?.assumptions.find(r=>r.path===a.path);
 return row??{...a,cases:[],reason:'Native or token replay pending; acceptance remains FAIL.'};
});
const logPath=arg('odds-log'),log=readFileSync(resolve(root,logPath),'utf8');
const passed=Number(log.match(/Tests\s+(\d+) passed/)?.[1]);
assert(passed>0&&!/FAIL |Tests\s+\d+ failed/.test(log),'A passing current UI odds test is required');
const paths=['packages/game-rules/src/cardrpg/economy-v3.ts','packages/game-rules/src/cardrpg/economy-sinks-v3.ts','packages/game-rules/src/cardrpg/economy-lab.ts','packages/game-rules/src/cardrpg/depth/economy-c2.ts'];
const output={date:new Date().toISOString(),config:signed(paths[0]),configSources:paths.map(signed),configHash:selected.configHash,policy:structuredClone(runtime.ECONOMY_LAB),confirmation:signed(confirmationPath),modelSnapshot:confirmation.modelSnapshot,
 scenarios:selected.scenarioScores.map(s=>({...s,gearCohort:confirmation.bank})),sensitivity:allAssumptions,sensitivitySource:sensitivity?signed(sensitivityPath):null,
 oddsTest:{exitCode:0,passed,log:signed(logPath)},score:selected.score,
 limits:['Behavioural assumptions are not observed users.','Bot ratio measures gross withdrawals per active hour, not profit or bot detection.','The finite opening market float is separately conserved; it is not an ongoing faucet.','Missing sensitivity cases remain explicit failed evidence.'],
};
writeFileSync(resolve(root,folder+'FINAL.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({configHash:output.configHash,seeds:selected.seeds,scenarios:output.scenarios.length,sensitivityComplete:allAssumptions.filter(a=>a.cases.length===2).length,sensitivityTotal:allAssumptions.length}));
