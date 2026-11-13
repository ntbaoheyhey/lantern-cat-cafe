import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignCohort,reconcileCampaignEvidence,validateCampaignCohort,campaignWeek} from './campaign-cohort.mjs';
import {simulate,mixes,UNIT} from './token-sim.mjs';
import {tiedRankAmounts} from '../../packages/chain/src/rank.ts';

const fixture=()=>({version:2,days:14,epoch:Date.UTC(2026,10,9),rulesHash:'a'.repeat(64),modelHash:'b'.repeat(64),accounts:6,seeds:[1],
  rows:['starter-only','equip-earned'].flatMap(policy=>['casual','regular','heavy'].map(profile=>({policy,profile,seed:1,starts:2,wins:2,
    epic:2,legendary:0,exported:2,exportEpic:2,exportLegendary:0,
    daily:[1,8].map(day=>({day,starts:1,wins:1,epic:1,legendary:0,exports:1,exportEpic:1,exportLegendary:0,commands:20}))})))});
const cohort=options=>campaignCohort({...reconcileCampaignEvidence(fixture()),evidenceHash:'c'.repeat(64)},options);

test('campaign evidence reconciles whole accounts and refuses mismatched surplus, identities and calendars',()=>{
  assert.equal(reconcileCampaignEvidence(fixture()).traces.length,6);
  for(const mutate of [d=>d.rows[0].exportEpic++,d=>d.rows.push(d.rows[0]),d=>d.rows[0].daily[0].exports++,
    d=>d.epoch+=86400000,d=>d.rows[0].daily.push(d.rows[0].daily[0]),d=>d.rows[0].daily[0].starts=7,
    d=>d.rows[0].daily[0].commands=NaN]){
    const d=fixture();mutate(d);assert.throws(()=>reconcileCampaignEvidence(d));
  }
});

test('campaign repeats paired weeks only by explicit assumption; stopped source cannot invent later wins or items',()=>{
  const c=cohort();assert.equal(campaignWeek(c,c.byType.casual[0],3).epic,1);
  const stop=cohort({tail:'stop-source'});
  assert.deepEqual(campaignWeek(stop,stop.byType.casual[0],3),{wins:0,epic:0,legendary:0,starts:0,commands:0});
  const corrupt=cohort();corrupt.byType.bot[0].weeks[0].epic=22;
  assert.throws(()=>validateCampaignCohort(corrupt));
});

test('actual campaign weekly eligibility replaces synthetic probabilities and shares the production tie pool',()=>{
  const s=simulate(mixes[2],{campaign:cohort(),controlled:false,earningEndWeek:13,entitlementBps:2500,demand:0});
  assert.equal(s.rows[12].cumulativeBossEmission,19500);
  assert.equal(s.rows[12].rankPending,242.5);
  assert.equal(s.rows[13].cumulativeRankEmission,242.5);
  assert.equal(s.rows.at(-1).rankExpired,0);
  assert(s.rows.slice(13).every(r=>r.bossEmission===0));
  assert(s.rows.slice(26).every(r=>r.emission===0));
  assert.equal(s.rows.at(-1).acquired,52000);
  assert.deepEqual(s,simulate(mixes[2],{campaign:cohort(),controlled:false,earningEndWeek:13,entitlementBps:2500,demand:0}));
});

test('source stop closes earning but preserves already earned rank and all original grants',()=>{
  const s=simulate(mixes[0],{campaign:cohort({tail:'stop-source'}),controlled:false,earningEndWeek:13,entitlementBps:2500,demand:0});
  assert.equal(s.rows.at(-1).acquired,2000);
  assert.equal(s.rows[12].cumulativeBossEmission,3000);
  assert.equal(s.rows.at(-1).cumulativeRankEmission,242.5);
  assert.equal(s.rows.at(-1).inclusiveEmission,23242.5);
  assert.equal(s.rows.at(-1).cumulativeBurn,0);
  for(const extra of [{profile:'demo'},{botRankBoost:2},{rewardSchedule:'legacy-weekly'},{rewardPolicy:'closed-burn'},{rewardPolicy:'grant-headroom'}])
    assert.throws(()=>simulate(mixes[0],{campaign:cohort(),...extra}));
});

test('campaign rank is never silently split when the next season cap cannot fit a full voucher',()=>{
  const s=simulate(mixes[0],{campaign:cohort(),earningEndWeek:13,entitlementBps:2500,demand:.01});
  assert(s.rows[13].routineBudget>0&&s.rows[13].routineBudget<.2425);
  assert.equal(s.rows[12].rankPending,242.5);
  assert.equal(s.rows.at(-1).cumulativeRankEmission,0);
  assert.equal(s.rows.at(-1).rankExpired,242.5);
  assert.equal(s.rows[25].rankPending,0);
});

test('shared rank allocator conserves the original finite slots for ties crossing every tier boundary',()=>{
  const max=15n*UNIT/10n;
  for(const n of [1,2,3,19,20,99,100,101,1000]){
    const scores=Array.from({length:n},(_,i)=>1+Math.floor(i*39/n));
    const awards=tiedRankAmounts(scores,max),expected=Array.from({length:n},(_,i)=>{
      const p=i+1,w=p*100<=n?6:p*10<=n?4:p*4<=n?2:p*2<=n?1:0;
      return max*BigInt(w)/6n;
    }).reduce((a,b)=>a+b,0n);
    const total=awards.reduce((a,b)=>a+b,0n);assert(total<=expected&&expected-total<BigInt(n));
    for(let i=1;i<n;i++)if(scores[i]===scores[i-1])assert.equal(awards[i],awards[i-1]);
  }
  assert.deepEqual(tiedRankAmounts([1],max),[0n]);
  assert.equal(tiedRankAmounts(Array(100).fill(13),max)[0],2425n*UNIT/10000n);
});
