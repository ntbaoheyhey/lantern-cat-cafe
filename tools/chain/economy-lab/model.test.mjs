import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLabRuntime,root} from './runtime.mjs';
import {resolve} from 'node:path';
import {gearAccount} from './cohort.mjs';
import {scenarios,tokenRun} from './token.mjs';
import {Worker} from 'node:worker_threads';
import {writeFileSync,mkdirSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {sha} from './runtime.mjs';
const runtime=await loadLabRuntime(resolve(root,'work/economy-lab/tests',String(process.pid))),config=runtime.ECONOMY_LAB;
const fixtureBank=()=>config.profiles.map((p,i)=>({profile:p.id,firstLegendaryDay:i?7:13,daily:Array.from({length:config.cohortDays},(_,d)=>({day:d+1,active:true,hours:p.hours,wins:6,level:20,cleared:[1,2,3],gear:{'hearthloom-weapon-epic':3}}))}));
test('all eighteen unique scenario combinations retain independent bot shares',()=>{
 const cases=scenarios(config);assert.equal(cases.length,18);assert.equal(new Set(cases.map(c=>c.id)).size,18);
 for(const mix of Object.keys(config.mixes))for(const demand of [.5,1])for(const botShare of [.1,.2,.35])assert(cases.some(c=>c.mix===mix&&c.demand===demand&&c.botShare===botShare));
});
test('live weekly reward changes the token ledger; retained fees are never burns',()=>{
 const bank=fixtureBank(),scenario=scenarios(config)[0],original=config.policy.rewards.weeklySpool;
 try{
  const before=tokenRun(runtime,config,bank,scenario,43113);
  config.policy.rewards.weeklySpool=original*2;
  const after=tokenRun(runtime,config,bank,scenario,43113);
  assert(after.withdrawals>before.withdrawals);assert.equal(after.testerClaims,config.initial.testerYarn*config.initial.testerRecipients);
  assert(Math.abs(after.retained-after.withdrawals*config.policy.spool.feeBp/(10000-config.policy.spool.feeBp))<1e-6);
  assert(Math.abs(after.conservationError)<1e-6);assert.equal(after.burn,Object.values(after.burnBySink).reduce((n,x)=>n+x,0));
 }finally{config.policy.rewards.weeklySpool=original;}
});
test('craft rebates use the production quote, preserve conservation, and cannot exceed paid burns',()=>{
 const bank=fixtureBank(),original={...config.policy.craft};
 try{
  Object.assign(config.policy.craft,{rebateBp:7500,weeklySpoolCap:2});
  const r=tokenRun(runtime,config,bank,scenarios(config)[0],43113);
  assert(r.craftRebates>0);assert(r.craftRebates<=(r.burnBySink.polish+r.burnBySink.decor+r.burnBySink.display)*.75+1e-6);
  assert(Math.abs(r.conservationError)<1e-6);
 }finally{Object.assign(config.policy.craft,original);}
});
test('no external opening stock cannot produce more burns than all claims',()=>{
 for(const scenario of scenarios(config)){
  const r=tokenRun(runtime,config,fixtureBank(),scenario,92811,{zeroExternal:true});
  assert.equal(r.openingMarketYarn,0);assert.equal(r.externalVolume,0);assert(r.burnClaims<=1+1e-9);
  assert(r.balances>=-1e-6);assert(Math.abs(r.claims-r.burn-r.treasury-r.balances)<1e-6);
 }
});
test('C2 invitation draws read the identical live policy object',()=>{
 const odds=config.policy.gear.odds,original={...odds};
 try{
  const before=gearAccount(runtime,config,90001,config.profiles[0],{days:2});
  Object.assign(odds,{common:0,rare:0,epic:0,legendary:10000});
  const after=gearAccount(runtime,config,90001,config.profiles[0],{days:2});
  assert.equal(after.firstLegendaryDay,1);assert.notEqual(before.firstLegendaryDay,after.firstLegendaryDay);
  assert(after.actions['gear-invitation']>0);assert(after.spent.stamps>0,'earned Bells paid for the real invitation');
 }finally{Object.assign(odds,original);}
});
test('the cohort accounts for actual modeled play time, excluding unused bot hours',()=>{
 const bot=gearAccount(runtime,config,90002,config.profiles.find(p=>p.id==='bot'),{days:2});
 for(const d of bot.daily)assert.equal(d.hours,d.modeledSeconds/3600);
 assert(bot.daily.some(d=>d.hours<d.plannedHours));assert(bot.daily.every(d=>d.routes<=6));
});
test('an encounter win without a completed route never issues weekly server rewards',()=>{
 const bank=fixtureBank().map(a=>({...a,daily:a.daily.map(d=>({...d,completedRoutes:[],cleared:[]}))}));
 const r=tokenRun(runtime,config,bank,scenarios(config)[0],8711);
 assert.equal(r.starSource,0);assert.equal(r.withdrawals,0);
});
test('new native cohorts preserve exact item quality and first Legendary origin',()=>{
 const account=gearAccount(runtime,config,90001,config.profiles[0],{days:2});
 const items=account.daily.flatMap(d=>d.gearItems);
 assert(items.length>0);assert(items.every(g=>Number.isInteger(g.quality)&&g.quality>=0&&g.quality<=10000&&g.source));
 const old=config.policy.gear.odds,original={...old};
 try{Object.assign(old,{common:0,rare:0,epic:0,legendary:10000});
  const a=gearAccount(runtime,config,90001,config.profiles[0],{days:1});
  assert.equal(a.firstLegendarySource,'gear-invitation');
 }finally{Object.assign(old,original);}
});
test('sensitivity workers use the independently measured native bank and verify its hash',async()=>{
 const folder=resolve(root,'work/economy-lab/tests/bank-switch-'+process.pid);mkdirSync(folder,{recursive:true});
 const first=resolve(folder,'first.jsonl.gz'),second=resolve(folder,'second.jsonl.gz');
 writeFileSync(first,gzipSync(fixtureBank().map(r=>JSON.stringify(r)).join('\n')));
 writeFileSync(second,gzipSync(fixtureBank().map(r=>JSON.stringify({...r,firstLegendaryDay:r.profile==='casual'?19:11})).join('\n')));
 const worker=new Worker(new URL('./search-worker.mjs',import.meta.url),{workerData:{runtimePath:runtime.runtimePath,bankPath:first}});
 const run=job=>new Promise((accept,reject)=>{worker.once('message',accept);worker.once('error',reject);worker.postMessage(job);});
 try{
  const candidate=structuredClone(config);candidate.population=50;candidate.tokenWeeks=2;
  const job={id:'native-bank',config:candidate,seeds:1,firstSeed:92,scenarios:[scenarios(candidate)[0]]};
  const a=await run(job),b=await run({...job,bankPath:second,bankHash:sha(second)});
  assert.equal(a.scenarioScores[0].quantiles.median.casualLegendaryDay,13);
  assert.equal(b.scenarioScores[0].quantiles.median.casualLegendaryDay,19);
  const bad=await run({...job,bankPath:second,bankHash:'wrong'});assert.match(bad.error,/bank hash mismatch/);
 }finally{await worker.terminate();}
});
