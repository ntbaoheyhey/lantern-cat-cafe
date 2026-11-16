/** Fixed-policy class regression, using the completed post-class native cohort.
 * LEARN/S2b.md. Does not tune prices, grants, caps or thresholds.
 */
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {root,sha} from '../../chain/economy-lab/runtime.mjs';
import {restoreModel,freezeModel} from '../../chain/economy-lab/freeze.mjs';
import {scenarios} from '../../chain/economy-lab/token.mjs';
import {hashConfig,nativePolicy} from '../../chain/economy-lab/search-core.mjs';

const folder=resolve(root,'reports/v4-ship/S2b/econ');
const input=process.env.V4_NATIVE_LABEL??'CLASS-FINAL-200',label=process.env.V4_TOKEN_LABEL??'CLASS-TOKENS';
assert(/^[A-Z0-9-]+$/.test(input)&&/^[A-Z0-9-]+$/.test(label));
const manifestPath=resolve(folder,input+'.json'),manifest=JSON.parse(readFileSync(manifestPath));
const bankPath=resolve(root,manifest.cohort.path),config=structuredClone(manifest.config),seeds=200,firstSeed=53113;
if(process.env.V4_RETENTION_BP){const bp=Number(process.env.V4_RETENTION_BP);assert([1500,2500].includes(bp));config.policy.spool.feeBp=bp;}
const configHash=hashConfig(config);
assert.equal(hashConfig(nativePolicy(config)),hashConfig(nativePolicy(manifest.config)));
assert.equal(sha(bankPath),manifest.cohort.sha256);
assert.equal(manifest.configHash,hashConfig(manifest.config));
assert.equal(manifest.cohort.seedsPerProfile,200);
assert.equal(manifest.cohort.accounts,config.profiles.length*200);
const out=resolve(folder,label+'.json'),prior=existsSync(out)?JSON.parse(readFileSync(out)):null;
if(prior){assert.equal(prior.bank.sha256,manifest.cohort.sha256);assert.equal(prior.configHash,configHash);}
const native=restoreModel(label+'-native-token-input',manifest.modelSnapshot,{native:true});
const frozen=prior?restoreModel(label+'-token-regression',prior.modelSnapshot):freezeModel(label+'-token-regression',native.runtimePath,{evidenceDirectory:folder});
const runtimePath=frozen.runtimePath??native.runtimePath;
const rows=prior?.scenarios??[],pending=scenarios(config).filter(s=>!rows.some(r=>r.id===s.id)),active=[];
let next=0;const started=performance.now();
writeFileSync(resolve(folder,label+'-CONFIG.json'),JSON.stringify(config,null,2)+'\n');
const save=()=>writeFileSync(out,JSON.stringify({at:new Date().toISOString(),configHash,config,
 bank:{path:relative(root,manifestPath),sha256:manifest.cohort.sha256,manifestSha256:sha(manifestPath)},modelSnapshot:frozen.evidence,
 thresholdSource:{path:'scripts/v3b2/thresholds.mjs',sha256:sha(resolve(root,'scripts/v3b2/thresholds.mjs'))},seeds,firstSeed,
 elapsedSeconds:(prior?.elapsedSeconds??0)+(performance.now()-started)/1000,complete:rows.length===18,
 scenarios:[...rows].sort((a,b)=>a.id.localeCompare(b.id)),
 pass:rows.length===18&&rows.every(r=>Object.values(r.distances).every(d=>d===0)),
 limits:['Modeled token behavior over fresh 42-day combat cohorts; not live player telemetry.','Sensitivity, transaction/UI proofs and report citations are separate gates.','Historical search integrity is preserved; no policy retuning is performed.']},null,2)+'\n');
save();
try{await Promise.all(Array.from({length:Math.min(3,pending.length)},()=>new Promise((accept,reject)=>{
 const worker=new Worker(frozen.worker,{workerData:{runtimePath,bankPath}});active.push(worker);
 const dispatch=()=>{if(existsSync(resolve(root,'STOP-V4SHIP'))){reject(Error('STOP-V4SHIP requested'));return;}
  const scenario=pending[next++];if(!scenario){void worker.terminate();accept();return;}
  worker.postMessage({id:scenario.id,config,seeds,firstSeed,scenarios:[scenario],bankHash:manifest.cohort.sha256});};
 worker.on('error',reject);worker.on('message',result=>{
  if(result.error){reject(Error(result.error));return;}
  try{assert.equal(result.configHash,configHash);assert.equal(result.scenarioScores.length,1);
   const row=result.scenarioScores[0];assert.equal(row.seeds,seeds);assert(!rows.some(r=>r.id===row.id));rows.push(row);save();
   console.log(JSON.stringify({scenario:row.id,finished:rows.length,failures:Object.entries(row.distances).filter(([,d])=>d!==0).map(([id])=>id)}));dispatch();
  }catch(error){reject(error);}
 });dispatch();
})));}finally{await Promise.all(active.map(w=>w.terminate()));save();}
if(rows.some(r=>Object.values(r.distances).some(d=>d!==0)))process.exitCode=1;
