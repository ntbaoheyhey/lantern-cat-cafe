import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzePilot,wilson} from './pilot-evidence.mjs';
const DAY=86400,start=1800000000,token='0x'+'a'.repeat(40);
const w=i=>'0x'+i.toString(16).padStart(40,'0');
const subject=(id,review='participant',patch={})=>({id:String(id),review,wallets:[w(id)],joinedAt:start,
 exposedAt:start+1,visits:[start,start+7*DAY],...patch});
const purchase=(id,patch={})=>({chainId:43113,token,wallet:w(id),txHash:'0x'+String(id).padStart(64,'0'),
 blockHash:'0x'+'b'.repeat(64),logIndex:1,block:100,timestamp:start+10,canonical:true,receiptStatus:1,
 orderId:String(id).padStart(8,'0')+'-2222-3333-4444-555555555555',sku:'fern',amountWei:'4000000000000000000',...patch});
const cohort=()=>({version:1,chainId:43113,token,mode:'synthetic',provenance:'Disposable test fixture',start,end:start+10*DAY,asOf:start+10*DAY,
 subjects:[subject(1),subject(2,'participant',{exposedAt:null,visits:[]}),subject(3,'operator')],
 purchases:[purchase(1),purchase(3)]});
test('Wilson reproduces NIST one-sided example and keeps endpoints/counts valid',()=>{
 assert(Math.abs(wilson(26,200,1.645).lower-.09577)<.00001);
 assert.equal(wilson(0,0).estimate,null);
 assert(wilson(0,20).upper>0);assert(wilson(20,20).lower<1);
 assert.throws(()=>wilson(21,20));assert.throws(()=>wilson(1,2,NaN));
});
test('nonviewers stay in denominator, operator burns separate, synthetic evidence cannot activate',()=>{
 const r=analyzePilot(cohort());
 assert.equal(r.purchaseAllEnrolled.estimate,.5);assert.equal(r.purchaseAfterPreview.estimate,1);
 assert.equal(r.day7Return.estimate,.5);assert.equal(r.burnByReview.participant,'4');assert.equal(r.burnByReview.operator,'4');
 assert.equal(r.activation,false);assert.equal(r.budgetEligibleBurn,'0');assert.match(r.measurement,/FIXTURE/);
});
test('extra wallets are grouped as one subject; duplicates never multiply buyers or burns',()=>{
 const c=cohort();c.subjects[0].wallets.push(w(4));c.purchases.push(purchase(4),purchase(1));
 const r=analyzePilot(c);assert.equal(r.purchaseAllEnrolled.successes,1);
 assert.equal(r.uniquePurchases,3);assert.equal(r.inputPurchases,4);assert.equal(r.multiWalletParticipants,1);
 assert.equal(r.burnByReview.participant,'8');
});
test('late entrants are censored only from day7 and still count for adoption',()=>{
 const c=cohort();c.subjects.push(subject(5,'participant',{joinedAt:start+9*DAY,exposedAt:null,visits:[]}));
 const r=analyzePilot(c);assert.equal(r.purchaseAllEnrolled.total,3);assert.equal(r.day7Return.total,2);assert.equal(r.censoredDay7,1);
});
test('rejects contradictory receipts, foreign tokens, wrong prices and repeat permanent purchases',()=>{
 for(const patch of [{receiptStatus:0},{canonical:false},{amountWei:'1'},{token:w(7)},{sku:'fake'},
  {timestamp:start-1},{wallet:w(9)},{orderId:'bad'},{block:-1}]){
  const c=cohort();c.purchases[0]={...c.purchases[0],...patch};assert.throws(()=>analyzePilot(c));
 }
 for(const extra of [purchase(1,{amountWei:'1'}),purchase(1,{txHash:'0x'+'c'.repeat(64)}),
  purchase(1,{orderId:'99999999-2222-3333-4444-555555555555',txHash:'0x'+'c'.repeat(64)})]){
  const c=cohort();c.purchases.push(extra);assert.throws(()=>analyzePilot(c));
 }
});
test('no measured cohort is a valid zero sample, never a perfect pass',()=>{
 const c=cohort();c.subjects=[];c.purchases=[];const r=analyzePilot(c);
 assert.equal(r.purchaseAllEnrolled.estimate,null);assert.equal(r.day7Return.estimate,null);
 assert.equal(r.activation,false);
});
test('fixed seven-day conversion never selects early successes from immature entrants',()=>{
 const c=cohort();
 c.subjects.push(subject(5,'participant',{joinedAt:start+9*DAY,exposedAt:null,visits:[]}));
 c.purchases.push(purchase(5,{timestamp:start+9*DAY+1}));
 const r=analyzePilot(c);
 assert.equal(r.purchaseAllEnrolled.successes,2);assert.equal(r.purchaseAllEnrolled.total,3);
 assert.equal(r.purchaseWithin7Days.successes,1);assert.equal(r.purchaseWithin7Days.total,2);
 assert.equal(r.censoredPurchase7Days,1);
 // A purchase exactly at day7 is outside [join,join+7days).
 c.purchases[0].timestamp=start+7*DAY;
 assert.equal(analyzePilot(c).purchaseWithin7Days.successes,0);
});
