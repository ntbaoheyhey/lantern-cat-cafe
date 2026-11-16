/** Diagnostic hybrid native banks, never candidate/economy gate evidence.
 * LEARN/S2b-boundary.md: isolate acquired gear from progression at fixed policy.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gunzipSync,gzipSync} from 'node:zlib';
import {root,sha,quantile} from '../../chain/economy-lab/runtime.mjs';
import {restoreModel} from '../../chain/economy-lab/freeze.mjs';
const folder=resolve(root,'reports/v4-ship/S2b'),output=resolve(folder,'boundary-channels.json');
assert(!existsSync(output),'Preserve prior channel evidence');
const read=path=>JSON.parse(readFileSync(path));
const labels=['CLASS-POWER-RETENTION25','CLASS-OFFENSE120-POWER25-TOKENS'];
const reports=labels.map(label=>read(resolve(folder,'econ',label+'.json')));
assert.equal(reports[0].configHash,reports[1].configHash);
const banks=reports.map(report=>{
 const manifest=read(resolve(root,report.bank.path));assert.equal(sha(resolve(root,manifest.cohort.path)),report.bank.sha256);
 return gunzipSync(readFileSync(resolve(root,manifest.cohort.path))).toString().trim().split('\n').map(JSON.parse);
});
assert.deepEqual(banks[0].map(r=>[r.profile,r.seed]),banks[1].map(r=>[r.profile,r.seed]));
const rawPath=resolve(folder,'boundary-runs.jsonl.gz'),rawSha=sha(rawPath);
const reference=gunzipSync(readFileSync(rawPath)).toString().trim().split('\n').map(JSON.parse).filter(r=>r.block==='holdout');
const ref=new Map(reference.map(r=>[`${r.label}:${r.scenario}:${r.seed}`,r]));
const restored=restoreModel('boundary-channel-observation',reports[0].modelSnapshot);
const runtime=await import(pathToFileURL(restored.runtimePath));
const {applyConfig}=await import(pathToFileURL(resolve(dirname(restored.runtimePath),'tools/chain/economy-lab/search-core.mjs')));
const {tokenRun}=await import(pathToFileURL(resolve(dirname(restored.runtimePath),'tools/chain/economy-lab/token.mjs')));
const config=applyConfig(runtime.ECONOMY_LAB,structuredClone(reports[0].config));
assert.equal(config.policy.spool.feeBp,2500);
const masks={gear:['gear','gearItems'],progression:['hours','wins','completedRoutes','level','cleared']};
const hybrid=Object.fromEntries(Object.entries(masks).map(([id,keys])=>[id,banks[0].map((a,i)=>({...a,daily:a.daily.map((d,j)=>({...d,...Object.fromEntries(keys.map(k=>[k,banks[1][i].daily[j][k]]))}))}))]));
const metrics=['burnClaims','starRatio','burn','claims','balances','externalVolume','treasury','starSource','starSink','starBalances','seals','fusions'];
const rows=[],summary=[],started=performance.now();let crossRuntimeReplays=0;
const scenarios=reports[0].scenarios.filter(s=>['casual-heavy-d0.5-b0.1','casual-heavy-d0.5-b0.35'].includes(s.id));
for(const scenario of scenarios){
 for(let seed=73113;seed<=73312;seed++){
  assert(!existsSync(resolve(root,'STOP-V4SHIP'))&&!existsSync(resolve(root,'reports/v4-ship/STOP-V4SHIP')),'STOP-V4SHIP');
  const control=tokenRun(runtime,config,banks[1],scenario,seed),{diagnosis,label,block,scenario:ignored,...expected}=ref.get(`${labels[1]}:${scenario.id}:${seed}`);
  assert.deepEqual(control,expected,'Cross-runtime replay');crossRuntimeReplays++;
  for(const [channel,bank] of Object.entries(hybrid)){
   const value=tokenRun(runtime,config,bank,scenario,seed);
   rows.push({channel,scenario:scenario.id,seed,...Object.fromEntries(metrics.map(k=>[k,value[k]]))});
  }
 }
 for(const channel of Object.keys(hybrid)){
  const group=rows.filter(r=>r.channel===channel&&r.scenario===scenario.id);
  const fields=Object.fromEntries(metrics.map(k=>{
   const values=group.map(r=>r[k]),base=group.map(r=>ref.get(`${labels[0]}:${scenario.id}:${r.seed}`)[k]);
   return [k,{median:quantile(values,.5),mean:values.reduce((a,b)=>a+b,0)/values.length,medianDifferenceFrom115:quantile(values,.5)-quantile(base,.5),meanPairedDifferenceFrom115:values.reduce((sum,v,i)=>sum+v-base[i],0)/values.length}];
  }));
  summary.push({scenario:scenario.id,channel,seeds:group.length,metrics:fields});
  console.log(JSON.stringify({scenario:scenario.id,channel,burn:fields.burnClaims.median,stars:fields.starRatio.median}));
 }
}
const outRaw=resolve(folder,'boundary-channels.jsonl.gz');writeFileSync(outRaw,gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
writeFileSync(output,JSON.stringify({at:new Date().toISOString(),labSha256:sha(import.meta.filename),configHash:reports[0].configHash,retentionBp:2500,referenceRawSha256:rawSha,models:reports.map(r=>({bank:r.bank,modelSnapshot:r.modelSnapshot})),masks,firstSeed:73113,seeds:200,crossRuntimeReplays,validationPass:crossRuntimeReplays===400,candidateEligible:false,summary,raw:{path:relative(root,outRaw),sha256:sha(outRaw),runs:rows.length},elapsedSeconds:(performance.now()-started)/1000,limits:['Hybrid records isolate model pathways but are not realizable native cohorts or candidate gate evidence.','Same diagnostic seed block as boundary analysis; not a new holdout.','No first-Legendary record, rate, threshold, clock or production code changed.']},null,2)+'\n');
