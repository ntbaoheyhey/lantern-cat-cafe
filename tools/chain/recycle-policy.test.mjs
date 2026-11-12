import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,summarize,mixes} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';
const base={supply:loadSourceSupply(),rewardPolicy:'treasury-closed',weeks:53,burnBudgetBps:10000};
test('closed treasury funds actual rewards without double spending or fresh routine release',()=>{
 const s=simulate(mixes[1],base),last=s.rows.at(-1);
 assert(last.recycledRewards>0,'Fixture must exercise revenue recycling');
 assert(s.rows.slice(0,13).every(r=>r.emission===0),'Incoming fees cannot fund same-season promises');
 assert(s.rows.every(r=>r.freshRoutineRelease===0&&r.cumulativeEmission===r.recycledRewards));
 assert.equal(last.inclusiveFreshRelease,20000);
 for(const b of s.budgets)assert(b.committed<=b.treasuryAtOpen+1e-9);
 for(const r of s.rows){
  assert(Math.abs(r.treasury+r.recycledRewards-r.treasuryRevenue)<1e-8);
  assert(Math.abs(r.playerCirculating+r.treasury+r.cumulativeBurn-r.inclusiveFreshRelease)<1e-8);
 }
 assert.equal(summarize(s).emissionBurn,last.inclusiveEmission/last.cumulativeBurn,
  'Original claims/burn includes recycled claims; do not replace its denominator');
});
test('fee bypass or no demand cannot manufacture treasury funding or healthy activity',()=>{
 for(const options of [{paidMarketShare:0},{demand:0}]){
  const s=simulate(mixes[2],{...base,...options});
  assert(s.rows.every(r=>r.emission===0&&r.recycledRewards===0&&r.treasuryRevenue===0));
  assert(s.seasons.every(q=>q.routine===0));
 }
 assert.equal(summarize(simulate(mixes[2],{...base,demand:0})).flowPass,false);
});
test('partial recycling retains the uncommitted treasury and always respects the reduced cap',()=>{
 const s=simulate(mixes[0],{...base,burnBudgetBps:5000,weeks:104});
 for(const b of s.budgets){assert(b.committed<=b.treasuryAtOpen*.5+1e-9);assert(b.bossPerWeek<=1.5+1e-9);}
 assert(s.rows.every(r=>r.emission<=1000*r.routineBudget+1e-8));
 const off=simulate(mixes[0],{...base,burnBudgetBps:0});
 assert(off.rows.every(r=>r.emission===0));
});
