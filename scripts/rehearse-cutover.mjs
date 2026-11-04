// Local-only cut-over rehearsal. No Supabase client, remote project or credentials.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { loadHarness, startLocalServer } from './local-server.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, 'apps/web');
const times = [];
async function step(name, run) {
  const start = performance.now();
  console.log(`START ${name}`);
  try { const result = await run(); times.push({ step: name, seconds: +((performance.now() - start) / 1000).toFixed(3), status: result === 'NOT AVAILABLE' ? 'N/A' : 'PASS' }); return result; }
  catch (error) { times.push({ step: name, seconds: +((performance.now() - start) / 1000).toFixed(3), status: 'FAIL' }); throw error; }
  finally { console.log(`${times.at(-1).status} ${name}: ${times.at(-1).seconds.toFixed(3)}s`); }
}
let child;
function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    child = spawn(command, args, { cwd: web, stdio: 'inherit', env: { ...process.env, ...env } });
    child.once('error', reject);
    child.once('exit', (code, signal) => { child = undefined; code === 0 ? resolve() : reject(new Error(`${command} exited ${code ?? signal}`)); });
  });
}
async function schema(db) {
  const query = async sql => (await db.query(sql)).rows;
  return {
    tables: await query("select relname, relkind, relrowsecurity, relacl::text from pg_class where relnamespace='public'::regnamespace order by 1"),
    functions: await query("select proname, pg_get_function_identity_arguments(oid) args, pg_get_functiondef(oid) def, proacl::text from pg_proc where pronamespace='public'::regnamespace order by 1,2"),
    columns: await query("select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position"),
    constraints: await query("select conrelid::regclass::text name, conname, pg_get_constraintdef(oid) def from pg_constraint where connamespace='public'::regnamespace order by 1,2"),
    indexes: await query("select tablename,indexname,indexdef from pg_indexes where schemaname='public' order by 1,2"),
    triggers: await query("select tgrelid::regclass::text name,tgname,pg_get_triggerdef(oid) def from pg_trigger where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace='public'::regnamespace) order by 1,2"),
    policies: await query("select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname='public' order by 1,2"),
  };
}
let harness, db, server, before, sentinel;
let migrated = false, rolledBack = false, rollbackApplied = false;
// Later migrations also harden shared nonce/voucher paths. A v2 rollback must
// retain those changes, not restore their obsolete pre-security definitions.
const v2Tables = new Set(['boss_fights', 'boss_clears', 'founder_grants', 'items', 'player_stacks', 'cat_state', 'v2_action_results']);
const sharedBudgetFunctions = new Set(['v2_take_budgets', 'v2_cleanup_budgets']);
const sharedSchema = current => ({
  tables: current.tables.filter(row => !v2Tables.has(row.relname)
    && !current.indexes.some(index => v2Tables.has(index.tablename) && index.indexname === row.relname)),
  functions: current.functions.filter(row => !row.proname.startsWith('v2_') || sharedBudgetFunctions.has(row.proname)),
  columns: current.columns.filter(row => !v2Tables.has(row.table_name)),
  constraints: current.constraints.filter(row => !v2Tables.has(row.name.replace(/^public\./, ''))),
  indexes: current.indexes.filter(row => !v2Tables.has(row.tablename)),
  triggers: current.triggers.filter(row => !v2Tables.has(row.name.replace(/^public\./, ''))),
  policies: current.policies.filter(row => !v2Tables.has(row.tablename)),
});
const started = performance.now();
async function rollback() {
  const manual = resolve(root, 'supabase-manual/v2-rollback.sql');
  if (existsSync(manual)) {
    console.log('Using requested supabase-manual/v2-rollback.sql');
    await db.exec(readFileSync(manual, 'utf8'));
  } else {
    console.log('Requested supabase-manual/v2-rollback.sql is absent; using disposable local integrity + gameplay rollback fixtures that retain shared security.');
    await db.exec(readFileSync(resolve(root, 'docs/proposals/sql/v2-integrity-rollback.sql'), 'utf8'));
    await db.exec(readFileSync(resolve(root, 'scripts/local-cutover-rollback.sql'), 'utf8'));
  }
  rollbackApplied = true;
  assert.deepEqual(await schema(db), before, 'Rollback must preserve the exact current shared schema/functions/grants/policies');
  assert.equal((await db.query("select count(*)::integer n from private.v2_request_budgets")).rows[0].n >= 0, true);
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(harness.as(db, role, null, () => db.query('select * from public.siwe_nonces')), /permission denied/);
    await assert.rejects(harness.as(db, role, null, () => db.query("select public.v2_take_budgets('[]'::jsonb)")), /permission denied/);
  }
  const state = await db.query('select gold, shards from idle_state where player_id=$1', [sentinel]);
  assert.equal(Number(state.rows[0].gold), 123); assert.equal(Number(state.rows[0].shards), 50);
  const v1 = await harness.as(db, 'service_role', null, () => db.query("select public.game_snapshot($1, '2026-10-28', '[]'::jsonb) r", [sentinel]));
  assert.equal(Number(v1.rows[0].r.gold), 123);
  assert.equal(Number(v1.rows[0].r.shards), 50);
  rolledBack = true;
}
try {
  harness = await step('Load local harness', loadHarness);
  await step('Create and restore a v1-only PGlite snapshot', async () => {
    const source = await harness.v1OnlyDb();
    try {
      sentinel = await harness.newPlayer(source);
      await source.query("update players set created_at='2020-01-01Z'::timestamptz where id=$1", [sentinel]);
      await source.query('insert into idle_state (player_id,gold,shards) values ($1,123,50)', [sentinel]);
      const dump = await source.dumpDataDir('none');
      db = await harness.restoreDb(dump);
    } finally { await source.close(); }
    before = await schema(db);
    assert.equal((await db.query("select to_regclass('public.cat_state') name")).rows[0].name, null);
  });
  const migrations = readdirSync(harness.migrationsDir).filter(f => f.endsWith('.sql') && f >= harness.V2_MIGRATION).sort();
  for (const migration of migrations) await step(`Apply ${migration}`, async () => { await db.exec(readFileSync(resolve(harness.migrationsDir, migration), 'utf8')); });
  migrated = true;
  before = sharedSchema(await schema(db));
  assert.ok(before.functions.some(row => row.proname === 'game_voucher_reissue_resolve'), 'Current shared voucher race protection is required');
  assert.ok(before.functions.some(row => row.proname === 'v2_take_budgets'), 'Shared budget RPC must survive gameplay rollback');
  await step('Founder grant dry run when its batch migration exists', async () => {
    const batch = (await db.query("select 1 from pg_proc where pronamespace='public'::regnamespace and proname='v2_grant_founder_batch'")).rows.length > 0;
    if (!batch) { console.log('NOT AVAILABLE: Founder batch migration is not on this main; no draft is imported or applied.'); return 'NOT AVAILABLE'; }
    await db.exec('begin');
    try {
      const atCutoff = await harness.newPlayer(db);
      await db.query("update players set created_at='2021-01-01Z'::timestamptz where id=$1", [atCutoff]);
      const call = async () => (await harness.as(db, 'service_role', null, () => db.query(
        "select public.v2_grant_founder_batch('2021-01-01Z', $1::jsonb, $2::jsonb, 500) r", [JSON.stringify({ yarn: 2, catKey: 1 }), JSON.stringify(harness.localRuntime(db, 'http://localhost').caps)]))).rows[0].r;
      const first = await call(); assert.equal(first.granted, 1); assert.equal(first.remaining, 0);
      const again = await call(); assert.equal(again.granted, 0); assert.equal(again.remaining, 0);
      assert.equal((await db.query('select 1 from founder_grants where player_id=$1', [atCutoff])).rows.length, 0);
    } finally { await db.exec('rollback'); }
  });
  server = await step('Start loopback HTTP on the migrated snapshot', () => startLocalServer({ db, harness }));
  await step('Flip VITE_GAME_V2=1 in an isolated local server build', () => run(process.execPath, ['e2e/support/server-build.mjs', '--build-only']));
  await step('Run v2-server browser journeys on that snapshot', () => run('npx', ['-y', 'pnpm@10.28.0', 'test:e2e', '--project=v2-server', '--workers=1'], { F2_EXTERNAL_SERVER: '1', F2_SERVER_PREBUILT: '1' }));
  await server.close(); server = undefined;
  await step('Rollback local v2 and verify v1 schema plus preserved balance', rollback);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (child) child.kill('SIGTERM');
  if (server) await server.close();
  if (migrated && !rolledBack && !rollbackApplied) {
    try { await step('Rollback after failed journeys', rollback); } catch (error) { console.error(error); process.exitCode = 1; }
  }
  if (db) await db.close();
  if (harness) await harness.close();
  console.table(times);
  console.log(`TOTAL ${((performance.now() - started) / 1000).toFixed(3)}s; ${process.exitCode ? 'FAIL' : 'PASS'} (local only)`);
}
