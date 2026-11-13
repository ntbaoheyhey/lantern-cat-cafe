import {createHash} from 'node:crypto';
import {rng,quantile} from './runtime.mjs';
import {tokenRun,scenarios} from './token.mjs';
import {T} from '../../../scripts/v3b2/thresholds.mjs';
export const LEVERS=[
 ['policy.rewards.weeklySpool',.25,2,.05],['policy.rewards.chapterSpool',0,2,1],['policy.rewards.seasonRankMax',1,6,1],['policy.rewards.starThreadBankCap',1,8,1],
 ['policy.spool.skinCost',2,8,1],['policy.spool.weeklyNetCap',4,12,1],['policy.fusion.legendary.yarn',6,26,1],['policy.fusion.legendary.starThread',1,3,1],
 ['policy.seal.feeBp',500,1500,100],['sinks.polish.yarn.0',1,8,1],['sinks.polish.yarn.1',3,16,1],
 ['sinks.polish.starThread.0',1,3,1],['sinks.polish.starThread.1',1,5,1],['sinks.decor.yarn',1,8,1],
 ['sinks.decor.starThread',1,8,1],['sinks.display.yarn',1,6,1],['sinks.display.starThread',1,4,1],
].map(([path,min,max,step])=>({path,min,max,step}));
export const get=(o,path)=>path.split('.').reduce((a,k)=>a[k],o);
export function set(o,path,value){const ks=path.split('.'),key=ks.pop();ks.reduce((a,k)=>a[k],o)[key]=value;}
export const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export const hashConfig=c=>createHash('sha256').update(JSON.stringify(canonical(c))).digest('hex');
/** Preserve module reference identity: production quotes and C2 rules see updates. */
export function applyConfig(target,source){for(const [k,v] of Object.entries(source)){if(v&&typeof v==='object'&&target[k]&&typeof target[k]==='object')applyConfig(target[k],v);else target[k]=structuredClone(v);}return target;}
const snap=(v,l)=>Number((Math.max(l.min,Math.min(l.max,l.min+Math.round((v-l.min)/l.step)*l.step))).toFixed(4));
export function validConfig(c){
 const s=c.sinks,cap=c.policy.rewards.starThreadBankCap??Infinity;
 return s.polish.yarn[1]>=s.polish.yarn[0]&&s.polish.starThread[1]>=s.polish.starThread[0]
  &&Math.max(...s.polish.starThread,s.decor.starThread,s.display.starThread,c.policy.fusion.legendary.starThread)<=cap;
}
export function candidates(base,count,seed,{center,levers=LEVERS,seen=new Set()}={}){
 const random=rng(seed),rows=[];let attempts=0;
 // Stratified Latin hypercube with independent permutations per dimension.
 const strata=levers.map(()=>{const a=Array.from({length:count},(_,i)=>i);for(let j=a.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[a[j],a[k]]=[a[k],a[j]];}return a;});
 while(rows.length<count){
  if(++attempts>count*10000)throw Error('Candidate space exhausted');
  const c=structuredClone(base),i=rows.length;
  for(let j=0;j<levers.length;j++){
   const original=levers[j],l=original.path.includes('starThread')&&!original.path.endsWith('BankCap')?{...original,max:Math.min(original.max,c.policy.rewards.starThreadBankCap)}:original;
   const u=attempts<=count?((strata[j][i]+random())/count):random();
   const value=center?get(center,l.path)+(u-.5)*(l.max-l.min)*.35:l.min+u*(l.max-l.min);
   set(c,l.path,snap(value,l));
  }
  if(!validConfig(c))continue;const hash=hashConfig(c);if(seen.has(hash))continue;seen.add(hash);rows.push({config:c,configHash:hash});
 }
 return rows;
}
const bounded=(x,min,max=Infinity)=>!Number.isFinite(x)?100:x<min?(min-x)/Math.max(min,.1):x>max?(x-max)/Math.max(max,.1):0;
export function targetDistances(q,scenario){return {
 'T-a':bounded(q.burnClaims,T.burnClaimsMin,scenario.demand===1?T.fullDemandBurnClaimsMax:Infinity),
 'T-b':bounded(q.starRatio,T.starRatioMin,T.starRatioMax),
 'T-c':bounded(q.heavyCasualHourlyRatio,1/T.hourlyRatioMax,T.hourlyRatioMax),
 'T-d':bounded(q.casualLegendaryDay,T.casualLegendaryMin,T.casualLegendaryMax)+bounded(q.heavyLegendaryDay,T.heavyLegendaryMin,T.heavyLegendaryMax)+(q.heavyLegendaryDay>=q.casualLegendaryDay?1:0),
 'T-e':scenario.botShare===.35?bounded(q.botRegularHourlyRatio,0,T.botHourlyRatioMax):0,
 'T-f':bounded(q.topOnePercentWithdrawnShare,0,T.topPercentWithdrawnShareMax),
};}
export const METRICS=['burnClaims','starRatio','heavyCasualHourlyRatio','casualLegendaryDay','heavyLegendaryDay','botRegularHourlyRatio','topOnePercentWithdrawnShare','claims','withdrawals','burn','starSource','starSink','starBalances','inactiveStarBalances','pausedStarGrants','lateBurnClaims'];
export function evaluate(runtime,bank,candidate,seeds,firstSeed=43113,scenarioOverrides){
 const config=applyConfig(runtime.ECONOMY_LAB,candidate),rows=[];
 for(const scenario of scenarioOverrides??scenarios(config)){
  const runs=Array.from({length:seeds},(_,i)=>tokenRun(runtime,config,bank,scenario,firstSeed+i));
  const quantiles=Object.fromEntries([['median',.5],['p10',.1],['p90',.9]].map(([label,p])=>[label,Object.fromEntries(METRICS.map(k=>[k,quantile(runs.map(r=>r[k]),p)]))]));
  const distances=targetDistances(quantiles.median,scenario);
  distances['T-g']=(scenario.demand===.5?bounded(quantiles.p90.burnClaims,T.robustBurnMin):0)+bounded(quantiles.p90.starRatio,T.robustStarMin,T.robustStarMax);
  // Also penalize the lower-tail burn, although the requested gate names p90.
  const lowerTail=scenario.demand===.5?bounded(quantiles.p10.burnClaims,T.robustBurnMin):0;
  const score=distances['T-a']*5+distances['T-b']*5+distances['T-d']*3+distances['T-e']*2+distances['T-c']+distances['T-f']+distances['T-g']*2+lowerTail;
  rows.push({...scenario,seeds,tokenWeeks:config.tokenWeeks,quantiles,distances,score});
 }
 const worst=Math.max(...rows.map(s=>s.score)),mean=rows.reduce((n,s)=>n+s.score,0)/rows.length;
 return {configHash:hashConfig(config),seeds,firstSeed,score:worst*3+mean,worst,mean,scenarioScores:rows};
}
export function nativePolicy(config){
 const c2=structuredClone(config.c2),tailoring=config.policy.tailoring?.legendary??{...c2.tailoring.legendary,materials:c2.legendary.materials,seals:c2.legendary.seals};
 // V3 overrides only this recipe. Retain every other C2 progression/combat knob.
 delete c2.tailoring.legendary;delete c2.legendary.materials;delete c2.legendary.seals;
 const profiles=config.profiles.map(p=>Object.fromEntries(['id','hours','hoursSigma','sessionMinutes','activeDays','upgrades'].map(k=>[k,p[k]])));
 return {c2,profiles,timing:config.timing,cohortDays:config.cohortDays,startEpoch:config.startEpoch,progression:{...Object.fromEntries(['cat','gear','shards','starShards','selector','enhancement','drops'].map(k=>[k,config.policy[k]])),tailoring}};
}
