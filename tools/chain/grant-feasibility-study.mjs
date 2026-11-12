// Exact bounds on an unchanged20-YARN tester grant; no forecast or activation.
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {planRewardBudget,parseYarn,formatYarn} from './reward-budget.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const snapshot={block:100,blockHash:'0x'+'7'.repeat(64)};
const rows=[];
for(const participants of [100,250,500,750,1000])for(const spend of [0,4,8,12,20])for(const nextTesters of [0,100]){
 const burn=BigInt(participants*spend)*10n**18n;
 const p=planRewardBudget({chainId:43113,provenance:'Synthetic exact bound,1000 grants20; only stated participants spend; no prior routine rewards.',
  poolBalance:'1000000',signedOutstanding:'0',verifiedUnpaid:'0',routineCommittedUnassigned:'0',operatingBuffer:'0',
  testerSlots:nextTesters,announcedRoutineCap:'1974.25',organicBurn:formatYarn(burn),routineAlreadyCommitted:'0',
  organicBurnShareBps:5000,demandEvidence:'trial-measured',authorityReady:true,snapshot,
  cumulativeFlow:{...snapshot,fromGenesis:true,grossClaims:'20000',eligibleBurn:formatYarn(burn)}});
 const desired=parseYarn('1974.25'),claims=parseYarn('20000')+BigInt(nextTesters)*20n*10n**18n;
 const forRatio=(claims+desired+1n)/2n,forPeriod=2n*desired;
 const required=forRatio>forPeriod?forRatio:forPeriod;
 const extra=required>burn?required-burn:0n;
 // Anyone offered the full pilot must obey BOTH bounds, without predicted burn.
 assert(parseYarn(p.candidateRoutineBudget)<=burn/2n);
 if(parseYarn(p.candidateRoutineBudget)>0n)assert(claims+parseYarn(p.candidateRoutineBudget)<=2n*burn);
 rows.push({participants,spendYarnEach:spend,nextTesters,claimsYarn:'20000',eligibleBurn:formatYarn(burn),
  candidateRoutine:p.candidateRoutineBudget,additionalBurnForFull100AccountPilot:formatYarn(extra),
  grantOnlyPass:p.cumulativeFlow.alreadyWithinTwoX,
  finiteStylesOnly:spend<=12,exhaustsParticipantGrant:spend===20});
}
const hash=createHash('sha256').update(readFileSync(new URL(import.meta.url))).update(readFileSync(resolve(root,'tools/chain/reward-budget.mjs'))).update(readFileSync(resolve(root,'tools/chain/grant-headroom.mjs'))).digest('hex');
const data={version:1,modelHash:hash,cases:rows.length,activation:false,
 assumptions:['1000 pre-enrolled wallets,20-YARN grants,zero past routine claims. No new external funds, recycling or treasury fee leakage.',
 'Exact participant COUNTS, not probability estimates or a bot detector. All listed spending goes to eligible direct burn; this is optimistic.',
 'Three permanent styles cap style-only spend at12.20 is an all-sink upper bound that leaves those participants no liquid grant, not a desirable outcome.',
 'Full100-account pilot means1974.25 YARN (100 weekly-boss maxima plus rank tiers). Hypothetical trusted eligibility; neither a running issuer nor measured demand.',
 'Candidate budgets require historical verified burn; no projected purchases. Seasonal health/retention remains separate.'],rows};
writeFileSync(resolve(root,'docs/chain/grant-feasibility-study.json'),JSON.stringify(data,null,2)+'\n');
const keys=Object.keys(rows[0]);
writeFileSync(resolve(root,'docs/chain/grant-feasibility-study.csv'),keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n');
const table=rows.filter(r=>r.nextTesters===0&&[12,20].includes(r.spendYarnEach)).map(r=>`|${r.participants}|${r.spendYarnEach}|${r.eligibleBurn}|${r.candidateRoutine}|${r.additionalBurnForFull100AccountPilot}|`).join('\n');
writeFileSync(resolve(root,'reports/chain/GRANT-FEASIBILITY.md'),`# Grant feasibility — 2026-11-12\n\n50 exact synthetic cases, not simulated players. All1000 wallets already received20. No grants, fees or allocation changed.\n\n|Spenders|Burn each|Total burn|Admissible routine budget|Extra burn before full100-account pilot|\n|---:|---:|---:|---:|---:|\n${table}\n\nTwelve is the entire3-style catalog. Twenty is an optimistic all-sink ceiling consuming the participant's whole grant. At500 spenders the20-YARN ceiling merely reaches the original2× boundary and leaves no headroom for new rewards. With100 additional tester slots, reserve another2000 claims in the denominator as well as the pool. Spending intent and pending orders are not burns.\n\nThe planner now takes the minimum of funding, closed-period burn credit, announced budget and cumulative headroom: max(0,2B−C−L−20N), where B is reviewed cumulative eligible burn, C is every prior gross reward claim including recycling, L is disjoint unpaid promises and N is additional tester slots. Missing full history disables a candidate. The budget cannot certify season-by-season demand.\n\nA one-time budget is deliberately allowed after enough genuine use; recurrent payouts are never promised. Next input is observed voluntary content use and authoritative earning receipts. Finite utility can be developed/tested locally; simulated adoption cannot supply those observations.\n\nReproduce: node tools/chain/grant-feasibility-study.mjs. All rows: docs/chain/grant-feasibility-study.json/CSV. Fingerprint:${hash}.\n`);
console.log(JSON.stringify({cases:rows.length,activation:false,fullPilotCases:rows.filter(r=>r.candidateRoutine==='1974.25').length,hash}));
