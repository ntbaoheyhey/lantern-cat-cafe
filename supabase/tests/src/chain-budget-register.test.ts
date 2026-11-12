import {beforeAll,afterAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import type {Address} from 'viem';
import {as,migratedDb} from './game-db.ts';
import {createRoutineBudgetRegistration,type RoutineBudgetPlan,type RegisteredRoutineBudget} from '../../functions/_shared/chain-budget-register.ts';
import {createTesterBudgetReservation,type TesterPoolSnapshot} from '../../functions/_shared/chain-tester-budget.ts';
let db:PGlite,serial=0;
const U=10n**18n,rules='a'.repeat(64),hash='0x'+'b'.repeat(64),stamp=1794492000;
const register=async(p:unknown)=>(await db.query<{r:RegisteredRoutineBudget}>('select public.chain_reward_budget_register($1::jsonb) r',[JSON.stringify(p)])).rows[0]!.r;
beforeAll(async()=>{
  db=await migratedDb();
  await db.query('insert into chain_source_policies(source_id,rules_hash) values($1,$2)',['budget-test',rules]);
});
afterAll(async()=>{await db?.close();});
async function setup({pool=40n*U,protectedYarn=0n}={}){
  const id=++serial,contract=('0x'+(1000+id).toString(16).padStart(40,'0')) as Address;
  const wallet=('0x'+id.toString(16).padStart(40,'0')) as Address;
  const player=(await db.query<{r:string}>('select public.upsert_player_by_wallet($1) r',[wallet])).rows[0]!.r;
  await db.query('insert into chain_judge_passes(player_id,wallet,ip_hash) values($1,$2,$3)',[player,wallet,rules]);
  await db.query('insert into chain_tester_budgets(contract,ceiling,protected_yarn,evidence_hash,enabled) values($1,$2,$3,$4,true)',
    [contract,(40n*U).toString(),protectedYarn.toString(),rules]);
  const s:TesterPoolSnapshot={chainId:43113,contract,block:10n,blockHash:hash,timestamp:BigInt(stamp),balance:pool};
  const plan:RoutineBudgetPlan={id:'plan-'+id,contract,season:1,source_id:'budget-test',rules_hash:rules,evidence_hash:rules,
    ceiling:(30n*U).toString(),boss_max:(15n*U/10n).toString(),rank_max:(15n*U/10n).toString(),weekly_cap:(3n*U).toString()};
  const prepare=createRoutineBudgetRegistration({contract,snapshot:async()=>s,register,now:()=>stamp*1000});
  const gift=createTesterBudgetReservation({contract,snapshot:async()=>s,now:()=>stamp*1000,
    reserve:async p=>(await db.query<{r:Parameters<Parameters<typeof createTesterBudgetReservation>[0]['reserve']>[0]}>('select public.chain_tester_reserve($1::jsonb) r',[JSON.stringify(p)])).rows[0]!.r});
  return {s,plan,prepare,gift,request:{player,wallet,contract,nonce:BigInt(id),amount:20n*U}};
}
it('reserves a full disabled routine ceiling before gifts, without enabling the source or claims',async()=>{
  const f=await setup();
  expect((await f.prepare(f.plan)).enabled).toBe(false);
  await expect(f.gift(f.request)).rejects.toThrow('tester_pool_low');
  expect((await db.query('select enabled from chain_source_policies')).rows[0]).toEqual({enabled:false});
});
it('a grant authorized first leaves too little for a new routine ceiling',async()=>{
  const f=await setup();await f.gift(f.request);
  await expect(f.prepare(f.plan)).rejects.toThrow('tester_pool_low');
  expect((await db.query('select * from chain_reward_budgets where id=$1',[f.plan.id])).rows).toHaveLength(0);
  expect((await f.prepare({...f.plan,ceiling:(20n*U).toString()})).enabled).toBe(false);
});
it('retains protected legacy promises and every earlier ceiling even when disabled',async()=>{
  const f=await setup({protectedYarn:10n*U});await f.prepare(f.plan);
  await expect(f.prepare({...f.plan,id:f.plan.id+'-next',season:2,ceiling:'1'})).rejects.toThrow('tester_pool_low');
});
it('matching retries are free and preserve activation state; a changed plan conflicts',async()=>{
  const f=await setup();await f.prepare(f.plan);
  await as(db,'service_role',null,()=>db.query('update chain_reward_budgets set enabled=true where id=$1',[f.plan.id]));
  f.s.balance=0n;expect((await f.prepare(f.plan)).enabled).toBe(true);
  await expect(f.prepare({...f.plan,ceiling:'1'})).rejects.toThrow('routine_budget_conflict');
  expect((await db.query('select * from chain_reward_budgets where contract=$1',[f.plan.contract])).rows).toHaveLength(1);
});
it('binds source rules and shared monotonic funding history',async()=>{
  const f=await setup({pool:100n*U});
  await expect(f.prepare({...f.plan,rules_hash:'c'.repeat(64)})).rejects.toThrow('routine_policy');
  await f.prepare(f.plan);f.s.block=9n;
  await expect(f.gift(f.request)).rejects.toThrow('tester_budget_snapshot');
  f.s.block=10n;f.s.blockHash='0x'+'c'.repeat(64);
  await expect(f.prepare({...f.plan,id:f.plan.id+'-next',season:2})).rejects.toThrow('tester_budget_snapshot');
  f.s.block=11n;await expect(f.gift(f.request)).resolves.toBeUndefined();
});
it('rejects stale/foreign snapshots and a valid-but-different returned plan before further work',async()=>{
  const f=await setup();let calls=0;
  const prepare=createRoutineBudgetRegistration({contract:f.request.contract,snapshot:async()=>({...f.s,timestamp:BigInt(stamp-61)}),
    register:async p=>{calls++;return {...p.budget,enabled:false};},now:()=>stamp*1000});
  await expect(prepare(f.plan)).rejects.toThrow('tester_budget_snapshot');expect(calls).toBe(0);
  await expect(f.prepare({...f.plan,contract:'0x'+'f'.repeat(40)})).rejects.toThrow('routine_budget_contract');
  const wrong=createRoutineBudgetRegistration({contract:f.request.contract,snapshot:async()=>f.s,
    register:async p=>({...p.budget,ceiling:'1',enabled:false}),now:()=>stamp*1000});
  await expect(wrong(f.plan)).rejects.toThrow('routine_budget_conflict');
});
it('service must use the registration lock; browsers cannot register or read plans',async()=>{
  const f=await setup(),p={budget:{...f.plan,enabled:true},pool_balance:f.s.balance.toString(),block:'10',block_hash:hash};
  for(const role of ['anon','authenticated'] as const)
    await expect(as(db,role,null,()=>register(p))).rejects.toThrow('permission denied');
  await expect(as(db,'service_role',null,()=>db.query('insert into chain_reward_budgets select * from chain_reward_budgets'))).rejects.toThrow('permission denied');
  expect((await as(db,'service_role',null,()=>register(p))).enabled).toBe(false);
});
it('requires a protected pool record and transaction rollback leaves no new promise',async()=>{
  const f=await setup();
  await db.query('delete from chain_tester_budgets where contract=$1',[f.plan.contract]);
  await expect(f.prepare(f.plan)).rejects.toThrow('tester_budget_unavailable');
  expect((await db.query('select * from chain_reward_budgets where id=$1',[f.plan.id])).rows).toHaveLength(0);
});
