import assert from 'node:assert/strict';
import {startLocal,devAccount,localApi,localOrigin} from './local.mjs';
const runtime=await startLocal({web:false});
try {
  const post=async(name,body,token)=>{
    const r=await fetch(`${localApi}/functions/v1/${name}`,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
    assert.equal(r.status,200);return r.json();
  };
  const user=devAccount(8), nonce=(await post('auth-nonce',{})).nonce;
  // Use the production EIP-4361 parser/verifier over HTTP.
  const message=`127.0.0.1:5980 wants you to sign in with your Ethereum account:\n${user.address}\n\nSign in to Taskbar Hero.\n\nURI: ${localOrigin}\nVersion: 1\nChain ID: 43113\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(Date.now()+600000).toISOString()}`;
  const session=await post('auth-verify',{message,signature:await user.signMessage({message})});
  await runtime.client.request({method:'anvil_setBalance',params:[user.address,'0x0']});
  const first=await post('guest-drip',{},session.token), again=await post('guest-drip',{},session.token);
  assert.equal(first.status,'confirmed');assert.equal(first.txHash,again.txHash);
  assert.equal(await runtime.client.getBalance({address:user.address}),50_000_000_000_000_000n);
  await runtime.db.query("update public.chain_guest_drips set status='pending' where wallet=$1",[user.address.toLowerCase()]);
  const recovered=await post('guest-drip',{},session.token);
  assert.equal(recovered.txHash,first.txHash);
  assert.equal(await runtime.client.getBalance({address:user.address}),50_000_000_000_000_000n);
  assert.equal((await runtime.db.query('select count(*)::int n from public.chain_guest_drips')).rows[0].n,1);
  await runtime.client.request({method:'anvil_setChainId',params:[43114]});
  await assert.rejects(runtime.drip(session.playerId,user.address,'a'.repeat(64)),/wrong_chain/);
  await runtime.client.request({method:'anvil_setChainId',params:[43113]});
  console.log('PASS: real SIWE HTTP, 0.05 AVAX receipt, repeat idempotency, mined-before-DB recovery, chain guard.');
} finally {await runtime.stop();}
