import {describe,expect,it} from 'vitest';
import {ECONOMY_V3 as E} from './economy-v3';
import {EMISSION_GUARD as G,emissionHeadroom,emissionHeadroomWei} from '../../../chain/src/economy-guard';
import {ECONOMY_SINKS} from './economy-sinks-v3';
// @ts-expect-error plain ESM tool without type declarations
import {SINKS,gachaEffective,simulate} from '../../../../tools/economy/sim.mjs';
const WEI=10n**18n;
describe('burn-backed emission guard',()=>{
 it('allows the launch allowance, then only 90% of public burns',()=>{
  expect(emissionHeadroom(0,0)).toBe(G.launchAllowance);
  expect(emissionHeadroom(G.launchAllowance,0)).toBe(0);
  expect(emissionHeadroom(G.launchAllowance,1000)).toBeCloseTo(900);
  expect(emissionHeadroom(10_000,100)).toBe(0);
  expect(()=>emissionHeadroom(-1,0)).toThrow('Invalid');
 });
 it('matches the float rule in integer wei',()=>{
  expect(emissionHeadroomWei(0n,0n)).toBe(BigInt(G.launchAllowance)*WEI);
  expect(emissionHeadroomWei(BigInt(G.launchAllowance)*WEI,1000n*WEI)).toBe(900n*WEI);
  expect(emissionHeadroomWei(10_000n*WEI,0n)).toBe(0n);
 });
 it('never lets cumulative season emission exceed allowance + 90% of burns',()=>{
  let emitted=0,burned=0;
  for(let week=0;week<13;week++){burned+=week*7;const room=emissionHeadroom(emitted,burned);emitted+=Math.min(room,500);
   expect(emitted).toBeLessThanOrEqual(G.launchAllowance+burned*G.backingBp/10000+1e-9);}
 });
});
describe('economy simulator stays wired to the live rule table',()=>{
 it('uses the same studio recipe prices',()=>{
  expect(SINKS.polish).toEqual({yarn:[...ECONOMY_SINKS.polish.yarn],starThread:[...ECONOMY_SINKS.polish.starThread]});
  expect(SINKS.decor).toMatchObject({yarn:ECONOMY_SINKS.decor.yarn,starThread:ECONOMY_SINKS.decor.starThread});
  expect(SINKS.display).toMatchObject({yarn:ECONOMY_SINKS.display.yarn,starThread:ECONOMY_SINKS.display.starThread,maxLevel:ECONOMY_SINKS.display.maxLevel});
 });
 it('reports the published effective gacha rates',()=>{
  const cat=gachaEffective(E.cat.odds,E.cat.soft,E.cat.hard,E.cat.stepBp),gear=gachaEffective(E.gear.odds,E.gear.soft,E.gear.hard,E.gear.stepBp);
  expect(cat.effectiveRate).toBeGreaterThan(0.02);expect(cat.effectiveRate).toBeLessThan(0.03);
  expect(gear.pullsPerLegendary).toBeLessThanOrEqual(E.gear.hard);
 });
 it('is deterministic and keeps the base case inside its gates',()=>{
  const a=simulate({mix:'balanced',policy:'burn-backed',weeks:26}),b=simulate({mix:'balanced',policy:'burn-backed',weeks:26});
  expect(a.ledger).toEqual(b.ledger);
  expect(a.burnPerClaim).toBeGreaterThanOrEqual(1);
  expect(a.heavyCasualWeeklyReward).toBeLessThanOrEqual(3);
 });
});
