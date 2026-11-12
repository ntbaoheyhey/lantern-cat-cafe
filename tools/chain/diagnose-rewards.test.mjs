import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signatureType,safeFailure} from './diagnose-rewards.mjs';
import {devAccount} from './local.mjs';
const signer=devAccount(2),contract=devAccount(7).address;
const claim={player:devAccount(5).address,amount:20n*10n**18n,season:0n,nonce:1n,expiry:2000000000n};
const fields=[{name:'player',type:'address'},{name:'amount',type:'uint256'},{name:'season',type:'uint256'},{name:'nonce',type:'uint256'},{name:'expiry',type:'uint256'}];
for(const type of ['TesterClaim','Claim'])test('recognizes '+type+' and rejects a different verifying contract',async()=>{
  const signature=await signer.signTypedData({domain:{name:'TaskbarHeroSeasonRewards',version:'1',chainId:43113,verifyingContract:contract},types:{[type]:fields},primaryType:type,message:claim});
  assert.equal(await signatureType({contract,signer:signer.address,claim,signature}),type);
  assert.equal(await signatureType({contract:devAccount(8).address,signer:signer.address,claim,signature}),'unrecognized');
});
test('diagnostics discard request bodies, credentials and raw provider messages',()=>{
  const error={name:'HttpRequestError',message:'private-key-must-not-appear',headers:{authorization:'Bearer secret-session'},cause:{name:'ContractFunctionRevertedError',data:{errorName:'InvalidSignature',secret:'private-key-must-not-appear'}}};
  assert.deepEqual(safeFailure(error),{kind:'contract_revert',revert:'InvalidSignature'});
  assert.deepEqual(safeFailure({...error,cause:undefined}),{kind:'HttpRequestError'});
  assert.deepEqual(safeFailure({name:'secret-session',message:'private-key-must-not-appear'}),{kind:'request_failed'});
});
