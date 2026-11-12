import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,mixes} from './token-sim.mjs';
const supply={rarePerActiveWeek:0,epicPerActiveWeek:8,legendaryPerActiveWeek:0,source:'Synthetic abundant Epic control'};
const forgePlan={interestBps:10000,maxDesigns:3,first:true,reserveCompletion:true};
const base={supply,forgePlan,entitlementBps:0,collectionTarget:0,weeks:52};

test('fee sensitivity keeps the historical10% default and rejects invalid prices',()=>{
  assert.deepEqual(simulate(mixes[0],base),simulate(mixes[0],{...base,sealFeeBps:1000}));
  for(const sealFeeBps of [-1,1001,.5,NaN,Infinity,'500'])
    assert.throws(()=>simulate(mixes[0],{...base,sealFeeBps}),/experimental seal fee/);
});
test('lower fee changes completed recipes with a conserved20 grant, no reward or buyer inflow',()=>{
  for(const [sealFeeBps,crafts,totalBurn] of [[1000,0,0],[750,1000,18000],[500,1000,13000],[250,2000,16000],[0,3000,9000]]){
    const s=simulate(mixes[0],{...base,sealFeeBps});const last=s.rows.at(-1);
    assert.equal(last.crafts,crafts);assert.equal(last.cumulativeBurn,totalBurn);
    assert.equal(last.cumulativeEmission,0);assert.equal(last.trades,0);
    assert.equal(last.playerCirculating+last.treasury+last.cumulativeBurn,20000);
    assert.equal(last.consumed,2*crafts);assert.equal(last.forgeBurn,3*crafts);
    assert.equal(s.forgeOutcomes.completed,crafts?1000:0);
    assert.equal(s.forgeOutcomes.nextRecipeUnaffordable,sealFeeBps===0?0:1000);
  }
});
test('fee experiment measures priority displacement without inventing repeat styles',()=>{
  const stylePlan={adoptionBps:10000,maxStyles:3,openWeek:1};
  const first=simulate(mixes[0],{...base,stylePlan,sealFeeBps:500});
  const styles=simulate(mixes[0],{...base,stylePlan,sealFeeBps:500,forgePlan:{...forgePlan,first:false}});
  assert.equal(first.rows.at(-1).crafts,1000);assert.equal(first.rows.at(-1).styleBurn,0,'Saving for the next13-YARN recipe retains the remaining7');
  const one=simulate(mixes[0],{...base,stylePlan,sealFeeBps:500,forgePlan:{...forgePlan,maxDesigns:1}});
  assert.equal(one.rows.at(-1).crafts,1000);assert.equal(one.rows.at(-1).styleBurn,4000,'One planned recipe leaves cash for a style');
  assert.equal(styles.rows.at(-1).crafts,0);assert.equal(styles.rows.at(-1).styleBurn,12000);
});
test('a cheaper quote cannot fabricate source authority, adopters, bot cosmetic use or departed participants',()=>{
  for(const extra of [{demand:0},{supply:{...supply,epicPerActiveWeek:0}}])
    assert.equal(simulate(mixes[0],{...base,sealFeeBps:500,...extra}).rows.at(-1).crafts,0);
  const s=simulate(mixes[2],{...base,sealFeeBps:500,demandShockWeek:1,demandAfterShock:0});
  assert.equal(s.forgeOutcomes.interested,800);assert.equal(s.forgeOutcomes.completed,0);
  assert.equal(s.forgeTiming.reduce((n,t)=>n+t.enrolled,0),800);
  assert.equal(s.forgeTiming.find(t=>t.type==='bot').enrolled,0);
  for(const t of s.forgeTiming){assert.equal(t.completed,0);assert.equal(t.medianWeekAmongCompleters,null);}
});
test('completion timing counts distinct people and retains non-completers in its denominator',()=>{
  const s=simulate(mixes[2],{...base,sealFeeBps:500,weeks:13});
  assert.equal(s.forgeTiming.reduce((n,t)=>n+t.completed,0),s.forgeOutcomes.completed);
  for(const t of s.forgeTiming){
    assert(t.byWeek[1]<=t.byWeek[4]&&t.byWeek[4]<=t.byWeek[13]);
    assert(t.byWeek[13]<=t.enrolled);assert.equal(t.completed,t.byWeek[13]);
  }
});
