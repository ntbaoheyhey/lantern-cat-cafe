import {beforeAll,afterAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import type {Address} from 'viem';
import {as,migratedDb} from './game-db.ts';
import {createRoutinePreparation,routineNonce,type RoutineReceipt,type RoutineReservation,type RoutineSnapshot} from '../../functions/_shared/chain-routine.ts';
let db:PGlite,serial=0;
const rules='a'.repeat(64),evidence='b'.repeat(64),U=10n**18n,epoch=1794182400;
const snapshot=(contract:Address):RoutineSnapshot=>({chainId:43113,contract,block:1,blockHash:'0x'+'c'.repeat(64),
  timestamp:epoch+14*604800+60,epoch,season:1,week:(epoch-345600)/604800+14,routineCap:(12n*U).toString()});
const store=async(r:RoutineReservation)=>(await db.query<{r:RoutineReservation}>('select public.chain_reward_reserve($1::jsonb) r',[JSON.stringify(r)])).rows[0]!.r;
const renew=async(r:RoutineReservation)=>(await db.query<{r:RoutineReservation}>('select public.chain_reward_renew($1::jsonb) r',[JSON.stringify(r)])).rows[0]!.r;
beforeAll(async()=>{db=await migratedDb();await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',['routine-test',rules]);});
afterAll(async()=>{await db?.close();});
async function setup({ceiling='3000000000000000000',weekly='12000000000000000000',enabled=true}={}){
  const id=++serial,wallet=('0x'+id.toString(16).padStart(40,'0')) as Address,contract=('0x'+(100+id).toString(16).padStart(40,'0')) as Address;
  const player=(await db.query<{r:string}>('select public.upsert_player_by_wallet($1) r',[wallet])).rows[0]!.r;
  const s=snapshot(contract),budget='budget-'+id;
  await db.query('insert into chain_reward_budgets(id,contract,season,source_id,rules_hash,evidence_hash,ceiling,boss_max,rank_max,weekly_cap,enabled) values($1,$2,1,$3,$4,$5,$6,$7,$7,$8,$9)',
    [budget,contract,'routine-test',rules,evidence,ceiling,(15n*U/10n).toString(),weekly,enabled]);
  const receipt:RoutineReceipt={sourceId:'routine-test',receiptId:'receipt-'+id,playerId:player,wallet,kind:'weekly-boss',earningPeriod:s.week,
    rulesHash:rules,evidenceHash:evidence,finalizedAt:s.timestamp-1,eligible:true,budgetId:budget,amount:(15n*U/10n).toString()};
  const prepare=createRoutinePreparation({enabled:true,contract,authority:async()=>receipt,snapshot:async()=>s,reserve:store});
  return {player,wallet,contract,s,receipt,prepare};
}
it('is disabled by default before source/RPC/store calls; budget also defaults disabled',async()=>{
  let calls=0;const f=await setup({enabled:false});
  const prep=createRoutinePreparation({contract:f.contract,authority:async()=>{calls++;return f.receipt;},snapshot:async()=>{calls++;return f.s;},reserve:async r=>{calls++;return r;}});
  await expect(prep(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow('routine_disabled');expect(calls).toBe(0);
  await expect(f.prepare(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow('routine_disabled');
});
it('persists exact wei/uint256 values and returns the original quote on retries',async()=>{
  const f=await setup(),a=await f.prepare(f.player,f.wallet,f.receipt.receiptId);
  f.s.timestamp+=30;
  const b=await f.prepare(f.player,f.wallet,f.receipt.receiptId);
  expect(b.reservation).toEqual(a.reservation);expect(a.claim.amount).toBe(15n*U/10n);
  expect(a.claim.nonce).toBe(routineNonce(f.receipt));expect(a.claim.nonce).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
  expect(a.preparationOnly).toBe(true);expect(a).not.toHaveProperty('signature');
  expect((await db.query('select * from chain_reward_reservations where budget_id=$1',[f.receipt.budgetId])).rows).toHaveLength(1);
});
it('browser roles cannot read, reserve, enable or edit budgets; service cannot rewrite receipts or amounts',async()=>{
  const f=await setup(),r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  for(const role of ['anon','authenticated'] as const){
    await expect(as(db,role,null,()=>store(r))).rejects.toThrow('permission denied');
    for(const table of ['chain_reward_budgets','chain_reward_reservations'])
      await expect(as(db,role,null,()=>db.query(`select * from ${table}`))).rejects.toThrow('permission denied');
    await expect(as(db,role,null,()=>db.query('update chain_reward_budgets set enabled=true'))).rejects.toThrow('permission denied');
  }
  await expect(as(db,'service_role',null,()=>db.query("update chain_reward_budgets set ceiling='999'"))).rejects.toThrow('permission denied');
  await expect(as(db,'service_role',null,()=>db.query('delete from chain_reward_reservations'))).rejects.toThrow('permission denied');
  await expect(as(db,'service_role',null,()=>store(r))).resolves.toEqual(r);
});
it('binds identity, source proof, budget, amount and nonce; changed retries fail',async()=>{
  const f=await setup(),r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  for(const patch of [{amount:'1'},{nonce:'1'},{evidence_hash:'d'.repeat(64)},{earning_period:r.earning_period-1},{rules_hash:'d'.repeat(64)}])
    await expect(store({...r,...patch})).rejects.toThrow('routine_conflict');
  const other=await setup();await expect(store({...r,player_id:other.player})).rejects.toThrow('unauthenticated');
});
it('the same weekly event cannot get a second receipt and a current-season rank is not final',async()=>{
  const f=await setup(),r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  await expect(store({...r,receipt_id:r.receipt_id+'-alias',nonce:'55'})).rejects.toThrow(/unique|duplicate/);
  f.receipt.kind='season-rank';f.receipt.earningPeriod=f.s.season;
  await expect(f.prepare(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow('routine_period');
  f.receipt.earningPeriod=0;f.receipt.finalizedAt=f.s.epoch-1;
  await expect(f.prepare(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow('routine_unfinalized');
});
it('enforces total budget across wallets and a shared boss/rank weekly cap',async()=>{
  const f=await setup({ceiling:(2n*U).toString()}),r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  const g=await setup();
  await expect(store({...r,player_id:g.player,wallet:g.wallet,receipt_id:'another-wallet',nonce:'71'})).rejects.toThrow('routine_budget');
  const h=await setup({weekly:(2n*U).toString()}),hr=(await h.prepare(h.player,h.wallet,h.receipt.receiptId)).reservation;
  await expect(store({...hr,kind:'season-rank',earning_period:0,receipt_id:'closed-rank',nonce:'72'})).rejects.toThrow('routine_cap');
  const rank=await store({...hr,kind:'season-rank',earning_period:0,receipt_id:'smaller-rank',nonce:'73',amount:(U/2n).toString()});
  expect(rank.amount).toBe((U/2n).toString());
});
it('clamps expiry before Monday/season rollover and never refreshes an expired reservation',async()=>{
  const f=await setup();f.s.timestamp=345600+(f.s.week+1)*604800-2;
  f.receipt.finalizedAt=f.s.timestamp-1;
  const r=await f.prepare(f.player,f.wallet,f.receipt.receiptId);expect(r.claim.expiry).toBe(BigInt(f.s.timestamp+1));
  const g=await setup();await g.prepare(g.player,g.wallet,g.receipt.receiptId);g.s.timestamp+=601;
  await expect(g.prepare(g.player,g.wallet,g.receipt.receiptId)).rejects.toThrow('routine_expired');
  await expect(store({...r.reservation,receipt_id:'cross-week',nonce:'81',expiry:Number(r.claim.expiry)+1})).rejects.toThrow('routine_week');
});
it('the reduced chain cap overrides the planned cap across boss plus rank, and contract identity is bound',async()=>{
  const f=await setup();f.s.routineCap=(2n*U).toString();
  const r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  await expect(store({...r,receipt_id:'reduced-rank',kind:'season-rank',earning_period:0,nonce:'101'})).rejects.toThrow('routine_cap');
  const g=await setup();
  await expect(store({...r,receipt_id:'wrong-contract',player_id:g.player,wallet:g.wallet,contract:g.contract,nonce:'102'})).rejects.toThrow('routine_policy');
});
it('requires a Fuji contract snapshot and its real reduced cap before any reservation',async()=>{
  for(const patch of [{chainId:1},{contract:'0x'+'f'.repeat(40)},{blockHash:'bad'},{week:0},{season:10},{epoch:1},{routineCap:'0'}]){
    const f=await setup();Object.assign(f.s,patch);
    await expect(f.prepare(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow(/routine_snapshot|routine_cap/);
    expect((await db.query('select * from chain_reward_reservations where budget_id=$1',[f.receipt.budgetId])).rows).toHaveLength(0);
  }
});
it('cannot admit an unverified entitlement or overstate a policy maximum',async()=>{
  const f=await setup();f.receipt.eligible=false;
  await expect(f.prepare(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow('routine_authority');
  f.receipt.eligible=true;f.receipt.amount=(2n*U).toString();
  await expect(f.prepare(f.player,f.wallet,f.receipt.receiptId)).rejects.toThrow('routine_amount');
});
it('keeps expired and retried promises charged and rolls failed transactions back',async()=>{
  const f=await setup({ceiling:(15n*U/10n).toString()}),r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  const g=await setup();
  await expect(db.transaction(async tx=>{await tx.query('select public.chain_reward_reserve($1::jsonb)',[JSON.stringify({...r,source_id:'missing'})]);})).rejects.toThrow('routine_disabled');
  await expect(store({...r,player_id:g.player,wallet:g.wallet,receipt_id:'reuse-after-expiry',nonce:'99',observed_at:r.observed_at+601,expiry:r.expiry+601})).rejects.toThrow('routine_budget');
  expect((await db.query('select * from chain_reward_reservations where budget_id=$1',[f.receipt.budgetId])).rows).toHaveLength(1);
});
it('duplicate calls return one reservation (PGlite serial execution, not a multi-session lock test)',async()=>{
  const f=await setup(),results=await Promise.all(Array.from({length:12},()=>f.prepare(f.player,f.wallet,f.receipt.receiptId)));
  expect(new Set(results.map(r=>r.reservation.nonce)).size).toBe(1);
});
it('renews only the validity window and retains one original exact liability and nonce',async()=>{
  const f=await setup(),original=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  const later={...original,observed_at:original.observed_at+601,expiry:original.expiry+601};
  const r=await as(db,'service_role',null,()=>renew(later));expect(r).toEqual(later);
  expect(await renew({...later,observed_at:later.observed_at+1,expiry:later.expiry+1})).toEqual(r);
  expect((await db.query('select * from chain_reward_reservations where budget_id=$1',[f.receipt.budgetId])).rows).toEqual([original]);
  const history=(await db.query('select * from chain_reward_renewals where receipt_id=$1',[original.receipt_id])).rows;
  expect(history).toHaveLength(1);expect(history[0]).toEqual({source_id:original.source_id,receipt_id:original.receipt_id,observed_at:later.observed_at,expiry:later.expiry});
  const next={...later,observed_at:later.observed_at+601,expiry:later.expiry+601};
  expect(await renew(next)).toEqual(next);
  expect((await db.query<{n:number}>('select count(*)::int n from chain_reward_renewals where receipt_id=$1',[original.receipt_id])).rows[0]!.n).toBe(2);
});
it('renewal rejects new promises, changed economic terms, cross-week reuse and disabled policies',async()=>{
  const f=await setup(),original=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  const later={...original,observed_at:original.observed_at+601,expiry:original.expiry+601};
  for(const patch of [{amount:'1'},{nonce:'777'},{budget_id:'other'},{season:2},{week:original.week+1},{evidence_hash:'f'.repeat(64)}])
    await expect(renew({...later,...patch})).rejects.toThrow('routine_conflict');
  await expect(renew({...later,receipt_id:'not-reserved'})).rejects.toThrow('routine_unearned');
  await expect(renew({...later,observed_at:345600+(original.week+1)*604800,expiry:345600+(original.week+1)*604800+600})).rejects.toThrow('routine_week');
  for(const patch of [{expiry:later.observed_at+14},{expiry:later.observed_at+601},{observed_at:original.observed_at-1}])
    await expect(renew({...later,...patch})).rejects.toThrow('routine_expired');
  await db.query('update chain_reward_budgets set enabled=false where id=$1',[f.receipt.budgetId]);
  await expect(renew(later)).rejects.toThrow('routine_disabled');
  expect((await db.query('select * from chain_reward_renewals where receipt_id=$1',[original.receipt_id])).rows).toHaveLength(0);
});
it('renewal is service-only; the service cannot edit or erase authorization history',async()=>{
  const f=await setup(),r=(await f.prepare(f.player,f.wallet,f.receipt.receiptId)).reservation;
  for(const role of ['anon','authenticated'] as const){
    await expect(as(db,role,null,()=>renew(r))).rejects.toThrow('permission denied');
    await expect(as(db,role,null,()=>db.query('select * from chain_reward_renewals'))).rejects.toThrow('permission denied');
  }
  for(const statement of ['delete from chain_reward_renewals','update chain_reward_renewals set expiry=expiry+1',
    'insert into chain_reward_renewals select * from chain_reward_renewals'])
    await expect(as(db,'service_role',null,()=>db.query(statement))).rejects.toThrow('permission denied');
  expect(await renew(r)).toEqual(r); // A fresh window is reused without an insert.
  expect((await db.query('select * from chain_reward_renewals where receipt_id=$1',[r.receipt_id])).rows).toHaveLength(0);
});
