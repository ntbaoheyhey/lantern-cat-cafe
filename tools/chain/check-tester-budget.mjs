// Finite grant budget -> real signed Anvil claims. No public RPC or credentials.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {startLocal,devAccount,walletFor,artifact} from './local.mjs';
const local=await startLocal({web:false});
try {
  const {config:c,db,client}=local,U=10n**18n,abi=artifact('SeasonRewards').abi;
  // Reproduce fast mining / earlier time-travel checks in disposable Anvil.
  // Admission must use its own pinned block, while finite-budget guards hold.
  await client.request({method:'evm_increaseTime',params:[60]});
  await client.request({method:'evm_mine',params:[]});
  await db.query('update chain_tester_budgets set ceiling=$1 where contract=$2',[(40n*U).toString(),c.SeasonRewards.toLowerCase()]);
  const actors=[];
  for(const index of [5,6,7,8,9,10,11,12]){
    const account=devAccount(index),wallet=account.address;
    const player=(await db.query('select public.upsert_player_by_wallet($1) r',[wallet.toLowerCase()])).rows[0].r;
    await local.judge(player,wallet,index.toString(16).repeat(64),'pass');
    actors.push({player,wallet,account});
  }
  const receipts=[];
  for(const actor of actors.slice(0,2)){
    const grant=await local.reward(actor.player,actor.wallet);
    const retry=await local.reward(actor.player,actor.wallet);
    assert.equal(grant.claim.nonce,retry.claim.nonce);
    const hash=await walletFor(actor.account).writeContract({address:c.SeasonRewards,abi,functionName:'claimTester',args:[grant.claim,grant.signature]});
    const receipt=await client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'success');
    const balance=await client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[actor.wallet]});
    assert.equal(balance,20n*U);
    assert.equal((await local.reward(actor.player,actor.wallet)).signature,'0x');
    await assert.rejects(client.simulateContract({address:c.SeasonRewards,abi,functionName:'claimTester',args:[grant.claim,grant.signature],account:actor.wallet}),/revert|NonceUsed/);
    receipts.push({hash,block:Number(receipt.blockNumber),amount:'20',status:receipt.status});
  }
  for(const actor of actors.slice(2))await assert.rejects(local.reward(actor.player,actor.wallet),/tester_budget_exhausted/);
  assert.equal((await db.query('select count(*)::int n from chain_tester_reservations')).rows[0].n,2);
  assert.equal(await client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[c.SeasonRewards]}),9960n*U);
  const report={chainId:43113,environment:'disposable Anvil',grantCeiling:'40',authorized:'40',paid:'40',walletsPaid:2,
    excessDenied:6,retryExtraAuthorized:'0',publicSigning:false,ordinaryAuthority:false,organicDemand:false,
    syntheticOperators:1,attackerCaptureShare:1,identityGuarantee:false,receipts};
  writeFileSync(new URL('../../reports/chain/TESTER-BUDGET-LOCAL.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log('PASS: eight distinct test wallets controlled by one script; finite40-YARN program pays two actual20-YARN claims, six denied before signing. Retries add zero liability; replay rejected; pool9960. Operator captures100% of approved grant budget: bounded loss is not identity fairness.');
} finally {await local.stop();}
