import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileBurnCredit} from './burn-credit-ledger.mjs';
const contract='0x'+'6'.repeat(40),player='0x'+'7'.repeat(40);
const token='0x'+'1'.repeat(40),hash='0x'+'2'.repeat(64),tx='0x'+'3'.repeat(64);
const event={chainId:43113,token,transactionHash:tx,blockHash:hash,logIndex:0,blockNumber:100,
 from:'0x'+'4'.repeat(40),receiptStatus:1,canonical:true,category:'seal',amount:'100'};
const period={chainId:43113,token,fromBlock:90,toBlock:110,completeClosedPeriod:true,events:[event],
 reviews:[{eventId:tx+':0',verdict:'organic',evidence:['fixture reviewed receipt; not production']} ]};
const base={chainId:43113,token,contract,shareBps:5000,periods:[period],commitments:[],snapshot:{block:120,timestamp:300,hash}};
const signed={id:'boss:week1:alice',amount:'10',state:'signed',signed:true,player,season:'0',nonce:'1',expiry:200};
test('carry credit counts paid, reserved and signed liabilities once and is replay-idempotent',()=>{
 const commitments=[signed,{id:'rank:season1:bob',amount:'15',state:'reserved',signed:false},
  {...signed,id:'boss:week1:carol',nonce:'2',amount:'5',state:'paid',receipt:{chainId:43113,contract,canonical:true,status:1,block:115,blockHash:hash,transactionHash:tx,logIndex:1,event:'Claimed',player,season:'0',nonce:'2',amount:'5'}}];
 const r=reconcileBurnCredit({...base,commitments});
 assert.equal(r.earnedCredit,'50');assert.equal(r.paid,'5');assert.equal(r.reserved,'25');assert.equal(r.availableCredit,'20');
 assert.deepEqual(reconcileBurnCredit({...base,commitments:[...commitments].reverse()}),r);
 assert.equal(r.activation,false);
});
test('signed expiry needs unused-nonce evidence at the same pinned block and strictly later timestamp',()=>{
 const expired={...signed,state:'expired',unusedNonce:{used:false,chainId:43113,contract,nonce:'1',block:120,blockHash:hash}};
 assert.equal(reconcileBurnCredit({...base,commitments:[expired]}).availableCredit,'50');
 for(const c of [{...signed,state:'cancelled'},{...expired,unusedNonce:undefined},
  {...expired,unusedNonce:{...expired.unusedNonce,used:true}},{...expired,unusedNonce:{...expired.unusedNonce,block:119}},
  {...expired,expiry:300}])assert.throws(()=>reconcileBurnCredit({...base,commitments:[c]}));
 assert.equal(reconcileBurnCredit({...base,commitments:[{id:'unsigned',amount:'40',state:'cancelled',signed:false}]}).released,'40');
});
test('overlapping periods, duplicate nonces, missing paid receipts and oversubscriptions reject',()=>{
 assert.throws(()=>reconcileBurnCredit({...base,periods:[period,period]}));
 assert.throws(()=>reconcileBurnCredit({...base,periods:[{...period,completeClosedPeriod:false}]}));
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[signed,signed]}));
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[signed,{...signed,id:'different'}]}));
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[{...signed,amount:'51'}]}));
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[{...signed,state:'paid'}]}));
 assert.throws(()=>reconcileBurnCredit({...base,periods:[{...period,token:'0x'+'5'.repeat(40)}]}));
});
test('unreviewed, demonstration and zero activity never earn budget credit',()=>{
 for(const verdict of ['unreviewed','demo','operator','suspected']){
  const p={...period,reviews:[{...period.reviews[0],verdict}]};
  assert.equal(reconcileBurnCredit({...base,periods:[p]}).availableCredit,'0');
 }
 assert.equal(reconcileBurnCredit({...base,periods:[]}).availableCredit,'0');
});

test('a paid or expired promise must match the same rewards contract, player, nonce and amount',()=>{
 const receipt={chainId:43113,contract,canonical:true,status:1,block:120,blockHash:hash,transactionHash:tx,logIndex:1,event:'Claimed',player,season:'0',nonce:'1',amount:'10'};
 const paid={...signed,state:'paid',receipt};
 assert.equal(reconcileBurnCredit({...base,commitments:[paid]}).paid,'10');
 for(const change of [{chainId:1},{contract:token},{player:token},{nonce:'2'},{season:'1'},{amount:'9'},
  {logIndex:-1},{blockHash:tx},{event:'Transfer'},{blockHash:undefined}]){
  assert.throws(()=>reconcileBurnCredit({...base,commitments:[{...paid,receipt:{...receipt,...change}}]}));
 }
 const expired={...signed,state:'expired',unusedNonce:{used:false,chainId:1,contract,nonce:'1',block:120,blockHash:hash}};
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[expired]}));
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[{...expired,unusedNonce:{...expired.unusedNonce,chainId:43113,contract:token}}]}));
 const duplicate={...paid,id:'another',nonce:'2',receipt:{...receipt,nonce:'2'}};
 assert.throws(()=>reconcileBurnCredit({...base,commitments:[paid,duplicate]}),/Repeated claim receipt/);
});
