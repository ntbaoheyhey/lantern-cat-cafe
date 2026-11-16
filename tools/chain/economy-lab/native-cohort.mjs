import {Worker} from 'node:worker_threads';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gzipSync} from 'node:zlib';
import {loadLabRuntime,root,sha,quantile} from './runtime.mjs';
import {hashConfig,nativePolicy} from './search-core.mjs';
import {freezeModel} from './freeze.mjs';
const args=process.argv.slice(2),arg=(k,d)=>args.includes('--'+k)?args[args.indexOf('--'+k)+1]:d;
const label=arg('label','CANDIDATE'),seeds=Number(arg('seeds',40)),workers=Number(arg('workers',6)),firstSeed=Number(arg('first-seed',90001));
if(!/^[A-Za-z0-9_-]+$/.test(label)||![seeds,workers,firstSeed].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid cohort arguments');
const B=resolve(root,process.env.ECONOMY_EVIDENCE_DIR??'reports/v3-shell/b2/econ'),out=resolve(B,`${label}.json`);mkdirSync(B,{recursive:true});
if(existsSync(out)&&!args.includes('--replace'))throw Error('Preserve measured cohorts; choose a new label');
const started=performance.now(),runtime=await loadLabRuntime(resolve(root,'work/economy-lab/native-runtime-'+label));
const experimentalClassAttack=arg('class-attack')?Number(arg('class-attack')):null;
if(experimentalClassAttack!==null){
 if(!Number.isFinite(experimentalClassAttack)||experimentalClassAttack<1||experimentalClassAttack>1.5)throw Error('Invalid class-only experiment');
 const source=readFileSync(runtime.runtimePath,'utf8'),anchor='Math.round(attack * 1.15)';
 if(source.split(anchor).length!==2)throw Error('Class experiment anchor changed');
 writeFileSync(runtime.runtimePath,source.replace(anchor,`Math.round(attack * ${experimentalClassAttack})`));
}
const config=arg('config')?JSON.parse(readFileSync(resolve(root,arg('config')))):structuredClone(runtime.ECONOMY_LAB);
const frozen=freezeModel('native-'+label,runtime.runtimePath,{native:true,evidenceDirectory:B});
const configHash=hashConfig(config),sourceFiles=['tools/chain/economy-lab/cohort.mjs','packages/game-rules/src/cardrpg/economy-v3.ts','packages/game-rules/src/cardrpg/economy-lab.ts','packages/game-rules/src/cardrpg/depth/economy-c2.ts'].map(path=>({path,sha256:sha(resolve(root,path))}));
const queue=config.profiles.flatMap(profile=>Array.from({length:seeds},(_,i)=>({profile:profile.id,seed:firstSeed+i}))),bank=[],active=[];let next=0,cpu=0;
try{await Promise.all(Array.from({length:Math.min(workers,queue.length)},()=>new Promise((accept,reject)=>{
 const worker=new Worker(frozen.worker,{workerData:{runtimePath:runtime.runtimePath,config}});active.push(worker);
 const dispatch=()=>{if(existsSync(resolve(root,process.env.ECONOMY_STOP_FILE??'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const job=queue[next++];if(job)worker.postMessage(job);else{void worker.terminate();accept();}};
 worker.on('error',reject);worker.on('message',row=>{if(row.error){reject(Error(row.error));return;}bank.push(row.report);cpu+=row.elapsedSeconds;if(bank.length%25===0)console.log(`${label}: ${bank.length}/${queue.length}, ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();});dispatch();
})));}finally{await Promise.all(active.map(w=>w.terminate()));}
bank.sort((a,b)=>a.profile.localeCompare(b.profile)||a.seed-b.seed);
const raw=resolve(B,`${label}.jsonl.gz`);writeFileSync(raw,gzipSync(bank.map(x=>JSON.stringify(x)).join('\n')+'\n'));
const profiles=config.profiles.map(p=>{const rows=bank.filter(a=>a.profile===p.id),days=rows.map(a=>a.firstLegendaryDay??config.cohortDays+1);return {id:p.id,seeds:rows.length,censored:rows.filter(a=>a.censoredLegendary).length,legendary:{median:quantile(days,.5),p10:quantile(days,.1),p90:quantile(days,.9)},firstSources:Object.fromEntries([...new Set(rows.map(r=>r.firstLegendarySource??'censored'))].map(k=>[k,rows.filter(r=>(r.firstLegendarySource??'censored')===k).length]))};});
const cohort={path:relative(root,raw),sha256:sha(raw),accounts:bank.length,seedsPerProfile:seeds,days:config.cohortDays,profiles};
writeFileSync(out,JSON.stringify({label,experimentalClassAttack,date:new Date().toISOString(),config,configHash,nativePolicy:nativePolicy(config),modelSnapshot:frozen.evidence,sourceFiles,elapsedSeconds:(performance.now()-started)/1000,measuredCpuSeconds:cpu,workers,cohort},null,2)+'\n');
console.log(JSON.stringify({label,seconds:(performance.now()-started)/1000,profiles}));
