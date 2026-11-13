import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeBurnEvidence,reconcileTokenHistory,compareLedgerAudits} from './burn-evidence.mjs';
const token='0x'+'1'.repeat(40),tx='0x'+'2'.repeat(64);
const event={chainId:43113,token,transactionHash:tx,blockHash:'0x'+'3'.repeat(64),logIndex:1,
 blockNumber:100,from:'0x'+'4'.repeat(40),receiptStatus:1,canonical:true,category:'seal',amount:'2'};
const base={chainId:43113,token,fromBlock:90,toBlock:110,events:[event]};
const review=(verdict)=>({eventId:tx+':1',verdict,evidence:['fixture:trusted-source-receipt']});
test('cross-provider agreement requires contiguous complete history and an identical snapshot',()=>{
 const accounting=summarizeBurnEvidence(base);
 const first={provider:'https://provider-a.invalid',accounting,snapshotBlock:110,snapshotHash:event.blockHash,
  ranges:[{from:90,to:100},{from:101,to:110}],reconciliation:{reconciled:true,transferCount:3,minted:'1000',burned:'2',supply:'998'}};
 const second={...first,provider:'https://provider-b.invalid',ranges:[{from:90,to:110}]};
 assert.equal(compareLedgerAudits(first,second).activation,false);
 for(const change of [{provider:first.provider},{snapshotBlock:111},{snapshotHash:'0x'+'7'.repeat(64)},
  {ranges:[{from:90,to:99},{from:101,to:110}]},{ranges:[]},{reconciliation:{...first.reconciliation,supply:'999'}},
  {accounting:{...accounting,digest:'different'}}])assert.throws(()=>compareLedgerAudits(first,{...second,...change}));
});
test('known demo burns and incomplete samples cannot fund routine rewards',()=>{
 const demo=summarizeBurnEvidence({...base,reviews:[review('demo')]});
 assert.equal(demo.totals.gross,'2');assert.equal(demo.totals.demo,'2');assert.equal(demo.budgetEligibleBurn,'0');
 const sample=summarizeBurnEvidence({...base,reviews:[review('organic')]});
 assert.equal(sample.totals.organic,'2');assert.equal(sample.budgetEligibleBurn,'0');assert.equal(sample.activation,false);
 const closed=summarizeBurnEvidence({...base,completeClosedPeriod:true,reviews:[review('organic')]});
 assert.equal(closed.budgetEligibleBurn,'2');assert.equal(closed.activation,false);
});
test('unreviewed burns stay unknown; arbitrary burns do not attest game demand',()=>{
 assert.equal(summarizeBurnEvidence(base).totals.unreviewed,'2');
 assert.throws(()=>summarizeBurnEvidence({...base,events:[{...event,category:'other'}],reviews:[review('organic')]}));
 assert.throws(()=>summarizeBurnEvidence({...base,reviews:[{...review('organic'),evidence:[]}]}));
});
test('receipt retries deduplicate exactly and conflicts or forged identities reject',()=>{
 const r=summarizeBurnEvidence({...base,events:[event,{...event}]});
 assert.equal(r.eventCount,1);assert.equal(r.totals.gross,'2');
 for(const change of [{amount:'3'},{blockHash:'0x'+'5'.repeat(64)}])
  assert.throws(()=>summarizeBurnEvidence({...base,events:[event,{...event,...change}]}));
 for(const change of [{chainId:1},{token:'0x'+'5'.repeat(40)},{blockNumber:89},{receiptStatus:0},{canonical:false},{amount:'0'},{amount:'1e20'}])
  assert.throws(()=>summarizeBurnEvidence({...base,events:[{...event,...change}]}));
});
test('review completeness and source digest are stable across input ordering',()=>{
 const other={...event,transactionHash:'0x'+'6'.repeat(64),logIndex:2,amount:'0.04'};
 const a=summarizeBurnEvidence({...base,events:[event,other]});
 const b=summarizeBurnEvidence({...base,events:[other,event]});
 assert.equal(a.digest,b.digest);assert.equal(a.totals.gross,'2.04');
 assert.throws(()=>summarizeBurnEvidence({...base,reviews:[review('demo'),review('demo')]}));
 assert.throws(()=>summarizeBurnEvidence({...base,events:[],reviews:[review('demo')]}));
});

test('genesis history reconciles every touched balance and detects missing or conflicting transfers',()=>{
 const zero='0x'+'0'.repeat(40),a=event.from,b='0x'+'5'.repeat(40);
 const mint={...event,from:zero,to:a,amount:'1000',logIndex:0};
 const move={...event,from:a,to:b,amount:'20',logIndex:1};
 const burn={...event,from:b,to:zero,amount:'2',logIndex:2};
 const input={transfers:[mint,move,burn],observedSupply:'998',observedBalances:{[a]:'980',[b]:'18'}};
 const result=reconcileTokenHistory(input);
 assert.equal(result.burned,'2');assert.equal(result.minted,'1000');
 assert.equal(reconcileTokenHistory({...input,transfers:[burn,move,mint,mint]}).transferCount,3);
 for(const transfers of [[move,burn],[mint,burn],[mint,move],[mint,move,burn,{...burn,amount:'3'}]])
  assert.throws(()=>reconcileTokenHistory({...input,transfers}));
 assert.throws(()=>reconcileTokenHistory({...input,observedSupply:'999'}));
 assert.throws(()=>reconcileTokenHistory({...input,observedBalances:{[a]:'980'}}));
 assert.throws(()=>reconcileTokenHistory({...input,observedBalances:{[a]:'981',[b]:'17'}}));
});
