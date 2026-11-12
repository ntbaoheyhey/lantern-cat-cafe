import {afterAll,beforeAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {getAddress,recoverTypedDataAddress,type Address} from 'viem';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {as,migratedDb} from './game-db';
import {createItems,sealIntentHash,type ItemStore,type ChainInventory,type SealIntent} from '../../functions/_shared/chain-items';
import {createTesterReward,claimDomain,TESTER_CLAIM_TYPES} from '../../functions/_shared/chain-rewards';
import {voucherSigner,voucherDomain,VOUCHER_TYPES} from '../../functions/_shared/relic';
let db:PGlite;let player:string;let other:string;
const wallet=getAddress('0x'+'1'.repeat(40)),otherWallet=getAddress('0x'+'2'.repeat(40)),nft=getAddress('0x'+'3'.repeat(40));
const one=async<T>(sql:string,args:unknown[]=[]) => (await db.query<{r:T}>(sql,args)).rows[0]!.r;
const store:ItemStore={inventory:(p,w)=>one<ChainInventory[]>('select public.chain_item_inventory($1,$2) r',[p,w]),reserve:(p,w,i,t,r,c)=>one<SealIntent>('select public.chain_seal_reserve($1,$2,$3,$4,$5,$6) r',[p,w,i,t,r,c]),finalize:(p,i)=>one<SealIntent>('select public.chain_seal_finalize($1,$2) r',[p,i])};
beforeAll(async()=>{db=await migratedDb();player=await one('select public.upsert_player_by_wallet($1) r',[wallet.toLowerCase()]);other=await one('select public.upsert_player_by_wallet($1) r',[otherWallet.toLowerCase()]);});afterAll(async()=>{await db?.close();});
it('requires server boss evidence; source inventory cannot be imported or spoofed',async()=>{
  expect(await store.inventory(player,wallet.toLowerCase())).toEqual([]);
  await expect(store.inventory(other,wallet.toLowerCase())).rejects.toThrow('unauthenticated');
  for(const role of ['anon','authenticated'] as const){
    await expect(as(db,role,null,()=>store.inventory(player,wallet.toLowerCase()))).rejects.toThrow('permission denied');
    for(const table of ['chain_inventory','chain_seals'])await expect(as(db,role,null,()=>db.query(`select * from ${table}`))).rejects.toThrow('permission denied');
    await expect(as(db,role,null,()=>store.reserve(player,wallet.toLowerCase(),player,10001,1,'2'))).rejects.toThrow('permission denied');
    await expect(as(db,role,null,()=>store.finalize(player,player))).rejects.toThrow('permission denied');
  }
  await one('select public.chain_judge_reserve($1,$2,$3,true) r',[player,wallet.toLowerCase(),'a'.repeat(64)]);
  const items=await store.inventory(player,wallet.toLowerCase());expect(items).toHaveLength(1);expect(items[0]?.item_id).toBe('star-thread');
  expect(await store.inventory(player,wallet.toLowerCase())).toEqual(items);
});
it('locks once, verifies real expected payment, consumes source and renews a single mint nonce',async()=>{
  const key=generatePrivateKey();let amount=0n,used=false,now=1700000000000;
  const items=createItems({store,signer:voucherSigner(key,nft),paid:async()=>amount,nonceUsed:async()=>used,now:()=>now});
  const inventory=await store.inventory(player,wallet.toLowerCase());const input={action:'reserve',inventory:inventory[0]!.id};
  const a=await items(player,wallet,input);if(!a.intent)throw new Error();
  expect(a.intent.cost).toBe('2000000000000000000');expect(a.intent.token_id).toBe(10001);
  expect(await items(player,wallet,input)).toEqual(a);
  expect((await store.inventory(player,wallet.toLowerCase()))[0]!.state).toBe('reserved');
  await expect(items(other,otherWallet,{action:'finalize',intent:a.intent.id})).rejects.toThrow('no_intent');
  await expect(items(player,wallet,{action:'finalize',intent:a.intent.id})).rejects.toThrow('seal_unpaid');
  amount=1n;await expect(items(player,wallet,{action:'finalize',intent:a.intent.id})).rejects.toThrow('seal_unpaid');
  amount=BigInt(a.intent.cost);const result=await items(player,wallet,{action:'finalize',intent:a.intent.id});if(!result.voucher)throw new Error();
  const {signature,used:_used,source:_source,...message}=result.voucher;
  expect(await recoverTypedDataAddress({domain:voucherDomain(nft),types:VOUCHER_TYPES,primaryType:'Voucher',message,signature:signature as `0x${string}`})).toBe(privateKeyToAccount(key).address);
  expect(message.nonce).toBe(BigInt(sealIntentHash(a.intent.id)));expect(message.player).toBe(wallet);
  expect((await store.inventory(player,wallet.toLowerCase()))[0]!.state).toBe('consumed');
  now+=700000;const renewal=await items(player,wallet,{action:'finalize',intent:a.intent.id});if(!renewal.voucher)throw new Error();
  expect(renewal.voucher.nonce).toBe(result.voucher.nonce);expect(renewal.voucher.expiry).toBeGreaterThan(result.voucher.expiry);
  used=true;const done=await items(player,wallet,{action:'finalize',intent:a.intent.id});if(!done.voucher)throw new Error();expect(done.voucher.used).toBe(true);expect(done.voucher.signature).toBe('0x');
});
it('caps new seals at three UTC-day reservations and requires earned level two',async()=>{
  const add=async(source:string,level=2)=>one<string>('insert into chain_inventory(player_id,item_id,source,earned_level) values($1,\'star-thread\',$2,$3) returning id r',[player,source,level]);
  const low=await add('low',1);await expect(store.reserve(player,wallet.toLowerCase(),low,10001,1,'2')).rejects.toThrow('level_or_inventory');
  for(const source of ['second','third'])await store.reserve(player,wallet.toLowerCase(),await add(source),10001,1,'2');
  const fourth=await add('fourth');await expect(store.reserve(player,wallet.toLowerCase(),fourth,10001,1,'2')).rejects.toThrow('daily_limit');
  // Reservations, including abandoned ones, count. Retry of an existing intent is allowed.
  const existing=(await store.inventory(player,wallet.toLowerCase())).find(i=>i.seal)!.seal!;
  expect((await store.reserve(player,wallet.toLowerCase(),existing.inventory_id,10001,1,'2')).id).toBe(existing.id);
  await db.query("update chain_seals set created_at=now()-interval '2 days' where player_id=$1",[player]);
  await store.reserve(player,wallet.toLowerCase(),fourth,10001,1,'2');
});
it('rejects unknown/bound inventory rather than trusting client price, rarity or stats',async()=>{
  const id=await one<string>("insert into chain_inventory(player_id,item_id,source,earned_level) values($1,'boss-proof','bound',2) returning id r",[player]);
  const items=createItems({store,signer:voucherSigner(generatePrivateKey(),nft),paid:async()=>0n,nonceUsed:async()=>false});
  await expect(items(player,wallet,{action:'reserve',inventory:id})).rejects.toThrow('bound_item');
  await expect(items(player,wallet,{action:'reserve',inventory:other})).rejects.toThrow('no_item');
  await expect(items(player,wallet,{action:'unseal'})).rejects.toThrow('invalid_action');
});
it('tester grant needs a judge pass, fixes amount, binds wallet/domain and never creates a new nonce',async()=>{
  const key=generatePrivateKey();let eligible=false,used=false,season=0n;
  const reward=createTesterReward({key,contract:nft,eligible:async()=>eligible,season:async()=>season,nonceUsed:async()=>used});
  await expect(reward(player,wallet)).rejects.toThrow('no_judge_pass');eligible=true;
  const first=await reward(player,wallet);expect(first.claim.amount).toBe(20n*10n**18n);
  expect(await recoverTypedDataAddress({domain:claimDomain(nft),types:TESTER_CLAIM_TYPES,primaryType:'TesterClaim',message:first.claim,signature:first.signature as `0x${string}`})).toBe(privateKeyToAccount(key).address);
  season=1n;expect((await reward(player,wallet)).claim.nonce).toBe(first.claim.nonce);
  used=true;expect((await reward(player,wallet)).signature).toBe('0x');
});
