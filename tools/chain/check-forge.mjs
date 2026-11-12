// Source->seal->trade->atomic finite forge. Disposable Anvil only, no real keys.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
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
 const second=await ingest({...receipt,receiptId:'earned-2',instanceId:'gear-instance-2',consumptionHash:'c'.repeat(64)});
 const inventory=(await r.items(player,owner.address,{action:'inventory'})).items;
 assert.equal(inventory.length,2);assert.equal(inventory[0].item_id,item.id);
 await send(devAccount(0),c.YarnToken,'YarnToken','transfer',[owner.address,20n*U]);
 await send(devAccount(0),c.YarnToken,'YarnToken','transfer',[buyer.address,17n*U]);
 const supplyBefore=await read(c.YarnToken,'YarnToken','totalSupply');
 for (const source of [admitted,second]) {
 const {intent,hash}=await r.items(player,owner.address,{action:'reserve',inventory:source.inventory_id});
 assert.equal(intent.cost,(10n*U).toString());
 await assert.rejects(r.items(player,owner.address,{action:'finalize',intent:intent.id}),/seal_unpaid/);
 await send(owner,c.YarnToken,'YarnToken','seal',[hash,BigInt(intent.cost)]);
 const {voucher}=await r.items(player,owner.address,{action:'finalize',intent:intent.id});
 const {signature,used:_used,source:_source,...fields}=voucher;
 await send(owner,c.RelicNFT,'RelicNFT','mint',[fields,signature]);
 const retried=await r.items(player,owner.address,{action:'finalize',intent:intent.id});
 assert.equal(retried.voucher.used,true);assert.equal(retried.voucher.signature,'0x');
 }
 await send(owner,c.RelicNFT,'RelicNFT','setApprovalForAll',[c.RelicMarketV2,true]);
 const listing=await read(c.RelicMarketV2,'RelicMarketV2','nextListingId');
 // Price7 is below both the100 reference and10 seal fee; there is no price floor.
 await send(owner,c.RelicMarketV2,'RelicMarketV2','list',[BigInt(item.tokenId),2n,14n*U,1]);
 await send(buyer,c.YarnToken,'YarnToken','approve',[c.RelicMarketV2,14n*U]);
 await send(buyer,c.RelicMarketV2,'RelicMarketV2','buy',[listing]);
 assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[owner.address,BigInt(item.tokenId)]),0n);
 assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[buyer.address,BigInt(item.tokenId)]),2n);
 assert.equal(supplyBefore-await read(c.YarnToken,'YarnToken','totalSupply'),20n*U+28n*U/100n);
 assert.equal(await read(c.RelicMarketV2,'RelicMarketV2','proceeds',[c.treasury,1]),42n*U/100n);
 assert.equal(await read(c.RelicMarketV2,'RelicMarketV2','proceeds',[owner.address,1]),1330n*U/100n);
 assert.deepEqual(await ingest(receipt),admitted);
 assert((await r.items(player,owner.address,{action:'inventory'})).items.every(i=>i.state==='consumed'));
 assert.equal((await db.query('select count(*)::int n from chain_source_receipts')).rows[0].n,2);
 const runtime=m.chainRuntime(c,walletFor(buyer),buyer.address),id=BigInt(item.tokenId);
 const beforeForge=await read(c.YarnToken,'YarnToken','totalSupply');
 const tx=await m.craftDesign(runtime,c,buyer.address,0,id,id);
 const proof=await client.getTransactionReceipt({hash:tx});assert.equal(proof.status,'success');
 assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[buyer.address,id]),0n);
 assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[c.RelicForge,id]),2n);
 assert.equal(await read(c.RelicForge,'RelicForge','consumedOf',[id]),2n);
 assert.equal(await read(c.RelicForge,'RelicForge','hasDesign',[buyer.address,0]),true);
 assert.equal(beforeForge-await read(c.YarnToken,'YarnToken','totalSupply'),3n*U);
 assert.equal(await read(c.YarnToken,'YarnToken','balanceOf',[buyer.address]),0n);
 assert.equal(await read(c.YarnToken,'YarnToken','allowance',[buyer.address,c.RelicForge]),0n);
 assert.equal(await m.craftDesign(runtime,c,buyer.address,0,id,id),undefined);
 assert.equal(await read(c.RelicForge,'RelicForge','totalCrafted'),1n);
 await assert.rejects(client.simulateContract({address:c.RelicNFT,abi:abi('RelicNFT'),functionName:'safeTransferFrom',args:[c.RelicForge,buyer.address,id,1n,'0x'],account:buyer.address}));
 const result={mode:'synthetic',chainId:43113,publicDeployment:false,organicDemand:false,
  provenance:'Disposable Anvil; two authenticated fixture receipts, source normalization, real seals and unrestricted14-YARN lot sale. Not C2 campaign authority.',
  forge:c.RelicForge,transaction:tx,gasUsed:proof.gasUsed.toString(),
  sourceUnits:2,sourceCopiesConsumed:2,sealedMinted:2,buyerUsableUnits:0,vaultUnits:2,erc1155Burned:0,
  sealBurnYarn:'20',saleBurnYarn:'0.28',forgeBurnYarn:'3',treasuryYarn:'0.42',sellerProceedsYarn:'13.3',
  buyerBalanceYarn:'0',buyerAllowanceWei:'0',design:0,crafts:1,lostResponseRetryCharges:0};
 writeFileSync(new URL('../../reports/chain/FORGE-LOCAL.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log('PASS: 2 source receipts -> 2 real sealed Epics -> unrestricted lot trade -> permanent vault +3 YARN burn +1 bound ornament; no withdrawal/reuse/double charge. Actual total burn23.28 and treasury0.42. Local only.');
} finally {await r.stop();}
