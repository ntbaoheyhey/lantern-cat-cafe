import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignEnvelope,affordableCampaignScale,farmingExposure,nominateCampaign,UNIT} from './campaign-budget.mjs';
import {tiedRankAmounts} from '../../packages/chain/src/rank.ts';
test('finite program funds weekly earnings and the original rank-slot pool separately from gifts',()=>{
  const r=campaignEnvelope({accounts:1000,bossMaximum:15n*UNIT/10n,rankMaximum:15n*UNIT/10n});
  assert.equal(r.grants,20000n*UNIT);assert.equal(r.boss,19500n*UNIT);assert.equal(r.rank,2425n*UNIT/10n);
  assert.equal(r.claims,397425n*UNIT/10n);assert.equal(r.burnForTwoX,1987125n*UNIT/100n);
  assert.equal(r.burnForFirstSeasonHealth,39500n*UNIT);assert.equal(r.earningBudget+r.settlementBudget,r.routine);
  assert.equal(campaignEnvelope({accounts:1,bossMaximum:1n,rankMaximum:UNIT}).rank,0n);
});
test('tie arrangements never exceed the reserved finite slot envelope',()=>{
  for(const n of [1,2,7,19,100,999,1000])for(const cap of [1n,15n*UNIT/10n,1500000000000000001n]){
    const bound=campaignEnvelope({accounts:n,bossMaximum:cap,rankMaximum:cap}).rank;
    for(const scores of [Array(n).fill(1),Array.from({length:n},(_,i)=>1+(i*7)%39)]){
      const actual=tiedRankAmounts(scores,cap).reduce((a,b)=>a+b,0n);assert(actual<=bound&&bound-actual<BigInt(n));
    }
  }
});
test('funding search is maximal at integer bps and never spends gifts or existing obligations twice',()=>{
  for(const accounts of [1,50,100,250])for(const giftShare of [0,1])for(const available of [0n,9960n*UNIT,20000n*UNIT]){
    const testerAccounts=accounts*giftShare,r=affordableCampaignScale({available,accounts,testerAccounts});
    if(!r.funded){assert(r.envelope.grants>available);continue;}
    assert(r.envelope.claims<=available);
    if(r.bps<2500){const next=6n*UNIT*BigInt(r.bps+1)/10000n;
      assert(campaignEnvelope({accounts,testerAccounts,bossMaximum:next,rankMaximum:next}).claims>available);}
  }
  assert.throws(()=>campaignEnvelope({accounts:1,bossMaximum:1,rankMaximum:1n}));
});
test('a fast bot must not inherit a pass from the human-farmer metric',()=>{
  assert.deepEqual(farmingExposure({casualPerHour:1,farmerPerHour:.2,botPerHour:10}),{farmerCasual:.2,botCasual:10,originalFarmerPass:true,allFarmPass:false});
  assert(!farmingExposure({casualPerHour:0,farmerPerHour:0,botPerHour:1}).allFarmPass);
  assert(farmingExposure({casualPerHour:0,farmerPerHour:0,botPerHour:0}).allFarmPass);
  assert(farmingExposure({casualPerHour:1,farmerPerHour:1,botPerHour:3.000000000000007}).allFarmPass);
  assert(!farmingExposure({casualPerHour:1,farmerPerHour:1,botPerHour:3.000000001}).allFarmPass);
});
test('candidate selection cannot use held-out seeds or hide a failed mix',()=>{
  const row=bps=>({split:'training',entitlementBps:bps,flowPass:true,allFarmPass:true,firstForgeBy13:1,emissionBurn:1.2});
  assert.equal(nominateCampaign([row(1000),{...row(1000),flowPass:false}]),null);
  assert.deepEqual(nominateCampaign([row(1500),row(1000)]),{bps:1000,trainingWorst:1.2});
  assert.equal(nominateCampaign([row(0)]),null);
  assert.throws(()=>nominateCampaign([{...row(1000),split:'holdout'}]));
});
