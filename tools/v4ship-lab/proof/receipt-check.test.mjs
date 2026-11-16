import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyJourneyReceipts} from './receipt-check.mjs';

// Deliberately synthetic receipts: negative controls for the verifier only.
const wallet=`0x${'1'.repeat(40)}`,payer=`0x${'2'.repeat(40)}`;
const fixture=()=>{
 const proofs=Array.from({length:5},(_,i)=>({hash:`0x${String(i+1).repeat(64)}`,wallet,payer,
  action:`synthetic-${i}`,feeAvax:'0.000000000000000006',block:'1',confirmationMs:12,confirmedAt:1,local:true}));
 return {proofs,history:proofs.map(p=>({hash:p.hash,href:`https://testnet.snowtrace.io/tx/${p.hash}`})),
  receipts:proofs.map(p=>({transactionHash:p.hash,from:payer,status:'0x1',gasUsed:'0x2',effectiveGasPrice:'0x3',blockNumber:'0x1'}))};
};

test('receipt verification accepts matching RPC metadata and complete history',async t=>{
 const f=fixture();t.mock.method(globalThis,'fetch',async(_url,request)=>({ok:true,json:async()=>({result:f.receipts.find(r=>r.transactionHash===JSON.parse(request.body).params[0])})}));
 assert.equal((await verifyJourneyReceipts(f.proofs,f.history,wallet)).pass,true);
});

for(const [name,mutate] of [
 ['failed RPC status',f=>{f.receipts[0].status='0x0';}],
 ['incorrect payer',f=>{f.proofs[0].payer=wallet;}],
 ['incorrect fee',f=>{f.proofs[0].feeAvax='0.000000000000000005';}],
 ['incorrect block',f=>{f.proofs[0].block='2';}],
 ['missing duration',f=>{f.proofs[0].confirmationMs=null;}],
 ['missing wallet receipt',f=>{f.history.shift();}],
 ['incorrect explorer',f=>{f.history[0].href='https://example.invalid/tx';}],
 ['fewer than five actions',f=>{f.proofs[0].action=f.proofs[1].action;}],
 ['public receipt mislabeled as local',f=>{f.proofs[0].local=false;}],
])test(`receipt verification rejects ${name}`,async t=>{
 const f=fixture();mutate(f);t.mock.method(globalThis,'fetch',async(_url,request)=>({ok:true,json:async()=>({result:f.receipts.find(r=>r.transactionHash===JSON.parse(request.body).params[0])})}));
 assert.equal((await verifyJourneyReceipts(f.proofs,f.history,wallet)).pass,false);
});

test('receipt verification rejects empty evidence and missing RPC receipts',async t=>{
 assert.equal((await verifyJourneyReceipts([],[],wallet)).pass,false);
 const f=fixture();t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({result:null})}));
 await assert.rejects(verifyJourneyReceipts(f.proofs,f.history,wallet),/Missing local RPC receipt/);
});
