import {Worker} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {nativePolicy,hashConfig} from './search-core.mjs';
import {assumptions,perturb} from './assumptions.mjs';
import {scenarios} from './token.mjs';
import {freezeModel,restoreModel} from './freeze.mjs';
import {comparablePolicy} from './evidence.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const label=arg('label','SENSITIVITY'),seeds=Number(arg('seeds',200)),workers=Number(arg('workers',6)),B=resolve(root,'reports/v3-shell/b2/econ');
if(!/^[A-Za-z0-9_-]+$/.test(label)||![seeds,workers].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid arguments');
const out=resolve(B,label+'.json'),prior=existsSync(out)?JSON.parse(readFileSync(out)):null;
if(prior&&!args.includes('--resume'))throw Error('Preserve sensitivity history; --resume extends the identical frozen experiment');
const firstSeed=Number(arg('first-seed',63113));
const configPath=resolve(root,arg('config')),config=JSON.parse(readFileSync(configPath)),manifestPath=resolve(root,arg('bank')),manifest=JSON.parse(readFileSync(manifestPath)),bankPath=resolve(root,manifest.cohort.path);
if(sha(bankPath)!==manifest.cohort.sha256||hashConfig(nativePolicy(config))!==hashConfig(nativePolicy(manifest.config)))throw Error('Native bank does not match this policy');
if(prior){assert.equal(prior.seeds,seeds);assert.equal(prior.firstSeed,firstSeed);assert.equal(prior.configSource.sha256,sha(configPath));assert.equal(prior.bank.sha256,manifest.cohort.sha256);}
const nativeIndexPath=arg('native-index')?resolve(root,arg('native-index')):null;
const nativeIndex=nativeIndexPath?JSON.parse(readFileSync(nativeIndexPath)):null;
const registry=assumptions(config),selected=arg('keys')?.split(','),rows=registry.map(a=>({...a,cases:structuredClone(prior?.assumptions.find(r=>r.path===a.path)?.cases??[]),reason:selected&&!selected.includes(a.name??a.path)?'Not selected for this diagnostic.':null}));
const queue=rows.filter(r=>!r.reason).flatMap(a=>[-.2,.2].flatMap(delta=>{
 const p=perturb(config,a,delta);let nativeBank;
 if(a.kind==='native'){
  const reference=nativeIndex?.cases.find(c=>c.assumption===a.path&&c.delta===delta&&c.complete)?.manifest;
  if(!reference){assert(!a.cases.some(c=>c.delta===delta),'Resume requires the original native case manifest');a.reason='Native session replay is incomplete; no rescaled substitute is used.';return [];}
  const path=resolve(root,reference.path);if(sha(path)!==reference.sha256)throw Error('Native sensitivity manifest hash mismatch');
  nativeBank=JSON.parse(readFileSync(path));
  if(!comparablePolicy(p.config,nativeBank.config)||nativeBank.cohort.seedsPerProfile<seeds)throw Error('Native sensitivity policy/seeds mismatch');
 }
 const job={id:`${a.path}:${delta}`,assumption:a.path,delta,...p,bankPath:nativeBank?resolve(root,nativeBank.cohort.path):bankPath,bankHash:nativeBank?.cohort.sha256??manifest.cohort.sha256,
  scenarios:p.demandScale?scenarios(config).map(s=>({...s,demand:s.demand*p.demandScale})):undefined};
 const saved=a.cases.find(c=>c.delta===delta);
 if(saved){
  assert.equal(saved.seeds,seeds);assert.equal(saved.firstSeed,firstSeed);assert.equal(saved.configHash,hashConfig(job.config));
  assert.equal(saved.bank.sha256,job.bankHash);assert.equal(sha(job.bankPath),job.bankHash);
  assert.equal(saved.scenarios.length,18);assert(saved.scenarios.every(s=>s.seeds===seeds&&Number.isFinite(s.burnClaims)&&Number.isFinite(s.starRatio)));
  return [];
 }
 return [job];
}));
const runtime=prior?null:await loadLabRuntime(resolve(root,'work/economy-lab/sensitivity-'+label)),frozen=prior?restoreModel('sensitivity-'+label,prior.modelSnapshot):freezeModel('sensitivity-'+label,runtime.runtimePath),runtimePath=frozen.runtimePath??runtime.runtimePath,started=performance.now(),active=[];let next=0,done=0;
const writeCheckpoint=()=>writeFileSync(out,JSON.stringify({label,seeds,firstSeed,date:new Date().toISOString(),configSource:{path:relative(root,configPath),sha256:sha(configPath)},modelSnapshot:frozen.evidence,bank:{...manifest.cohort,manifest:relative(root,manifestPath)},complete:rows.every(r=>r.cases.length===2),elapsedSeconds:(prior?.elapsedSeconds??0)+(performance.now()-started)/1000,assumptions:rows},null,2)+'\n');
writeCheckpoint();
console.log(`${label}: ${rows.reduce((n,r)=>n+r.cases.length,0)} verified cases retained; ${queue.length} cases pending in this run.`);
mkdirSync(resolve(B,'sensitivity'),{recursive:true});
try{await Promise.all(Array.from({length:Math.min(workers,queue.length)},()=>new Promise((accept,reject)=>{
 const worker=new Worker(frozen.worker,{workerData:{runtimePath,bankPath}});active.push(worker);
 const dispatch=()=>{if(existsSync(resolve(root,'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const job=queue[next++];if(!job){void worker.terminate();accept();return;}worker.postMessage({...job,seeds,firstSeed});};
 worker.on('error',reject);worker.on('message',result=>{if(result.error){reject(Error(result.error));return;}const job=queue.find(j=>j.id===result.id),row=rows.find(r=>r.path===job.assumption);
  if(result.configHash!==hashConfig(job.config)){reject(Error('Sensitivity runtime applied a different config'));return;}
  const value={delta:job.delta,seeds,firstSeed,configHash:result.configHash,before:job.before,after:job.after,discreteNoChange:job.discreteNoChange,bank:{path:relative(root,job.bankPath),sha256:job.bankHash},scenarios:result.scenarioScores.map(s=>({...s,baseScenario:s.id,burnClaims:s.quantiles.median.burnClaims,starRatio:s.quantiles.median.starRatio}))};row.cases.push(value);row.reason=null;
  writeFileSync(resolve(B,'sensitivity',`${label}-${job.assumption}-${job.delta}.json`),JSON.stringify(value,null,2)+'\n');
  writeCheckpoint();
  console.log(`${label}: ${++done}/${queue.length} ${row.name??row.path} ${job.delta}; ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();
 });dispatch();
})));}finally{await Promise.all(active.map(w=>w.terminate()));}
writeCheckpoint();
console.log(`Saved ${relative(root,out)}; ${rows.filter(r=>r.cases.length===2).length}/${rows.length} assumptions measured. Pending native cases remain FAIL.`);
