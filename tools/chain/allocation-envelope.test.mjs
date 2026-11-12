import test from 'node:test';
import assert from 'node:assert/strict';
import {allocationEnvelope,ANNUAL_PLAYER_BUDGETS,UNIT,GENESIS} from './allocation-envelope.mjs';

test('cliffs, linear durations and bucket-specific treasury ceiling preserve the allocation',()=>{
  const start=allocationEnvelope(0),cliff=allocationEnvelope(52),next=allocationEnvelope(53);
  assert.equal(start.unlocked,65_000_000n*UNIT);
  assert.equal(allocationEnvelope(25).buckets.partners,0n);
  assert.equal(allocationEnvelope(26).buckets.partners,20_000_000n*UNIT);
  assert.equal(allocationEnvelope(26).buckets.testers,60_000_000n*UNIT);
  assert.equal(cliff.buckets.team+cliff.buckets.investors+cliff.buckets.advisors,0n);
  assert.equal(next.buckets.team,150_000_000n*UNIT/156n);
  assert.equal(next.buckets.investors,120_000_000n*UNIT/104n);
  assert.equal(allocationEnvelope(156).buckets.investors,120_000_000n*UNIT);
  assert.equal(allocationEnvelope(208).buckets.team,150_000_000n*UNIT);
  assert.equal(allocationEnvelope(260).buckets.treasury,48_000_000n*UNIT);
  assert.equal(allocationEnvelope(650).buckets.treasury,120_000_000n*UNIT);
  assert.equal(allocationEnvelope(260).playerBudget,350_000_000n*UNIT);
  assert.equal(ANNUAL_PLAYER_BUDGETS.reduce((a,b)=>a+b),350_000_000n*UNIT);
  assert.equal(allocationEnvelope(650).unlocked,GENESIS);
});

test('ceilings are monotone and conserve exactly through and beyond every release boundary',()=>{
  let previous=allocationEnvelope(0);
  for(let week=1;week<=780;week++){
    const current=allocationEnvelope(week);
    assert.equal(current.unlocked+current.locked,GENESIS);
    for(const name of Object.keys(current.buckets))assert(current.buckets[name]>=previous.buckets[name]);
    previous=current;
  }
  for(const week of [-1,.1,Infinity,NaN,5201])assert.throws(()=>allocationEnvelope(week));
});
