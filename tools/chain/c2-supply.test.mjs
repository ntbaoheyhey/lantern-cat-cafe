import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRules} from '../cardrpg-sim/load.mjs';
import {loadC2Inputs,reconcileC2,c2Scenario} from './c2-supply.mjs';
import {simulate,mixes} from './token-sim.mjs';
const loaded=await loadRules();
const catalog=loaded.rules.TRADE_BY_ID;
const inputs=loadC2Inputs();
await loaded.vite.close();
test('C2 source reconciles every item, hours, partial week and declared mix',()=>{
  const r=reconcileC2(inputs,catalog);
  assert.equal(r.counts.accounts,600);assert.equal(r.counts.eligible,64);
  assert(Math.abs(r.byProfile.casual.epicPerActiveWeek-14.403666666666667)<1e-8);
  assert.equal(r.byProfile.casual.rarePerActiveWeek,0);
  const s=c2Scenario(r);
  assert.equal(s.hoursByType.casual,3.5);assert.equal(s.hoursByType.regular,7);assert.equal(s.hoursByType.farmer,21);
  assert.equal(s.supplySchedule.initial[4].byType.casual.epicPerActiveWeek,r.weeks[4].casual.epicPerActiveWeek);
  assert(s.supplySchedule.initial[4].byType.casual.epicPerActiveWeek<r.byProfile.casual.epicPerActiveWeek);
});
test('changed authority, rates, classification, exposure and input identity are rejected',()=>{
  for(const mutate of [
    x=>{x.weekly.items['bellsteel-charm-epic'].authoritativeIssuancePerWeek=1;},
    x=>{x.weekly.epicPerActiveWeek+=1;},
    x=>{x.weekly.items['bellsteel-charm-common'].tradable=true;},
    x=>{x.weekly.activeHoursPerWeek.casual=30;},
    x=>{x.economy.profiles.casual.perItem['bellsteel-charm-epic'].weeks[4].observedDays=7;},
    x=>{x.weekly.tradeSourceSha256='changed';},
    x=>{x.weekly.specialOneTimeRewards['star-thread'].recurringPerWeek=1;},
    x=>{x.economy.source.runtimeSha256='f'.repeat(64);},
  ]){const x=structuredClone(inputs);mutate(x);assert.throws(()=>reconcileC2(x,catalog));}
});
test('ordinary mint authority remains zero and bot yield is explicitly hypothetical',()=>{
  const r=reconcileC2(inputs,catalog);
  const zero=c2Scenario(r,{authority:true});
  const result=simulate(mixes[2],{...zero,weeks:52});
  assert.equal(result.rows.at(-1).acquired,0);assert.equal(result.rows.at(-1).sealed,0);
  const stress=c2Scenario(r,{botScale:3});
  assert.equal(stress.supply.byType.bot.epicPerActiveWeek,r.byProfile.heavy.epicPerActiveWeek*3);
  assert.equal(stress.supply.byType.farmer.legendaryPerActiveWeek,r.byProfile.heavy.legendaryPerActiveWeek);
  assert.throws(()=>c2Scenario(r,{botScale:2}));
});
test('source horizon stops after observed30 days without manufacturing supply later',()=>{
  const r=reconcileC2(inputs,catalog),scenario=c2Scenario(r,{tail:'stop'});
  const result=simulate(mixes[0],{...scenario,weeks:13,entitlementBps:0});
  assert(result.rows[4].acquired>0);
  assert(result.rows.slice(5).every(row=>row.acquired===result.rows[4].acquired));
});
test('changing only hours changes per-hour denominators, never claims or item creation',()=>{
  const a=simulate(mixes[2],{weeks:13});
  const b=simulate(mixes[2],{weeks:13,hoursByType:{casual:6,regular:20,farmer:60,bot:140}});
  assert.equal(a.rows.at(-1).inclusiveEmission,b.rows.at(-1).inclusiveEmission);
  assert.equal(a.rows.at(-1).acquired,b.rows.at(-1).acquired);
  assert.equal(a.rows.at(-1).farmerPerHour/2,b.rows.at(-1).farmerPerHour);
  assert.equal(a.rows.at(-1).casualPerHour/2,b.rows.at(-1).casualPerHour);
  assert.throws(()=>simulate(mixes[0],{hoursByType:{casual:0}}));
});
