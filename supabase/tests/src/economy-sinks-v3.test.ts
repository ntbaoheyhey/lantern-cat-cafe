import {afterAll,beforeAll,beforeEach,describe,expect,it} from 'vitest';
import {buildMigratedDb,as} from './standalone-db';
import {createEconomy,economyIntentHash,freshEconomy,type EconomyChain,type EconomyStore} from '../../functions/_shared/economy-v3';
import {economyStore} from '../../functions/_shared/economy-v3-store';
import {economySinkQuote,ECONOMY_SINK_IDS} from '../../../packages/game-rules/src/cardrpg/economy-sinks-v3';
import type {EconomyCommand} from '../../../packages/chain/src/economy-v3';
import type {PGlite} from '@electric-sql/pglite';
import type {Address} from 'viem';
const player='43113000-0000-0000-0000-000000000002',wallet=('0x'+'2'.repeat(40)) as Address,UNIT=10n**18n;
const now=Date.UTC(2026,10,13),payments=new Map<string,bigint>();let db:PGlite,store:EconomyStore,mints=0;
const chain:EconomyChain={nftUsed:async()=>false,rewardUsed:async()=>false,owns:async()=>false,paid:async(_wallet,hash)=>payments.get(hash)??0n,burn:async()=>{},capacity:async()=>{},season:async()=>0n,mint:async()=>{mints++;return '0x12';},claim:async()=>'0x12',certify:async()=>'0x12'};
let act:ReturnType<typeof createEconomy>;
const call=(command:EconomyCommand,id=crypto.randomUUID())=>act(player,wallet,{id,command});
const initial=()=>({...freshEconomy(),stars:30,gear:[{id:'earned:1',template:'hearthloom-weapon-epic',quality:1000}]});
beforeAll(async()=>{
 db=await buildMigratedDb();await db.query('insert into players(id,wallet) values($1,$2)',[player,wallet]);
 await db.exec('update chain_v3_budget set enabled=true,ceiling=100000000000000000000');
 store=economyStore(async(name,args)=>{const values=Object.values(args).map(v=>v&&typeof v==='object'?JSON.stringify(v):v);return as(db,'service_role',null,async()=>((await db.query('select '+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+') r',values)).rows[0] as {r:unknown}).r);});
 act=createEconomy({enabled:true,store,chain,now:()=>now});
},30000);
beforeEach(async()=>{
 payments.clear();mints=0;await db.exec('delete from chain_v3_actions; delete from chain_v3_accounts;');
 await db.query('insert into chain_v3_accounts(player_id,wallet,state) values($1,$2,$3)',[player,wallet,JSON.stringify(initial())]);
});
afterAll(async()=>{await db?.close();});
describe('real service-ledger deterministic sinks',()=>{
 it.each(ECONOMY_SINK_IDS)('%s requires the exact chain burn and applies its guaranteed benefit exactly once',async sink=>{
  const command:EconomyCommand={action:'sink',sink,...(sink==='polish'?{instance:'earned:1'}:{})};
  const quote=economySinkQuote(sink,initial(),'earned:1',now),id=crypto.randomUUID();
  const reserved=await call(command,id),intent=reserved.intent!;
  expect(intent.cost).toBe(String(BigInt(quote.yarn)*UNIT));expect(reserved.state.stars).toBe(30-quote.starThread);
  expect(reserved.voucher).toBeUndefined();expect(reserved.state.styles).toEqual([]);
  if(sink==='polish')expect(reserved.state.gear).toEqual([]);
  expect((await call(command,id)).state).toEqual(reserved.state);
  await expect(call({action:'finalize',intent:intent.id})).rejects.toThrow('Exact');
  payments.set(economyIntentHash(id),BigInt(intent.cost)-1n);
  await expect(call({action:'finalize',intent:intent.id})).rejects.toThrow('Exact');
  payments.set(economyIntentHash(id),BigInt(intent.cost));
  const done=await call({action:'finalize',intent:id});expect(done.intent!.ready).toBe(true);expect(done.voucher).toBeUndefined();
  const again=await call({action:'finalize',intent:id});expect(again.state).toEqual(done.state);
  if(sink==='polish')expect(done.state.gear).toEqual([{...initial().gear[0]!,quality:quote.quality}]);
  else expect(done.state.styles).toEqual([quote.style]);
  expect((await call({action:'voucher',intent:id})).voucher).toBeUndefined();expect(mints).toBe(0);
 });
 it('rejects client prices, Star Thread, seed, output, and non-owned inputs',async()=>{
  for(const field of ['cost','stars','seed','output','quality'])await expect(act(player,wallet,{id:crypto.randomUUID(),command:{action:'sink',sink:'decor',[field]:0}})).rejects.toThrow('invalid_request');
  await expect(call({action:'sink',sink:'polish',instance:'invented'})).rejects.toThrow('owned');
  await db.query('update chain_v3_accounts set state=jsonb_set(state,\'{stars}\',\'0\') where player_id=$1',[player]);
  await expect(call({action:'sink',sink:'display'})).rejects.toThrow('Star Thread');
 });
 it('serializes reservations so concurrent clicks cannot reserve or spend the same recipe twice',async()=>{
  const results=await Promise.allSettled([call({action:'sink',sink:'decor'}),call({action:'sink',sink:'decor'})]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  const result=await call({action:'state'});expect(result.state.intents).toHaveLength(1);
  expect(result.state.stars).toBe(30-economySinkQuote('decor',initial(),undefined,now).starThread);
 });
 it('keeps reserved gear unavailable to sealing until its quality payment settles',async()=>{
  const reserve=await call({action:'sink',sink:'polish',instance:'earned:1'});
  await expect(call({action:'sink',sink:'polish',instance:'earned:1'})).rejects.toThrow('owned');
  expect((await call({action:'state'})).state.gear).toEqual([]);
  payments.set(economyIntentHash(reserve.intent!.id),BigInt(reserve.intent!.cost));
  const done=await call({action:'finalize',intent:reserve.intent!.id});expect(done.state.gear).toHaveLength(1);
 });
});
