// Disposable integration proof. No public RPC, credential loading or activation.
import assert from 'node:assert/strict';
import {startLocal,devAccount,walletFor,artifact} from './local.mjs';
const local=await startLocal({web:false});
try {
  const {config:c,client,db,modules:m}=local,playerWallet=devAccount(7),signer=devAccount(2),U=10n**18n;
  const abi=artifact('SeasonRewards').abi,read=(name,args=[])=>client.readContract({address:c.SeasonRewards,abi,functionName:name,args});
  const epoch=await read('seasonEpoch');
  await client.request({method:'evm_setNextBlockTimestamp',params:[Number(epoch+13n*604800n+60n)]});
  await client.request({method:'evm_mine',params:[]});
  const player=(await db.query('select public.upsert_player_by_wallet($1) r',[playerWallet.address.toLowerCase()])).rows[0].r;
  await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',['local-reward-proof','a'.repeat(64)]);
  const b=await client.getBlock({blockTag:'latest'});
  const budget=m.createRoutineBudgetRegistration({contract:c.SeasonRewards,now:()=>Number(b.timestamp)*1000,
    snapshot:async()=>({chainId:43113,contract:c.SeasonRewards,block:b.number,blockHash:b.hash,timestamp:b.timestamp,
      balance:await client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[c.SeasonRewards],blockNumber:b.number})}),
    register:p=>db.transaction(async tx=>{
      await tx.exec('set local role service_role');
      return (await tx.query('select public.chain_reward_budget_register($1::jsonb) r',[JSON.stringify(p)])).rows[0].r;
    })});
  const registered=await budget({id:'local-budget',contract:c.SeasonRewards.toLowerCase(),season:1,source_id:'local-reward-proof',
    rules_hash:'a'.repeat(64),evidence_hash:'b'.repeat(64),ceiling:(3n*U).toString(),boss_max:(15n*U/10n).toString(),
    rank_max:(15n*U/10n).toString(),weekly_cap:(12n*U).toString()});
  assert.equal(registered.enabled,false);
  // Activation is explicit in this synthetic fixture only.
  await db.query("update chain_reward_budgets set enabled=true where id='local-budget'");
  const snapshot=async()=>{
    const b=await client.getBlock({blockTag:'latest'});
    return {chainId:43113,contract:c.SeasonRewards,block:Number(b.number),blockHash:b.hash,timestamp:Number(b.timestamp),epoch:Number(epoch),
      season:Number((b.timestamp-epoch)/(13n*604800n)),week:Number((b.timestamp-345600n)/604800n),routineCap:(await read('currentRoutineBudget')).toString()};
  };
  const initial=await snapshot();
  const receipt={sourceId:'local-reward-proof',receiptId:'boss-week',playerId:player,wallet:playerWallet.address,
    kind:'weekly-boss',earningPeriod:initial.week,rulesHash:'a'.repeat(64),evidenceHash:'b'.repeat(64),
    finalizedAt:initial.timestamp,eligible:true,budgetId:'local-budget',amount:(15n*U/10n).toString()};
  const prep=m.createRoutinePreparation({enabled:true,contract:c.SeasonRewards,authority:async(_p,_w,id)=>{
    assert(id===receipt.receiptId,'Fixture authority rejects unknown receipts');return receipt;
  },snapshot,reserve:r=>db.transaction(async tx=>{
    await tx.exec('set local role service_role');
    return (await tx.query('select public.chain_reward_reserve($1::jsonb) r',[JSON.stringify(r)])).rows[0].r;
  })});
  const one=await prep(player,playerWallet.address,receipt.receiptId);
  assert.deepEqual((await prep(player,playerWallet.address,receipt.receiptId)).claim,one.claim);
  // Signing is explicit in this local fixture only, never in the preparation seam.
  const sign=claim=>signer.signTypedData({domain:m.claimDomain(c.SeasonRewards),types:m.CLAIM_TYPES,primaryType:'Claim',message:claim});
  const submit=async(claim,signature)=>{
    const hash=await walletFor(playerWallet).writeContract({address:c.SeasonRewards,abi,functionName:'claim',args:[claim,signature]});
    assert.equal((await client.waitForTransactionReceipt({hash})).status,'success');return hash;
  };
  const sig=await sign(one.claim);await submit(one.claim,sig);
  await assert.rejects(client.simulateContract({address:c.SeasonRewards,abi,functionName:'claim',args:[one.claim,sig],account:playerWallet.address}),/NonceUsed|revert/);
  receipt.receiptId='closed-rank';receipt.kind='season-rank';receipt.earningPeriod=0;
  const rank=await prep(player,playerWallet.address,receipt.receiptId);await submit(rank.claim,await sign(rank.claim));
  assert.equal(await read('routineClaimedInWeek',[playerWallet.address,BigInt(initial.week)]),3n*U);
  assert.equal(await read('emittedInSeason',[1n]),3n*U);
  assert.equal(await client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[playerWallet.address]}),3n*U);
  const reserved=(await db.query('select sum(amount::numeric)::text amount,count(*)::int n from chain_reward_reservations')).rows[0];
  assert.equal(reserved.n,2);assert.equal(BigInt(reserved.amount),3n*U);
  // A paid promise remains budget-consumed; it cannot fund a second source event.
  assert.deepEqual((await prep(player,playerWallet.address,receipt.receiptId)).claim,rank.claim);
  assert.equal(await read('usedNonces',[rank.claim.nonce]),true);
  console.log('PASS: disabled-by-default server preparation -> exact3-YARN budget ->1.5 boss +1.5 closed-season rank -> signed Anvil claims; replay rejected; wallet/weekly/season balances match; both promises remain budget-consumed. Local fixture signing only.');
} finally {await local.stop();}
