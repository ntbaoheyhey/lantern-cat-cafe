// Offline replay of reviewed evidence and disjoint promises. No signer or RPC.
import assert from 'node:assert/strict';
import {parseYarn,formatYarn} from './reward-budget.mjs';
import {summarizeBurnEvidence} from './burn-evidence.mjs';
/** Never reuses the same period or paid reward. Signed liabilities are released
 * only after a pinned, independently supplied unused-nonce/expiry observation.
 * Receipt/review authority is supplied by the caller; replay does not attest it. */
export function reconcileBurnCredit({chainId,token,contract,shareBps,periods,commitments,snapshot}) {
 assert.equal(chainId,43113,'Fuji only');
 const address=/^0x[0-9a-fA-F]{40}$/,hash=/^0x[0-9a-fA-F]{64}$/;
 assert(address.test(token)&&address.test(contract),'Invalid token or rewards contract');
 assert(Number.isSafeInteger(shareBps)&&shareBps>=0&&shareBps<=10000,'Invalid burn share');
 assert(Number.isSafeInteger(snapshot.block)&&snapshot.block>=0&&Number.isSafeInteger(snapshot.timestamp)&&snapshot.timestamp>=0,'Pinned snapshot required');
 assert(/^0x[0-9a-fA-F]{64}$/.test(snapshot.hash),'Invalid snapshot hash');
 const ranges=[...periods].sort((a,b)=>a.fromBlock-b.fromBlock),digests=new Set(),eventIds=new Set();
 let last=-1,organic=0n;
 for(const p of ranges){
  assert(p.chainId===chainId&&p.token.toLowerCase()===token.toLowerCase(),'Foreign period');
  assert(p.completeClosedPeriod===true&&p.toBlock<=snapshot.block,'Only closed observed periods earn credit');
  assert(p.fromBlock>last,'Overlapping or repeated burn periods');last=p.toBlock;
  const summary=summarizeBurnEvidence(p);
  assert(!digests.has(summary.digest),'Duplicate period');digests.add(summary.digest);
  for(const row of summary.rows){assert(!eventIds.has(row.eventId),'Repeated burn receipt');eventIds.add(row.eventId);}
  organic+=parseYarn(summary.budgetEligibleBurn);
 }
 assert(organic<=parseYarn('1000000000'),'Burn evidence exceeds fixed genesis');
 const ids=new Set(),nonces=new Set(),payments=new Set();let paid=0n,reserved=0n,released=0n;
 const activeStates=new Set(['reserved','signed','paid','cancelled','expired']);
 for(const c of commitments){
  assert(typeof c.id==='string'&&c.id.trim()&&!ids.has(c.id),'Duplicate/missing commitment identity');ids.add(c.id);
  assert(activeStates.has(c.state),'Unknown commitment state');
  const amount=parseYarn(c.amount);assert(amount>0n,'Zero commitment');
  assert(c.signed===true||c.signed===false,'Signature state required');
  if(c.signed){
   assert(address.test(c.player)&&typeof c.season==='string'&&/^(0|[1-9][0-9]*)$/.test(c.season)&&BigInt(c.season)<2n**256n,'Signed player and season required');
   assert(typeof c.nonce==='string'&&/^(0|[1-9][0-9]*)$/.test(c.nonce)&&!nonces.has(c.nonce),'Repeated/invalid signed nonce');
   assert(BigInt(c.nonce)<2n**256n,'Nonce exceeds uint256');nonces.add(c.nonce);
   assert(Number.isSafeInteger(c.expiry)&&c.expiry>=0,'Signed expiry required');
  }
  if(c.state==='paid'){
   assert(c.signed&&c.receipt?.canonical===true&&c.receipt.status===1&&c.receipt.block<=snapshot.block&&
    Number.isSafeInteger(c.receipt.block)&&c.receipt.block>=0&&hash.test(c.receipt.transactionHash)&&hash.test(c.receipt.blockHash),'Paid claims need a pinned successful receipt');
   const r=c.receipt;
   assert(r.chainId===chainId&&address.test(r.contract)&&r.contract.toLowerCase()===contract.toLowerCase(),'Foreign claim receipt');
   assert(r.block!==snapshot.block||r.blockHash.toLowerCase()===snapshot.hash.toLowerCase(),'Claim snapshot hash mismatch');
   assert(Number.isSafeInteger(r.logIndex)&&r.logIndex>=0,'Claim event identity required');
   const id=r.transactionHash.toLowerCase()+':'+r.logIndex;
   assert(!payments.has(id),'Repeated claim receipt');payments.add(id);
   assert(r.event==='Claimed'&&r.player?.toLowerCase()===c.player.toLowerCase()&&r.season===c.season&&r.nonce===c.nonce&&parseYarn(r.amount)===amount,'Claim receipt does not match liability');
   paid+=amount;
  }else if(c.state==='expired'){
   assert(c.signed&&snapshot.timestamp>c.expiry,'A signature is valid at its expiry second');
   const e=c.unusedNonce;
   assert(e?.used===false&&e.chainId===chainId&&e.contract?.toLowerCase()===contract.toLowerCase()&&e.nonce===c.nonce&&e.block===snapshot.block&&e.blockHash===snapshot.hash,'Expiry alone cannot prove the voucher was never paid');
   released+=amount;
  }else if(c.state==='cancelled'){
   assert(!c.signed,'Signed promises cannot be cancelled offline');released+=amount;
  }else{
   assert((c.state==='signed')===c.signed,'Reservation/signature state mismatch');reserved+=amount;
  }
 }
 const earned=organic*BigInt(shareBps)/10000n,used=paid+reserved;
 assert(used<=earned,'Paid and outstanding promises oversubscribe reviewed burn credit');
 return {chainId,token,contract,snapshot,shareBps,periods:ranges.length,events:eventIds.size,
  organicBurn:formatYarn(organic),earnedCredit:formatYarn(earned),paid:formatYarn(paid),
  reserved:formatYarn(reserved),released:formatYarn(released),availableCredit:formatYarn(earned-used),
  planningOnly:true,activation:false,
  note:'Canonical history, decoded claim events and unused-nonce observations require external verification; their identities/amounts are matched here. Available credit is still capped by pool funding, allocation, current contract cap and authoritative eligibility; replay does not reserve or sign anything.'};
}
