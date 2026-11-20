// Exact finite-program envelopes and adversarial exposure. No activation,
// demand inference, identity proof, RPC or signatures.
import assert from 'node:assert/strict';
export const UNIT=10n**18n;
export function campaignEnvelope({accounts,bossMaximum,rankMaximum,earningWeeks=13,testerAccounts=accounts}) {
  assert(Number.isSafeInteger(accounts)&&accounts>=1&&accounts<=100000,'Invalid account count');
  assert(Number.isInteger(earningWeeks)&&earningWeeks>=1&&earningWeeks<=13,'Invalid earning window');
  assert(Number.isInteger(testerAccounts)&&testerAccounts>=0&&testerAccounts<=accounts,'Invalid tester count');
  for(const n of [bossMaximum,rankMaximum])assert(typeof n==='bigint'&&n>=0n&&n<=12n*UNIT,'Invalid exact reward');
  let rank=0n;
  for(let p=1;p<=accounts;p++)rank+=rankMaximum*BigInt(p*100<=accounts?6:p*10<=accounts?4:p*4<=accounts?2:p*2<=accounts?1:0)/6n;
  const boss=BigInt(accounts*earningWeeks)*bossMaximum,grants=BigInt(testerAccounts)*20n*UNIT;
  const claims=boss+rank+grants;
  return {accounts,testerAccounts,earningWeeks,boss,rank,grants,routine:boss+rank,claims,
    burnForTwoX:(claims+1n)/2n,burnForFirstSeasonHealth:boss+grants,
    // Rank is reserved now but paid from the following settlement season.
    earningBudget:boss,settlementBudget:rank,settlementRankMaximum:rankMaximum};
}
export function affordableCampaignScale({available,accounts,testerAccounts=accounts,earningWeeks=13,maxBps=2500}) {
  assert(typeof available==='bigint'&&available>=0n,'Invalid available funds');
  assert(Number.isInteger(maxBps)&&maxBps>=0&&maxBps<=10000,'Invalid scale ceiling');
  const envelope=bps=>campaignEnvelope({accounts,testerAccounts,earningWeeks,
    bossMaximum:6n*UNIT*BigInt(bps)/10000n,rankMaximum:6n*UNIT*BigInt(bps)/10000n});
  if(envelope(0).claims>available)return {funded:false,bps:0,unfunded:envelope(0).claims-available,envelope:envelope(0)};
  let low=0,high=maxBps;
  while(low<high){const mid=Math.ceil((low+high)/2);if(envelope(mid).claims<=available)low=mid;else high=mid-1;}
  return {funded:true,bps:low,remaining:available-envelope(low).claims,envelope:envelope(low)};
}
export function farmingExposure({casualPerHour,farmerPerHour,botPerHour}) {
  for(const n of [casualPerHour,farmerPerHour,botPerHour])assert(Number.isFinite(n)&&n>=0,'Invalid reward/hour');
  const ratio=n=>casualPerHour?n/casualPerHour:null;
  // Repeated floating-point hour additions can turn an exact3x boundary into
  // 3.000000000000007. Tolerate only machine rounding, never a policy margin.
  const atMostTriple=n=>n<=3*casualPerHour+64*Number.EPSILON*Math.max(n,3*casualPerHour);
  return {farmerCasual:ratio(farmerPerHour),botCasual:ratio(botPerHour),
    originalFarmerPass:atMostTriple(farmerPerHour),
    allFarmPass:atMostTriple(Math.max(farmerPerHour,botPerHour))};
}
export function nominateCampaign(rows) {
  assert(rows.every(r=>r.split==='training'),'Holdout data cannot select a candidate');
  const groups=new Map();
  for(const r of rows){assert(Number.isInteger(r.entitlementBps));const g=groups.get(r.entitlementBps)??[];g.push(r);groups.set(r.entitlementBps,g);}
  const accepted=[...groups].filter(([bps,rs])=>bps>0&&rs.every(r=>r.flowPass&&r.allFarmPass&&r.firstForgeBy13>=.95));
  accepted.sort((a,b)=>Math.max(...a[1].map(r=>r.emissionBurn))-Math.max(...b[1].map(r=>r.emissionBurn))||a[0]-b[0]);
  return accepted.length?{bps:accepted[0][0],trainingWorst:Math.max(...accepted[0][1].map(r=>r.emissionBurn))}:null;
}
