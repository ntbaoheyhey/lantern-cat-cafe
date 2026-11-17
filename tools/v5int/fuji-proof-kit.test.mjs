import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {FUNDING_WEI,fundingProof,publicConfig,collectProof} from './fuji-proof-kit.mjs';
const guest='0x'+'12'.repeat(20),payer='0x'+'34'.repeat(20),hash='0x'+'56'.repeat(32);
const input=()=>({hash,guest,local:true,confirmationMs:1250,
  tx:{hash,from:payer,to:guest,value:`0x${FUNDING_WEI.toString(16)}`},
  receipt:{transactionHash:hash,from:payer,to:guest,status:'0x1',gasUsed:'0x5208',effectiveGasPrice:'0x3b9aca00',blockNumber:'0x1'}});
test('fee comes from actual receipt gas, payer differs from guest and local proof has no public link',()=>{
  const proof=fundingProof(input());assert.equal(proof.feeWei,'21000000000000');assert.equal(proof.feeAvax,'0.000021');
  assert.equal(proof.payer,payer);assert.equal(proof.explorer,null);assert.equal(proof.fundingWei,'50000000000000000');
  assert.equal(fundingProof({...input(),local:false}).explorer,`https://testnet.snowtrace.io/tx/${hash}`);
});
test('rejects wrong recipient, self-funded transfers, wrong amount, reverted or unrelated receipts',()=>{
  const cases=[value=>{value.tx.to=payer;},value=>{value.tx.from=guest;value.receipt.from=guest;},
    value=>{value.tx.value='0x1';},value=>{value.receipt.status='0x0';},
    value=>{value.receipt.transactionHash='0x'+'78'.repeat(32);},value=>{delete value.receipt.effectiveGasPrice;}];
  for(const change of cases){const value=input();change(value);assert.throws(()=>fundingProof(value));}
});
test('checks chain before submitting, then checks the confirmed transaction against the receipt',async()=>{
  let submits=0;
  await assert.rejects(collectProof({rpc:async()=> '0x1',guest,local:true,submit:async()=>{submits++;return hash;}}),/chain ID/);
  assert.equal(submits,0);
  const fixture=input(),calls=[];
  const rpc=async method=>{calls.push(method);return {eth_chainId:'0xa869',eth_getTransactionReceipt:fixture.receipt,eth_getTransactionByHash:fixture.tx}[method];};
  const proof=await collectProof({rpc,guest,local:true,submit:async()=>{submits++;return hash;}});
  assert.equal(proof.hash,hash);assert.equal(submits,1);assert.deepEqual(calls,['eth_chainId','eth_getTransactionReceipt','eth_getTransactionByHash']);
});
test('requires explicit owner configuration and refuses local or redirectable credentials in public URLs',()=>{
  assert.throws(()=>publicConfig({}),/PROOF_/);
  const env={PROOF_CONFIRM_FUJI:'YES',PROOF_GUEST_ADDRESS:guest,PROOF_GUEST_TOKEN:'test-only-session',
    PROOF_RPC_URL:'https://api.avax-test.network/ext/bc/C/rpc',PROOF_DRIP_URL:'https://example.invalid/functions/v1/guest-drip'};
  assert.equal(publicConfig(env).guest,guest);
  for(const change of [{PROOF_CONFIRM_FUJI:'NO'},{PROOF_RPC_URL:'http://127.0.0.1:6308'},{PROOF_DRIP_URL:'https://token@example.invalid/functions/v1/guest-drip'},{PROOF_DRIP_URL:'https://example.invalid/other'}]){
    assert.throws(()=>publicConfig({...env,...change}));
  }
  const run=spawnSync(process.execPath,['tools/v5int/fuji-proof-kit.mjs','--fuji'],{env:{PATH:process.env.PATH},encoding:'utf8'});
  assert.equal(run.status,1);assert.match(run.stderr,/Set all documented PROOF_\* variables/);assert.equal(run.stdout,'');
});
