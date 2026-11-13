// Receipt accounting and review boundaries only. Never signs or enables rewards.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseYarn,formatYarn} from './reward-budget.mjs';
const address=/^0x[0-9a-fA-F]{40}$/,hash=/^0x[0-9a-fA-F]{64}$/;
const allowedCategories=new Set(['seal','market','other']);
const allowedVerdicts=new Set(['organic','demo','operator','suspected','unreviewed']);
/** Two providers at the SAME pinned snapshot. This attests agreement about
 * public history, not human ownership, willingness, or closed-season demand. */
export function compareLedgerAudits(first,second) {
 for(const audit of [first,second]){
  assert(audit.accounting.chainId===43113&&audit.reconciliation?.reconciled===true,'Complete Fuji reconciliation required');
  assert(audit.ranges.length>0,'A receipt sample is not a genesis ledger');
  let next=audit.accounting.fromBlock;
  for(const range of audit.ranges){
   assert(Number.isSafeInteger(range.from)&&Number.isSafeInteger(range.to)&&range.from===next&&range.to>=range.from,'Ledger scan has a gap or overlap');
   next=range.to+1;
  }
  assert.equal(next,audit.snapshotBlock+1,'Ledger scan does not reach snapshot');
  assert.equal(audit.accounting.toBlock,audit.snapshotBlock,'Accounting snapshot mismatch');
  assert(hash.test(audit.snapshotHash),'Invalid snapshot identity');
 }
 assert(first.provider&&second.provider&&first.provider!==second.provider,'Different provider URLs required');
 assert.equal(first.snapshotBlock,second.snapshotBlock,'Compare identical snapshot blocks');
 assert.equal(first.snapshotHash.toLowerCase(),second.snapshotHash.toLowerCase(),'Provider chain disagreement');
 assert.equal(first.accounting.token.toLowerCase(),second.accounting.token.toLowerCase(),'Different tokens');
 assert.deepEqual(first.reconciliation,second.reconciliation,'Provider ledger disagreement');
 assert.equal(first.accounting.digest,second.accounting.digest,'Provider burn evidence disagreement');
 return {chainId:43113,token:first.accounting.token,snapshotBlock:first.snapshotBlock,snapshotHash:first.snapshotHash,
  providers:[first.provider,second.provider],reconciled:true,transferCount:first.reconciliation.transferCount,
  minted:first.reconciliation.minted,burned:first.reconciliation.burned,supply:first.reconciliation.supply,
  budgetEligibleBurn:first.accounting.budgetEligibleBurn,activation:false,
  note:'Two endpoints agree at one pinned snapshot. Endpoint diversity does not prove independent infrastructure, Sybil resistance, organic demand or a complete closed season.'};
}
/** Reconcile a FROM-GENESIS token transfer history to a pinned supply/balance
 * snapshot. The caller must establish deployment coverage and canonical logs.
 * This detects omissions affecting balances; it is not a second RPC attestation. */
export function reconcileTokenHistory({transfers,observedSupply,observedBalances}){
 const zero='0x'+'0'.repeat(40),seen=new Map(),balances=new Map();
 let minted=0n,burned=0n;
 for(const t of transfers){
  assert(hash.test(t.transactionHash)&&hash.test(t.blockHash),'Invalid transfer identity');
  assert(address.test(t.from)&&address.test(t.to),'Invalid transfer party');
  assert(Number.isSafeInteger(t.blockNumber)&&t.blockNumber>=0&&Number.isSafeInteger(t.logIndex)&&t.logIndex>=0,'Invalid transfer position');
  const normalized={transactionHash:t.transactionHash.toLowerCase(),blockHash:t.blockHash.toLowerCase(),
   from:t.from.toLowerCase(),to:t.to.toLowerCase(),amount:formatYarn(parseYarn(t.amount)),blockNumber:t.blockNumber,logIndex:t.logIndex};
  const id=normalized.transactionHash+':'+t.logIndex;
  if(seen.has(id))assert.deepEqual(seen.get(id),normalized,'Conflicting transfer');
  seen.set(id,normalized);
 }
 for(const t of [...seen.values()].sort((a,b)=>a.blockNumber-b.blockNumber||a.logIndex-b.logIndex)){
  const amount=parseYarn(t.amount);
  assert(t.from!==zero||t.to!==zero,'Invalid zero-to-zero transfer');
  if(t.from===zero)minted+=amount;
  else {const balance=(balances.get(t.from)??0n)-amount;assert(balance>=0n,'Incomplete history: transfer exceeds ledger balance');balances.set(t.from,balance);}
  if(t.to===zero)burned+=amount;else balances.set(t.to,(balances.get(t.to)??0n)+amount);
 }
 const supply=minted-burned;
 assert.equal(supply,parseYarn(observedSupply),'Token supply does not reconcile');
 const observed=new Map();
 for(const [owner,value] of Object.entries(observedBalances)){
  assert(address.test(owner)&&owner.toLowerCase()!==zero&&!observed.has(owner.toLowerCase()),'Invalid/duplicate observed holder');
  observed.set(owner.toLowerCase(),parseYarn(value));
 }
 assert.equal(observed.size,balances.size,'Must observe every touched address');
 for(const [owner,balance] of balances)assert.equal(observed.get(owner),balance,'Holder balance does not reconcile');
 assert.equal([...balances.values()].reduce((a,b)=>a+b,0n),supply);
 return {transferCount:seen.size,inputCount:transfers.length,minted:formatYarn(minted),burned:formatYarn(burned),
  supply:formatYarn(supply),balances:Object.fromEntries([...balances].sort().map(([k,v])=>[k,formatYarn(v)])),reconciled:true};
}
export function summarizeBurnEvidence({chainId,token,fromBlock,toBlock,completeClosedPeriod=false,events,reviews=[]}){
 assert.equal(chainId,43113,'Fuji only');
 assert(address.test(token),'Invalid token');
 assert(Number.isSafeInteger(fromBlock)&&Number.isSafeInteger(toBlock)&&fromBlock>=0&&toBlock>=fromBlock,'Invalid block range');
 assert(typeof completeClosedPeriod==='boolean','Period scope required');
 const unique=new Map(),reviewMap=new Map();
 for(const r of reviews){
  assert(typeof r.eventId==='string'&&allowedVerdicts.has(r.verdict),'Invalid review');
  assert(!reviewMap.has(r.eventId),'Duplicate review');
  assert(Array.isArray(r.evidence)&&r.evidence.every(s=>typeof s==='string'&&s.trim()),'Review evidence must be references');
  if(r.verdict!=='unreviewed')assert(r.evidence.length,'Review requires evidence');
  reviewMap.set(r.eventId,r);
 }
 for(const e of events){
  assert(e.chainId===43113&&e.token.toLowerCase()===token.toLowerCase(),'Foreign burn');
  assert(hash.test(e.transactionHash)&&hash.test(e.blockHash),'Invalid receipt identity');
  assert(Number.isSafeInteger(e.logIndex)&&e.logIndex>=0&&address.test(e.from),'Invalid log');
  assert(Number.isSafeInteger(e.blockNumber)&&e.blockNumber>=fromBlock&&e.blockNumber<=toBlock,'Burn outside snapshot');
  assert(e.receiptStatus===1&&e.canonical===true,'Unconfirmed or reverted receipt');
  assert(allowedCategories.has(e.category),'Invalid burn category');
  const amount=parseYarn(e.amount);
  assert(amount>0n,'Zero value is not a measured burn');
  const eventId=e.transactionHash.toLowerCase()+':'+e.logIndex;
  const normalized={...e,transactionHash:e.transactionHash.toLowerCase(),blockHash:e.blockHash.toLowerCase(),
   token:e.token.toLowerCase(),from:e.from.toLowerCase(),eventId,amount:formatYarn(amount)};
  if(unique.has(eventId))assert.deepEqual(unique.get(eventId),normalized,'Conflicting duplicate receipt');
  unique.set(eventId,normalized);
 }
 for(const id of reviewMap.keys())assert(unique.has(id),'Review references an absent burn');
 const totals={gross:0n,organic:0n,demo:0n,operator:0n,suspected:0n,unreviewed:0n};
 const rows=[...unique.values()].sort((a,b)=>a.blockNumber-b.blockNumber||a.logIndex-b.logIndex||a.transactionHash.localeCompare(b.transactionHash)).map(e=>{
  const review=reviewMap.get(e.eventId),verdict=review?.verdict??'unreviewed';
  assert(verdict!=='organic'||e.category!=='other','Arbitrary burns are not a game demand signal');
  const amount=parseYarn(e.amount);totals.gross+=amount;totals[verdict]+=amount;
  return {...e,verdict,evidence:review?.evidence??[]};
 });
 assert.equal(totals.organic+totals.demo+totals.operator+totals.suspected+totals.unreviewed,totals.gross);
 const digest=createHash('sha256').update(JSON.stringify({chainId,token:token.toLowerCase(),fromBlock,toBlock,completeClosedPeriod,rows})).digest('hex');
 return {chainId,token,fromBlock,toBlock,completeClosedPeriod,eventCount:rows.length,inputCount:events.length,
  digest,totals:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,formatYarn(v)])),rows,
  budgetEligibleBurn:completeClosedPeriod?formatYarn(totals.organic):'0',
  demandEvidence:completeClosedPeriod&&totals.organic>0n?'reviewed-input-only':'unmeasured',
  activation:false,note:'Reviews are caller assertions, not identity or authority proofs. Incomplete receipt samples never fund a period. No volume rewards, signer, or reservation is enabled.'};
}
