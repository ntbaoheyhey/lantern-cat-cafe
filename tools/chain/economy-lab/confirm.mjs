import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {loadLabRuntime,root,sha} from './runtime.mjs';
import {nativePolicy,hashConfig} from './search-core.mjs';
import {freezeModel} from './freeze.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const B=resolve(root,'reports/v3-shell/b2/econ'),folder=resolve(B,'search');
const label=arg('label','CONFIRMED'),seeds=Number(arg('seeds',200)),top=Number(arg('top',10)),workers=Number(arg('workers',6));
if(!/^[A-Za-z0-9_-]+$/.test(label)||![seeds,top,workers].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid confirmation arguments');
const outputPath=resolve(B,label+'.json');if(existsSync(outputPath))throw Error('Preserve measured confirmation');
const manifestPath=resolve(root,arg('bank')),manifest=JSON.parse(readFileSync(manifestPath)),bankPath=resolve(root,manifest.cohort.path);
if(sha(bankPath)!==manifest.cohort.sha256)throw Error('Native cohort hash mismatch');
if(manifest.cohort.seedsPerProfile<seeds)throw Error('Confirm the native progression with at least as many seeds first.');
const select=arg('rounds')?.split(',').map(Number),unique=new Map(),sources=[];
for(const file of readdirSync(folder).filter(f=>/^round-\d+\.json$/.test(f))){
 const path=resolve(folder,file),round=JSON.parse(readFileSync(path));if(select&&!select.includes(round.round))continue;
 sources.push({round:round.round,path:relative(root,path),sha256:sha(path)});
 for(const row of round.configs){if(hashConfig(nativePolicy(row.config))!==hashConfig(nativePolicy(manifest.config)))continue;
  if(!unique.has(row.configHash)||row.score<unique.get(row.configHash).score)unique.set(row.configHash,{...row,round:round.round});
 }
}
const selected=[...unique.values()].sort((a,b)=>a.score-b.score).slice(0,top);
if(selected.length<top)throw Error('Not enough unique candidates with this exact native policy');
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/confirm-'+label)),started=performance.now(),confirmed=[],active=[];let next=0;
const frozen=freezeModel('confirm-'+label,runtime.runtimePath);
mkdirSync(resolve(B,'confirm'),{recursive:true});
try{await Promise.all(Array.from({length:Math.min(workers,selected.length)},()=>new Promise((accept,reject)=>{
 const worker=new Worker(frozen.worker,{workerData:{runtimePath:runtime.runtimePath,bankPath}});active.push(worker);
 const dispatch=()=>{if(existsSync(resolve(root,'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const row=selected[next++];if(!row){void worker.terminate();accept();return;}worker.postMessage({id:row.configHash,config:row.config,seeds,firstSeed:Number(arg('first-seed',53113))});};
 worker.on('error',reject);worker.on('message',row=>{if(row.error){reject(Error(row.error));return;}const candidate=selected.find(r=>r.configHash===row.id);
  if(row.configHash!==hashConfig(candidate.config)){reject(Error('Confirmed runtime applied a different config'));return;}
  const result={...row,config:candidate.config,searchScore:candidate.score,searchRound:candidate.round};confirmed.push(result);
  writeFileSync(resolve(B,'confirm',label+'-'+row.configHash+'.json'),JSON.stringify(result,null,2)+'\n');
  console.log(`${label}: ${confirmed.length}/${selected.length}; score ${row.score.toFixed(4)}; ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();
 });dispatch();
})));}finally{await Promise.all(active.map(w=>w.terminate()));}
confirmed.sort((a,b)=>a.score-b.score);
writeFileSync(outputPath,JSON.stringify({label,seeds,date:new Date().toISOString(),selection:'Top unique configs under the final comparable model and exact native policy. Independent confirmation token seeds.',compared:unique.size,sources,modelSnapshot:frozen.evidence,bank:{...manifest.cohort,manifest:{path:relative(root,manifestPath),sha256:sha(manifestPath)}},elapsedSeconds:(performance.now()-started)/1000,confirmed},null,2)+'\n');
console.log(`Saved ${relative(root,outputPath)}.`);
