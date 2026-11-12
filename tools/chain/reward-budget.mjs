// Offline planning only. No RPC, keys, signing or configuration writes.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const UNIT = 10n ** 18n;
const GENESIS = 1_000_000_000n * UNIT;
const min = (...xs) => xs.reduce((a,b) => a < b ? a : b);
const positive = n => n < 0n ? 0n : n;
export function parseYarn(value) {
  assert(typeof value === 'string' && /^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$/.test(value), 'Use a nonnegative decimal YARN string, at most18 decimals');
  const [whole, fraction = ''] = value.split('.');
  const n = BigInt(whole) * UNIT + BigInt(fraction.padEnd(18,'0'));
  assert(n <= GENESIS, 'Amount exceeds YARN genesis');
  return n;
}
export function formatYarn(value) {
  const fraction = (value % UNIT).toString().padStart(18,'0').replace(/0+$/,'');
  return (value / UNIT).toString() + (fraction ? '.' + fraction : '');
}

/** Signed claims, verified unpaid entitlements and unassigned commitments must
 * be disjoint. routineAlreadyCommitted is total budget consumption (including
 * already-paid claims); routineCommittedUnassigned is only its unpaid portion
 * not yet represented by signedOutstanding or verifiedUnpaid. Pool balance
 * is at a specified block; do not subtract already-paid claims from it again.
 * Reserve proposed tester cohorts before routine payouts. These are exact
 * accounting bounds, not permission to issue or a demand forecast. */
export function planRewardBudget(input) {
  assert(input.chainId === 43113, 'Fuji only');
  assert(typeof input.provenance === 'string' && input.provenance.trim(), 'Snapshot/assumption provenance required');
  assert(Number.isSafeInteger(input.testerSlots) && input.testerSlots >= 0 && input.testerSlots <= 50_000_000, 'Invalid tester slots');
  assert(Number.isInteger(input.organicBurnShareBps) && input.organicBurnShareBps >= 0 && input.organicBurnShareBps <= 10000, 'Invalid burn share');
  assert(['unmeasured','trial-measured'].includes(input.demandEvidence), 'Unknown demand evidence');
  assert(typeof input.authorityReady === 'boolean', 'Authority status required');
  const fields=['poolBalance','signedOutstanding','verifiedUnpaid','routineCommittedUnassigned','operatingBuffer','announcedRoutineCap','organicBurn','routineAlreadyCommitted'];
  const v=Object.fromEntries(fields.map(key=>[key,parseYarn(input[key])]));
  assert(v.routineCommittedUnassigned <= v.routineAlreadyCommitted, 'Unassigned commitment exceeds total committed routine budget');
  const protectedClaims=v.signedOutstanding+v.verifiedUnpaid;
  const protectedLiabilities=protectedClaims+v.routineCommittedUnassigned;
  const grants=BigInt(input.testerSlots)*20n*UNIT;
  const reserved=protectedLiabilities+v.operatingBuffer+grants;
  const gap=positive(reserved-v.poolBalance);
  const unreserved=positive(v.poolBalance-reserved);
  // Measured burn from a CLOSED observation period. Exclude sponsor/distributor
  // burns and suspicious activity. The same period's budget cannot be reused.
  const supported=v.organicBurn*BigInt(input.organicBurnShareBps)/10000n;
  const demandRemaining=positive(supported-v.routineAlreadyCommitted);
  const policyRemaining=positive(v.announcedRoutineCap-v.routineAlreadyCommitted);
  const arithmeticCeiling=min(unreserved,demandRemaining,policyRemaining);
  const ready=input.authorityReady && input.demandEvidence==='trial-measured' && gap===0n;
  const amount=ready?arithmeticCeiling:0n;
  return {
    chainId:43113,provenance:input.provenance,planningOnly:true,
    status:gap>0n?'INSUFFICIENT_RESERVED_FUNDS':!ready?'ROUTINE_DISABLED':amount===0n?'NO_NEW_BUDGET':'CANDIDATE_ONLY',
    testerSlots:input.testerSlots,grantReserve:formatYarn(grants),protectedClaims:formatYarn(protectedClaims),
    protectedUnassignedCommitments:formatYarn(v.routineCommittedUnassigned),protectedLiabilities:formatYarn(protectedLiabilities),
    totalReserve:formatYarn(reserved),fundingGap:formatYarn(gap),unreserved:formatYarn(unreserved),
    maximumFundableTesterSlots:Number(positive(v.poolBalance-protectedLiabilities-v.operatingBuffer)/(20n*UNIT)),
    arithmeticCeiling:formatYarn(arithmeticCeiling),candidateRoutineBudget:formatYarn(amount),
    burnBudgetRemaining:formatYarn(demandRemaining),announcedBudgetRemaining:formatYarn(policyRemaining),
    authorityReady:input.authorityReady,demandEvidence:input.demandEvidence,
    note:'No issuance enabled. Reconcile outstanding vouchers atomically before signing; chain caps and final eligibility still apply. This offline calculator does not attest provenance or enforce reservations.',
  };
}

export function exampleBudgets() {
  const base={chainId:43113,provenance:'Illustrative10000-funded pool minus two20 grants from recorded user-run smoke; not a fresh balance query.',poolBalance:'9960',signedOutstanding:'0',verifiedUnpaid:'0',operatingBuffer:'0',testerSlots:100,
    announcedRoutineCap:'1974.25',organicBurn:'0',routineAlreadyCommitted:'0',routineCommittedUnassigned:'0',organicBurnShareBps:5000,demandEvidence:'unmeasured',authorityReady:false};
  return [
    {name:'demo-100',...planRewardBudget(base)},
    {name:'demo-1000',...planRewardBudget({...base,testerSlots:1000})},
    {name:'signed-and-earned-reserves',...planRewardBudget({...base,signedOutstanding:'100',verifiedUnpaid:'150',operatingBuffer:'100'})},
    {name:'hypothetical-reviewed-trial',...planRewardBudget({...base,provenance:'Hypothetical closed-trial organic burn2000; no measured demand exists yet.',organicBurn:'2000',demandEvidence:'trial-measured',authorityReady:true})},
    {name:'same-period-budget-reuse',...planRewardBudget({...base,provenance:'Hypothetical2000 organic burn,1000 already committed to rewards; no fresh budget.',organicBurn:'2000',routineAlreadyCommitted:'1000',demandEvidence:'trial-measured',authorityReady:true})},
    {name:'unassigned-commitment-reserve',...planRewardBudget({...base,provenance:'Hypothetical pool2500, tester reserve2000, unassigned prior commitment400; only100 can be committed next.',poolBalance:'2500',organicBurn:'4000',routineAlreadyCommitted:'400',routineCommittedUnassigned:'400',demandEvidence:'trial-measured',authorityReady:true})},
  ];
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const path=process.argv.find(x=>x.startsWith('--input='))?.slice(8);
  const result=path?planRewardBudget(JSON.parse(readFileSync(path,'utf8'))):exampleBudgets();
  const output=JSON.stringify(result,null,2)+'\n';
  const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
  if(out)writeFileSync(out,output);
  console.log(output.trimEnd());
}
