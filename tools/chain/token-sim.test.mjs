import test from 'node:test';
import assert from 'node:assert/strict';
import {UNIT, nextMultiplier, routineBudget, simulate, summarize, mixes, validateSupply} from './token-sim.mjs';

test('policy reproduces deployed Solidity fixtures including grant denominator and zero lock', () => {
  assert.equal(nextMultiplier(UNIT, 32n * UNIT, 16n * UNIT), 625n * UNIT / 1000n);
  assert.equal(routineBudget(625n * UNIT / 1000n), 75n * UNIT / 10n);
  assert.equal(nextMultiplier(UNIT, 10n * UNIT, 8n * UNIT), UNIT);
  assert.equal(nextMultiplier(UNIT, 10n * UNIT, 7n * UNIT), 8n * UNIT / 10n);
  assert.equal(nextMultiplier(UNIT, 10n * UNIT, 0n), 0n);
  assert.equal(nextMultiplier(0n, 20n * UNIT, 100n * UNIT), 0n);
  assert.equal(nextMultiplier(UNIT / 2n, 0n, 0n), UNIT / 2n);
});

test('zero demand includes all tester grants in first-season health and stops future routine claims', () => {
  const s = simulate(mixes[2], {demand: 0});
  const first = s.rows[12];
  assert.equal(first.seasonEmission, 20000 + first.cumulativeEmission);
  assert.equal(first.cumulativeBurn, 0);
  assert(s.rows.slice(13).every(r => r.emission === 0 && r.routineBudget === 0));
  assert.equal(summarize(s).emissionBurn, null);
  assert.equal(summarize(s).flowPass, false);
});

test('demo cannot manufacture routine rewards, recurring boss materials or unshipped item sinks', () => {
  const s = simulate(mixes[0], {profile: 'demo'});
  assert(s.rows.every(r => r.emission === 0 && r.cosmeticBurn === 0 && r.consumed === 0));
  assert.equal(s.rows.at(-1).inclusiveEmission, 20000);
  assert(s.rows.at(-1).sealed <= 1000);
  assert.equal(s.rows.at(-1).freeRelics, 3000);
});

test('implemented sinks conserve unsunk items, exclude cosmetics, and respect fee bypass', () => {
  const s = simulate(mixes[2], {paidMarketShare: 0});
  assert(s.rows.every(r => r.saleBurn === 0 && r.treasury === 0 && r.cosmeticBurn === 0 && r.sealedStock === r.sealed));
  assert(s.rows.at(-1).trades > 0);
  assert.deepEqual(s, simulate(mixes[2], {paidMarketShare: 0}), 'fixed seeds reproduce every row');
});

test('custom supply must include valid rates and provenance', () => {
  assert.throws(() => validateSupply({rarePerActiveWeek: -1, epicPerActiveWeek: 0, source: 'test'}));
  assert.throws(() => validateSupply({rarePerActiveWeek: 0, epicPerActiveWeek: 0}));
  assert.throws(() => validateSupply({rarePerActiveWeek: Infinity, epicPerActiveWeek: 0, source: 'test'}));
});
