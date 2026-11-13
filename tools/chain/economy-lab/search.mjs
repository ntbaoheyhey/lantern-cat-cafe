import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {LEVERS,candidates,nativePolicy,hashConfig} from './search-core.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const round=Number(arg('round',1)),count=Number(arg('configs',40)),seeds=Number(arg('seeds',40)),workers=Number(arg('workers',6));
for(const n of [round,count,seeds,workers])if(!Number.isSafeInteger(n)||n<1)throw Error('Positive integer parameters required');
const B=resolve(root,'reports/v3-shell/b2/econ'),folder=resolve(B,'search');mkdirSync(folder,{recursive:true});
const out=resolve(folder,`round-${String(round).padStart(2,'0')}.json`);if(existsSync(out)&&!args.includes('--replace'))throw Error('Round already exists; preserve measured history');
const runtime=await loadLabRuntime(resolve(root,`work/economy-lab/search-runtime-${round}`));
const snapshotPath=resolve(folder,`round-${String(round).padStart(2,'0')}-model.json.gz`);
const modelFiles=['tools/chain/economy-lab/token.mjs','tools/chain/economy-lab/studio.mjs','tools/chain/economy-lab/search-core.mjs','tools/chain/economy-lab/search-worker.mjs','tools/chain/economy-lab/runtime.mjs','scripts/v3b2/thresholds.mjs'];
const frozenRoot=resolve(root,`work/economy-lab/frozen/round-${round}`);
for(const path of modelFiles){const destination=resolve(frozenRoot,path);mkdirSync(resolve(destination,'..'),{recursive:true});writeFileSync(destination,readFileSync(resolve(root,path)));}
writeFileSync(snapshotPath,gzipSync(JSON.stringify({runtime:readFileSync(runtime.runtimePath,'utf8'),sources:modelFiles.map(path=>({path,sha256:sha(resolve(root,path)),text:readFileSync(resolve(root,path),'utf8')}))})));
const base=arg('config')?JSON.parse(readFileSync(resolve(root,arg('config')))):structuredClone(runtime.ECONOMY_LAB);
const levers=arg('levers')?JSON.parse(readFileSync(resolve(root,arg('levers')))):LEVERS;
if(levers.length<10||levers.some(l=>!LEVERS.some(x=>x.path===l.path)||!Number.isFinite(l.min)||!Number.isFinite(l.max)||l.min>l.max||l.step<=0))throw Error('At least ten valid live lever ranges required');
const evidencePath=resolve(root,arg('bank','reports/v3-shell/b2/econ/BASELINE.json')),evidence=JSON.parse(readFileSync(evidencePath));
const cohort=evidence.cohort??evidence.scenarios[0].gearCohort,bankPath=resolve(root,cohort.path);
if(sha(bankPath)!==cohort.sha256)throw Error('Native bank hash mismatch');
if(hashConfig(nativePolicy(base))!==hashConfig(nativePolicy(evidence.config)))throw Error('Progression config changed; measure a fresh native cohort');
const started=performance.now(),results=[],configByHash=new Map(),active=[];
async function batch(jobs){
 let next=0,completed=0;
 await Promise.all(Array.from({length:Math.min(workers,jobs.length)},()=>new Promise((accept,reject)=>{
  const worker=new Worker(pathToFileURL(resolve(frozenRoot,'tools/chain/economy-lab/search-worker.mjs')),{workerData:{runtimePath:runtime.runtimePath,bankPath}});active.push(worker);
  const dispatch=()=>{if(existsSync(resolve(root,'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const job=jobs[next++];if(!job){void worker.terminate();accept();return;}configByHash.set(job.configHash,job.config);worker.postMessage({...job,id:job.configHash,seeds,firstSeed:Number(arg('first-seed',43113))});};
  worker.on('error',reject);worker.on('message',row=>{if(row.error){reject(Error(row.error));return;}if(row.configHash!==row.id){reject(Error('Applied config differs from requested config'));return;}results.push(row);if(++completed%5===0)console.log(`Round ${round}: ${results.length}/${count}; best ${Math.min(...results.map(r=>r.score)).toFixed(4)}; ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();});dispatch();
 })));
}
const seen=new Set();
try{
 await batch(candidates(base,Math.ceil(count/2),round*104729,{seen,levers}));
 const center=configByHash.get([...results].sort((a,b)=>a.score-b.score)[0].configHash);
 if(count>1)await batch(candidates(base,Math.floor(count/2),round*104729+7919,{center,seen,levers}));
}finally{await Promise.all(active.map(w=>w.terminate()));}
results.sort((a,b)=>a.score-b.score);
const output={round,seeds,configsEvaluated:results.length,elapsedSeconds:(performance.now()-started)/1000,method:'Constrained stratified search then local refinement. Paired token seeds, all 18 scenarios, worst-case score weighted 3x plus mean. Exact production quotes; finite token conservation; verified native C2 bank.',modelSnapshot:{path:relative(root,snapshotPath),sha256:sha(snapshotPath)},leverNames:levers.map(l=>l.path),leverRanges:levers,bank:{...cohort,manifest:relative(root,evidencePath)},baseConfig:base,baseHash:hashConfig(base),configs:results.map(r=>({...r,config:configByHash.get(r.configHash)}))};
writeFileSync(out,JSON.stringify(output,null,2)+'\n');
writeFileSync(resolve(folder,`round-${String(round).padStart(2,'0')}-best.json`),JSON.stringify(configByHash.get(results[0].configHash),null,2)+'\n');
console.log(`Saved ${relative(root,out)}; best score ${results[0].score.toFixed(4)}.`);
