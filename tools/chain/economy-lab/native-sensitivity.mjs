import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {assumptions,perturb} from './assumptions.mjs';
import {freezeModel,restoreModel} from './freeze.mjs';
import {comparablePolicy} from './evidence.mjs';
import {hashConfig} from './search-core.mjs';

const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const label=arg('label','NATIVE-SENSITIVITY'),workers=Number(arg('workers',4));
if(!/^[A-Za-z0-9_-]+$/.test(label)||!Number.isSafeInteger(workers)||workers<1)throw Error('Invalid arguments');
const B=resolve(root,process.env.ECONOMY_EVIDENCE_DIR??'reports/v3-shell/b2/econ'),folder=resolve(B,'native-sensitivity',label);
mkdirSync(folder,{recursive:true});
const config=JSON.parse(readFileSync(resolve(root,arg('config'))));
const manifestPath=resolve(root,arg('bank')),manifest=JSON.parse(readFileSync(manifestPath));
const raw=resolve(root,manifest.cohort.path);
if(sha(raw)!==manifest.cohort.sha256||!comparablePolicy(config,manifest.config))throw Error('Native bank mismatch');
if(manifest.cohort.seedsPerProfile<200)throw Error('Native sensitivity needs 200 base seeds per profile');
const baseline=gunzipSync(readFileSync(raw)).toString().trim().split('\n').map(JSON.parse);
const indexPath=resolve(B,label+'.json'),prior=existsSync(indexPath)?JSON.parse(readFileSync(indexPath)):null;
if(prior&&prior.base.sha256!==sha(manifestPath))throw Error('Resume must keep the original base bank');
const runtime=prior?null:await loadLabRuntime(resolve(root,'work/economy-lab/native-sensitivity-'+label));
const frozen=prior?restoreModel('native-sensitivity-'+label,prior.modelSnapshot,{native:true}):freezeModel('native-sensitivity-'+label,runtime.runtimePath,{native:true,evidenceDirectory:B});
const runtimePath=frozen.runtimePath??runtime.runtimePath;
const selected=arg('keys')?.split(','),registry=assumptions(config).filter(a=>a.kind==='native');
const rows=[],started=performance.now();
const writeIndex=()=>writeFileSync(indexPath,JSON.stringify({label,date:new Date().toISOString(),base:{path:relative(root,manifestPath),sha256:sha(manifestPath)},nativePolicyOnly:true,modelSnapshot:frozen.evidence,
 method:'Actual C2 transitions; rerun only the changed profile using the same 200 seeds, reuse unchanged profiles exactly. Timing changes rerun every profile. Integer perturbations with no policy change reuse verified records.',
 elapsedSeconds:(performance.now()-started)/1000,complete:rows.length===registry.length*2&&rows.every(r=>r.complete),cases:rows},null,2)+'\n');
writeIndex();

for(const assumption of registry)for(const delta of [-.2,.2]){
 const changed=perturb(config,assumption,delta),key=assumption.path+(delta<0?'-minus':'-plus'),out=resolve(folder,key+'.json');
 if(selected&&!selected.includes(assumption.name??assumption.path)){rows.push({assumption:assumption.path,delta,complete:false,reason:'Not selected'});continue;}
 if(existsSync(out)){
  const saved=JSON.parse(readFileSync(out)),path=resolve(root,saved.cohort.path);
  if(saved.configHash!==hashConfig(changed.config)||sha(path)!==saved.cohort.sha256)throw Error('Cannot resume a changed policy or corrupt native bank');
  rows.push({assumption:assumption.path,delta,complete:true,manifest:{path:relative(root,out),sha256:sha(out)}});writeIndex();continue;
 }
 if(existsSync(resolve(root,process.env.ECONOMY_STOP_FILE??'STOP-V3B')))throw Error('Requested economy stop');
 const match=/^profiles\.(\d+)\./.exec(assumption.path);
 const affected=changed.nativeChanged?(match?[config.profiles[Number(match[1])].id]:config.profiles.map(p=>p.id)):[];
 const tasks=baseline.filter(r=>affected.includes(r.profile)).map(r=>({seed:r.seed,profile:r.profile}));
 const bank=baseline.filter(r=>!affected.includes(r.profile));let next=0,done=0;const active=[],at=performance.now();
 console.log(`${key}: rerun ${tasks.length} native accounts; reuse ${bank.length}`);
 try{await Promise.all(Array.from({length:Math.min(workers,tasks.length)},()=>new Promise((accept,reject)=>{
  const worker=new Worker(frozen.worker,{workerData:{runtimePath,config:changed.config}});active.push(worker);
  const dispatch=()=>{if(existsSync(resolve(root,process.env.ECONOMY_STOP_FILE??'STOP-V3B'))){reject(Error('Requested economy stop'));return;}const job=tasks[next++];if(job)worker.postMessage(job);else{void worker.terminate();accept();}};
  worker.on('error',reject);worker.on('message',row=>{if(row.error){reject(Error(row.error));return;}bank.push(row.report);if(++done%50===0)console.log(`${key}: ${done}/${tasks.length}; ${((performance.now()-at)/1000).toFixed(1)}s`);dispatch();});dispatch();
 })));}finally{await Promise.all(active.map(w=>w.terminate()));}
 bank.sort((a,b)=>a.profile.localeCompare(b.profile)||a.seed-b.seed);
 const path=resolve(folder,key+'.jsonl.gz');writeFileSync(path,gzipSync(bank.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 const cohort={path:relative(root,path),sha256:sha(path),accounts:bank.length,seedsPerProfile:manifest.cohort.seedsPerProfile,days:config.cohortDays};
 writeFileSync(out,JSON.stringify({assumption:assumption.path,name:assumption.name,delta,before:changed.before,after:changed.after,discreteNoChange:changed.discreteNoChange,config:changed.config,configHash:hashConfig(changed.config),affectedProfiles:affected,rerunAccounts:tasks.length,reusedAccounts:bank.length-tasks.length,cohort,modelSnapshot:frozen.evidence,elapsedSeconds:(performance.now()-at)/1000},null,2)+'\n');
 rows.push({assumption:assumption.path,delta,complete:true,manifest:{path:relative(root,out),sha256:sha(out)}});writeIndex();
 console.log(`${key}: saved ${relative(root,out)}`);
}
writeIndex();console.log(`Saved ${relative(root,indexPath)}.`);
