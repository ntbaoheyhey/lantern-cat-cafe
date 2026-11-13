import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLabRuntime} from './runtime.mjs';
import {gearAccount} from './cohort.mjs';
import {scenarios,tokenRun} from './token.mjs';
const runtime=await loadLabRuntime(),config=runtime.ECONOMY_LAB;
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
