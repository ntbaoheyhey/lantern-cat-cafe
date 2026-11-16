/** Observation-only purchase/withdrawal eligibility. LEARN/S2b-boundary.md.
 * Exact replay is required for every run; this is never a candidate gate.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gunzipSync,gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {root,sha,quantile} from '../../chain/economy-lab/runtime.mjs';
import {restoreModel} from '../../chain/economy-lab/freeze.mjs';

const folder=resolve(root,'reports/v4-ship/S2b'),output=resolve(folder,'eligibility-observation-1.json');
assert(!existsSync(output),'Preserve the previous observation');
const labels=['CLASS-POWER-RETENTION25','CLASS-OFFENSE120-POWER25-TOKENS'];
const scenarioIds=['casual-heavy-d0.5-b0.1','casual-heavy-d0.5-b0.35'];
const blocks=[{name:'original',firstSeed:53113,seeds:100},{name:'new-token-only',firstSeed:83113,seeds:100}];
const rows=[],groups=[],models=[],log=[],started=performance.now();
let exactComparisons=0;
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP');
const replace=(s,a,b)=>{assert.equal(s.split(a).length,2,'Unique observation anchor');return s.replace(a,b);};
const stats=xs=>({mean:xs.reduce((a,b)=>a+b,0)/xs.length,median:quantile(xs,.5),p10:quantile(xs,.1),p90:quantile(xs,.9)});
const save=()=>{
 const rawPath=resolve(folder,'eligibility-observation-1.jsonl.gz');
 writeFileSync(rawPath,gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
 writeFileSync(resolve(folder,'eligibility-observation-1.log.json.gz'),gzipSync(JSON.stringify(log)));
 const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  scope:'Fixed-policy observation, not intervention/candidate/fresh native holdout',labSha256:sha(import.meta.filename),blocks,models,groups,
  checks:{exactComparisons,expected:800,pass:exactComparisons===800},candidateEligible:false,officialClassGate:false,newBaseline:false,
  raw:{path:relative(root,rawPath),sha256:sha(rawPath),runs:rows.length},seconds:(performance.now()-started)/1000,
  limits:['Repeated account-week opportunities and purchase attempts, not distinct users or additional successful purchases.',
   'The 1.20 model remains rejected; production is 1.15/2500bp.',
   'Only token seeds change in the second block; both native banks are fixed historical cohorts.',
   'No rate, reward, price, preference, threshold, clock, class source or production change.']};
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
};
try{
 for(const label of labels){
  stop();
  const reportPath=resolve(folder,'econ',label+'.json'),report=JSON.parse(readFileSync(reportPath));
  const manifestPath=resolve(root,report.bank.path),manifest=JSON.parse(readFileSync(manifestPath));
  assert.equal(sha(manifestPath),report.bank.manifestSha256);
  const bankPath=resolve(root,manifest.cohort.path);assert.equal(sha(bankPath),report.bank.sha256);
  const bank=gunzipSync(readFileSync(bankPath)).toString().trim().split('\n').map(JSON.parse);
  assert.equal(bank.length,1000);
  const restored=restoreModel('eligibility-observe-'+label,report.modelSnapshot);
  const directory=dirname(restored.runtimePath),tokenPath=resolve(directory,'tools/chain/economy-lab/token.mjs');
  const studioPath=resolve(dirname(tokenPath),'studio.mjs');
  const observedToken=resolve(dirname(tokenPath),'token-eligibility.mjs'),observedStudio=resolve(dirname(tokenPath),'studio-eligibility.mjs');
  let studio=readFileSync(studioPath,'utf8');
  studio=replace(studio,'id,now,spend) {','id,now,spend,observe) {');
  studio=replace(studio,"if(id==='polish'&&!item)return null;","if(id==='polish'&&!item){observe(id,'no-item',account);return null;}");
  studio=replace(studio,"if(id==='display'&&inventory.styles.includes(\x60display:\x24{runtime.ECONOMY_LAB.sinks.display.maxLevel}\x60))return null;","if(id==='display'&&inventory.styles.includes(\x60display:\x24{runtime.ECONOMY_LAB.sinks.display.maxLevel}\x60)){observe(id,'finite-complete',account);return null;}");
  studio=replace(studio,"if(id==='decor'&&runtime.v3Season&&inventory.styles.includes(\x60decor:\x24{runtime.v3Season(now).number}\x60))return null;","if(id==='decor'&&runtime.v3Season&&inventory.styles.includes(\x60decor:\x24{runtime.v3Season(now).number}\x60)){observe(id,'season-complete',account);return null;}");
  studio=replace(studio,'catch{return null;}','catch{observe(id,\'quote-ineligible\',account);return null;}');
  studio=replace(studio,"if(account.stars<quote.starThread||!spend(account,quote.yarn,id))return null;","if(account.stars<quote.starThread){observe(id,'stars',account);return null;}if(!spend(account,quote.yarn,id)){observe(id,'yarn',account);return null;}observe(id,'success',account);");
  writeFileSync(observedStudio,studio);
  let token=readFileSync(tokenPath,'utf8');
  token=replace(token,"'./studio.mjs'","'./studio-eligibility.mjs'");
  token=replace(token,' const spend=(a,cost,kind)=>{'," const eligibility={};const observe=(kind,reason,a)=>{const k=[a.p.id,kind,reason].join(':');eligibility[k]=(eligibility[k]??0)+1;};\n const spend=(a,cost,kind)=>{");
  token=replace(token,'   if(a.deed&&a.level>=E.deed.level',"   observe('withdraw',!a.deed?'no-deed':a.level<E.deed.level?'level':week*7<E.spool.minAgeDays?'age':'eligible',a);\n   if(a.deed&&a.level>=E.deed.level");
  token=replace(token,'   // A finite desired loadout.',"   observe('fusion',!set?'no-set':a.fusions>=16?'finite-complete':a.stars<E.fusion.legendary.starThread?'stars':a.yarn<E.fusion.legendary.yarn?'yarn':'eligible',a);\n   // A finite desired loadout.");
  token=replace(token,'config.startEpoch+week*7*86400000,spend);','config.startEpoch+week*7*86400000,spend,observe);');
  token=replace(token,'   if(a.level>=E.seal.level',"   observe('seal',a.level<E.seal.level?'level':!a.market?'no-market':a.bossSeals<E.seal.bossSeals?'boss-seals':!Object.keys(a.epics).some(k=>a.epics[k]>0)?'no-item':a.yarn<E.seal.reference.epic*E.seal.feeBp/10000?'yarn':'eligible',a);\n   if(a.level>=E.seal.level");
  token=replace(token,' return {seed,burnClaims:',' return {eligibility,seed,burnClaims:');
  writeFileSync(observedToken,token);
  const runtime=await import(pathToFileURL(restored.runtimePath)),core=await import(pathToFileURL(resolve(directory,'tools/chain/economy-lab/search-core.mjs')));
  assert.equal(core.hashConfig(report.config),report.configHash);
  const config=core.applyConfig(runtime.ECONOMY_LAB,structuredClone(report.config));assert.equal(config.policy.spool.feeBp,2500);
  const original=await import(pathToFileURL(tokenPath)),observed=await import(pathToFileURL(observedToken));
  const nativeProfiles=config.profiles.map(p=>{
   const accounts=bank.filter(a=>a.profile===p.id),weeks=accounts.flatMap(a=>Array.from({length:6},(_,i)=>a.daily.slice(i*7,i*7+7)));
   return {profile:p.id,accounts:accounts.length,level15Day:stats(accounts.map(a=>a.daily.find(d=>d.level>=15)?.day??43)),
    firstLegendaryDay:stats(accounts.map(a=>a.firstLegendaryDay??43)),weeks:weeks.length,
    zeroRewardWeeks:weeks.filter(ds=>ds.every(d=>!d.completedRoutes.length)).length,
    level15Weeks:weeks.filter(ds=>ds.some(d=>d.level>=15)).length,
    firstLegendarySources:Object.fromEntries([...new Set(accounts.map(a=>a.firstLegendarySource??'censored'))].map(k=>[k,accounts.filter(a=>(a.firstLegendarySource??'censored')===k).length]))};
  });
  models.push({label,reportSha256:sha(reportPath),bank:report.bank,configHash:report.configHash,
   observedTokenSha256:sha(observedToken),observedStudioSha256:sha(observedStudio),nativeProfiles});
  for(const block of blocks)for(const scenarioId of scenarioIds){
   const saved=report.scenarios.find(s=>s.id===scenarioId);assert(saved);
   const scenario={id:saved.id,mix:saved.mix,demand:saved.demand,botShare:saved.botShare},samples=[];
   for(let i=0;i<block.seeds;i++){
    stop();const seed=block.firstSeed+i;
    const control=original.tokenRun(runtime,config,bank,scenario,seed),value=observed.tokenRun(runtime,config,bank,scenario,seed);
    const {eligibility,...unchanged}=value;assert.deepEqual(unchanged,control,'Observation must preserve all fields and RNG');
    exactComparisons++;
    const row={label,block:block.name,scenario:scenarioId,seed,burnClaims:value.burnClaims,starRatio:value.starRatio,eligibility};
    rows.push(row);samples.push(row);
   }
   const keys=[...new Set(samples.flatMap(s=>Object.keys(s.eligibility)))].sort();
   groups.push({label,block,scenario:scenarioId,burnClaims:stats(samples.map(s=>s.burnClaims)),starRatio:stats(samples.map(s=>s.starRatio)),
    eligibility:Object.fromEntries(keys.map(k=>[k,stats(samples.map(s=>s.eligibility[k]??0))]))});
   const progress={label,block:block.name,scenario:scenarioId,exactComparisons};log.push(progress);console.log(JSON.stringify(progress));save();
  }
 }
}catch(error){log.push({error:error.message});save();throw error;}
save();assert.equal(exactComparisons,800);
console.log(JSON.stringify({output:relative(root,output),exactComparisons,candidateEligible:false}));
