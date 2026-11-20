// Explicit synthetic ownership only. This is NOT a wallet clustering detector.
// Exact wei and integer microhours keep the3x boundary free of float rounding.
import assert from 'node:assert/strict';
const sum=xs=>xs.reduce((a,b)=>a+b,0n);
const ratio=(a,b)=>b===0n?null:Number(a)/Number(b);
export function operatorExposure(wallets,operators){
  assert(Array.isArray(wallets)&&wallets.length>0,'Wallet cohort required');
  assert(Array.isArray(operators)&&operators.length>0,'Explicit operator assumptions required');
  const actors=new Map(),seen=new Set();
  for(const o of operators){
    assert(typeof o.id==='string'&&o.id.length>0&&o.id.length<=64&&!actors.has(o.id),'Duplicate/invalid operator');
    assert(typeof o.microhours==='bigint'&&o.microhours>0n,'Positive integer exposure required');
    actors.set(o.id,{...o,grants:0n,routine:0n,wallets:0});
  }
  for(const w of wallets){
    assert(typeof w.id==='string'&&!seen.has(w.id),'Duplicate wallet');seen.add(w.id);
    const o=actors.get(w.operator);assert(o,'Unassigned wallet');
    for(const n of [w.grants,w.routine])assert(typeof n==='bigint'&&n>=0n,'Exact nonnegative rewards required');
    o.grants+=w.grants;o.routine+=w.routine;o.wallets++;
  }
  assert([...actors.values()].every(o=>o.wallets>0),'Unused operator');
  const aggregate=[...actors.values()].map(o=>({...o,total:o.grants+o.routine}));
  const total=sum(wallets.map(w=>w.grants+w.routine));
  assert.equal(sum(aggregate.map(o=>o.total)),total,'Ownership mapping cannot create rewards');
  const topOne=xs=>sum(xs.sort((a,b)=>a>b?-1:a<b?1:0).slice(0,Math.ceil(xs.length/100)));
  return {total,wallets:wallets.length,operators:actors.size,
    walletTopOnePercent:ratio(topOne(wallets.map(w=>w.grants+w.routine)),total),
    operatorTopOnePercent:ratio(topOne(aggregate.map(o=>o.total)),total),
    largestOperatorShare:ratio(aggregate.reduce((m,o)=>o.total>m?o.total:m,0n),total),aggregate};
}
export function compareOperatorHours(operator,casual){
  for(const a of [operator,casual]){
    assert(typeof a.microhours==='bigint'&&a.microhours>0n,'Exact positive exposure required');
    for(const k of ['routine','total'])assert(typeof a[k]==='bigint'&&a[k]>=0n,'Exact reward required');
  }
  const metric=key=>{
    const numerator=operator[key]*casual.microhours,denominator=casual[key]*operator.microhours;
    return {ratio:ratio(numerator,denominator),pass:numerator<=3n*denominator};
  };
  return {routine:metric('routine'),includingGrants:metric('total')};
}
