/** QA-6: execute the existing operator SQL only against disposable in-memory databases. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/campaign-policy-check-${attempt}.json`);
const isolated=resolve(root,`work/v4ship-prep/campaign-policy-check-${attempt}`);
assert(!existsSync(output)&&!existsSync(isolated)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const require=createRequire(resolve(root,'supabase/tests/package.json'));
const {PGlite}=require('@electric-sql/pglite');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['tools/chain/prepare-v3-demo.mjs','packages/chain/deployments/43113.json','supabase/functions/_shared/chain-campaign-manifest.ts'];
for(const path of paths){mkdirSync(dirname(resolve(isolated,path)),{recursive:true});writeFileSync(resolve(isolated,path),readFileSync(resolve(root,path)));}
const message=execFileSync('node',[resolve(isolated,paths[0]),'--pool-wei=2000000000000000000000'],{encoding:'utf8'});
assert(message.includes('no SQL was executed'));
const sql=readFileSync(resolve(isolated,'work/v3-shell/activate-demo.sql'),'utf8');
const current=readFileSync(resolve(root,paths[2]),'utf8').match(/CAMPAIGN_RULES_HASH='([0-9a-f]{64})'/)[1];
const prior=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S11/campaign-manifest-comparison-1.json'))).manifestBefore;
const report={at:new Date().toISOString(),harnessSha256:sha(readFileSync(import.meta.filename)),current,prior,sqlSha256:sha(sql),inputs:paths.map(path=>({path,sha256:sha(readFileSync(resolve(root,path)))})),rows:[],complete:false,scope:'Three disposable in-memory PGlite databases; no linked Supabase, RPC, signing or live data. Existing SQL tested without rewriting it.'};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
async function database(){
 const db=new PGlite();await db.exec(readFileSync(resolve(root,'supabase/tests/sql/bootstrap.sql'),'utf8'));
 for(const name of readdirSync(resolve(root,'supabase/migrations')).filter(name=>name.endsWith('.sql')).sort())await db.exec(readFileSync(resolve(root,'supabase/migrations',name),'utf8'));
 return db;
}
async function snapshot(db){
 const result={};for(const table of ['chain_source_policies','chain_campaigns','chain_v3_budget','chain_tester_budgets'])result[table]=(await db.query(`select * from public.${table} order by 1`)).rows;
 return JSON.stringify(result);
}
try{
 // A correct binary alone must not silently authorize an old source policy.
 let db=await database();
 try{
  const wallet='0x'+'7'.repeat(40),player=(await db.query('select upsert_player_by_wallet($1) id',[wallet])).rows[0].id;
  await db.query("insert into chain_source_policies values('campaign-journal-v1',$1,true)",[prior]);
  await assert.rejects(()=>db.query('select chain_campaign_boot($1,$2,$3,$4)',[player,wallet,current,'{}']),/campaign_disabled/);
  await db.exec(sql);
  const policy=(await db.query("select rules_hash,enabled from chain_source_policies where source_id='campaign-journal-v1'")).rows[0];
  assert.deepEqual(policy,{rules_hash:current,enabled:true});
  const boot=(await db.query('select chain_campaign_boot($1,$2,$3,$4) r',[player,wallet,current,'{}'])).rows[0].r;assert.equal(boot.rules_hash,current);
  const once=await snapshot(db);await db.exec(sql);assert.equal(await snapshot(db),once);
  report.rows.push({case:'manifest-only-vs-explicit-policy',manifestOnlyRejected:true,explicitCurrentPolicy:true,newJournalWorks:true,repeatPreservesState:true});save();
 }finally{await db.close();}
 // An existing old journal aborts before policy/budget/player mutation.
 db=await database();
 try{
  const wallet='0x'+'8'.repeat(40),player=(await db.query('select upsert_player_by_wallet($1) id',[wallet])).rows[0].id;
  await db.query("insert into chain_source_policies values('campaign-journal-v1',$1,true)",[prior]);
  await db.query('insert into chain_campaigns(player_id,wallet,rules_hash,state) values($1,$2,$3,$4)',[player,wallet,prior,JSON.stringify({marker:'preserve-existing-campaign'})]);
  const before=await snapshot(db);
  await assert.rejects(()=>db.exec(sql),/Existing campaigns require a reviewed rules migration; no player was reset/);await db.exec('rollback');
  assert.equal(await snapshot(db),before);
  report.rows.push({case:'stale-journal',migrationRejected:true,playerPolicyBudgetUnchanged:true,snapshotSha256:sha(before)});save();
 }finally{await db.close();}
 // First-time activation follows the same transaction, without a seeded policy.
 db=await database();
 try{
  await db.exec(sql);const policy=(await db.query("select rules_hash,enabled from chain_source_policies where source_id='campaign-journal-v1'")).rows[0];assert.deepEqual(policy,{rules_hash:current,enabled:true});
  report.rows.push({case:'fresh-policy',currentPolicyCreated:true});save();
 }finally{await db.close();}
 report.complete=true;
}catch(error){report.failure=error.message;throw error;}finally{save();}
console.log(JSON.stringify({output,complete:report.complete,cases:report.rows}));
