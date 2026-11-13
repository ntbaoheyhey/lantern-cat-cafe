import test from 'node:test';
import assert from 'node:assert/strict';
import {marketOnlyBound,inactiveGrantBound,reconcileFlow} from './flow-feasibility.mjs';
test('current40/60 split cannot reach2x through market fees alone even after exhausting balances',()=>{
  const r=marketOnlyBound({claims:'20000'});
  assert.equal(r.maximumBurn,'8000');assert.equal(r.remainingTwoXShortfall,'2000');
  assert.equal(r.canReachTwoX,false);assert.equal(r.minimumDirectShareBps,1667);
  assert.equal(marketOnlyBound({claims:'1',burnShareBps:5000}).canReachTwoX,true);
  assert.equal(marketOnlyBound({claims:'0'}).canReachTwoX,false);
});
test('one-wei/fractional boundaries round conservatively and reject invalid fee shares',()=>{
  const r=marketOnlyBound({claims:'0.000000000000000001'});
  assert.equal(r.maximumBurn,'0');assert.equal(r.remainingTwoXShortfall,'0.000000000000000001');
  assert.throws(()=>marketOnlyBound({claims:'1',burnShareBps:10001}));
});
test('persistent nonspenders impose a retained-stock bound independent of reward cuts',()=>{
  assert.equal(inactiveGrantBound({accounts:1000,adoptionBps:5000}).minimumBurnForTwoX,'10000');
  assert.equal(inactiveGrantBound({accounts:1000,adoptionBps:1000}).minimumBurnForTwoX,'18000');
  assert.equal(inactiveGrantBound({accounts:3,adoptionBps:5000}).inactiveAccounts,1);
});
test('demo-only Fuji balance snapshot conserves and cannot be confused with a healthy economy',()=>{
  const r=reconcileFlow({claims:'40',directBurn:'2',marketBurn:'0.024691357824691357',
    treasury:'0.037037036737037037',balances:'37.938271605438271606'});
  assert.equal(r.additionalDirectBurnWithoutNewClaims,'17.975308642175308643');
  assert.equal(r.flowPass,false);assert.equal(r.cumulativeHealthOnePossibleWithoutTreasuryBurn,false);
  assert.throws(()=>reconcileFlow({claims:'40',directBurn:'2',marketBurn:'1',treasury:'1',balances:'35'}));
});
