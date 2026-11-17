import test from 'node:test';
import assert from 'node:assert/strict';
import {requestAllowed} from './network-policy.mjs';
const publicRead={url:'https://api.avax-test.network/ext/bc/C/rpc',method:'POST',local:false,allowGuestTx:false};
test('read-only blocks every transaction, signing and funding request',()=>{
  for(const method of ['eth_sendRawTransaction','eth_sendTransaction','eth_signTransaction','personal_sign','wallet_sendCalls','anvil_setBalance'])assert.equal(requestAllowed({...publicRead,body:{method}}),false,method);
  assert.equal(requestAllowed({...publicRead,url:'https://example.supabase.co/functions/v1/guest-drip',body:{wallet:'public-address'}}),false);
});
test('read-only allows public receipt reads but rejects mixed batches',()=>{
  assert.equal(requestAllowed({...publicRead,body:{method:'eth_getTransactionReceipt',params:['public-hash']}}),true);
  assert.equal(requestAllowed({...publicRead,body:[{method:'eth_blockNumber'},{method:'eth_sendRawTransaction'}]}),false);
  assert.equal(requestAllowed({...publicRead,body:'invalid json'}),false);
});
test('local read-only is also enforced; opt-in cannot access another lane',()=>{
  const req={url:'http://127.0.0.1:6202',method:'POST',body:{method:'eth_sendRawTransaction'},local:true,allowGuestTx:false};
  assert.equal(requestAllowed(req),false);assert.equal(requestAllowed({...req,allowGuestTx:true}),true);
  assert.equal(requestAllowed({...req,url:'http://127.0.0.1:8546',allowGuestTx:true}),false);
  assert.equal(requestAllowed({...req,url:'https://api.avax-test.network/ext/bc/C/rpc',allowGuestTx:true}),false);
});
test('public page cannot use the read-only kit to reach local services',()=>{
  assert.equal(requestAllowed({...publicRead,url:'http://127.0.0.1:6202',method:'GET'}),false);
  assert.equal(requestAllowed({...publicRead,url:'https://example.com',method:'GET'}),true);
});
