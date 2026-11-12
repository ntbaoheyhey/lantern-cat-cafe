// Offline analysis of a fixed, reviewed tester cohort. No collection, RPC or signing.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {YARN_STYLES} from '../../packages/chain/src/cosmetics.ts';
import {formatYarn} from './reward-budget.mjs';
const DAY=86400,addr=/^0x[0-9a-fA-F]{40}$/,hash=/^0x[0-9a-fA-F]{64}$/;
const nonnegative=n=>Number.isSafeInteger(n)&&n>=0;

/** NIST Wilson score interval; descriptive uncertainty, not causal inference. */
export function wilson(successes,total,z=1.959963984540054) {
  assert(nonnegative(successes)&&nonnegative(total)&&successes<=total,'Invalid binomial counts');
  assert(Number.isFinite(z)&&z>0,'Invalid normal quantile');
  if(total===0)return {successes,total,estimate:null,lower:null,upper:null};
  const p=successes/total,z2=z*z,denominator=1+z2/total;
  const center=(p+z2/(2*total))/denominator;
  const margin=z*Math.sqrt(p*(1-p)/total+z2/(4*total*total))/denominator;
  return {successes,total,estimate:p,lower:Math.max(0,center-margin),upper:Math.min(1,center+margin)};
}

export function analyzePilot(input) {
  assert(input.version===1&&input.chainId===43113&&addr.test(input.token),'Versioned Fuji cohort required');
  assert(['synthetic','controlled','voluntary'].includes(input.mode),'Declare how testers were recruited');
  assert([input.start,input.end,input.asOf].every(nonnegative)&&input.start<input.end&&input.asOf>=input.end,'Closed observation window required');
  assert(typeof input.provenance==='string'&&input.provenance.trim(),'Reviewed export provenance required');
  const subjects=new Map(),wallets=new Map();
  for(const s of input.subjects){
    assert(typeof s.id==='string'&&s.id.trim()&&!subjects.has(s.id),'Repeated/missing subject identity');
    assert(['participant','operator','automation','suspected','unreviewed'].includes(s.review),'Declare cohort review');
    assert(nonnegative(s.joinedAt)&&s.joinedAt>=input.start&&s.joinedAt<input.end,'Enrollment outside window');
    assert(s.exposedAt===null||(nonnegative(s.exposedAt)&&s.exposedAt>=s.joinedAt&&s.exposedAt<input.end),'Invalid first preview');
    assert(Array.isArray(s.wallets)&&s.wallets.length>0&&Array.isArray(s.visits),'Wallets and visits required');
    for(const time of s.visits)assert(nonnegative(time)&&time>=s.joinedAt&&time<input.end,'Visit outside observed window');
    for(const raw of s.wallets){
      assert(addr.test(raw)&&!wallets.has(raw.toLowerCase()),'Duplicate/foreign subject wallet');
      wallets.set(raw.toLowerCase(),s.id);
    }
    subjects.set(s.id,s);
  }
  const unique=new Map(),orders=new Map(),owned=new Map(),buyers=new Set(),postPreviewBuyers=new Set(),firstPurchase=new Map();
  const burn={participant:0n,operator:0n,automation:0n,suspected:0n,unreviewed:0n};
  for(const p of input.purchases){
    assert(p.chainId===43113&&addr.test(p.token)&&p.token.toLowerCase()===input.token.toLowerCase(),'Foreign token purchase');
    assert(hash.test(p.txHash)&&hash.test(p.blockHash)&&nonnegative(p.logIndex)&&nonnegative(p.block),'Pinned event identity required');
    assert(p.canonical===true&&p.receiptStatus===1,'Confirmed canonical purchase required');
    assert(addr.test(p.wallet)&&wallets.has(p.wallet.toLowerCase()),'Purchase outside enrolled cohort');
    const s=subjects.get(wallets.get(p.wallet.toLowerCase()));
    assert(nonnegative(p.timestamp)&&p.timestamp>=s.joinedAt&&p.timestamp<input.end,'Purchase outside observation window');
    const style=YARN_STYLES.find(s=>s.id===p.sku);
    assert(style&&p.amountWei===style.cost,'Purchase must match the shipped catalog cost');
    assert(typeof p.orderId==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(p.orderId),'Server order identity required');
    const id=p.txHash.toLowerCase()+':'+p.logIndex;
    const row={...p,txHash:p.txHash.toLowerCase(),blockHash:p.blockHash.toLowerCase(),wallet:p.wallet.toLowerCase(),token:p.token.toLowerCase()};
    if(unique.has(id)){assert.deepEqual(unique.get(id),row,'Conflicting duplicate event');continue;}
    unique.set(id,row);
    assert(!orders.has(p.orderId),'An order cannot be counted in two payments');orders.set(p.orderId,id);
    const ownership=row.wallet+':'+row.sku;
    assert(!owned.has(ownership),'Permanent style cannot be repurchased by the same account');owned.set(ownership,id);
    burn[s.review]+=BigInt(p.amountWei);
    if(s.review==='participant'){
      buyers.add(s.id);
      firstPurchase.set(s.id,Math.min(firstPurchase.get(s.id)??Infinity,p.timestamp));
      if(s.exposedAt!==null&&p.timestamp>=s.exposedAt)postPreviewBuyers.add(s.id);
    }
  }
  const participants=[...subjects.values()].filter(s=>s.review==='participant');
  const exposed=participants.filter(s=>s.exposedAt!==null);
  // A missing preview is retained in the all-enrolled denominator. A participant
  // with incomplete follow-up is censored only from the day7 return calculation.
  const mature=participants.filter(s=>s.joinedAt+8*DAY<=input.end);
  const returned=mature.filter(s=>s.visits.some(t=>t>=s.joinedAt+7*DAY&&t<s.joinedAt+8*DAY));
  // Compare the same seven days for every mature entrant. Buying early does not
  // waive follow-up maturity: otherwise early successes bias the denominator.
  const purchaseMature=participants.filter(s=>s.joinedAt+7*DAY<=input.end);
  const purchasedWeek1=purchaseMature.filter(s=>(firstPurchase.get(s.id)??Infinity)<s.joinedAt+7*DAY);
  const hiddenParticipants=participants.filter(s=>s.wallets.length>1).length;
  return {version:1,chainId:43113,token:input.token,mode:input.mode,provenance:input.provenance,
    window:{start:input.start,end:input.end,asOf:input.asOf},subjects:subjects.size,wallets:wallets.size,
    participants:participants.length,excludedSubjects:subjects.size-participants.length,
    multiWalletParticipants:hiddenParticipants,uniquePurchases:unique.size,inputPurchases:input.purchases.length,
    purchaseAllEnrolled:wilson(buyers.size,participants.length),
    purchaseWithin7Days:wilson(purchasedWeek1.length,purchaseMature.length),
    censoredPurchase7Days:participants.length-purchaseMature.length,
    purchaseAfterPreview:wilson(postPreviewBuyers.size,exposed.length),
    day7Return:wilson(returned.length,mature.length),censoredDay7:participants.length-mature.length,
    burnByReview:Object.fromEntries(Object.entries(burn).map(([k,v])=>[k,formatYarn(v)])),
    measurement:input.mode==='synthetic'?'TEST FIXTURE — not player evidence':'TESTNET COHORT — not real-money willingness to pay',
    activation:false,budgetEligibleBurn:'0',
    limitations:[
      'Canonical events, order/payment bindings and subject grouping are reviewed input assertions; this analyzer cannot attest their truth.',
      'Wallets are not people. One reviewed subject may own multiple wallets; unidentified clusters invalidate independent-trial inference.',
      'Wilson intervals are descriptive under independent comparable participants; no optional stopping, post-hoc exclusion or causal price claim.',
      'All-enrolled purchase has unequal follow-up; use purchaseWithin7Days for the fixed horizon. Late entrants are censored regardless of an early purchase. Nonviewers remain in every eligible denominator.',
      'Operators, scripts and suspected identities are reported separately; review criteria must be fixed before inspecting purchase outcomes.',
      'Free20-YARN grants and permanent three-item content do not establish recurring demand. Synthetic/control purchases never fund routine rewards.',
      'This feature-only sample is not a complete token ledger, item-supply study, closed13-week economy review or approval to activate rewards.'
    ]};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const input=process.argv[2],output=process.argv[3];
  assert(input&&output,'Usage: node tools/chain/pilot-evidence.mjs reviewed-input.json output.json');
  assert(resolve(input)!==resolve(output),'Do not overwrite source evidence');
  const result=analyzePilot(JSON.parse(readFileSync(input,'utf8')));
  writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({measurement:result.measurement,participants:result.participants,activation:false}));
}
