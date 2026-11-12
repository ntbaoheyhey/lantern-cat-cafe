import {beforeAll,afterAll,expect,it} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {as,migratedDb} from './game-db.ts';
import {createSourceIngest,type SourceReceipt,type SourceResult} from '../../functions/_shared/chain-source.ts';
import {TRADE_RULES} from '../../../packages/game-rules/src/cardrpg/trade.ts';
let db:PGlite,player:string,other:string;
const wallet='0x'+'1'.repeat(40),otherWallet='0x'+'2'.repeat(40),rules='a'.repeat(64);
const equipment=TRADE_RULES.find(r=>r.kind==='equipment'&&r.tradable)!;
const sql='select public.chain_source_ingest($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) r';
const args=(r:SourceReceipt)=>[r.sourceId,r.receiptId,r.instanceId,r.playerId,r.wallet,r.itemId,r.earnedLevel,r.rulesHash,r.consumptionHash,r.normalizationVersion,r.earnedAt,r.consumedAt];
const store=async(r:SourceReceipt)=>(await db.query<{r:SourceResult}>(sql,args(r))).rows[0]!.r;
const ingest=createSourceIngest({enabled:true,store});
const receipt=(id:string):SourceReceipt=>({sourceId:'campaign-test',receiptId:id,instanceId:'instance-'+id,playerId:player,wallet,
  itemId:equipment.id,earnedLevel:2,rulesHash:rules,consumptionHash:Buffer.from(id.padEnd(32,'_')).toString('hex'),
  normalizationVersion:'depth-min-roll-v1',earnedAt:'2026-01-01T00:00:00Z',consumedAt:'2026-01-02T00:00:00Z'});
beforeAll(async()=>{
 db=await migratedDb();
 player=(await db.query<{r:string}>('select public.upsert_player_by_wallet($1) r',[wallet])).rows[0]!.r;
 other=(await db.query<{r:string}>('select public.upsert_player_by_wallet($1) r',[otherWallet])).rows[0]!.r;
 await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',['campaign-test',rules]);
});
afterAll(async()=>{await db?.close();});
it('defaults to disabled before any store call; a new source policy is also disabled',async()=>{
 let calls=0;const off=createSourceIngest({store:async()=>{calls++;throw new Error('must not run');}});
 await expect(off(receipt('off'))).rejects.toThrow('source_disabled');expect(calls).toBe(0);
 await db.query('insert into chain_source_policies(source_id,rules_hash) values($1,$2)',['disabled-source',rules]);
 await expect(ingest({...receipt('missing'),sourceId:'missing-source'})).rejects.toThrow('source_disabled');
 await expect(ingest({...receipt('disabled'),sourceId:'disabled-source'})).rejects.toThrow('source_disabled');
});
it('browser roles cannot grant, enable, read or mutate receipts; service cannot edit receipt history',async()=>{
 for(const role of ['anon','authenticated'] as const){
  await expect(as(db,role,null,()=>store(receipt('rpc')))).rejects.toThrow('permission denied');
  for(const table of ['chain_source_policies','chain_source_receipts']){
   await expect(as(db,role,null,()=>db.query(`select * from ${table}`))).rejects.toThrow('permission denied');
   await expect(as(db,role,null,()=>db.query(`delete from ${table}`))).rejects.toThrow('permission denied');
  }
  await expect(as(db,role,null,()=>db.query('update chain_source_policies set enabled=true'))).rejects.toThrow('permission denied');
 }
 await expect(as(db,'service_role',null,()=>db.query("update chain_source_receipts set item_id='fake'"))).rejects.toThrow('permission denied');
 const r=await as(db,'service_role',null,()=>ingest(receipt('service')));expect(r.inventory_id).toBeTruthy();
});
it('identical retries preserve one instance and never reset spent inventory, including a rules upgrade',async()=>{
 const r=receipt('retry'),first=await ingest(r);
 expect(await ingest(r)).toEqual(first);
 await db.query("update chain_inventory set state='consumed' where id=$1",[first.inventory_id]);
 await db.query('update chain_source_policies set rules_hash=$1 where source_id=$2',['b'.repeat(64),'campaign-test']);
 expect(await ingest(r)).toEqual(first);
 await expect(ingest(receipt('stale'))).rejects.toThrow('source_rules_changed');
 await db.query('update chain_source_policies set rules_hash=$1 where source_id=$2',[rules,'campaign-test']);
 expect((await db.query<{state:string}>('select state from chain_inventory where id=$1',[first.inventory_id])).rows[0]!.state).toBe('consumed');
});
it('rejects changed retries, cross-wallet or cross-receipt use of an instance and consumption proof',async()=>{
 const r=receipt('unique');await ingest(r);
 for(const patch of [{itemId:TRADE_RULES.find(x=>x.kind==='equipment'&&x.tradable&&x.id!==equipment.id)!.id},
  {earnedLevel:3},{rulesHash:'c'.repeat(64)},{consumedAt:'2026-01-03T00:00:00Z'},
  {playerId:other,wallet:otherWallet}])await expect(ingest({...r,...patch})).rejects.toThrow('source_conflict');
 await expect(ingest({...receipt('second'),instanceId:r.instanceId,playerId:other,wallet:otherWallet})).rejects.toThrow('source_reused');
 await expect(ingest({...receipt('third'),consumptionHash:r.consumptionHash})).rejects.toThrow('source_reused');
 await expect(ingest({...receipt('identity'),playerId:other})).rejects.toThrow('unauthenticated');
});
it('validates catalog, proof, normalization and time before admitting source gear',async()=>{
 for(const itemId of ['star-thread','boss-proof','fish','toString','unknown',TRADE_RULES.find(r=>r.kind==='equipment'&&!r.tradable)!.id])
  await expect(ingest({...receipt('bound'),itemId})).rejects.toThrow('source_bound_item');
 for(const change of [{earnedLevel:1},{receiptId:''},{instanceId:' padded '},{sourceId:'x'},{wallet:'0xBAD'},
  {rulesHash:'not-hash'},{consumptionHash:''},{normalizationVersion:'client-stats'},
  {earnedAt:'bad'},{consumedAt:'2025-01-01T00:00:00Z'}])
  await expect(ingest({...receipt('invalid'),...change} as SourceReceipt)).rejects.toThrow(/source_/);
 await expect(ingest({...receipt('future'),consumedAt:'2100-01-01T00:00:00Z'})).rejects.toThrow('source_future');
 let saved:SourceReceipt|undefined;
 const capture=createSourceIngest({enabled:true,store:async r=>{saved=r;return {inventory_id:'fixture',source_id:r.sourceId,receipt_id:r.receiptId};}});
 await capture({...receipt('whitelist'),clientPower:999,enabled:true} as SourceReceipt);
 expect(saved).not.toHaveProperty('clientPower');expect(saved).not.toHaveProperty('enabled');
});
it('producer consumption and ingestion can roll back together; failed inserts leave no orphan inventory',async()=>{
 const r=receipt('rollback');
 await db.exec('create temporary table source_test_instances(id text primary key, consumed boolean not null default false)');
 await db.query('insert into source_test_instances(id) values($1)',[r.instanceId]);
 await expect(db.transaction(async tx=>{
  await tx.query('update source_test_instances set consumed=true where id=$1',[r.instanceId]);
  await tx.query(sql,args(r));throw new Error('producer_failure');
 })).rejects.toThrow('producer_failure');
 expect((await db.query<{consumed:boolean}>('select consumed from source_test_instances')).rows[0]!.consumed).toBe(false);
 expect((await db.query('select * from chain_source_receipts where receipt_id=$1',[r.receiptId])).rows).toHaveLength(0);
 const before=(await db.query('select id from chain_inventory')).rows.length;
 // Direct trusted caller also receives SQL constraints; the entire function rolls back.
 await expect(store({...r,normalizationVersion:'bad' as SourceReceipt['normalizationVersion']})).rejects.toThrow();
 expect((await db.query('select id from chain_inventory')).rows).toHaveLength(before);
 await db.transaction(async tx=>{
  await tx.query('update source_test_instances set consumed=true where id=$1',[r.instanceId]);await tx.query(sql,args(r));
 });
 expect((await db.query<{consumed:boolean}>('select consumed from source_test_instances')).rows[0]!.consumed).toBe(true);
});
it('repeated submissions cannot mint duplicate inventory (PGlite serial statements, not multi-session lock proof)',async()=>{
 const r=receipt('duplicate');const results=await Promise.all(Array.from({length:12},()=>ingest(r)));
 expect(new Set(results.map(x=>x.inventory_id)).size).toBe(1);
});
