import test from 'node:test';
import assert from 'node:assert/strict';
import {parseYarn,formatYarn,planRewardBudget} from './reward-budget.mjs';
const snapshot={block:100,blockHash:'0x'+'1'.repeat(64)};
const base={chainId:43113,provenance:'Synthetic funding fixture',poolBalance:'1000',signedOutstanding:'80',verifiedUnpaid:'20',operatingBuffer:'100',testerSlots:10,
  snapshot,cumulativeFlow:{...snapshot,fromGenesis:true,grossClaims:'5000',eligibleBurn:'4000'},
  announcedRoutineCap:'500',organicBurn:'400',routineAlreadyCommitted:'0',routineCommittedUnassigned:'0',organicBurnShareBps:5000,demandEvidence:'trial-measured',authorityReady:true};
test('protect claims, unsigned earned entitlements, buffer and grants before routine planning',()=>{
  const p=planRewardBudget(base);
  assert.equal(p.totalReserve,'400');assert.equal(p.unreserved,'600');
  assert.equal(p.candidateRoutineBudget,'200');assert.equal(p.maximumFundableTesterSlots,40);
  assert.equal(p.status,'CANDIDATE_ONLY');assert.equal(p.planningOnly,true);
});
test('an unfunded tester cohort cannot be hidden by zero routine emission',()=>{
  const p=planRewardBudget({...base,poolBalance:'300'});
  assert.equal(p.fundingGap,'100');assert.equal(p.candidateRoutineBudget,'0');
  assert.equal(p.status,'INSUFFICIENT_RESERVED_FUNDS');
});
test('unmeasured demand or missing authority always leaves routine disabled',()=>{
  for(const change of [{demandEvidence:'unmeasured'},{authorityReady:false}]){
    const p=planRewardBudget({...base,...change});
    assert.equal(p.arithmeticCeiling,'200');assert.equal(p.candidateRoutineBudget,'0');
    assert.equal(p.status,'ROUTINE_DISABLED');
  }
});
test('a closed burn budget cannot be spent again or exceed the announced pool',()=>{
  assert.equal(planRewardBudget({...base,routineAlreadyCommitted:'200'}).candidateRoutineBudget,'0');
  assert.equal(planRewardBudget({...base,announcedRoutineCap:'150',routineAlreadyCommitted:'100'}).candidateRoutineBudget,'50');
  assert.equal(planRewardBudget({...base,poolBalance:'450'}).candidateRoutineBudget,'50');
});
test('unassigned commitments reserve funds without double-counting paid or assigned claims',()=>{
  const prior={...base,announcedRoutineCap:'2000',organicBurn:'4000',routineAlreadyCommitted:'500'};
  const unassigned=planRewardBudget({...prior,routineCommittedUnassigned:'500'});
  assert.equal(unassigned.protectedUnassignedCommitments,'500');
  assert.equal(unassigned.protectedLiabilities,'600');
  assert.equal(unassigned.totalReserve,'900');
  assert.equal(unassigned.candidateRoutineBudget,'100');
  assert.equal(unassigned.maximumFundableTesterSlots,15);
  // The same liabilities moved to signed vouchers retain the same funding bound.
  assert.equal(planRewardBudget({...prior,signedOutstanding:'580'}).candidateRoutineBudget,'100');
  // Paid commitments already left this snapshot's pool; reserve them only in the period budget.
  assert.equal(planRewardBudget(prior).candidateRoutineBudget,'600');
  const shortage=planRewardBudget({...prior,poolBalance:'800',routineCommittedUnassigned:'500'});
  assert.equal(shortage.fundingGap,'100');assert.equal(shortage.candidateRoutineBudget,'0');
  assert.throws(()=>planRewardBudget({...base,routineCommittedUnassigned:'1'}));
  assert.throws(()=>planRewardBudget({...base,routineCommittedUnassigned:undefined}));
});
test('integer decimal amounts retain single wei and reject unsafe money inputs',()=>{
  assert.equal(formatYarn(parseYarn('0.000000000000000001')),'0.000000000000000001');
  for(const x of [1,'-1','1e3','NaN','01','0.0000000000000000001','1000000001'])assert.throws(()=>parseYarn(x));
  for(const change of [{chainId:43114},{testerSlots:.5},{organicBurnShareBps:10001},{provenance:''}])assert.throws(()=>planRewardBudget({...base,...change}));
  assert.equal(planRewardBudget({...base,poolBalance:'400.000000000000000001'}).candidateRoutineBudget,'0.000000000000000001');
});
test('prior grants, future grants and every unpaid promise consume cumulative headroom',()=>{
  const prior={...base,cumulativeFlow:{...base.cumulativeFlow,grossClaims:'7950'}};
  const p=planRewardBudget(prior);
  assert.equal(p.fundingAndPeriodCeiling,'200');
  assert.equal(p.candidateRoutineBudget,'0');
  assert.equal(p.cumulativeFlow.additionalBurnRequired,'125');
  assert.equal(p.cumulativeFlow.alreadyWithinTwoX,true);
  assert.equal(p.cumulativeFlow.includingPromisesWithinTwoX,false);
  // 7600 paid+100 unpaid+200 future tester grants leaves exactly100 for routine.
  assert.equal(planRewardBudget({...prior,cumulativeFlow:{...prior.cumulativeFlow,grossClaims:'7600'}}).candidateRoutineBudget,'100');
  const paid={...prior,poolBalance:'900',signedOutstanding:'0',verifiedUnpaid:'0',
    cumulativeFlow:{...prior.cumulativeFlow,grossClaims:'8050'}};
  assert.equal(planRewardBudget(paid).cumulativeFlow.headroom,p.cumulativeFlow.headroom);
  assert.equal(planRewardBudget(paid).cumulativeFlow.additionalBurnRequired,'125');
});
test('missing, partial, foreign-block and inconsistent burn ledgers cannot enable a budget',()=>{
  const absent=planRewardBudget({...base,cumulativeFlow:undefined});
  assert.equal(absent.candidateRoutineBudget,'0');assert.equal(absent.status,'ROUTINE_DISABLED');
  for(const change of [{fromGenesis:false},{block:101},{blockHash:'0x'+'2'.repeat(64)},{eligibleBurn:'399'}])
    assert.throws(()=>planRewardBudget({...base,cumulativeFlow:{...base.cumulativeFlow,...change}}));
  assert.throws(()=>planRewardBudget({...base,snapshot:undefined}));
});
test('gross recycled claims never receive a genesis clamp or disappear from the ratio',()=>{
  const p=planRewardBudget({...base,cumulativeFlow:{...base.cumulativeFlow,
    grossClaims:'2000000001',eligibleBurn:'1000000000'}});
  assert.equal(p.cumulativeFlow.grossClaims,'2000000001');
  assert.equal(p.cumulativeFlow.additionalBurnRequired,'150.5');
  assert.equal(p.candidateRoutineBudget,'0');
});
test('one-wei cumulative shortfalls round up and buffers do not count as claims',()=>{
  const p=planRewardBudget({...base,operatingBuffer:'0',testerSlots:0,signedOutstanding:'0',verifiedUnpaid:'0',
    organicBurn:'0',cumulativeFlow:{...base.cumulativeFlow,grossClaims:'0.000000000000000003',eligibleBurn:'0.000000000000000001'}});
  assert.equal(p.cumulativeFlow.additionalBurnRequired,'0.000000000000000001');
  assert.equal(p.cumulativeFlow.unpaidAndProposedClaims,'0');
});
