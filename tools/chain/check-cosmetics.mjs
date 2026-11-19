// Real burns and recovery on disposable Anvil, never a public signer.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {startLocal,devAccount,walletFor,artifact} from './local.mjs';
import {analyzePilot} from './pilot-evidence.mjs';
import {auditCosmeticPilot} from './audit-cosmetic-pilot.mjs';
const {decodeEventLog}=createRequire(new URL('../../apps/web/package.json',import.meta.url))('viem');
const r=await startLocal({web:false});
try{
 const {config:c,client,db,cosmetics}=r,owner=devAccount(5),other=devAccount(6),U=10n**18n;
 // Enrollment is a server-clock event. Anvil can mine ahead of wall time, so
 // scan from genesis instead of treating its latest block as enrollment time.
 const opening=await client.getBlock({blockNumber:0n}),start=Math.floor(Date.now()/1000),purchases=[];
 assert(Number(opening.timestamp)<=start,'Local genesis must predate enrollment');
 const read=(fn,args=[])=>client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:fn,args});
 const send=async(account,fn,args)=>{
  const hash=await walletFor(account).writeContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:fn,args});
  assert.equal((await client.waitForTransactionReceipt({hash})).status,'success');return hash;
 };
 const purchase=async(order,hash)=>{
  // Keep the actual SQL timestamp and mine the payment after the reservation.
  const latest=await client.getBlock({blockTag:'latest'});
  await client.request({method:'evm_setNextBlockTimestamp',params:[Math.max(Number(latest.timestamp)+1,Math.ceil(Date.parse(order.created_at)/1000))]});
  const txHash=await send(owner,'seal',[hash,BigInt(order.cost)]);
  const receipt=await client.getTransactionReceipt({hash:txHash});
  const payment=receipt.logs.flatMap(log=>{
   if(log.address.toLowerCase()!==c.YarnToken.toLowerCase())return [];
   const event=decodeEventLog({abi:artifact('YarnToken').abi,data:log.data,topics:log.topics});
   return event.eventName==='SealPaid'?[{log,event}]:[];
  });
  assert.equal(payment.length,1);const {log,event}=payment[0];
  assert.equal(event.args.intent,hash);assert.equal(event.args.player.toLowerCase(),owner.address.toLowerCase());
  assert.equal(event.args.amount,BigInt(order.cost));
  purchases.push({chainId:43113,token:c.YarnToken,wallet:owner.address,txHash,blockHash:receipt.blockHash,
   block:Number(receipt.blockNumber),logIndex:log.logIndex,receiptStatus:1,canonical:true,
   timestamp:Number((await client.getBlock({blockNumber:receipt.blockNumber})).timestamp),
   orderId:order.id,sku:order.sku,amountWei:order.cost});
 };
 const p=(await db.query('select public.upsert_player_by_wallet($1) r',[owner.address.toLowerCase()])).rows[0].r;
 const q=(await db.query('select public.upsert_player_by_wallet($1) r',[other.address.toLowerCase()])).rows[0].r;
 await send(devAccount(0),'transfer',[owner.address,20n*U]);
 const supplyBefore=await read('totalSupply'),before=await read('balanceOf',[owner.address]);
 const {order,hash}=await cosmetics(p,owner.address,{action:'reserve',sku:'fern'});
 await assert.rejects(cosmetics(p,owner.address,{action:'finalize',intent:order.id}),/cosmetic_unpaid/);
 await assert.rejects(cosmetics(p,owner.address,{action:'equip',sku:'fern'}),/cosmetic_locked/);
 await purchase(order,hash);
 // Simulate a lost HTTP response: reserve and finalize again against the immutable receipt.
 assert.equal((await cosmetics(p,owner.address,{action:'reserve',sku:'fern'})).hash,hash);
 await cosmetics(p,owner.address,{action:'finalize',intent:order.id});
 await cosmetics(p,owner.address,{action:'finalize',intent:order.id});
 assert.equal((await cosmetics(p,owner.address,{action:'equip',sku:'fern'})).active,'fern');
 await assert.rejects(cosmetics(q,other.address,{action:'finalize',intent:order.id}),/no_intent/);
 await assert.rejects(cosmetics(q,other.address,{action:'equip',sku:'fern'}),/cosmetic_locked/);
 assert.equal(await read('totalSupply'),supplyBefore-4n*U);
 assert.equal(await read('balanceOf',[owner.address]),before-4n*U);
 assert.equal(await read('sealPayments',[owner.address,hash]),4n*U);
 assert.equal((await cosmetics(p,owner.address,{action:'state'})).orders.length,1);
 await assert.rejects(client.simulateContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'seal',args:[hash,4n*U],account:owner.address}));
 for(const sku of ['tide','ember']){
  const {order:o,hash:h}=await cosmetics(p,owner.address,{action:'reserve',sku});
  await purchase(o,h);await cosmetics(p,owner.address,{action:'finalize',intent:o.id});
 }
 const owned=await cosmetics(p,owner.address,{action:'state'});
 assert.equal(owned.orders.filter(o=>o.paid_at).length,3);
 assert.equal(await read('totalSupply'),supplyBefore-12n*U);
 assert.equal(await read('balanceOf',[owner.address]),8n*U);
 assert.equal((await cosmetics(p,owner.address,{action:'equip',sku:'none'})).active,null);
 const latest=await client.getBlock({blockTag:'latest'});
 await client.request({method:'evm_setNextBlockTimestamp',params:[Math.max(Number(latest.timestamp)+1,Math.floor(Date.now()/1000)+1)]});
 await client.request({method:'evm_mine',params:[]});
 const snapshot=await client.getBlock({blockTag:'latest'}),end=Number(snapshot.timestamp);
 const input={version:1,chainId:43113,token:c.YarnToken,mode:'synthetic',start,end,asOf:end,
  provenance:'Disposable Anvil43113: decoded SealPaid logs, matching SQL orders and totalSupply; scripted subjects, not human evidence.',
  snapshot:{block:Number(snapshot.number),hash:snapshot.hash},
  subjects:[{id:'scripted-buyer',wallets:[owner.address],review:'participant',joinedAt:start,exposedAt:start,visits:[start]},
   {id:'scripted-nonbuyer',wallets:[other.address],review:'participant',joinedAt:start,exposedAt:start,visits:[start]}],purchases};
 const report=analyzePilot(input);assert.equal(report.purchaseAllEnrolled.estimate,.5);
 assert.equal(report.burnByReview.participant,'12');assert.equal(report.activation,false);
 writeFileSync(new URL('../../reports/chain/COSMETIC-PILOT-LOCAL-INPUT.json',import.meta.url),JSON.stringify(input,null,2)+'\n');
 writeFileSync(new URL('../../reports/chain/COSMETIC-PILOT-LOCAL.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 const cohort={...input};delete cohort.purchases;
 const orders=(await db.query('select * from public.chain_cosmetic_orders order by created_at')).rows;
 await client.request({method:'anvil_mine',params:['0xc']});
 const audit=await auditCosmeticPilot({client,cohort,orders,fromBlock:Number(opening.number),snapshotBlock:Number(snapshot.number)});
 assert.equal(audit.analysis.uniquePurchases,3);assert.equal(audit.analysis.burnByReview.participant,'12');
 assert.equal(audit.analysis.censoredPurchase7Days,2,'Seconds of scripted testing cannot establish seven-day adoption');
 writeFileSync(new URL('../../reports/chain/COSMETIC-PILOT-LOCAL-AUDIT.json',import.meta.url),JSON.stringify(audit,null,2)+'\n');
 console.log('PASS: 3 finite styles, 12 YARN actual supply burn; lost-response recovery, one payment/order, foreign-wallet rejection and free reset. Local only.');
}finally{await r.stop();}
