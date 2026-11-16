/** Observation-only E3 diagnosis. LEARN/S2b-boundary.md.
 * Replays immutable model snapshots. No policy, thresholds or production edits.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gunzipSync,gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {root,sha,quantile,rng} from '../../chain/economy-lab/runtime.mjs';
import {restoreModel} from '../../chain/economy-lab/freeze.mjs';

const folder=resolve(root,'reports/v4-ship/S2b');
const output=resolve(folder,'boundary-diagnosis.json');
assert(!existsSync(output),'Preserve completed evidence; choose a new item if repeating');
const rawPath=resolve(folder,'boundary-runs.jsonl.gz');
const previousRawSha256=existsSync(rawPath)?sha(rawPath):null;
const sources=['CLASS-POWER-RETENTION25','CLASS-OFFENSE120-POWER25-TOKENS','CLASS-POWER-RETENTION15'];
const scenarioIds=['casual-heavy-d0.5-b0.1','casual-heavy-d0.5-b0.35'];
const blocks=[{id:'replay',firstSeed:53113,seeds:200},{id:'holdout',firstSeed:73113,seeds:200}];
const start=performance.now(),raw=[],groups=[],models=[],nativeSummaries=[];
let exactComparisons=0,identityComparisons=0,quantileComparisons=0,expectedQuantileComparisons=0;
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP'))&&!existsSync(resolve(root,'reports/v4-ship/STOP-V4SHIP')),'STOP-V4SHIP');
const sum=xs=>xs.reduce((a,b)=>a+b,0),mean=xs=>sum(xs)/xs.length;
const close=(a,b,label)=>assert(Math.abs(a-b)<1e-6,`${label}: ${a} vs ${b}`);
const replace=(source,anchor,value)=>{assert.equal(source.split(anchor).length,2,`Observation anchor: ${anchor}`);return source.replace(anchor,value);};
const profileKeys=[];
function stats(rows,get){const xs=rows.map(get);assert(xs.every(Number.isFinite));return {mean:mean(xs),median:quantile(xs,.5),p10:quantile(xs,.1),p90:quantile(xs,.9)};}
function fields(rows,keys,get=(r,k)=>r[k]){return Object.fromEntries(keys.map(k=>[k,stats(rows,r=>get(r,k))]));}
function instrument(source){
 source=replace(source,' const spend=(a,cost,kind)=>{',' const spendFailures={},spendSuccesses={},profileStarSource={};\n const spend=(a,cost,kind)=>{');
 source=replace(source,'if(a.yarn+1e-9<cost)return false;',`if(a.yarn+1e-9<cost){const k=a.p.id+':'+kind;spendFailures[k]=(spendFailures[k]??0)+1;return false;}const k=a.p.id+':'+kind;spendSuccesses[k]=(spendSuccesses[k]??0)+1;`);
 source=replace(source,'a.stars+=grant;starSource+=grant;','a.stars+=grant;starSource+=grant;profileStarSource[a.p.id]=(profileStarSource[a.p.id]??0)+grant;');
 source=replace(source,' return {seed,burnClaims:',` const diagnosis={spendFailures,spendSuccesses,byProfile:Object.fromEntries(types.map(p=>{const xs=all.filter(a=>a.p.id===p.id);return [p.id,{accounts:xs.length,active:xs.filter(a=>a.alive).length,yarn:sum(xs,a=>a.yarn),inactiveYarn:sum(xs.filter(a=>!a.alive),a=>a.yarn),stars:sum(xs,a=>a.stars),inactiveStars:sum(xs.filter(a=>!a.alive),a=>a.stars),starSource:profileStarSource[p.id]??0,starSink:(profileStarSource[p.id]??0)-sum(xs,a=>a.stars),spool:sum(xs,a=>a.spool),epics:sum(xs,a=>Object.values(a.epics).reduce((x,y)=>x+y,0)),unpolished:sum(xs,a=>a.studio.gear.filter(g=>g.quality<runtime.ECONOMY_LAB.policy.quality.at(-1).floorBp).length),withdrawn:sum(xs,a=>a.withdrawn),burn:sum(xs,a=>a.burn)}];}))};\n return {diagnosis,seed,burnClaims:`);
 return source;
}
const rawMetrics=['burnClaims','starRatio','claims','burn','retained','treasury','balances','externalVolume','starSource','starSink','starBalances','inactiveStarBalances','pausedStarGrants','lateBurnClaims','seals','fusions','craftRebates'];
const profileMetrics=['accounts','active','yarn','inactiveYarn','stars','inactiveStars','starSource','starSink','spool','epics','unpolished','withdrawn','burn'];
function summarize(rows){
 return {metrics:fields(rows,rawMetrics),
  margins:fields(rows,['yarnSlack','starSlack','additionalStarSinksAtFixedSource','first13YarnSlack','last13YarnSlack'],(r,k)=>({
   yarnSlack:r.burn-r.claims,starSlack:1.1*r.starSink-r.starSource,additionalStarSinksAtFixedSource:Math.max(0,r.starSource/1.1-r.starSink),
   first13YarnSlack:sum(r.weeks.slice(0,13).map(w=>w.burn-w.claims))-r.testerClaims,last13YarnSlack:sum(r.weeks.slice(-13).map(w=>w.burn-w.claims))})[k]),
  burnBySink:fields(rows,Object.keys(rows[0].burnBySink),(r,k)=>r.burnBySink[k]),
  studioPurchases:fields(rows,Object.keys(rows[0].studioPurchases),(r,k)=>r.studioPurchases[k]),
  byProfile:Object.fromEntries(profileKeys.map(p=>[p,fields(rows,profileMetrics,(r,k)=>r.diagnosis.byProfile[p][k])])),
  insufficientYarnAttempts:fields(rows,[...new Set(rows.flatMap(r=>Object.keys(r.diagnosis.spendFailures)))].sort(),(r,k)=>r.diagnosis.spendFailures[k]??0),
  weeks:rows[0].weeks.map((_,i)=>({week:i+1,...fields(rows,['active','claims','burn','starSource','starSink'],(r,k)=>r.weeks[i][k])})),
  perSeedPassing:{burn:rows.filter(r=>r.burnClaims>=1).length,star:rows.filter(r=>r.starRatio<=1.1&&r.starRatio>=.9).length},
 };
}
for(const label of sources){
 stop();
 const reportPath=resolve(folder,'econ',label+'.json'),report=JSON.parse(readFileSync(reportPath));
 assert.equal(report.seeds,200);assert.equal(report.firstSeed,53113);assert.equal(report.complete,true);
 const manifestPath=resolve(root,report.bank.path),manifest=JSON.parse(readFileSync(manifestPath));
 assert.equal(sha(manifestPath),report.bank.manifestSha256);
 const bankPath=resolve(root,manifest.cohort.path);assert.equal(sha(bankPath),report.bank.sha256);
 const bank=gunzipSync(readFileSync(bankPath)).toString().trim().split('\n').map(JSON.parse);
 const keys=bank.map(a=>`${a.profile}:${a.seed}`);
 assert.equal(new Set(keys).size,1000);if(models.length)assert.deepEqual(keys,models[0].accountKeys);
 const restored=restoreModel('boundary-'+label,report.modelSnapshot);
 const directory=dirname(restored.runtimePath),tokenPath=resolve(directory,'tools/chain/economy-lab/token.mjs');
 const observedPath=resolve(dirname(tokenPath),'token-observed.mjs');writeFileSync(observedPath,instrument(readFileSync(tokenPath,'utf8')));
 const runtime=await import(pathToFileURL(restored.runtimePath));
 const core=await import(pathToFileURL(resolve(directory,'tools/chain/economy-lab/search-core.mjs')));
 assert.equal(core.hashConfig(report.config),report.configHash);
 const config=core.applyConfig(runtime.ECONOMY_LAB,structuredClone(report.config));
 assert.equal(config.policy.spool.feeBp,label.endsWith('15')?1500:2500);
 if(!profileKeys.length)profileKeys.push(...config.profiles.map(p=>p.id));
 const original=await import(pathToFileURL(tokenPath)),observed=await import(pathToFileURL(observedPath));
 const entry={label,reportSha256:sha(reportPath),configHash:report.configHash,retentionBp:config.policy.spool.feeBp,modelSnapshot:report.modelSnapshot,bank:report.bank,observedSourceSha256:sha(observedPath),accountKeys:keys};
 models.push(entry);
 if(!label.endsWith('15'))nativeSummaries.push({label,profiles:profileKeys.map(profile=>{
  const rows=bank.filter(r=>r.profile===profile);
  return {profile,accounts:rows.length,...fields(rows,['firstLegendary','firstLevel15','completedRoutes','activeHours','gearItems','imperfectHighRarity'],(r,k)=>({
   firstLegendary:r.firstLegendaryDay??43,firstLevel15:r.daily.find(d=>d.level>=15)?.day??43,
   completedRoutes:sum(r.daily.map(d=>d.completedRoutes.length)),activeHours:sum(r.daily.map(d=>d.hours)),
   gearItems:sum(r.daily.map(d=>d.gearItems.length)),imperfectHighRarity:sum(r.daily.map(d=>d.gearItems.filter(g=>['epic','legendary'].includes(runtime.R.GEAR_BY_ID[g.template].rarity)&&g.quality<8500).length))})[k])};
 })});
 for(const block of blocks.filter(b=>!label.endsWith('15')||b.id==='replay'))for(const scenarioId of scenarioIds){
  const saved=report.scenarios.find(s=>s.id===scenarioId);assert(saved);
  const scenario={id:saved.id,mix:saved.mix,demand:saved.demand,botShare:saved.botShare},rows=[];
  for(let i=0;i<block.seeds;i++){
   stop();const seed=block.firstSeed+i;
   const control=original.tokenRun(runtime,config,bank,scenario,seed);
   const value=observed.tokenRun(runtime,config,bank,scenario,seed);
   const {diagnosis,...unchanged}=value;assert.deepEqual(unchanged,control,'Instrumentation must preserve every original output');exactComparisons++;
   close(value.burn-value.claims,value.externalVolume-value.treasury-value.balances,'YARN bridge');
   assert.equal(value.starSource,value.starSink+value.starBalances);identityComparisons++;
   rows.push(value);raw.push({label,block:block.id,scenario:scenarioId,...value});
  }
  if(block.id==='replay')for(const [name,q] of [['median',.5],['p10',.1],['p90',.9]]){
   expectedQuantileComparisons+=Object.keys(saved.quantiles[name]).length;
   for(const [metric,expected] of Object.entries(saved.quantiles[name])){
    const actual=quantile(rows.map(r=>r[metric]),q);assert.equal(actual,expected,`${label} ${scenarioId} ${name} ${metric}`);quantileComparisons++;
   }
  }
  const summary=summarize(rows),value={label,block,scenario,...summary};groups.push(value);
  console.log(JSON.stringify({label,block:block.id,scenario:scenarioId,burn:summary.metrics.burnClaims.median,stars:summary.metrics.starRatio.median,exactComparisons}));
 }
}
// A reproducible percentile bootstrap, separate from the frozen pass/fail rules.
function pairedInterval(a,b,kind,seed){
 assert.equal(a.length,b.length);const random=rng(seed),boot=[];
 const statistic=(x,y)=>kind==='mean'?mean(y.map((v,i)=>v-x[i])):quantile(y,.5)-quantile(x,.5);
 for(let j=0;j<5000;j++){const x=[],y=[];for(let i=0;i<a.length;i++){const k=Math.floor(random()*a.length);x.push(a[k]);y.push(b[k]);}boot.push(statistic(x,y));}
 return {estimate:statistic(a,b),confidence95:[quantile(boot,.025),quantile(boot,.975)],resamples:5000,seed};
}
const comparisons=[];
for(const block of blocks)for(const scenario of scenarioIds){
 const a=raw.filter(r=>r.label===sources[0]&&r.block===block.id&&r.scenario===scenario);
 const b=raw.filter(r=>r.label===sources[1]&&r.block===block.id&&r.scenario===scenario);assert.deepEqual(a.map(r=>r.seed),b.map(r=>r.seed));
 const metrics=Object.fromEntries(rawMetrics.map((k,i)=>[k,{mean:pairedInterval(a.map(r=>r[k]),b.map(r=>r[k]),'mean',81001+i),median:pairedInterval(a.map(r=>r[k]),b.map(r=>r[k]),'median',82001+i)}]));
 comparisons.push({block:block.id,scenario,contrast:'1.20 minus 1.15',metrics});
}
const rawBytes=gzipSync(raw.map(r=>JSON.stringify(r)).join('\n')+'\n');
if(previousRawSha256){
 assert.deepEqual(gunzipSync(readFileSync(rawPath)),gunzipSync(rawBytes),'A repeated diagnostic must preserve all prior run evidence');
}else writeFileSync(rawPath,rawBytes);
const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),labSha256:sha(import.meta.filename),
 purpose:'Fixed-policy diagnosis only; original E3 failures remain authoritative; no new baseline or candidate selection',
 models:models.map(({accountKeys,...m})=>({...m,orderedAccountKeysEqual:true})),blocks,scenarioIds,nativeSummaries,groups,comparisons,
 checks:{exactComparisons,identityComparisons,quantileComparisons,expectedQuantileComparisons,previousRawSha256,pass:exactComparisons===2000&&identityComparisons===2000&&quantileComparisons===expectedQuantileComparisons},
 raw:{path:relative(root,rawPath),sha256:sha(rawPath),runs:raw.length},elapsedSeconds:(performance.now()-start)/1000,
 limits:['Same frozen native banks, not fresh native-cohort holdout.','Shared initial seeds can diverge in branch-dependent RNG consumption.','Bootstrap intervals describe modeled sampling variation, not live-player uncertainty or permission to lower a gate.','Spend-failure counts are repeated attempts, not independent unmet customers.','No rate, threshold, clock, asset, deployment or production change.']};
// Compare every saved metric; derive the count from the immutable reports.
assert(report.checks.pass,JSON.stringify(report.checks));
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:relative(root,output),checks:report.checks,seconds:report.elapsedSeconds}));
