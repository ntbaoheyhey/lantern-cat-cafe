import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,mixes} from './token-sim.mjs';

test('one-season pilot preserves earned rank but stops all new boss and rank earning',()=>{
  const options={controlled:false,entitlementBps:2500,weeks:52};
  const ongoing=simulate(mixes[1],options);
  const pilot=simulate(mixes[1],{...options,earningEndWeek:13});
  assert.deepEqual(pilot.rows.slice(0,13),ongoing.rows.slice(0,13),'No retroactive change to the earning season');
  assert(pilot.rows.slice(13).every(r=>r.bossEmission===0&&r.quotedBoss===0));
  assert(pilot.rows[13].rankEmission>0,'Previously earned season rank is not confiscated');
  assert.equal(pilot.rows[12].rankPending,242.5);
  assert.equal(pilot.rows.at(-1).cumulativeRankEmission,242.5);
  assert(pilot.rows.slice(26).every(r=>r.emission===0&&r.rankPending===0));
  assert(pilot.rows.at(-1).cumulativeEmission<=19742.5,'One 1000-account pilot cannot exceed the documented envelope');
  assert.deepEqual(ongoing,simulate(mixes[1],{...options,earningEndWeek:null}));
});

test('finite pilot rank still obeys the actual reduced cap and expiry, without new rank after closure',()=>{
  const pilot=simulate(mixes[2],{earningEndWeek:13,entitlementBps:2500,demand:0});
  assert.equal(pilot.rows[12].rankPending,242.5);
  assert(pilot.rows.slice(13).every(r=>r.emission===0&&r.routineBudget===0));
  assert.equal(pilot.rows.at(-1).rankExpired,242.5);
  assert.equal(pilot.rows.at(-1).rankPending,0);
});

test('closed-budget policies reserve no new boss earning after a pilot ends',()=>{
  for(const rewardPolicy of ['closed-burn','burn-credit','treasury-closed','grant-headroom']){
    const pilot=simulate(mixes[0],{earningEndWeek:13,entitlementBps:2500,rewardPolicy});
    assert(pilot.budgets.filter(b=>b.week>13).every(b=>b.bossPerWeek===0));
    assert(pilot.rows.slice(13).every(r=>r.bossEmission===0));
    assert(pilot.rows.slice(26).every(r=>r.emission===0&&r.rankPending===0));
    assert(pilot.budgets.filter(b=>b.week>26).every(b=>b.committed===0));
  }
});

test('explicit earning window handles later full seasons and rejects ambiguous partial seasons',()=>{
  const options={earningEndWeek:26,controlled:false,entitlementBps:2500};
  const pilot=simulate(mixes[0],options);
  assert(pilot.rows[25].bossEmission>0);
  assert(pilot.rows[26].rankEmission>0);
  assert(pilot.rows.slice(26).every(r=>r.bossEmission===0));
  assert(pilot.rows.slice(39).every(r=>r.emission===0&&r.rankPending===0));
  const legacy=simulate(mixes[0],{...options,rewardSchedule:'legacy-weekly'});
  assert(legacy.rows.slice(26).every(r=>r.emission===0));
  for(const earningEndWeek of [0,1,12,14,-13,533,NaN,Infinity,'13'])
    assert.throws(()=>simulate(mixes[0],{earningEndWeek}),/earning window/);
});
