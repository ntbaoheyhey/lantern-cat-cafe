import {Worker} from 'node:worker_threads';
import {availableParallelism} from 'node:os';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadLabRuntime,root,sha,quantile} from './runtime.mjs';
import {tokenRun,scenarios} from './token.mjs';
const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const seeds=Number(arg('seeds','200')),workers=Number(arg('workers',String(Math.max(1,Math.min(6,availableParallelism()-2))))),firstSeed=Number(arg('first-seed','90001'));
if(!Number.isSafeInteger(seeds)||seeds<1||!Number.isSafeInteger(workers)||workers<1)throw Error('Positive seeds and workers required');
const B=resolve(root,'reports/v3-shell/b2/econ');mkdirSync(B,{recursive:true});
const started=performance.now(),runtime=await loadLabRuntime(),config=runtime.ECONOMY_LAB;
const configHash=createHash('sha256').update(JSON.stringify(config)).digest('hex'),cache=resolve(root,'work/economy-lab/cohorts',configHash);mkdirSync(cache,{recursive:true});
const cases=scenarios(config).filter(s=>arg('scenario','all')==='all'||s.id===arg('scenario'));if(!cases.length)throw Error('Unknown scenario');
const bank=[],queue=[];let cached=0,measuredCpuSeconds=0;
for(const profile of config.profiles)for(let i=0;i<seeds;i++){
 const job={profile:profile.id,seed:firstSeed+i},path=resolve(cache,`${job.profile}-${job.seed}.json`);
 if(args.includes('--resume')&&existsSync(path)){const saved=JSON.parse(readFileSync(path));if(saved.configHash!==configHash||saved.runtimeHash!==sha(runtime.runtimePath)||saved.report.daily.length!==config.cohortDays)throw Error('Stale cohort cache');bank.push(saved.report);measuredCpuSeconds+=saved.elapsedSeconds;cached++;}
 else queue.push(job);
}
console.log(`C2: ${queue.length} accounts queued, ${cached} verified cached; ${workers} local CPU workers.`);
let next=0,finished=0;const active=[];
try{await Promise.all(Array.from({length:Math.min(workers,queue.length)},()=>new Promise((accept,reject)=>{
 const worker=new Worker(new URL('./worker.mjs',import.meta.url),{workerData:{runtimePath:runtime.runtimePath}});active.push(worker);
 const dispatch=()=>{if(existsSync(resolve(root,'STOP-V3B'))){reject(Error('STOP-V3B requested'));return;}const job=queue[next++];if(job)worker.postMessage(job);else{void worker.terminate();accept();}};
 worker.on('error',reject);worker.on('message',row=>{if(row.error){reject(Error(row.error));return;}
  const {report,elapsedSeconds}=row;bank.push(report);measuredCpuSeconds+=elapsedSeconds;
  writeFileSync(resolve(cache,`${report.profile}-${report.seed}.json`),JSON.stringify({configHash,runtimeHash:sha(runtime.runtimePath),elapsedSeconds,report}));
  if(++finished%25===0)console.log(`C2 ${finished}/${queue.length}; elapsed ${((performance.now()-started)/1000).toFixed(1)}s`);dispatch();
 });dispatch();
})));}finally{await Promise.all(active.map(w=>w.terminate()));}
bank.sort((a,b)=>a.profile.localeCompare(b.profile)||a.seed-b.seed);
const rawPath=resolve(B,'BASELINE-COHORT.jsonl.gz');writeFileSync(rawPath,gzipSync(bank.map(x=>JSON.stringify(x)).join('\n')+'\n'));
const cohort={path:rawPath,sha256:sha(rawPath),accounts:bank.length,seedsPerProfile:seeds,days:config.cohortDays,method:'Public C2 rules and native auto battles; session/action time is explicitly modeled, without browser presentation. Paired account/calendar seeds reused across scenarios. Final-fortnight yields are extrapolated after the measured cohort window; this is not 52-week combat telemetry.',profiles:config.profiles.map(p=>{const rows=bank.filter(a=>a.profile===p.id),first=rows.map(a=>a.firstLegendaryDay??config.cohortDays+1);return {id:p.id,seeds:rows.length,censored:rows.filter(a=>a.censoredLegendary).length,legendary:{median:quantile(first,.5),p10:quantile(first,.1),p90:quantile(first,.9)},activeHours:quantile(rows.map(a=>a.daily.reduce((n,d)=>n+d.hours,0)),.5)};})};
const rows=[],raw=[],metrics=['burnClaims','starRatio','heavyCasualHourlyRatio','casualLegendaryDay','heavyLegendaryDay','botRegularHourlyRatio','topOnePercentWithdrawnShare','claims','withdrawals','burn','retained','treasury','balances','openingMarketYarn','remainingMarketYarn','starSource','starSink','volume','lateBurnClaims'];
for(const scenario of cases){
 const results=Array.from({length:seeds},(_,i)=>tokenRun(runtime,config,bank,scenario,43113+i));
 raw.push(...results.map(r=>({scenario:scenario.id,...r})));
 const quantiles=Object.fromEntries([['median',.5],['p10',.1],['p90',.9]].map(([label,p])=>[label,Object.fromEntries(metrics.map(k=>[k,quantile(results.map(r=>r[k]),p)]))]));
 rows.push({...scenario,seeds,tokenWeeks:config.tokenWeeks,gearCohort:cohort,quantiles,undefinedMetrics:Object.fromEntries(metrics.map(k=>[k,results.filter(r=>!Number.isFinite(r[k])).length]))});
 console.log(`${scenario.id}: burn ${quantiles.median.burnClaims?.toFixed(3)}, stars ${quantiles.median.starRatio?.toFixed(3)}, Legendary ${quantiles.median.casualLegendaryDay}/${quantiles.median.heavyLegendaryDay}`);
}
const zeroExternal=cases.filter(s=>s.demand===.5).map(s=>{const r=tokenRun(runtime,config,bank,s,43113,{zeroExternal:true});return {scenario:s.id,burnClaims:r.burnClaims,starRatio:r.starRatio,claims:r.claims,burn:r.burn,balances:r.balances};});
const rawTokenPath=resolve(B,'BASELINE-TOKENS.jsonl.gz');writeFileSync(rawTokenPath,gzipSync(raw.map(x=>JSON.stringify(x)).join('\n')+'\n'));
const log=resolve(root,'reports/v3-shell/b2/tests/e1-model-unit.log');
let liveConfigTest;if(existsSync(log))liveConfigTest={exitCode:/# fail 0\b/.test(readFileSync(log,'utf8'))?0:1,passed:Number(readFileSync(log,'utf8').match(/# pass (\d+)/)?.[1]??0),log:{path:log,sha256:sha(log)}};
const elapsedSeconds=(performance.now()-started)/1000;
const result={schema:1,date:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),configHash,config,sourceFiles:['packages/game-rules/src/cardrpg/economy-v3.ts','packages/game-rules/src/cardrpg/depth/economy-c2.ts','packages/game-rules/src/cardrpg/economy-lab.ts'].map(p=>({path:p,sha256:sha(resolve(root,p))})),elapsedSeconds,cachedAccounts:cached,measuredCohortCpuSeconds:measuredCpuSeconds,workers,scenarios:rows,zeroExternal,liveConfigTest,rawTokens:{path:rawTokenPath,sha256:sha(rawTokenPath)},method:'500 modeled accounts; five player policies with hours/session distributions, weekly churn, Deed rates, withdrawal/sink/market decisions. All claims include finite tester grants. Opening third-party market float is pre-existing circulation, separately conserved and depleted. No retained-fee burn, unfunded trades or automatic controller reductions.'};
writeFileSync(resolve(B,'BASELINE.json'),JSON.stringify(result,null,2)+'\n');console.log(`Complete: ${elapsedSeconds.toFixed(1)}s, ${rows.length} scenarios, ${bank.length} C2 accounts.`);
