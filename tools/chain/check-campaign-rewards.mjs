// Earn a real campaign boss -> immutable evidence -> funded reservation -> Anvil
// claim. Only the public throwaway mnemonic is used; no public RPC or secrets.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {startLocal,devAccount,walletFor,artifact,root} from './local.mjs';
const {toHex}=createRequire(resolve(root,'apps/web/package.json'))('viem');
const local=await startLocal({web:false});
try{
 const {config:c,client,db,modules:m,campaign}=local,U=10n**18n,account=devAccount(8),wallet=account.address.toLowerCase();
 const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0].r;
 const player=await one('select upsert_player_by_wallet($1) r',[wallet]);
 let state=await campaign(player,wallet,{action:'state'}),sequence=0;
 const act=async command=>{
  const input={action:'command',id:'f0000000-0000-4000-8000-'+(++sequence).toString(16).padStart(12,'0'),revision:state.view.revision,command};
  state=await campaign(player,wallet,input);assert.deepEqual(await campaign(player,wallet,input),state);
 };
 for(const cat of state.view.crew)await act({type:'level',cat:cat.id});
 await act({type:'start',chapter:1});
 for(let n=0;n<50&&!['won','lost'].includes(state.view.phase);n++){
  const choices=state.view.choices,preferred=['recycle','brew','leave','Points','Heal'];
  await act((choices.find(c=>preferred.includes(c.label))??choices[0]).command);
 }
 assert.equal(state.view.phase,'won','Retain actual engine failure; never inject a win');
 assert.equal((await db.query('select * from chain_campaign_results where player_id=$1',[player])).rows.length,1);
 // The DB completion clock must also be visible to the pinned local chain.
 await client.request({method:'evm_setNextBlockTimestamp',params:[Math.floor(Date.now()/1000)+1]});
 await client.request({method:'evm_mine',params:[]});
 const abi=artifact('SeasonRewards').abi,epoch=Number(await client.readContract({address:c.SeasonRewards,abi,functionName:'seasonEpoch'}));
 const block=await client.getBlock(),contract=c.SeasonRewards.toLowerCase(),rules=m.CAMPAIGN_RULES_HASH;
 const register=m.createRoutineBudgetRegistration({contract:c.SeasonRewards,now:()=>Number(block.timestamp)*1000,
  snapshot:async()=>({chainId:43113,contract:c.SeasonRewards,block:block.number,blockHash:block.hash,timestamp:block.timestamp,
   balance:await client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[c.SeasonRewards],blockNumber:block.number})}),
  register:p=>db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query('select chain_reward_budget_register($1::jsonb) r',[JSON.stringify(p)])).rows[0].r;})});
 const budget=await register({id:'earned-campaign-proof',contract,season:0,source_id:m.CAMPAIGN_SOURCE,rules_hash:rules,evidence_hash:'a'.repeat(64),
  ceiling:(3n*U).toString(),boss_max:(15n*U/10n).toString(),rank_max:(15n*U/10n).toString(),weekly_cap:(12n*U).toString()});
 assert.equal(budget.enabled,false);
 // Explicit activation ONLY in this disposable fixture. No production program.
 await db.query('insert into chain_campaign_reward_programs values($1,$2,$3,0,0,true)',[contract,epoch,rules]);
 await db.query('update chain_reward_budgets set enabled=true where id=$1',[budget.id]);
 const authority=m.createCampaignRewardAuthority({enabled:true,contract:c.SeasonRewards,epoch,rulesHash:rules,
  read:(p,w,c,k,t)=>one('select chain_campaign_reward_evidence($1,$2,$3,$4,$5) r',[p,w,c,k,t])});
 const snapshot=async()=>{const b=await client.getBlock();return {chainId:43113,contract:c.SeasonRewards,block:Number(b.number),blockHash:b.hash,timestamp:Number(b.timestamp),epoch,
  season:Number((b.timestamp-BigInt(epoch))/7862400n),week:Number((b.timestamp-345600n)/604800n),
  routineCap:(await client.readContract({address:c.SeasonRewards,abi,functionName:'currentRoutineBudget',blockNumber:b.number})).toString()};};
 const current=await snapshot(),id=player+':weekly-boss:'+current.week;
 const prepare=m.createRoutinePreparation({enabled:true,contract:c.SeasonRewards,authority,snapshot,
  reserve:r=>db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query('select chain_reward_reserve($1::jsonb) r',[JSON.stringify(r)])).rows[0].r;})});
 const prepared=await prepare(player,account.address,id);assert.deepEqual((await prepare(player,account.address,id)).claim,prepared.claim);
 let clock=Number((await client.getBlock()).timestamp)*1000;
 const sign=m.createCampaignClaim({enabled:true,contract:c.SeasonRewards,token:c.YarnToken,key:toHex(devAccount(2).getHdKey().privateKey),
  rulesHash:rules,client,now:()=>clock,
  read:(p,w,c,k,t)=>one('select chain_campaign_reward_evidence($1,$2,$3,$4,$5) r',[p,w,c,k,t]),
  reserve:r=>one('select chain_reward_reserve($1::jsonb) r',[JSON.stringify(r)]),
  renew:r=>one('select chain_reward_renew($1::jsonb) r',[JSON.stringify(r)]),
  stored:(s,r)=>one('select to_jsonb(r) r from chain_reward_reservations r where source_id=$1 and receipt_id=$2',[s,r])});
 const original=await sign(player,account.address,'claim','weekly-boss');
 assert.equal(original.claim.expiry,prepared.claim.expiry);
 await client.request({method:'evm_setNextBlockTimestamp',params:[Number(original.claim.expiry)+1]});
 await client.request({method:'evm_mine',params:[]});
 clock=Number((await client.getBlock()).timestamp)*1000;
 await assert.rejects(client.simulateContract({address:c.SeasonRewards,abi,functionName:'claim',args:[original.claim,original.signature],account:account.address}),/Expired|revert/);
 const preview=await sign(player,account.address,'quote','weekly-boss');
 assert.equal(preview.signature,undefined);assert.equal(await one('select count(*)::int r from chain_reward_renewals'),0);
 const renewed=await sign(player,account.address,'claim','weekly-boss');
 assert.equal(renewed.claim.nonce,original.claim.nonce);assert.equal(renewed.claim.amount,original.claim.amount);
 assert(renewed.claim.expiry>original.claim.expiry);
 assert.equal(await one('select count(*)::int r from chain_reward_renewals'),1);
 assert.equal(await one('select count(*)::int r from chain_reward_reservations'),1);
 assert.equal(await one('select sum(amount::numeric)::text r from chain_reward_reservations'),(15n*U/10n).toString());
 const tx=await walletFor(account).writeContract({address:c.SeasonRewards,abi,functionName:'claim',args:[renewed.claim,renewed.signature]});
 assert.equal((await client.waitForTransactionReceipt({hash:tx})).status,'success');
 await assert.rejects(client.simulateContract({address:c.SeasonRewards,abi,functionName:'claim',args:[renewed.claim,renewed.signature],account:account.address}),/NonceUsed|revert/);
 clock=Number((await client.getBlock()).timestamp)*1000;
 const recovered=await sign(player,account.address,'claim','weekly-boss');assert(recovered.quote.used);assert.equal(recovered.signature,undefined);
 const balance=await client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[account.address]});
 assert.equal(balance,15n*U/10n);
 assert.equal(await client.readContract({address:c.SeasonRewards,abi,functionName:'routineClaimedInWeek',args:[account.address,BigInt(current.week)]}),balance);
 const report={version:1,pass:true,chainId:43113,network:'disposable-anvil',actions:sequence,rulesHash:rules,
  routeWon:true,bossFacts:1,claimYarn:'1.5',reservations:1,renewalWindows:1,expiredOriginalRejected:true,sameNonceRenewed:true,transaction:tx,replayRejected:true,
  publicTransactions:0,organicParticipants:0,limitations:'One fixed server-seeded campaign; explicit local program/funding fixture. Rank closure has separate SQL/300-population tests. No demand or economic acceptance claim.'};
 writeFileSync(resolve(root,'reports/chain/CAMPAIGN-REWARDS-LOCAL.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await local.stop();}
