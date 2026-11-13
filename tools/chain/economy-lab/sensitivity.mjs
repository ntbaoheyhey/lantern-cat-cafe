import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {nativePolicy,hashConfig} from './search-core.mjs';
import {assumptions,perturb} from './assumptions.mjs';
import {scenarios} from './token.mjs';
import {freezeModel} from './freeze.mjs';
import {comparablePolicy} from './evidence.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const label=arg('label','SENSITIVITY'),seeds=Number(arg('seeds',200)),workers=Number(arg('workers',6)),B=resolve(root,'reports/v3-shell/b2/econ');
if(!/^[A-Za-z0-9_-]+$/.test(label)||![seeds,workers].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid arguments');
const out=resolve(B,label+'.json');if(existsSync(out))throw Error('Preserve sensitivity history');
const configPath=resolve(root,arg('config')),config=JSON.parse(readFileSync(configPath)),manifestPath=resolve(root,arg('bank')),manifest=JSON.parse(readFileSync(manifestPath)),bankPath=resolve(root,manifest.cohort.path);
if(sha(bankPath)!==manifest.cohort.sha256||hashConfig(nativePolicy(config))!==hashConfig(nativePolicy(manifest.config)))throw Error('Native bank does not match this policy');
const nativeIndexPath=arg('native-index')?resolve(root,arg('native-index')):null;
const nativeIndex=nativeIndexPath?JSON.parse(readFileSync(nativeIndexPath)):null;
const registry=assumptions(config),selected=arg('keys')?.split(','),rows=registry.map(a=>({...a,cases:[],reason:selected&&!selected.includes(a.name??a.path)?'Not selected for this diagnostic.':null}));
const queue=rows.filter(r=>!r.reason).flatMap(a=>[-.2,.2].flatMap(delta=>{
 const p=perturb(config,a,delta);let nativeBank;
 if(a.kind==='native'){
  const reference=nativeIndex?.cases.find(c=>c.assumption===a.path&&c.delta===delta&&c.complete)?.manifest;
  if(!reference){a.reason='Native session replay is incomplete; no rescaled substitute is used.';return [];}
  const path=resolve(root,reference.path);if(sha(path)!==reference.sha256)throw Error('Native sensitivity manifest hash mismatch');
  nativeBank=JSON.parse(readFileSync(path));
  if(!comparablePolicy(p.config,nativeBank.config)||nativeBank.cohort.seedsPerProfile<seeds)throw Error('Native sensitivity policy/seeds mismatch');
 }
 return [{id:`${a.path}:${delta}`,assumption:a.path,delta,...p,bankPath:nativeBank?resolve(root,nativeBank.cohort.path):bankPath,bankHash:nativeBank?.cohort.sha256??manifest.cohort.sha256,
  scenarios:p.demandScale?scenarios(config).map(s=>({...s,demand:s.demand*p.demandScale})):undefined}];
}));
if(!queue.length)throw Error('No selected token assumptions');
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/sensitivity-'+label)),frozen=freezeModel('sensitivity-'+label,runtime.runtimePath),started=performance.now(),active=[];let next=0,done=0;
mkdirSync(resolve(B,'sensitivity'),{recursive:true});
try{await Promise.all(Array.from({length:Math.min(workers,queue.length)},()=>new Promise((accept,reject)=>{
 const worker=new Worker(frozen.worker,{workerData:{runtimePath:runtime.runtimePath,bankPath}});active.push(worker);
 const dispatch=()=>{if(existsSync(resolve(root,'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const job=queue[next++];if(!job){void worker.terminate();accept();return;}worker.postMessage({...job,seeds,firstSeed:Number(arg('first-seed',63113))});};
 worker.on('error',reject);worker.on('message',result=>{if(result.error){reject(Error(result.error));return;}const job=queue.find(j=>j.id===result.id),row=rows.find(r=>r.path===job.assumption);
  if(result.configHash!==hashConfig(job.config)){reject(Error('Sensitivity runtime applied a different config'));return;}
  const value={delta:job.delta,seeds,before:job.before,after:job.after,discreteNoChange:job.discreteNoChange,bank:{path:relative(root,job.bankPath),sha256:job.bankHash},scenarios:result.scenarioScores.map(s=>({...s,baseScenario:s.id,burnClaims:s.quantiles.median.burnClaims,starRatio:s.quantiles.median.starRatio}))};row.cases.push(value);
  writeFileSync(resolve(B,'sensitivity',`${label}-${job.assumption}-${job.delta}.json`),JSON.stringify(value,null,2)+'\n');
  console.log(`${label}: ${++done}/${queue.length} ${row.name??row.path} ${job.delta}; ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();
 });dispatch();
})));}finally{await Promise.all(active.map(w=>w.terminate()));}
writeFileSync(out,JSON.stringify({label,seeds,date:new Date().toISOString(),configSource:{path:relative(root,configPath),sha256:sha(configPath)},modelSnapshot:frozen.evidence,bank:{...manifest.cohort,manifest:relative(root,manifestPath)},complete:rows.every(r=>r.cases.length===2),elapsedSeconds:(performance.now()-started)/1000,assumptions:rows},null,2)+'\n');
console.log(`Saved ${relative(root,out)}; ${rows.filter(r=>r.cases.length===2).length}/${rows.length} assumptions measured. Pending native cases remain FAIL.`);
