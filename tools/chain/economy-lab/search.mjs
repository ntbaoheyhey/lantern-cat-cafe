import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import assert from 'node:assert/strict';
import {resolve,relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {LEVERS,nativePolicy,hashConfig} from './search-core.mjs';
import {restoreModel} from './freeze.mjs';
import {verifiedConfirmation} from './evidence.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const round=Number(arg('round',1)),count=Number(arg('configs',40)),seeds=Number(arg('seeds',40)),workers=Number(arg('workers',6));
const method=arg('method','stratified');if(!['stratified','coordinate'].includes(method))throw Error('Unknown search method');
for(const n of [round,count,seeds,workers])if(!Number.isSafeInteger(n)||n<1)throw Error('Positive integer parameters required');
const B=resolve(root,'reports/v3-shell/b2/econ'),folder=resolve(root,arg('output-dir','reports/v3-shell/b2/econ/search'));mkdirSync(folder,{recursive:true});
const out=resolve(folder,`round-${String(round).padStart(2,'0')}.json`);if(existsSync(out)&&!args.includes('--replace'))throw Error('Round already exists; preserve measured history');
const checkpointPath=resolve(folder,`round-${String(round).padStart(2,'0')}-checkpoint.json`);
const prior=existsSync(checkpointPath)?JSON.parse(readFileSync(checkpointPath)):null;
const runtime=prior?null:await loadLabRuntime(resolve(root,`work/economy-lab/search-runtime-${round}`));
const snapshotPath=resolve(folder,`round-${String(round).padStart(2,'0')}-model.json.gz`);
const modelFiles=['tools/chain/economy-lab/token.mjs','tools/chain/economy-lab/studio.mjs','tools/chain/economy-lab/search-core.mjs','tools/chain/economy-lab/search-worker.mjs','tools/chain/economy-lab/runtime.mjs','scripts/v3b2/thresholds.mjs'];
const frozenRoot=resolve(root,`work/economy-lab/frozen/round-${round}`);
if(!prior)for(const path of modelFiles){const destination=resolve(frozenRoot,path);mkdirSync(resolve(destination,'..'),{recursive:true});writeFileSync(destination,readFileSync(resolve(root,path)));}
if(!prior)writeFileSync(snapshotPath,gzipSync(JSON.stringify({runtime:readFileSync(runtime.runtimePath,'utf8'),sources:modelFiles.map(path=>({path,sha256:sha(resolve(root,path)),text:readFileSync(resolve(root,path),'utf8')}))})));
const restored=prior?restoreModel(`round-${round}`,prior.modelSnapshot):null;
const runtimePath=restored?.runtimePath??runtime.runtimePath;
const model=await import(pathToFileURL(resolve(frozenRoot,'tools/chain/economy-lab/search-core.mjs')));
const base=arg('config')?JSON.parse(readFileSync(resolve(root,arg('config')))):structuredClone(prior?.baseConfig??runtime.ECONOMY_LAB);
const levers=arg('levers')?JSON.parse(readFileSync(resolve(root,arg('levers')))):LEVERS;
if(levers.length<10||levers.some(l=>!LEVERS.some(x=>x.path===l.path)||!Number.isFinite(l.min)||!Number.isFinite(l.max)||l.min>l.max||l.step<=0))throw Error('At least ten valid live lever ranges required');
const evidencePath=resolve(root,arg('bank','reports/v3-shell/b2/econ/BASELINE.json')),evidence=JSON.parse(readFileSync(evidencePath));
const cohort=evidence.cohort??evidence.scenarios[0].gearCohort,bankPath=resolve(root,cohort.path);
if(sha(bankPath)!==cohort.sha256)throw Error('Native bank hash mismatch');
if(hashConfig(nativePolicy(base))!==hashConfig(nativePolicy(evidence.config)))throw Error('Progression config changed; measure a fresh native cohort');
const firstSeed=Number(arg('first-seed',43113));
const expected={round,count,seeds,firstSeed,method,baseHash:hashConfig(base),leverHash:hashConfig(levers),bankHash:sha(bankPath),manifestHash:sha(evidencePath)};
if(prior)for(const [key,value] of Object.entries(expected))assert.equal(prior[key],value,'Search resume changed '+key);
const checkpoint=prior??{...expected,baseConfig:base,modelSnapshot:{path:relative(root,snapshotPath),sha256:sha(snapshotPath)},stages:[],elapsedSeconds:0};
const atomic=(path,value)=>{const temporary=path+'.tmp';writeFileSync(temporary,JSON.stringify(value,null,2)+'\n');renameSync(temporary,path);};
const resultFolder=resolve(folder,`round-${String(round).padStart(2,'0')}-checkpoints`);mkdirSync(resultFolder,{recursive:true});
const started=performance.now(),results=[],configByHash=new Map(),active=[];
const saveCheckpoint=()=>atomic(checkpointPath,{...checkpoint,elapsedSeconds:checkpoint.elapsedSeconds+(performance.now()-started)/1000});
saveCheckpoint();
async function batch(jobs){
 const pending=[];
 for(const job of jobs){
  configByHash.set(job.configHash,job.config);
  const path=resolve(resultFolder,job.configHash+'.json');
  if(existsSync(path))results.push(verifiedConfirmation(JSON.parse(readFileSync(path)),{configHash:job.configHash,seeds,firstSeed,modelSha256:checkpoint.modelSnapshot.sha256,bankSha256:cohort.sha256}));
  else pending.push(job);
 }
 if(jobs.length!==pending.length)console.log(`Round ${round}: retained ${jobs.length-pending.length} verified completed configs.`);
 let next=0,completed=0;
 await Promise.all(Array.from({length:Math.min(workers,pending.length)},()=>new Promise((accept,reject)=>{
  const worker=new Worker(pathToFileURL(resolve(frozenRoot,'tools/chain/economy-lab/search-worker.mjs')),{workerData:{runtimePath,bankPath}});active.push(worker);
  const dispatch=()=>{if(existsSync(resolve(root,'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const job=pending[next++];if(!job){void worker.terminate();accept();return;}configByHash.set(job.configHash,job.config);worker.postMessage({...job,id:job.configHash,seeds,firstSeed});};
  worker.on('error',reject);worker.on('message',row=>{if(row.error){reject(Error(row.error));return;}if(row.configHash!==row.id){reject(Error('Applied config differs from requested config'));return;}const saved={...row,config:configByHash.get(row.configHash),modelSnapshot:checkpoint.modelSnapshot,bank:cohort};atomic(resolve(resultFolder,row.configHash+'.json'),saved);results.push(saved);saveCheckpoint();if(++completed%5===0)console.log(`Round ${round}: ${results.length}/${count}; best ${Math.min(...results.map(r=>r.score)).toFixed(4)}; ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();});dispatch();
 })));
}
const seen=new Set();
try{
 let first=checkpoint.stages[0];
 if(!first){first=method==='coordinate'?model.coordinateCandidates(base,Math.ceil(count/2),{seen,levers}):model.candidates(base,Math.ceil(count/2),round*104729,{seen,levers});checkpoint.stages.push(first);saveCheckpoint();}
 for(const row of first)seen.add(row.configHash);
 if(method==='coordinate')seen.add(hashConfig(base));
 await batch(first);
 const center=configByHash.get([...results].sort((a,b)=>a.score-b.score||a.configHash.localeCompare(b.configHash))[0].configHash);
 if(count>1){
  let second=checkpoint.stages[1];
  if(!second){second=method==='coordinate'?model.coordinateCandidates(center,Math.floor(count/2),{seen,levers}):model.candidates(base,Math.floor(count/2),round*104729+7919,{center,seen,levers});checkpoint.stages.push(second);saveCheckpoint();}
  await batch(second);
 }
}finally{await Promise.all(active.map(w=>w.terminate()));}
results.sort((a,b)=>a.score-b.score||a.configHash.localeCompare(b.configHash));
const output={round,seeds,configsEvaluated:results.length,elapsedSeconds:checkpoint.elapsedSeconds+(performance.now()-started)/1000,method:(method==='coordinate'?'Single-axis and paired-axis local probes, then repeat around the measured best.':'Constrained stratified search then local refinement.')+' Paired token seeds, all 18 scenarios, worst-case score weighted 3x plus mean. Exact production quotes; finite token conservation; verified native C2 bank.',modelSnapshot:checkpoint.modelSnapshot,leverNames:levers.map(l=>l.path),leverRanges:levers,bank:{...cohort,manifest:relative(root,evidencePath)},baseConfig:base,baseHash:hashConfig(base),configs:results.map(r=>({...r,config:configByHash.get(r.configHash)}))};
writeFileSync(out,JSON.stringify(output,null,2)+'\n');
writeFileSync(resolve(folder,`round-${String(round).padStart(2,'0')}-best.json`),JSON.stringify(configByHash.get(results[0].configHash),null,2)+'\n');
console.log(`Saved ${relative(root,out)}; best score ${results[0].score.toFixed(4)}.`);
