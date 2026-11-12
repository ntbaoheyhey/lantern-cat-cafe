// Disposable source-adapter proof; not an ordinary campaign authority or public telemetry.
import assert from 'node:assert/strict';
import {startLocal,devAccount,walletFor,artifact} from './local.mjs';
const r=await startLocal({web:false});
try {
 const {config:c,client,db,modules:m}=r,owner=devAccount(5),buyer=devAccount(6),U=10n**18n;
 const abi=name=>artifact(name).abi;
 const send=async(account,address,name,fn,args)=>{
  const hash=await walletFor(account).writeContract({address,abi:abi(name),functionName:fn,args});
  assert.equal((await client.waitForTransactionReceipt({hash})).status,'success');return hash;
 };
 const read=(address,name,fn,args=[])=>client.readContract({address,abi:abi(name),functionName:fn,args});
 const player=(await db.query('select public.upsert_player_by_wallet($1) r',[owner.address.toLowerCase()])).rows[0].r;
 const item=m.TRADE_RULES.find(x=>x.kind==='equipment'&&x.tradable&&x.rarity==='epic');
 const receipt={sourceId:'local-source-proof',receiptId:'earned-1',instanceId:'gear-instance-1',playerId:player,wallet:owner.address.toLowerCase(),
  itemId:item.id,earnedLevel:2,rulesHash:'a'.repeat(64),consumptionHash:'b'.repeat(64),normalizationVersion:'depth-min-roll-v1',
  earnedAt:'2026-01-01T00:00:00Z',consumedAt:'2026-01-02T00:00:00Z'};
 await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',[receipt.sourceId,receipt.rulesHash]);
 const ingest=m.createSourceIngest({enabled:true,store:async t=>db.transaction(async tx=>{
  await tx.exec('set local role service_role');
  return (await tx.query('select public.chain_source_ingest($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) r',
   [t.sourceId,t.receiptId,t.instanceId,t.playerId,t.wallet,t.itemId,t.earnedLevel,t.rulesHash,t.consumptionHash,t.normalizationVersion,t.earnedAt,t.consumedAt])).rows[0].r;
 })});
 const admitted=await ingest(receipt);assert.deepEqual(await ingest(receipt),admitted);
 const inventory=(await r.items(player,owner.address,{action:'inventory'})).items;
 assert.equal(inventory.length,1);assert.equal(inventory[0].item_id,item.id);
 await send(devAccount(0),c.YarnToken,'YarnToken','transfer',[owner.address,10n*U]);
 await send(devAccount(0),c.YarnToken,'YarnToken','transfer',[buyer.address,7n*U]);
 const supplyBefore=await read(c.YarnToken,'YarnToken','totalSupply');
 const {intent,hash}=await r.items(player,owner.address,{action:'reserve',inventory:admitted.inventory_id});
 assert.equal(intent.cost,(10n*U).toString());
 await assert.rejects(r.items(player,owner.address,{action:'finalize',intent:intent.id}),/seal_unpaid/);
 await send(owner,c.YarnToken,'YarnToken','seal',[hash,BigInt(intent.cost)]);
 const {voucher}=await r.items(player,owner.address,{action:'finalize',intent:intent.id});
 const {signature,used:_used,source:_source,...fields}=voucher;
 await send(owner,c.RelicNFT,'RelicNFT','mint',[fields,signature]);
 const retried=await r.items(player,owner.address,{action:'finalize',intent:intent.id});
 assert.equal(retried.voucher.used,true);assert.equal(retried.voucher.signature,'0x');
 await send(owner,c.RelicNFT,'RelicNFT','setApprovalForAll',[c.RelicMarketV2,true]);
 const listing=await read(c.RelicMarketV2,'RelicMarketV2','nextListingId');
 // Price7 is below both the100 reference and10 seal fee; there is no price floor.
 await send(owner,c.RelicMarketV2,'RelicMarketV2','list',[BigInt(item.tokenId),1n,7n*U,1]);
 await send(buyer,c.YarnToken,'YarnToken','approve',[c.RelicMarketV2,7n*U]);
 await send(buyer,c.RelicMarketV2,'RelicMarketV2','buy',[listing]);
 assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[owner.address,BigInt(item.tokenId)]),0n);
 assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[buyer.address,BigInt(item.tokenId)]),1n);
 assert.equal(supplyBefore-await read(c.YarnToken,'YarnToken','totalSupply'),10n*U+14n*U/100n);
 assert.equal(await read(c.RelicMarketV2,'RelicMarketV2','proceeds',[c.treasury,1]),21n*U/100n);
 assert.equal(await read(c.RelicMarketV2,'RelicMarketV2','proceeds',[owner.address,1]),665n*U/100n);
 assert.deepEqual(await ingest(receipt),admitted);
 assert.equal((await r.items(player,owner.address,{action:'inventory'})).items[0].state,'consumed');
 assert.equal((await db.query('select count(*)::int n from chain_source_receipts')).rows[0].n,1);
 console.log('PASS: service-only source receipt -> one Epic inventory ->10 YARN seal -> one mint -> unrestricted7-YARN sale; buyer1/seller0; exact10.14 burn/0.21 treasury/6.65 proceeds; retries cannot recreate source. Local fixture only; campaign authority remains unconnected.');
} finally {await r.stop();}
