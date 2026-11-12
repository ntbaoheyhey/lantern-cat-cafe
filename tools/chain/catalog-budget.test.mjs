import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogBaskets,optimisticCohortBound} from './catalog-budget.mjs';
const U=10n**18n;
test('current23-YARN forge cannot consume a20 grant through unfinished inputs',()=>{
  const q=catalogBaskets({unsealedEpics:6});assert.equal(q.firstForge,23n*U);assert.equal(q.maxForge,0);
  assert(q.baskets.every(b=>b.epicsConsumed===0&&b.forgeBurn===0n));
  assert.equal(q.maximumCompleteSpend,14n*U);
});
test('5% trial can complete one forge while preserving two YARN and finite outputs',()=>{
  const q=catalogBaskets({sealBps:500,unsealedEpics:6});
  assert.equal(q.firstForge,13n*U);assert.equal(q.maxForge,1);assert.equal(q.maximumCompleteSpend,18n*U);
  assert(q.baskets.some(b=>b.forge===1&&b.styles.length===1&&b.thread===1&&b.remaining===2n*U));
  for(const b of q.baskets){assert.equal(b.spent,b.styleBurn+b.sealBurn+b.forgeBurn);assert.equal(b.spent+b.remaining,20n*U);}
});
test('a cheaper seal cannot create source inventory or a renewed cosmetic catalog',()=>{
  assert.equal(catalogBaskets({sealBps:0,unsealedEpics:0}).maxForge,0);
  assert.equal(catalogBaskets({sealBps:0,unsealedEpics:1}).maxForge,0);
  const q=catalogBaskets({sealBps:0,unsealedEpics:999,budget:1000n*U});
  assert.equal(q.maxForge,3);assert(q.baskets.every(b=>b.styles.length<=3&&b.epicsConsumed<=6&&b.thread<=1));
});
test('all grid baskets conserve wei and hold the requested reserve',()=>{
  for(const sealBps of [0,250,500,1000])for(const reserve of [0n,2n*U])for(const budget of [20n*U,23n*U,41n*U]){
    const q=catalogBaskets({sealBps,reserve,budget,unsealedEpics:6});
    for(const b of q.baskets){assert(b.remaining>=reserve);assert.equal(b.spent+b.remaining,budget);}
  }
});
test('weak adoption cannot be repaired by a smaller fee even with perfectly willing active buyers',()=>{
  for(const activeHumans of [100,250])for(const sealBps of [0,250,500,1000]){
    const q=catalogBaskets({sealBps,unsealedEpics:6});
    const b=optimisticCohortBound({accounts:1000,activeHumans,maximumCompleteSpend:q.maximumCompleteSpend});
    assert(!b.canReachTwoX);assert.equal(b.claims,b.burn+b.retained);
  }
  const b=optimisticCohortBound({accounts:1000,activeHumans:500,maximumCompleteSpend:18n*U});
  assert.equal(b.minimumActive,556n);assert(!b.canReachTwoX);
});
test('zero budget, zero spend and invalid scenarios cannot manufacture a pass',()=>{
  assert.equal(catalogBaskets({budget:0n,reserve:0n,hasThread:false}).maximumCompleteSpend,0n);
  assert(!optimisticCohortBound({accounts:1000,activeHumans:1000,maximumCompleteSpend:0n}).canReachTwoX);
  for(const sealBps of [-1,1001,.5])assert.throws(()=>catalogBaskets({sealBps}));
  assert.throws(()=>catalogBaskets({budget:-1n}));assert.throws(()=>catalogBaskets({unsealedEpics:.5}));
  assert.throws(()=>optimisticCohortBound({accounts:1000,activeHumans:1001,maximumCompleteSpend:0n}));
});
