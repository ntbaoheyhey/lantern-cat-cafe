import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {loadLabRuntime,sha} from './economy-lab/runtime.mjs';
import {hashConfig} from './economy-lab/search-core.mjs';
import {captureEconomyUi} from './economy-lab/ui-proof.mjs';
Object.assign(process.env,{CHAIN_LOCAL_WEB_PORT:'5995',CHAIN_LOCAL_RPC_PORT:'8546',CHAIN_LOCAL_API_PORT:'5997'});
const {startLocal,devAccount,walletFor,artifact}=await import('./local.mjs');
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {parseEther,getAddress}=require('viem');
const rules=await loadLabRuntime(),policy=rules.ECONOMY_LAB.policy;
const withScreens=process.argv.includes('--screens'),local=await startLocal({web:withScreens,campaignRewards:false}),receipts=[];
try{
 const guest=devAccount(6),buyer=devAccount(7),w=walletFor(guest),bw=walletFor(buyer),c=local.config;
 const send=async(wallet,address,name,fn,args,extra={})=>{const hash=await wallet.writeContract({address,abi:artifact(name).abi,functionName:fn,args}),r=await local.client.waitForTransactionReceipt({hash});assert.equal(r.status,'success');receipts.push({action:fn,hash,transactionHash:hash,status:r.status,blockNumber:Number(r.blockNumber),...extra});return hash;};
 const nonce=await local.modules.issueNonce(local.authDeps);
 // Use the public SIWE verifier with an Anvil-only guest key.
 const {createSiweMessage}=require('viem/siwe');
 const signed=createSiweMessage({domain:'127.0.0.1:5995',address:guest.address,nonce:nonce.nonce,chainId:43113,uri:'http://127.0.0.1:5995',version:'1',statement:'Sign in to Taskbar Hero.',issuedAt:new Date(),expirationTime:new Date(Date.now()+600000)});
 const auth=await local.modules.verifySignIn(local.authDeps,{message:signed,signature:await guest.signMessage({message:signed})});
 const session=await local.modules.verifySessionToken(auth.token,{jwtSecret:local.authDeps.config.jwtSecret});
 const p=session.sub,call=(command,id=crypto.randomUUID())=>local.economy(p,guest.address,{id,command});
 await local.judge(p,guest.address,'1'.repeat(64),'boss');
 const q=await call({action:'quest'});assert.equal(q.state.level,5);assert.equal(q.state.spool,parseEther('16').toString());
 const d=await call({action:'deed'});const mint=async v=>send(w,c.RelicNFT,'RelicNFT','mint',[{player:getAddress(v.player),relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)},v.signature]);
 await mint(d.voucher);assert.equal(d.state.deed,30001);
 const capGross=BigInt(policy.spool.weeklyNetCap)*10n**18n*10000n/BigInt(10000-policy.spool.feeBp),gross=capGross< BigInt(q.state.spool)?capGross:BigInt(q.state.spool);
 const withdrawalId=crypto.randomUUID(),withdraw=await call({action:'withdraw',amount:gross.toString(),deed:30001},withdrawalId),claim=withdraw.withdrawal.claim;
 await send(w,c.SeasonRewards,'SeasonRewards','claim',[{player:guest.address,amount:BigInt(claim.amount),season:BigInt(claim.season),nonce:BigInt(claim.nonce),expiry:BigInt(claim.expiry)},withdraw.withdrawal.signature]);
 assert.equal(claim.amount,(gross-gross*BigInt(policy.spool.feeBp)/10000n).toString());assert.equal((await call({action:'withdraw',amount:gross.toString(),deed:30001},withdrawalId)).withdrawal.used,true);
 // Fixture treasury funding is separate from earned Spool. Never invented by the ledger.
 await send(walletFor(devAccount(0)),c.YarnToken,'YarnToken','transfer',[guest.address,parseEther('100')],{fixture:'Finite test treasury transfer; not earned Spool'});
 const seal=await call({action:'seal',instance:'quest:weapon',deed:30001});await send(w,c.YarnToken,'YarnToken','seal',[seal.hash,BigInt(seal.intent.cost)]);await mint((await call({action:'finalize',intent:seal.intent.id})).voucher);
 const fusion=await call({action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[seal.intent.token],sealedStars:0});
 await assert.rejects(()=>call({action:'finalize',intent:fusion.intent.id}),/payment/);
 await send(w,c.YarnToken,'YarnToken','seal',[fusion.hash,BigInt(fusion.intent.cost)]);
 const burnTx=await send(w,c.RelicNFT,'RelicNFT','safeBatchTransferFrom',[guest.address,local.modules.ECONOMY_DEAD,fusion.intent.burnIds.map(BigInt),fusion.intent.burnAmounts.map(BigInt),fusion.hash]);
 await assert.rejects(()=>call({action:'finalize',intent:fusion.intent.id,burnTx:receipts[0].hash}),/Batch burn required/);
 const fused=await call({action:'finalize',intent:fusion.intent.id,burnTx});await mint(fused.voucher);
 const token=BigInt(fused.voucher.relicId);await send(w,c.RelicNFT,'RelicNFT','setApprovalForAll',[c.RelicMarketV2,true]);await send(w,c.RelicMarketV2,'RelicMarketV2','list',[token,1n,parseEther('1'),1]);
 await send(walletFor(devAccount(0)),c.YarnToken,'YarnToken','transfer',[buyer.address,parseEther('2')]);await send(bw,c.YarnToken,'YarnToken','approve',[c.RelicMarketV2,parseEther('1')]);
 const [ids,items]=await local.client.readContract({address:c.RelicMarketV2,abi:artifact('RelicMarketV2').abi,functionName:'getListings',args:[0n,100n]});
 const index=items.findIndex(x=>x.relicId===token&&x.seller.toLowerCase()===guest.address.toLowerCase());assert.ok(index>=0);
 await send(bw,c.RelicMarketV2,'RelicMarketV2','buy',[ids[index]]);
 assert.equal(await local.client.readContract({address:c.RelicNFT,abi:artifact('RelicNFT').abi,functionName:'balanceOf',args:[buyer.address,token]}),1n);
 assert.equal(await local.client.readContract({address:c.RelicNFT,abi:artifact('RelicNFT').abi,functionName:'balanceOf',args:[local.modules.ECONOMY_DEAD,BigInt(seal.intent.token)]}),1n);
 // Preserve the real quest/fusion flow above. Extra bound Thread and a Worn
 // remaining quest item are explicit local fixtures for all studio recipes.
 const state=(await call({action:'state'})).state;
 state.stars+=8;state.gear.find(g=>g.id==='quest:relic').quality=1000;
 await local.db.query('update chain_v3_accounts set state=$2,revision=revision+1 where player_id=$1',[p,JSON.stringify(state)]);
 const sinks=[];
 for(const sinkId of rules.ECONOMY_SINK_IDS){
  const before=(await call({action:'state'})).state;
  const reserved=await call({action:'sink',sink:sinkId,...(sinkId==='polish'?{instance:'quest:relic'}:{})}),intent=reserved.intent;
  const supply=()=>local.client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'totalSupply'}),supplyBefore=await supply();
  await assert.rejects(()=>call({action:'finalize',intent:intent.id}),/payment/);
  const transactionHash=await send(w,c.YarnToken,'YarnToken','seal',[reserved.hash,BigInt(intent.cost)],{sinkId});
  const done=await call({action:'finalize',intent:intent.id}),after=done.state;
  assert.equal(supplyBefore-await supply(),BigInt(intent.cost));assert.equal(before.stars-after.stars,intent.recipe.starThread);
  if(sinkId==='polish')assert.equal(after.gear.find(g=>g.id==='quest:relic').quality,intent.recipe.quality);
  else assert(after.styles.includes(intent.recipe.style));
  const claimed=BigInt(before.craftRebate?.spool??0),rebate=rules.craftSpoolRebate(BigInt(intent.cost),claimed);
  assert.equal(BigInt(after.spool)-BigInt(before.spool),rebate);
  assert.deepEqual((await call({action:'finalize',intent:intent.id})).state,after);
  sinks.push({id:sinkId,benefit:intent.recipe.benefit,cost:intent.cost,starThread:intent.recipe.starThread,rebate:rebate.toString(),transactionHash});
 }
 const guestRuntime=local.modules.chainRuntime(c,w,guest.address),buyerRuntime=local.modules.chainRuntime(c,bw,buyer.address);
 const guestHoldings=await guestRuntime.holdings(local.modules.CHAIN_V3_ITEM_IDS);
 assert(guestHoldings.some(h=>h.id===30001n&&h.amount===1n),'Deed appears in the chain Bag');
 assert((await buyerRuntime.holdings(local.modules.CHAIN_V3_ITEM_IDS)).some(h=>h.id===token),'Quality output appears for buyer');
 const move=await guestRuntime.moveAdapter(local.modules.CHAIN_V3_ITEM_IDS),moving=await move.relics();
 await move.moveRelics(buyer.address,moving.map(h=>h.id),moving.map(h=>h.amount));
 assert((await buyerRuntime.holdings(local.modules.CHAIN_V3_ITEM_IDS)).some(h=>h.id===30001n),'Transferred Deed remains discoverable');
 mkdirSync('reports/v3-shell/b2/econ',{recursive:true});
 writeFileSync('reports/v3-shell/b2/econ/ANVIL-E2E.json',JSON.stringify({date:new Date().toISOString(),environment:'Disposable localhost Anvil; not public Fuji',chain:43113,rpcPort:8546,guestSiwe:true,questLevel:5,deed:30001,spoolGross:gross.toString(),retained:withdraw.intent.retained,netYarn:claim.amount,configHash:hashConfig(rules.ECONOMY_LAB),configSources:['packages/game-rules/src/cardrpg/economy-v3.ts','packages/game-rules/src/cardrpg/economy-sinks-v3.ts'].map(path=>({path,sha256:sha(path)})),fusionOutput:String(token),sealedInputBurn:burnTx,secondWalletBought:true,fixtures:{demoQuest:true,extraBoundThread:8,wornQuestRelicQuality:1000,treasuryFunding:'100 YARN'},sinks,receipts},null,2)+'\n');
 console.log(`V3 Anvil PASS: guest SIWE → quest → Deed → Spool → withdraw → seal → dead-address fusion → list → buy; ${receipts.length} receipts`);
 if(withScreens)await captureEconomyUi(rules,{oddsLog:'reports/v3-shell/b2/tests/q4-final-odds.log'});
}finally{await local.stop();}
