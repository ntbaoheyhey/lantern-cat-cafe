// True multi-session lock proof on a disposable, network-isolated PostgreSQL.
// No host ports/volumes, credentials, existing containers or remote databases.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const name=`chain-reservation-proof-${process.pid}`;
const postgresImage='postgres:17-alpine@sha256:e5d2edd28b1f8d40a0a6c0c9cdc545b19b56a0d5d88f94bc11a97d970d4700d0';
const docker=args=>execFileSync('docker',args,{encoding:'utf8',timeout:120000});
const sql=text=>new Promise(resolve=>{
  const child=spawn('docker',['exec','-i',name,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'],{stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',c=>stdout+=c);child.stderr.on('data',c=>stderr+=c);
  child.on('error',error=>resolve({code:-1,stdout,stderr:error.message}));
  child.on('close',code=>resolve({code,stdout:stdout.trim(),stderr:stderr.trim()}));child.stdin.end(text);
});
const ok=async text=>{const r=await sql(text);assert.equal(r.code,0,r.stderr);return r.stdout;};
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
let created=false;
try {
  docker(['run','-d','--rm','--network','none','--name',name,'--tmpfs','/var/lib/postgresql/data',
    '-e','POSTGRES_HOST_AUTH_METHOD=trust',postgresImage]);created=true;
  for(let i=0;;i++){
    // The image's temporary initialization server accepts Unix sockets, then
    // shuts down. TCP loopback is ready only on the final post-init server.
    // No host port is published; --network none still permits local loopback.
    try{docker(['exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']);break;}catch{assert(i<100,'Postgres startup deadline');await new Promise(r=>setTimeout(r,100));}
  }
  await ok(readFileSync(resolve(root,'supabase/tests/sql/bootstrap.sql'),'utf8'));
  for(const file of readdirSync(resolve(root,'supabase/migrations')).filter(s=>s.endsWith('.sql')).sort())
    await ok(readFileSync(resolve(root,'supabase/migrations',file),'utf8'));
  const rules='a'.repeat(64),evidence='b'.repeat(64),contract='0x'+'f'.repeat(40),U=10n**18n;
  const wallets=Array.from({length:8},(_,i)=>'0x'+(i+1).toString(16).padStart(40,'0'));
  const players=[];
  for(const wallet of wallets)players.push(await ok(`select public.upsert_player_by_wallet(${quote(wallet)});`));
  await ok(`insert into chain_source_policies(source_id,rules_hash,enabled) values('race-proof',${quote(rules)},true);
    insert into chain_reward_budgets(id,contract,season,source_id,rules_hash,evidence_hash,ceiling,boss_max,rank_max,weekly_cap,enabled)
    values('race-budget',${quote(contract)},1,'race-proof',${quote(rules)},${quote(evidence)},'3000000000000000000','1500000000000000000','1500000000000000000','12000000000000000000',true);`);
  const stamp=1794182400+13*604800+60,week=Math.floor((stamp-345600)/604800);
  const requests=players.map((player,i)=>({source_id:'race-proof',receipt_id:`race-${i}`,player_id:player,wallet:wallets[i],kind:'weekly-boss',
    earning_period:week,rules_hash:rules,evidence_hash:evidence,budget_id:'race-budget',contract,policy_cap:(12n*U).toString(),
    amount:(15n*U/10n).toString(),season:1,week,nonce:String(i+1),expiry:stamp+600,observed_at:stamp}));
  // Holding the transaction open after admission exposes read-then-write races.
  const raced=await Promise.all(requests.map(r=>sql(`begin;set local role service_role;
    select public.chain_reward_reserve(${quote(JSON.stringify(r))}::jsonb);select pg_sleep(0.2);commit;`)));
  assert.equal(raced.filter(r=>r.code===0).length,2);
  assert.equal(raced.filter(r=>r.code!==0&&r.stderr.includes('routine_budget')).length,6);
  const balance=await ok('select sum(amount::numeric)::text from chain_reward_reservations;');assert.equal(BigInt(balance),3n*U);
  const first=requests[raced.findIndex(r=>r.code===0)];
  const renewal={...first,observed_at:first.observed_at+601,expiry:first.expiry+601};
  const renewRace=()=>Promise.all(Array.from({length:8},()=>sql(`begin;set local role service_role;
    select public.chain_reward_renew(${quote(JSON.stringify(renewal))}::jsonb);select pg_sleep(0.1);commit;`)));
  const renewed=await renewRace();assert(renewed.every(r=>r.code===0));
  assert.equal(new Set(renewed.map(r=>r.stdout)).size,1);
  assert.equal(await ok('select count(*) from chain_reward_renewals;'),'1');
  assert.equal(await ok('select sum(amount::numeric)::text from chain_reward_reservations;'),balance);
  const renewalDefinition=await ok("select pg_get_functiondef('public.chain_reward_renew(jsonb)'::regprocedure);");
  await ok('delete from chain_reward_renewals;');
  await ok(renewalDefinition.replace('perform pg_advisory_xact_lock(431150);','null;')
    .replace('insert into public.chain_reward_renewals values','perform pg_sleep(0.5); insert into public.chain_reward_renewals values'));
  const unsafeRenewals=await renewRace();assert(unsafeRenewals.some(r=>r.code!==0),'Missing renewal lock must expose duplicate validity-window inserts');
  await ok(renewalDefinition);await ok('delete from chain_reward_renewals;');
  // Negative control changes ONLY the disposable database. Widen the race window
  // after the checks; without its lock this implementation must oversubscribe.
  await ok('delete from chain_reward_reservations;');
  const definition=await ok("select pg_get_functiondef('public.chain_reward_reserve(jsonb)'::regprocedure);");
  assert(definition.includes('perform pg_advisory_xact_lock(431150);'));
  await ok(definition.replace('perform pg_advisory_xact_lock(431150);','null;')
    .replace('insert into public.chain_reward_reservations select r.*;','perform pg_sleep(1); insert into public.chain_reward_reservations select r.*;'));
  const broken=await Promise.all(requests.map(r=>sql(`begin;set local role service_role;
    select public.chain_reward_reserve(${quote(JSON.stringify(r))}::jsonb);commit;`)));
  assert(broken.filter(r=>r.code===0).length>2,'Negative control did not expose the missing lock');
  assert(BigInt(await ok('select sum(amount::numeric)::text from chain_reward_reservations;'))>3n*U);
  await ok(definition); // restore before the independent source test
  const source=`select public.chain_source_ingest('race-proof','earned-race','instance-race',${quote(players[0])},${quote(wallets[0])},
    'local-source-fixture',2,${quote(rules)},${quote(evidence)},'depth-min-roll-v1','2026-01-01','2026-01-02')->>'inventory_id';`;
  const duplicates=await Promise.all(Array.from({length:8},()=>sql(`begin;set local role service_role;${source}select pg_sleep(0.1);commit;`)));
  assert(duplicates.every(r=>r.code===0),duplicates.map(r=>r.stderr).join('\n'));
  assert.equal(new Set(duplicates.map(r=>r.stdout.trim())).size,1);
  assert.equal(await ok('select count(*) from chain_source_receipts;'),'1');
  assert.equal(await ok('select count(*) from chain_inventory;'),'1');
  // Independent20-YARN judge grants contend for one40-YARN lifetime envelope.
  await ok('delete from chain_reward_reservations; delete from chain_reward_budgets;');
  await ok(`insert into chain_tester_budgets(contract,ceiling,evidence_hash,enabled)
    values(${quote(contract)},'40000000000000000000',${quote(evidence)},true);`);
  for(let i=0;i<players.length;i++)await ok(`insert into chain_judge_passes(wallet,player_id,ip_hash)
    values(${quote(wallets[i])},${quote(players[i])},${quote(evidence)});`);
  const gifts=players.map((player,i)=>({contract,player_id:player,wallet:wallets[i],nonce:String(1000+i),amount:(20n*U).toString(),
    pool_balance:(100n*U).toString(),block:'100',block_hash:'0x'+'c'.repeat(64)}));
  const giftRace=await Promise.all(gifts.map(r=>sql(`begin;set local role service_role;
    select public.chain_tester_reserve(${quote(JSON.stringify(r))}::jsonb);select pg_sleep(0.2);commit;`)));
  assert.equal(giftRace.filter(r=>r.code===0).length,2);
  assert.equal(giftRace.filter(r=>r.code!==0&&r.stderr.includes('tester_budget_exhausted')).length,6);
  assert.equal(BigInt(await ok('select sum(amount::numeric)::text from chain_tester_reservations;')),40n*U);
  const admitted=gifts[giftRace.findIndex(r=>r.code===0)];
  const giftRetries=await Promise.all(Array.from({length:8},()=>sql(`begin;set local role service_role;
    select public.chain_tester_reserve(${quote(JSON.stringify(admitted))}::jsonb);commit;`)));
  assert(giftRetries.every(r=>r.code===0));
  assert.equal(await ok('select count(*) from chain_tester_reservations;'),'2');
  // Remove BOTH protections in this disposable negative control; the row lock
  // independently serializes gifts even if the common advisory lock is absent.
  const giftDefinition=await ok("select pg_get_functiondef('public.chain_tester_reserve(jsonb)'::regprocedure);");
  await ok('delete from chain_tester_reservations;');
  await ok(giftDefinition.replace('perform pg_advisory_xact_lock(431150);','null;')
    .replace('where contract=r.contract for update;','where contract=r.contract;')
    .replace('insert into public.chain_tester_reservations select r.*;','perform pg_sleep(1); insert into public.chain_tester_reservations select r.*;'));
  const giftBroken=await Promise.all(gifts.map(r=>sql(`begin;set local role service_role;
    select public.chain_tester_reserve(${quote(JSON.stringify(r))}::jsonb);commit;`)));
  assert(giftBroken.filter(r=>r.code===0).length>2,'Gift negative control did not expose missing locks');
  assert(BigInt(await ok('select sum(amount::numeric)::text from chain_tester_reservations;'))>40n*U);
  await ok(giftDefinition);
  await ok('delete from chain_tester_reservations;');
  const budgetDefinition=await ok("select pg_get_functiondef('public.chain_reward_budget_register(jsonb)'::regprocedure);");
  const mixed=[...gifts.slice(0,4).map(g=>({fn:'chain_tester_reserve',p:{...g,pool_balance:(40n*U).toString()}})),
    ...Array.from({length:4},(_,i)=>({fn:'chain_reward_budget_register',p:{
      budget:{id:`mixed-${i}`,contract,season:i,source_id:'race-proof',rules_hash:rules,evidence_hash:evidence,
        ceiling:(30n*U).toString(),boss_max:U.toString(),rank_max:U.toString(),weekly_cap:(2n*U).toString()},
      pool_balance:(40n*U).toString(),block:'100',block_hash:'0x'+'c'.repeat(64)}}))];
  const mixedRun=()=>Promise.all(mixed.map(({fn,p})=>sql(`begin;set local role service_role;
    select public.${fn}(${quote(JSON.stringify(p))}::jsonb);select pg_sleep(0.2);commit;`)));
  const total=async()=>BigInt(await ok(`select ((select coalesce(sum(amount::numeric),0) from chain_tester_reservations)+
    (select coalesce(sum(ceiling::numeric),0) from chain_reward_budgets))::text;`));
  const funded=await mixedRun(),committed=await total();
  assert(committed>0n&&committed<=40n*U,'Mixed program commitments exceeded their common pool');
  assert(funded.filter(r=>r.code===0).length>=1);
  assert(funded.filter(r=>r.code!==0).every(r=>/tester_pool_low|tester_budget_exhausted/.test(r.stderr)));
  await ok('delete from chain_tester_reservations;delete from chain_reward_budgets;');
  await ok(giftDefinition.replace('perform pg_advisory_xact_lock(431150);','null;')
    .replace('where contract=r.contract for update;','where contract=r.contract;')
    .replace('insert into public.chain_tester_reservations select r.*;','perform pg_sleep(1); insert into public.chain_tester_reservations select r.*;'));
  await ok(budgetDefinition.replace('perform pg_advisory_xact_lock(431150);','null;')
    .replace('where contract=b.contract for update;','where contract=b.contract;')
    .replace('insert into public.chain_reward_budgets select b.*;','perform pg_sleep(1); insert into public.chain_reward_budgets select b.*;'));
  await mixedRun();assert(await total()>40n*U,'Mixed negative control did not expose missing locks');
  await ok(giftDefinition);await ok(budgetDefinition);
  await ok(`insert into chain_source_policies(source_id,rules_hash,enabled) values('campaign-journal-v1',${quote(rules)},true);`);
  const journalState=JSON.stringify({game:{gear:[],run:null,equipment:{}},origins:{}});
  await ok(`set role service_role;select chain_campaign_boot(${quote(players[0])},${quote(wallets[0])},${quote(rules)},${quote(journalState)});reset role;`);
  const journalCall=i=>`select chain_campaign_commit(${quote(players[0])},${quote(wallets[0])},${quote(rules)},
    'd0000000-0000-4000-8000-${String(i+1).padStart(12,'0')}',${quote(String(i+1).repeat(64))},0,${quote(journalState)},null);`;
  const journalRace=()=>Promise.all(Array.from({length:8},(_,i)=>sql(`begin;set local role service_role;${journalCall(i)}select pg_sleep(0.2);commit;`)));
  const journalGood=await journalRace();
  assert.equal(journalGood.filter(r=>r.code===0).length,1);
  assert.equal(journalGood.filter(r=>r.code!==0&&r.stderr.includes('campaign_stale')).length,7);
  assert.equal(await ok('select revision from chain_campaigns;'),'1');
  const journalDefinition=await ok("select pg_get_functiondef('public.chain_campaign_commit(uuid,text,text,uuid,text,integer,jsonb,text)'::regprocedure);");
  assert(journalDefinition.includes('where player_id=p_player for update;'));
  await ok('delete from chain_campaign_actions;update chain_campaigns set revision=0;');
  await ok(journalDefinition.replace('where player_id=p_player for update;','where player_id=p_player;')
    .replace('if p_export is not null then','perform pg_sleep(1); if p_export is not null then'));
  const journalBroken=await journalRace();
  assert(journalBroken.filter(r=>r.code===0).length>1,'Campaign negative control did not expose stale writes');
  await ok(journalDefinition);
  // A real campaign commit and its result fact are one transaction. These are
  // explicit server-state fixtures for the transaction/close races, not play.
  const beforeBoss=JSON.stringify({game:{run:{id:1,chapter:1,mode:'campaign',complete:false,won:false,current:'boss',nodes:[{id:'boss',kind:'boss'}]}},origins:{}});
  const afterBoss=JSON.stringify({game:{run:{id:1,chapter:1,mode:'campaign',complete:true,won:true,current:null,nodes:[{id:'boss',kind:'boss'}]}},origins:{}});
  await ok(`select chain_campaign_boot(${quote(players[7])},${quote(wallets[7])},${quote(rules)},${quote(beforeBoss)});`);
  const win=i=>`select chain_campaign_commit(${quote(players[7])},${quote(wallets[7])},${quote(rules)},
    'e0000000-0000-4000-8000-${String(i+1).padStart(12,'0')}',${quote(String(i+1).repeat(64))},0,${quote(afterBoss)},null);`;
  await ok(`begin;set local role service_role;${win(0)}rollback;`);
  assert.equal(await ok('select count(*) from chain_campaign_results;'),'0');
  const wins=await Promise.all(Array.from({length:8},(_,i)=>sql(`begin;set local role service_role;${win(i)}select pg_sleep(0.1);commit;`)));
  assert.equal(wins.filter(r=>r.code===0).length,1);
  assert.equal(await ok('select count(*) from chain_campaign_results;'),'1');
  const closeEpoch=Number(await ok('select (345600+floor((extract(epoch from clock_timestamp())-345600)/604800)::bigint*604800-7862400)::text;'));
  await ok(`insert into chain_campaign_reward_programs values(${quote(contract)},${closeEpoch},${quote(rules)},0,0,true);`);
  const closeRace=()=>Promise.all(Array.from({length:8},()=>sql(`begin;set local role service_role;select chain_campaign_close_season(${quote(contract)},0);commit;`)));
  const closes=await closeRace();assert(closes.every(r=>r.code===0));assert.equal(new Set(closes.map(r=>r.stdout)).size,1);
  const closeDefinition=await ok("select pg_get_functiondef('public.chain_campaign_close_season(text,integer)'::regprocedure);");
  await ok('delete from chain_campaign_rank_snapshots;');
  await ok(closeDefinition.replace('perform pg_advisory_xact_lock(431160);','null;')
    .replace('insert into public.chain_campaign_rank_snapshots values','perform pg_sleep(0.5); insert into public.chain_campaign_rank_snapshots values'));
  const unsafeCloses=await closeRace();assert(unsafeCloses.some(r=>r.code!==0),'Missing close lock must expose conflicting snapshot inserts');
  await ok(closeDefinition);
  console.log('PASS: boss evidence rolls back with its campaign; eight competing wins record one fact. Eight season closes return one immutable snapshot; missing-lock negative control exposes conflicting closes.');
  console.log('PASS: eight expired-voucher retries share one append-only validity window and the original nonce/liability. Removing its lock exposes duplicate inserts. No budget is recycled.');
  console.log('PASS: eight campaign sessions propose revision0; one commits and seven fail stale. Removing the state row lock accepts multiple stale transitions.');
  console.log('PASS: four gifts and four new routine budgets contend for one40-YARN pool; total commitments stay within40. Removing shared locks oversubscribes the mixed pool.');
  console.log('PASS: eight concurrent judge requests authorize exactly two20-YARN grants within40; eight retries add zero allocations; missing-lock gift control oversubscribes. No key or signature used.');
  console.log('PASS: PostgreSQL17, eight real sessions contend for3 YARN: exactly two1.5 reservations, six budget denials, total3. Missing-lock negative control oversubscribes as expected. Eight simultaneous source retries all return one inventory ID and one receipt. Disposable container removed; no public signing/deployment.');
} finally {if(created)docker(['rm','-f',name]);}
