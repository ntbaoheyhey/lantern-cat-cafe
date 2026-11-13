import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {buildMigratedDb,as} from './standalone-db';
import {createEconomy,economyIntentHash,freshEconomy,type EconomyChain,type EconomyStore} from '../../functions/_shared/economy-v3';
import {economyStore} from '../../functions/_shared/economy-v3-store';
import {economyChain} from '../../functions/_shared/economy-v3-chain';
import type {EconomyCommand} from '../../../packages/chain/src/economy-v3';
import type {PGlite} from '@electric-sql/pglite';
import type {Address,Hex} from 'viem';
import {ECONOMY_V3 as E} from '../../../packages/game-rules/src/cardrpg/economy-v3';
const player='43113000-0000-0000-0000-000000000001',wallet=('0x'+'1'.repeat(40)) as Address,unit=10n**18n;
let db:PGlite,store:EconomyStore,clock=Date.UTC(2026,10,13),paid=0n,burns=0,hasDeed=true;
const chain:EconomyChain={nftUsed:async()=>false,rewardUsed:async()=>false,owns:async()=>hasDeed,paid:async()=>paid,burn:async()=>{burns++;},capacity:async()=>{},season:async()=>0n,mint:async()=>'0x12',claim:async()=>'0x12',certify:async()=>'0x12'};
let act:ReturnType<typeof createEconomy>;
const request=(command:EconomyCommand,id=crypto.randomUUID())=>act(player,wallet,{id,command});
beforeAll(async()=>{db=await buildMigratedDb();await db.query('insert into players(id,wallet,created_at) values($1,$2,$3)',[player,wallet,new Date(clock).toISOString()]);await db.exec('update chain_v3_budget set enabled=true,ceiling=100000000000000000000');store=economyStore(async(name,args)=>{const values=Object.values(args).map(v=>v&&typeof v==='object'?JSON.stringify(v):v);return as(db,'service_role',null,async()=>((await db.query('select '+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+') r',values)).rows[0] as {r:unknown}).r);});act=createEconomy({enabled:true,demo:true,store,chain,now:()=>clock});},30000);
afterAll(async()=>{await db?.close();});
describe('server economy',()=>{
 it('preserves old Thread above cap while continuing Spool and idempotent weekly credit',async()=>{
  let state={...freshEconomy(),stars:E.rewards.starThreadBankCap+20};
  const localStore:EconomyStore={receipt:async()=>null,read:async()=>({state,revision:0,createdAt:new Date(clock).toISOString(),judge:false,campaign:null,wins:[{id:2,at:new Date(clock).toISOString(),chapter:1}]}),commit:async p=>{state=p.state;return {hash:p.hash,state,revision:1};}};
  const service=createEconomy({enabled:true,store:localStore,chain,now:()=>clock});
  const first=await service(player,wallet,{id:crypto.randomUUID(),command:{action:'state'}});
  expect(first.state.stars).toBe(E.rewards.starThreadBankCap+20);expect(BigInt(first.state.spool)).toBeGreaterThan(0n);
  const again=await service(player,wallet,{id:crypto.randomUUID(),command:{action:'state'}});expect(again.state).toEqual(first.state);
 });
 it('is default off and rejects invented balances/quest wins',async()=>{
  expect(typeof economyChain).toBe('function');
  await expect(createEconomy({store,chain})(player,wallet,{id:crypto.randomUUID(),command:{action:'state'}})).rejects.toThrow('campaign_disabled');
  await expect(request({action:'quest'})).rejects.toThrow('quest');
  await expect(act(player,wallet,{id:crypto.randomUUID(),command:{action:'state',spool:'999'}})).rejects.toThrow('invalid_request');
 });
 it('grants one quest pack from the authoritative judge result, reserving one Deed',async()=>{
  await db.query("insert into chain_entitlements(player_id,relic_id,rarity_index,source) values($1,3,2,'judge-boss')",[player]);
  const q=await request({action:'quest'});expect(q.state.spool).toBe(String(16n*unit));expect(q.state.gear).toHaveLength(4);
  expect((await request({action:'quest'})).state.spool).toBe(q.state.spool);
  const first=await request({action:'deed'}),again=await request({action:'deed'});expect(first.voucher?.relicId).toBe('30001');expect(again.voucher?.nonce).toBe(first.voucher?.nonce);
 });
 it('withdraws the net once, retaining 25%, enforcing ownership and cooldown',async()=>{
  hasDeed=false;await expect(request({action:'withdraw',amount:String(16n*unit),deed:30001})).rejects.toThrow('held');hasDeed=true;
  const id=crypto.randomUUID(),c={action:'withdraw' as const,amount:String(16n*unit),deed:30001},a=await request(c,id),b=await request(c,id);
  expect(a.withdrawal?.claim.amount).toBe(String(12n*unit));expect(a.intent?.retained).toBe(String(4n*unit));expect(b.state.spool).toBe('0');expect(b.withdrawal?.claim.nonce).toBe(a.withdrawal?.claim.nonce);
  await expect(request({...c,amount:'1'},id)).rejects.toThrow('campaign_conflict');await expect(request(c)).rejects.toThrow('seven days');
  expect((await db.query<{reserved_net:string}>('select reserved_net from chain_v3_budget')).rows[0]!.reserved_net).toBe(String(12n*unit));
 });
 it('reserves real gear once and refuses unpaid minting',async()=>{
  const r=await request({action:'seal',instance:'quest:weapon'});expect(r.intent?.token).toBe(22020);expect(r.hash).toBe(economyIntentHash(r.intent!.id));
  await expect(request({action:'seal',instance:'quest:weapon'})).rejects.toThrow('earned');
  await expect(request({action:'finalize',intent:r.intent!.id})).rejects.toThrow('Exact');paid=10n*unit;
  const done=await request({action:'finalize',intent:r.intent!.id});expect(done.voucher?.relicId).toBe('22020');
 });
 it('rejects excess sealed Thread before it can increase the bound balance',async()=>{
  await expect(request({action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[22020],sealedStars:E.fusion.legendary.starThread+1})).rejects.toThrow('invalid_request');
 });
 it('consumes mixed sealed and bound inputs with deterministic quality and a unique burn receipt',async()=>{
  const r=await request({action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[22020],sealedStars:0});
  expect(r.intent?.burnIds).toEqual([22020]);expect(r.intent?.token).toBe(21031);expect(r.state.stars).toBe(0);paid=20n*unit;
  await expect(request({action:'finalize',intent:r.intent!.id})).rejects.toThrow('receipt required');
  const done=await request({action:'finalize',intent:r.intent!.id,burnTx:('0x'+'a'.repeat(64)) as Hex});expect(done.voucher?.relicId).toBe('21031');expect(burns).toBe(1);
  await request({action:'voucher',intent:r.intent!.id});expect(burns).toBe(1);
 });
 it('denies direct client ledger, budget and mint allocation writes',async()=>{
  for(const table of ['chain_v3_accounts','chain_v3_actions','chain_v3_burns','chain_v3_deeds','chain_v3_budget'])await expect(as(db,'authenticated',null,()=>db.query('select * from '+table))).rejects.toThrow();
 });
 it('applies the seven-day age gate when demo is off',async()=>{
  const fresh=createEconomy({enabled:true,demo:false,store,chain,now:()=>clock+1000});await expect(fresh(player,wallet,{id:crypto.randomUUID(),command:{action:'withdraw',amount:'1',deed:30001}})).rejects.toThrow('age');
 });
 it('allows an ordinary level-five demo guest to earn a Deed without a Judge pack',async()=>{
  const state={...freshEconomy(),level:5};
  const guestStore:EconomyStore={receipt:async()=>null,read:async()=>({state,revision:0,createdAt:new Date(clock).toISOString(),judge:false,campaign:null,wins:[{id:1,at:new Date(clock).toISOString(),chapter:1}]}),commit:async p=>({hash:p.hash,state:p.state,revision:1})};
  const command={id:crypto.randomUUID(),command:{action:'quest'}};
  const demo=createEconomy({enabled:true,demo:true,store:guestStore,chain,now:()=>clock});
  const result=await demo(player,wallet,command);
  expect(result.state.quest).toBe(true);expect(result.state.gear).toEqual([]);expect(result.state.credits).not.toContain('demo-quest');
  await expect(createEconomy({enabled:true,store:guestStore,chain,now:()=>clock})(player,wallet,command)).rejects.toThrow('level 15');
 });
});
