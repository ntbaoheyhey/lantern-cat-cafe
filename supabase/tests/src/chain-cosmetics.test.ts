import {afterAll,beforeAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import type {Address,Hex} from 'viem';
import {as,migratedDb} from './game-db.ts';
import {createCosmetics,cosmeticIntentHash,type CosmeticStore} from '../../functions/_shared/chain-cosmetics.ts';
import {sealIntentHash} from '../../functions/_shared/chain-items.ts';
import {YARN_STYLES,type CosmeticOrder,type CosmeticState} from '../../../packages/chain/src/cosmetics.ts';
let db:PGlite,player:string,other:string;
const wallet=('0x'+'1'.repeat(40)) as Address,otherWallet=('0x'+'2'.repeat(40)) as Address;
const token=('0x'+'3'.repeat(40)) as Address;
const payments=new Map<string,bigint>();
const query=async<T>(sql:string,args:unknown[]) => (await db.query<{r:T}>(sql,args)).rows[0]!.r;
const store:CosmeticStore={
 state:(p,w)=>query<CosmeticState>('select public.chain_cosmetic_state($1,$2) r',[p,w]),
 reserve:(p,w,s,t)=>query<CosmeticOrder>('select public.chain_cosmetic_reserve($1,$2,$3,$4) r',[p,w,s,t]),
 finalize:(p,w,i)=>query<CosmeticState>('select public.chain_cosmetic_finalize($1,$2,$3) r',[p,w,i]),
 equip:(p,w,s)=>query<CosmeticState>('select public.chain_cosmetic_equip($1,$2,$3) r',[p,w,s]),
};
const paid=async(w:Address,h:Hex)=>payments.get(w.toLowerCase()+h)??0n;
const api=createCosmetics({enabled:true,token,store,paid});
const reserve=async(sku:string)=>await api(player,wallet,{action:'reserve',sku}) as {order:CosmeticOrder;hash:Hex};
beforeAll(async()=>{db=await migratedDb();player=await query<string>('select public.upsert_player_by_wallet($1) r',[wallet]);other=await query<string>('select public.upsert_player_by_wallet($1) r',[otherWallet]);});
afterAll(async()=>{await db?.close();});
it('defaults off without reading payments or granting anything',async()=>{
 let calls=0;
 const off=createCosmetics({token,store,paid:async()=>{calls++;return 4n*10n**18n;}});
 await expect(off(player,wallet,{action:'state'})).rejects.toThrow('cosmetics_disabled');expect(calls).toBe(0);
});
it('browser roles cannot purchase, finalize, equip or edit ownership; service cannot rewrite receipts',async()=>{
 for(const role of ['anon','authenticated'] as const){
  for(const action of [()=>store.state(player,wallet),()=>store.reserve(player,wallet,'fern',token),
   ()=>store.finalize(player,wallet,player),()=>store.equip(player,wallet,'none')])
   await expect(as<unknown>(db,role,null,action)).rejects.toThrow('permission denied');
  for(const table of ['chain_cosmetic_orders','chain_cosmetic_preferences'])
   await expect(as(db,role,null,()=>db.exec(`select * from ${table}`))).rejects.toThrow('permission denied');
 }
 await expect(as(db,'service_role',null,()=>db.exec("update chain_cosmetic_orders set paid_at=now()"))).rejects.toThrow('permission denied');
 expect(await as(db,'service_role',null,()=>store.state(player,wallet))).toEqual({orders:[],active:null});
});
it('locks one order per SKU; payment domains differ from sealing and other deployments',async()=>{
 const first=await reserve('fern');expect(first.order.cost).toBe(YARN_STYLES[0].cost);
 expect(await reserve('fern')).toEqual(first);
 expect(first.hash).not.toBe(sealIntentHash(first.order.id));
 expect(first.hash).not.toBe(cosmeticIntentHash(otherWallet,first.order.id));
 await expect(store.reserve(player,wallet,'fern',otherWallet)).rejects.toThrow('invalid_request');
 await expect(api(other,otherWallet,{action:'finalize',intent:first.order.id})).rejects.toThrow('no_intent');
 await expect(api(player,otherWallet,{action:'reserve',sku:'tide'})).rejects.toThrow('unauthenticated');
});
it('rejects unpaid, wrong amounts and another wallet payment before granting a permanent style',async()=>{
 const {order,hash}=await reserve('fern');
 await expect(api(player,wallet,{action:'equip',sku:'fern'})).rejects.toThrow('cosmetic_locked');
 for(const amount of [0n,1n,BigInt(order.cost)-1n,BigInt(order.cost)+1n]){
  payments.set(wallet+hash,amount);
  await expect(api(player,wallet,{action:'finalize',intent:order.id})).rejects.toThrow('cosmetic_unpaid');
 }
 payments.set(wallet+hash,0n);payments.set(otherWallet+hash,BigInt(order.cost));
 await expect(api(player,wallet,{action:'finalize',intent:order.id})).rejects.toThrow('cosmetic_unpaid');
 payments.set(wallet+hash,BigInt(order.cost));
 const result=await api(player,wallet,{action:'finalize',intent:order.id}) as CosmeticState;
 expect(result.orders[0]!.paid_at).toBeTruthy();
 expect(await api(player,wallet,{action:'finalize',intent:order.id})).toEqual(result);
 expect((await api(player,wallet,{action:'equip',sku:'fern'}) as CosmeticState).active).toBe('fern');
 expect((await api(player,wallet,{action:'equip',sku:'none'}) as CosmeticState).active).toBeNull();
});
it('caps lifetime purchases at the finite catalog and does not touch inventory or player stats',async()=>{
 const before=await db.query('select * from chain_inventory where player_id=$1',[player]);
 for(const style of YARN_STYLES){
  const {order,hash}=await reserve(style.id);payments.set(wallet+hash,BigInt(style.cost));
  await api(player,wallet,{action:'finalize',intent:order.id});
 }
 const state=await store.state(player,wallet);expect(state.orders).toHaveLength(3);
 expect(state.orders.reduce((n,o)=>n+BigInt(o.cost),0n)).toBe(12n*10n**18n);
 expect((await db.query('select * from chain_inventory where player_id=$1',[player])).rows).toEqual(before.rows);
 for(const sku of ['unknown','none','toString','fern ',null])
  await expect(api(player,wallet,{action:'reserve',sku})).rejects.toThrow('invalid_request');
});
it('rejects corrupted store prices and identity before any payment read',async()=>{
 const {order}=await reserve('fern');let reads=0;
 for(const patch of [{cost:'1'},{token:otherWallet},{wallet:otherWallet},{player_id:other},{sku:'fake'},{sku:'tide'},{id:'invalid'}]){
  const broken=createCosmetics({enabled:true,token,paid:async()=>{reads++;return 4n*10n**18n;},
    store:{...store,reserve:async()=>({...order,...patch}) as CosmeticOrder}});
  await expect(broken(player,wallet,{action:'reserve',sku:'fern'})).rejects.toThrow('cosmetic_store_conflict');
 }
 expect(reads).toBe(0);
});
