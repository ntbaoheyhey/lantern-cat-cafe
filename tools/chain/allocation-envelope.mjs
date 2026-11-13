// Accounting ceilings from the unchanged allocation design, not vesting contracts.
// A model year is 52 weeks; a quarter is 13. No release creates new YARN.
import assert from 'node:assert/strict';
export const UNIT = 10n ** 18n;
export const GENESIS = 1_000_000_000n * UNIT;
const min = (a,b) => a < b ? a : b;
const linear = (amount,week,start,duration) => amount * BigInt(Math.max(0,Math.min(duration,week-start))) / BigInt(duration);
const playerTotal = 350_000_000n * UNIT;
const weights = [10000n,8000n,6400n,5120n,4096n];
export const ANNUAL_PLAYER_BUDGETS = weights.map(w => playerTotal*w/33616n);
ANNUAL_PLAYER_BUDGETS[4] += playerTotal-ANNUAL_PLAYER_BUDGETS.reduce((a,b)=>a+b,0n);
Object.freeze(ANNUAL_PLAYER_BUDGETS);

export function allocationEnvelope(week) {
  assert(Number.isSafeInteger(week)&&week>=0&&week<=5200,'Invalid allocation week');
  const buckets = {
    player:ANNUAL_PLAYER_BUDGETS.reduce((n,amount,i)=>n+linear(amount,week,i*52,52),0n),
    team:linear(150_000_000n*UNIT,week,52,156),
    treasury:min(120_000_000n*UNIT,2_400_000n*UNIT*BigInt(Math.floor(week/13))),
    investors:linear(120_000_000n*UNIT,week,52,104),
    ecosystem:linear(100_000_000n*UNIT,week,0,208),
    testers:15_000_000n*UNIT+linear(45_000_000n*UNIT,week,0,26),
    liquidity:50_000_000n*UNIT,
    advisors:linear(30_000_000n*UNIT,week,52,104),
    partners:week>=26?20_000_000n*UNIT:0n,
  };
  const unlocked = Object.values(buckets).reduce((a,b)=>a+b,0n);
  assert(unlocked<=GENESIS,'Allocation ceiling cannot exceed genesis');
  return {week,buckets,unlocked,locked:GENESIS-unlocked,
    nonPlayerUnlocked:unlocked-buckets.player,playerBudget:buckets.player};
}
