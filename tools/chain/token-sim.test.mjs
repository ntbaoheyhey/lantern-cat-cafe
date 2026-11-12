import test from 'node:test';
import assert from 'node:assert/strict';
import {UNIT, nextMultiplier, routineBudget, simulate, summarize, mixes, validateSupply, rewardSensitivity,rankEntitlement} from './token-sim.mjs';
import {loadSourceSupply} from './supply-snapshot.mjs';

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

test('smaller entitlements leave tester grants and the deployed first-season cap unchanged', () => {
  const original = simulate(mixes[2]), small = simulate(mixes[2], {entitlementBps: 2500});
  assert.equal(small.rows[0].testerEmission, 20000);
  assert(small.rows.slice(0, 13).every(r => r.routineBudget === 12));
  assert.equal(small.rows[12].cumulativeEmission, original.rows[12].cumulativeEmission / 4);
  const stopped = simulate(mixes[2], {entitlementBps: 0});
  assert(stopped.rows.every(r => r.emission === 0 && r.inclusiveEmission === 20000));
  for (const entitlementBps of [-1, 10001, .5, NaN, Infinity]) assert.throws(() => simulate(mixes[0], {entitlementBps}));
});

test('sensitivity cannot replace the failing default or promise safety at weak demand', () => {
  const sensitivity = rewardSensitivity();
  assert.equal(sensitivity.rows.length, 63);
  assert.equal(sensitivity.envelopes[2].largestTestedMaxEntitlement, null);
  assert(sensitivity.rows.filter(r => r.demand === .1 && r.entitlementBps === 0).every(r => !r.flowPass));
  assert(mixes.some(m => !summarize(simulate(m)).flowPass), 'all-mix default acceptance must remain unmet');
});

test('closed-season rank is paid in the next season and week52 discloses the fourth liability',()=>{
  const s=simulate(mixes[1],{controlled:false,weeks:53});
  assert(s.rows.slice(0,13).every(r=>r.rankEmission===0));
  for(const close of [13,26,39,52]){
    assert.equal(s.rows[close-1].rankPending,970); // 10*6 +90*4 +150*2 +250*1
    assert(s.rows[close].rankEmission>0);
  }
  // Display rows use doubles; exact bigint channel conservation is asserted inside simulate.
  assert(s.rows.every(r=>Math.abs(r.emission-r.bossEmission-r.rankEmission)<1e-8));
  assert(s.rows[51].cumulativeRankEmission<=2910);
  assert(s.rows[52].cumulativeRankEmission>s.rows[51].cumulativeRankEmission);
  assert.equal(rankEntitlement(0,1000),6n*UNIT);
  assert.equal(rankEntitlement(500,1000),0n);
});

test('rank stays within the reduced shared weekly cap and can expire at zero policy',()=>{
  const s=simulate(mixes[2],{demand:0});
  assert(s.rows.slice(13).every(r=>r.rankEmission===0));
  assert(s.rows.at(-1).rankExpired>0);
  assert(s.rows.every(r=>r.bossEmission+r.rankEmission<=1000*r.routineBudget+1e-8));
});

test('source profiles do not create rare materials and persistent non-adoption cannot become demand by waiting',()=>{
  const supply={rarePerActiveWeek:0,epicPerActiveWeek:42,legendaryPerActiveWeek:0,source:'test conditional upper bound'};
  const s=simulate(mixes[2],{supply,demand:.1});
  assert(s.rows.at(-1).shelfOverflow>0);
  assert(s.rows.every(r=>r.unsealedStock<=240000));
  assert(s.rows.at(-1).cumulativeBurn<s.rows.at(-1).inclusiveEmission/2);
  const noBuyers=simulate(mixes[1],{supply,collectionTarget:0});
  assert(noBuyers.rows.every(r=>r.trades===0&&r.saleBurn===0));
});

test('abundant drops cannot force endless seal burns after collection and seller stock saturate',()=>{
  const supply={rarePerActiveWeek:0,epicPerActiveWeek:42,legendaryPerActiveWeek:0,source:'conditional high-supply fixture'};
  const full=simulate(mixes[2],{supply,controlled:false,collectionTarget:0,sealStockTarget:2});
  assert.equal(full.rows.at(-1).sealed,2000);
  assert.equal(full.rows.at(-1).cumulativeBurn,20000);
  assert(full.rows.slice(13).every(r=>r.burn===0));
  assert.equal(summarize(full).flowPass,false);
  const zero=simulate(mixes[2],{supply,sealStockTarget:0,collectionTarget:0});
  assert(zero.rows.every(r=>r.burn===0&&r.sealed===0));
  for(const sealStockTarget of [-1,.5,1001,NaN])assert.throws(()=>simulate(mixes[0],{sealStockTarget}));
});

test('five-year horizon preserves the first year and exposes quiet seasons without manufacturing a pass',()=>{
  const options={supply:loadSourceSupply(),rewardPolicy:'closed-burn'};
  const short=simulate(mixes[2],options),long=simulate(mixes[2],{...options,weeks:260});
  assert.deepEqual(long.rows.slice(0,52),short.rows,'Changing horizon cannot change past outcomes');
  assert.equal(long.seasons.length,20);
  assert.equal(long.rows[53].currentDemand,1,'No accidental week54 shock from the old sentinel');
  assert(long.seasons.slice(-4).every(s=>!s.healthTargetMet),'Zero/zero seasons are not healthy activity');
  assert(long.rows.every(r=>r.totalSupply<=1e9&&r.reserved>=0));
  assert.equal(short.affordability[0].features[10].reachByWeek[26],0);
  assert.equal(short.affordability[0].features[10].reachByWeek[104],undefined,'No look-ahead reach estimate');
});
