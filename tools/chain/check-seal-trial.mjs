// Exact20-YARN complete basket, actual disposable Anvil transactions only.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {startLocal,devAccount,walletFor,artifact} from './local.mjs';
process.env.CHAIN_SEAL_PRICE_TRIAL='1';
const r=await startLocal({web:false});
try{
  const {config:c,client,db,modules:m}=r,owner=devAccount(5),U=10n**18n,receipts=[];
  const read=(address,name,functionName,args=[])=>client.readContract({address,abi:artifact(name).abi,functionName,args});
  const send=async(address,name,functionName,args)=>{
    const hash=await walletFor(owner).writeContract({address,abi:artifact(name).abi,functionName,args});
    const receipt=await client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'success');
    receipts.push({action:functionName,hash,block:Number(receipt.blockNumber)});return hash;
  };
  const player=(await db.query('select public.upsert_player_by_wallet($1) r',[owner.address.toLowerCase()])).rows[0].r;
  await r.judge(player,owner.address,'5'.repeat(64),'pass');
  await r.judge(player,owner.address,'5'.repeat(64),'boss');
  const grant=await r.reward(player,owner.address);
  await send(c.SeasonRewards,'SeasonRewards','claimTester',[grant.claim,grant.signature]);
  assert.equal(await read(c.YarnToken,'YarnToken','balanceOf',[owner.address]),20n*U);
  const before=await read(c.YarnToken,'YarnToken','totalSupply');
  const item=m.TRADE_RULES.find(x=>x.kind==='equipment'&&x.tradable&&x.rarity==='epic');
  const receipt={sourceId:'local-price-trial',receiptId:'epic-1',instanceId:'instance-1',playerId:player,wallet:owner.address.toLowerCase(),
    itemId:item.id,earnedLevel:2,rulesHash:'a'.repeat(64),consumptionHash:'b'.repeat(64),normalizationVersion:'depth-min-roll-v1',
    earnedAt:'2026-01-01T00:00:00Z',consumedAt:'2026-01-02T00:00:00Z'};
  await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',[receipt.sourceId,receipt.rulesHash]);
  const ingest=m.createSourceIngest({enabled:true,store:async t=>db.transaction(async tx=>{
    await tx.exec('set local role service_role');
    return (await tx.query('select public.chain_source_ingest($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) r',
      [t.sourceId,t.receiptId,t.instanceId,t.playerId,t.wallet,t.itemId,t.earnedLevel,t.rulesHash,t.consumptionHash,t.normalizationVersion,t.earnedAt,t.consumedAt])).rows[0].r;
  })});
  await ingest(receipt);
  await ingest({...receipt,receiptId:'epic-2',instanceId:'instance-2',consumptionHash:'c'.repeat(64)});
  const inventory=await r.items(player,owner.address,{action:'inventory'});
  assert.equal(inventory.sealPolicy,'basket-trial-v1');assert.equal(inventory.items.length,3);
  for(const source of inventory.items){
    const {intent,hash}=await r.items(player,owner.address,{action:'reserve',inventory:source.id});
    assert.equal(BigInt(intent.cost),(source.item_id==='star-thread'?1n:5n)*U);
    await send(c.YarnToken,'YarnToken','seal',[hash,BigInt(intent.cost)]);
    const {voucher}=await r.items(player,owner.address,{action:'finalize',intent:intent.id});
    const {signature,used:_used,source:_source,...fields}=voucher;
    await send(c.RelicNFT,'RelicNFT','mint',[fields,signature]);
    assert.equal((await r.items(player,owner.address,{action:'finalize',intent:intent.id})).voucher.used,true);
  }
  const runtime=m.chainRuntime(c,walletFor(owner),owner.address),id=BigInt(item.tokenId);
  const forge=await m.craftDesign(runtime,c,owner.address,0,id,id);
  assert.equal((await client.getTransactionReceipt({hash:forge})).status,'success');receipts.push({action:'forge',hash:forge});
  assert.equal(await m.craftDesign(runtime,c,owner.address,0,id,id),undefined);
  const {order,hash}=await r.cosmetics(player,owner.address,{action:'reserve',sku:'fern'});
  await send(c.YarnToken,'YarnToken','seal',[hash,BigInt(order.cost)]);
  await r.cosmetics(player,owner.address,{action:'finalize',intent:order.id});
  assert.equal((await r.cosmetics(player,owner.address,{action:'equip',sku:'fern'})).active,'fern');
  assert.equal(await read(c.YarnToken,'YarnToken','balanceOf',[owner.address]),2n*U);
  assert.equal(before-await read(c.YarnToken,'YarnToken','totalSupply'),18n*U);
  assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[owner.address,id]),0n);
  assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[c.RelicForge,id]),2n);
  assert.equal(await read(c.RelicNFT,'RelicNFT','balanceOf',[owner.address,10001n]),1n);
  assert.equal(await read(c.RelicForge,'RelicForge','hasDesign',[owner.address,0]),true);
  const report={chainId:43113,mode:'disposable Anvil',policy:'basket-trial-v1',grant:'20',epicSeals:'10',forge:'3',style:'4',threadSeal:'1',burn:'18',retained:'2',
    completed:{ornaments:1,styles:1,sealedThreads:1},publicDeployment:false,organicDemand:false,ordinaryAuthority:false,
    evidence:'One actual tester claim; two synthetic source receipts through the trusted adapter; exact payment/mint/forge/equip/retry checks. Feasibility, not human demand or campaign authority.',receipts};
  writeFileSync(new URL('../../reports/chain/SEAL-TRIAL-LOCAL.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log('PASS: actual20 grant -> 2 Epic seals10 + forge3 + style4 + thread1 -> 18 burned,2 retained; permanent outputs and idempotent retries. Local fixture, not organic demand.');
}finally{await r.stop();}
