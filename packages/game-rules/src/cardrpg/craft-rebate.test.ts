import {afterEach,describe,expect,it} from 'vitest';
import {ECONOMY_V3,craftSpoolRebate,withdrawalQuote,withdrawableSpool} from './economy-v3';
const policy=ECONOMY_V3.craft as {rebateBp:number;weeklySpoolCap:number};
const original={...policy},UNIT=10n**18n;
afterEach(()=>Object.assign(policy,original));
describe('deterministic craft rebate',()=>{
 it('quotes an affordable maximum with no rounded-net overflow at the cap',()=>{
  expect(withdrawableSpool(0n)).toBe(0n);
  expect(withdrawableSpool(UNIT)).toBe(UNIT);
  const cap=BigInt(ECONOMY_V3.spool.weeklyNetCap)*UNIT,max=withdrawableSpool(1000n*UNIT);
  expect(withdrawalQuote(max).net).toBeLessThanOrEqual(cap);
  expect(withdrawalQuote(max+1n).net).toBeGreaterThan(cap);
  expect(()=>withdrawableSpool(-1n)).toThrow('Invalid');
 });
 it('cannot repay a farming loop, even at the highest allowed rate',()=>{
  Object.assign(policy,{rebateBp:9999,weeklySpoolCap:100});
  for(const paid of [1n,UNIT,3n*UNIT+7n,90n*UNIT]){
   const gross=craftSpoolRebate(paid);
   expect(gross).toBeLessThan(paid);
   if(gross)expect(withdrawalQuote(gross).net).toBeLessThan(paid);
  }
  policy.rebateBp=10000;
  expect(()=>craftSpoolRebate(UNIT)).toThrow('Invalid');
 });
 it('clips fractional rebates to the weekly remainder without losing old credit',()=>{
  Object.assign(policy,{rebateBp:7500,weeklySpoolCap:2});
  expect(craftSpoolRebate(UNIT,175n*UNIT/100n)).toBe(UNIT/4n);
  expect(craftSpoolRebate(UNIT,2n*UNIT)).toBe(0n);
  expect(craftSpoolRebate(UNIT,3n*UNIT)).toBe(0n);
  expect(()=>craftSpoolRebate(-1n)).toThrow('Invalid');
 });
});
