import test from 'node:test';
import assert from 'node:assert/strict';
import { rarityCurve, summarizeEconomy } from './loot-summary.mjs';
test('rarity quantiles retain accounts censored at the observation horizon', () => {
 const r = rarityCurve([{ first: 1 }, { first: null }, { first: null }], 'first', 30);
 assert.equal(r.medianDay, null); assert.equal(r.p90Day, null); assert.equal(r.censored, 2); assert.equal(r.cdf.at(-1).fraction, 1 / 3);
});
test('partial weeks use actual exposure and gross supply is independent of the bag', () => {
 const zero = { fish: 0, threads: 0, stamps: 0, essence: 0 };
 const row = { days: 9, profile: { id: 'casual', minutes: 30 }, gearCreated: { cup: 9 }, materialsCreated: {},
  weeks: { 1: { gear: { cup: 7 } }, 2: { gear: { cup: 2 } } }, daily: Array.from({ length: 9 }, () => ({ power: 10, accountXp: 9 })),
  firstEpicDay: 1, firstLegendaryDay: null, income: { ...zero, fish: 100 }, spending: { ...zero, fish: 90 },
  initialCurrencies: zero, balances: { ...zero, fish: 10 }, finalBag: 1, maxBag: 3, duplicateShards: 0 };
 const r = summarizeEconomy([row], 9, { cup: { rarity: 'epic' } }).profiles.casual;
 assert.equal(r.perItem.cup.perActiveWeek, 7); assert.equal(r.perItem.cup.weeks[1].observedDays, 2);
 assert.equal(r.perItem.cup.weeks[1].meanCreated, 2); assert.equal(r.bag.medianFinal, 1); assert.equal(r.currencies.fish.sinkRatio, .9);
 assert.throws(() => summarizeEconomy([row], 30, {}), /Incomplete/);
});
