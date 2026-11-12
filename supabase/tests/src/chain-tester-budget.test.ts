import {beforeAll,afterAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {getAddress,recoverTypedDataAddress,type Address} from 'viem';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {as,migratedDb} from './game-db.ts';
import {createTesterBudgetReservation,type TesterReservation,type TesterPoolSnapshot} from '../../functions/_shared/chain-tester-budget.ts';
import {createTesterReward,claimDomain,TESTER_CLAIM_TYPES,testerBudgetRequired} from '../../functions/_shared/chain-rewards.ts';
let db:PGlite,serial=0;
const U=10n**18n,stamp=1794492000,hash='0x'+'a'.repeat(64),proof='b'.repeat(64);
const store=async(row:TesterReservation&{pool_balance:string;block:string;block_hash:string})=>
  (await db.query<{r:TesterReservation}>('select public.chain_tester_reserve($1::jsonb) r',[JSON.stringify(row)])).rows[0]!.r;
beforeAll(async()=>{db=await migratedDb();});afterAll(async()=>{await db?.close();});
async function actor(){
  const wallet=getAddress('0x'+(++serial).toString(16).padStart(40,'0'));
  const player=(await db.query<{r:string}>('select public.upsert_player_by_wallet($1) r',[wallet.toLowerCase()])).rows[0]!.r;
  await db.query('insert into chain_judge_passes(player_id,wallet,ip_hash) values($1,$2,$3)',[player,wallet.toLowerCase(),proof]);
  return {player,wallet};
}
async function setup({enabled=true,ceiling=40n*U,pool=100n*U,protectedYarn=0n}={}){
  const a=await actor(),contract=getAddress('0x'+(10000+serial).toString(16).padStart(40,'0'));
  await db.query('insert into chain_tester_budgets(contract,ceiling,protected_yarn,evidence_hash,enabled) values($1,$2,$3,$4,$5)',
    [contract.toLowerCase(),ceiling.toString(),protectedYarn.toString(),proof,enabled]);
  const snapshot:TesterPoolSnapshot={chainId:43113,contract,block:5n,blockHash:hash,timestamp:BigInt(stamp),balance:pool};
  const request={...a,contract,nonce:BigInt(serial),amount:20n*U};
  const reserve=createTesterBudgetReservation({contract,snapshot:async()=>snapshot,reserve:store,now:()=>stamp*1000});
  return {...a,contract,snapshot,request,reserve};
}
it('requires an explicitly enabled budget before authorizing a gift',async()=>{
  const f=await setup({enabled:false});await expect(f.reserve(f.request)).rejects.toThrow('tester_budget_unavailable');
  expect((await db.query('select * from chain_tester_reservations')).rows).toHaveLength(0);
});
it('campaign activation cannot bypass the common grant ledger when the separate tester flag is omitted',async()=>{
  const f=await setup({enabled:false});
  const required=testerBudgetRequired(undefined,'1');expect(required).toBe(true);
  const key=generatePrivateKey();
  const deps={key,contract:f.contract,eligible:async()=>true,season:async()=>0n,nonceUsed:async()=>false,
    reservationRequired:required,now:()=>stamp*1000};
  expect(()=>createTesterReward({...deps,key:'0x'})).toThrow('tester_budget_unavailable');
  const reward=createTesterReward({...deps,reserve:f.reserve});
  await expect(reward(f.player,f.wallet)).rejects.toThrow('tester_budget_unavailable');
  expect((await db.query('select * from chain_tester_reservations where contract=$1',[f.contract.toLowerCase()])).rows).toHaveLength(0);
  expect(testerBudgetRequired('1','0')).toBe(true);
  expect(testerBudgetRequired('0','0')).toBe(false);
});
it('two20 grants exhaust40; retries retain one exact nonce and cannot spend the ceiling again',async()=>{
  const f=await setup(),g=await actor(),h=await actor();
  await f.reserve(f.request);await f.reserve(f.request);
  await f.reserve({...f.request,...g,nonce:1001n});
  await expect(f.reserve({...f.request,...h,nonce:1002n})).rejects.toThrow('tester_budget_exhausted');
  expect((await db.query('select * from chain_tester_reservations where contract=$1',[f.contract.toLowerCase()])).rows).toHaveLength(2);
});
it('protects pre-ledger promises and treats paid/expired reservations conservatively',async()=>{
  const f=await setup({pool:50n*U,protectedYarn:20n*U});await f.reserve(f.request);
  const g=await actor();await expect(f.reserve({...f.request,...g,nonce:1011n})).rejects.toThrow('tester_pool_low');
  f.snapshot.balance=0n;await expect(f.reserve(f.request)).resolves.toBeUndefined();
  await expect(f.reserve({...f.request,...g,nonce:1011n})).rejects.toThrow('tester_pool_low');
});
it('preserves every configured routine ceiling, including disabled/paid budgets',async()=>{
  const f=await setup({pool:40n*U});
  await db.query('insert into chain_source_policies(source_id,rules_hash) values($1,$2)',['gift-routine',proof]);
  await db.query(`insert into chain_reward_budgets(id,contract,season,source_id,rules_hash,evidence_hash,ceiling,boss_max,rank_max,weekly_cap)
    values('gift-routine',$1,0,'gift-routine',$2,$2,$3,'0','0','0')`,[f.contract.toLowerCase(),proof,(25n*U).toString()]);
  await expect(f.reserve(f.request)).rejects.toThrow('tester_pool_low');
});
it('checks live player and judge identity, fixed20 amount, nonce and contract on changed retries',async()=>{
  const f=await setup();await f.reserve(f.request);
  await expect(f.reserve({...f.request,amount:U})).rejects.toThrow('tester_budget_conflict');
  await expect(f.reserve({...f.request,nonce:1999n})).rejects.toThrow('tester_budget_conflict');
  await expect(f.reserve({...f.request,contract:('0x'+'f'.repeat(40)) as Address})).rejects.toThrow('tester_budget_conflict');
  const g=await actor();await expect(f.reserve({...f.request,player:g.player})).rejects.toThrow('no_judge_pass');
  await db.query('delete from chain_judge_passes where player_id=$1',[g.player]);
  await expect(f.reserve({...f.request,...g,nonce:1003n})).rejects.toThrow('no_judge_pass');
});
it('fails before storage for a foreign, stale, future or malformed funding snapshot',async()=>{
  const f=await setup();let calls=0;
  for(const patch of [{chainId:1},{contract:('0x'+'f'.repeat(40)) as Address},{block:-1n},{blockHash:'bad'},
    {timestamp:BigInt(stamp-61)},{timestamp:BigInt(stamp+1)},{balance:-1n},{balance:1_000_000_001n*U}]){
    const reserve=createTesterBudgetReservation({contract:f.contract,snapshot:async()=>({...f.snapshot,...patch}),
      reserve:async r=>{calls++;return r;},now:()=>stamp*1000});
    await expect(reserve(f.request)).rejects.toThrow('tester_budget_snapshot');
  }
  expect(calls).toBe(0);
});
it('rejects earlier snapshots and conflicting same-block hashes for new promises',async()=>{
  const f=await setup(),g=await actor();await f.reserve(f.request);
  f.snapshot.block=4n;await expect(f.reserve({...f.request,...g,nonce:1004n})).rejects.toThrow('tester_budget_snapshot');
  f.snapshot.block=5n;f.snapshot.blockHash='0x'+'c'.repeat(64);
  await expect(f.reserve({...f.request,...g,nonce:1004n})).rejects.toThrow('tester_budget_snapshot');
});
it('checks the stored reservation identity before allowing signing',async()=>{
  const f=await setup();
  for(const patch of [{wallet:'0x'+'f'.repeat(40)},{amount:'1'},{nonce:'999'},{player_id:'wrong'}]){
    const reserve=createTesterBudgetReservation({contract:f.contract,snapshot:async()=>f.snapshot,reserve:async r=>({...r,...patch}),now:()=>stamp*1000});
    await expect(reserve(f.request)).rejects.toThrow('tester_budget_conflict');
  }
});
it('denies browser writes/reads; service cannot rewrite ceilings or remove charged promises',async()=>{
  const f=await setup(),row={contract:f.contract.toLowerCase(),player_id:f.player,wallet:f.wallet.toLowerCase(),amount:(20n*U).toString(),nonce:String(f.request.nonce),pool_balance:(100n*U).toString(),block:'5',block_hash:hash};
  for(const role of ['anon','authenticated'] as const){
    await expect(as(db,role,null,()=>store(row))).rejects.toThrow('permission denied');
    for(const t of ['chain_tester_budgets','chain_tester_reservations'])
      await expect(as(db,role,null,()=>db.query(`select * from ${t}`))).rejects.toThrow('permission denied');
  }
  await expect(as(db,'service_role',null,()=>db.query("update chain_tester_budgets set ceiling='999'"))).rejects.toThrow('permission denied');
  await expect(as(db,'service_role',null,()=>db.query('delete from chain_tester_reservations'))).rejects.toThrow('permission denied');
  await expect(as(db,'service_role',null,()=>store(row))).resolves.toMatchObject({amount:row.amount});
});
it('signs only after a successful reservation and renews the same charged entitlement',async()=>{
  const f=await setup({ceiling:20n*U}),key=generatePrivateKey();let now=stamp*1000,season=0n,used=false;
  const reserve=createTesterBudgetReservation({contract:f.contract,snapshot:async()=>({...f.snapshot,timestamp:BigInt(Math.floor(now/1000))}),reserve:store,now:()=>now});
  const reward=createTesterReward({key,contract:f.contract,eligible:async()=>true,season:async()=>season,nonceUsed:async()=>used,reserve,now:()=>now});
  const first=await reward(f.player,f.wallet);
  expect(await recoverTypedDataAddress({domain:claimDomain(f.contract),types:TESTER_CLAIM_TYPES,primaryType:'TesterClaim',message:first.claim,signature:first.signature as `0x${string}`})).toBe(privateKeyToAccount(key).address);
  now+=601000;season=1n;const renewed=await reward(f.player,f.wallet);
  expect(renewed.claim.nonce).toBe(first.claim.nonce);expect(renewed.claim.expiry).toBeGreaterThan(first.claim.expiry);
  expect((await db.query('select * from chain_tester_reservations where contract=$1',[f.contract.toLowerCase()])).rows).toHaveLength(1);
  const g=await actor();await expect(reward(g.player,g.wallet)).rejects.toThrow('tester_budget_exhausted');
  used=true;await db.query('update chain_tester_budgets set enabled=false where contract=$1',[f.contract.toLowerCase()]);
  expect((await reward(f.player,f.wallet)).signature).toBe('0x');
});
