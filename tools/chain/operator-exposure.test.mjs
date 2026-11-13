import test from 'node:test';
import assert from 'node:assert/strict';
import {operatorExposure,compareOperatorHours} from './operator-exposure.mjs';
test('200 aliases can hide a20% operator behind a1% top-wallet metric',()=>{
  const wallets=Array.from({length:1000},(_,i)=>({id:String(i),operator:i<200?'bot':String(i),grants:20n,routine:8n}));
  const operators=[{id:'bot',microhours:200n},...wallets.slice(200).map(w=>({id:w.operator,microhours:1n}))];
  const r=operatorExposure(wallets,operators);
  assert.equal(r.total,28000n);assert.equal(r.walletTopOnePercent,.01);
  assert.equal(r.operators,801);assert.equal(r.operatorTopOnePercent,.208);assert.equal(r.largestOperatorShare,.2);
  assert.equal(r.aggregate.find(a=>a.id==='bot').wallets,200);
});
test('grant-only farming cannot pass by silently removing grants from hourly exposure',()=>{
  const r=compareOperatorHours({microhours:1n,routine:0n,total:20n},{microhours:10n,routine:0n,total:20n});
  assert.equal(r.routine.ratio,null);assert(r.routine.pass);
  assert.equal(r.includingGrants.ratio,10);assert(!r.includingGrants.pass);
});
test('exact exposure admits equality at3x and rejects a single wei above it',()=>{
  const base={microhours:1000000n,routine:10n**30n,total:10n**30n};
  assert(compareOperatorHours({...base,routine:base.routine*3n,total:base.total*3n},base).routine.pass);
  assert(!compareOperatorHours({...base,routine:base.routine*3n+1n,total:base.total*3n+1n},base).routine.pass);
});
test('unknown ownership, duplicate wallets and noninteger exposure fail closed',()=>{
  const w={id:'a',operator:'a',grants:20n,routine:1n},o={id:'a',microhours:1n};
  assert.throws(()=>operatorExposure([w,w],[o]));
  assert.throws(()=>operatorExposure([w],[{...o,id:'unknown'}]));
  assert.throws(()=>operatorExposure([w],[{...o,microhours:.35}]));
  assert.throws(()=>operatorExposure([w],[o,{...o,id:'unused'}]));
});
