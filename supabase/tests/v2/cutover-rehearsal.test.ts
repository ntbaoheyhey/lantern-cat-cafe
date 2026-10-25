import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { call, fn, newPlayer, rollbackSql, setStacks, stack, v1OnlyDb, v2MigrationSql } from './helpers.ts';

it('rehearses v1 preservation, all v2 migrations, parameterized Founder batches and rollback in PGlite', async () => {
  const timings: Record<string, number> = {};
  const step = async <T>(name: string, action: () => Promise<T>) => {
    const start = performance.now();
    try { return await action(); } finally { timings[name] = Math.round((performance.now() - start) * 100) / 100; }
  };
  const db = await step('v1 bootstrap migrations (ms)', v1OnlyDb);
  try {
    // Synthetic rehearsal parameters only. D8 and the real cut-over timestamp remain undecided.
    const cutoff = '2030-01-01T00:00:00Z';
    const contents = { fish: 100, catKey: 2, moonPearl: 1 }; // EXAMPLE, not an approved Founder bundle.
    const ids: string[] = [];
    await step('create v1 fixtures (ms)', async () => {
      for (let i = 0; i < 6; i++) {
        const id = await newPlayer(db); ids.push(id);
        await db.query('update players set created_at = $2::timestamptz where id = $1', [id, i < 5 ? '2029-12-31T00:00:00Z' : '2030-01-02T00:00:00Z']);
        await db.query('insert into idle_state(player_id, shards) values ($1, $2)', [id, 10 + i]);
      }
    });
    const listing = async () => ({
      tables: (await db.query(`select table_name, table_type from information_schema.tables where table_schema = 'public' order by 1,2`)).rows,
      routines: (await db.query(`select proname, pg_get_function_identity_arguments(oid) args, prosecdef, proconfig::text, proacl::text from pg_proc where pronamespace = 'public'::regnamespace order by 1,2`)).rows,
      v1: (await db.query(`select p.id, p.wallet, p.created_at, i.shards from players p join idle_state i on i.player_id = p.id order by p.id`)).rows,
    });
    const before = await listing();
    await step('apply V8 and additive Founder migration (ms)', () => db.exec(v2MigrationSql()));
    await setStacks(db, ids[0]!, { catKey: 4 });
    const batch = () => call(db, `public.v2_grant_founder_batch($1::timestamptz, $2::jsonb, $3::jsonb, $4)`,
      [cutoff, JSON.stringify(contents), JSON.stringify(v2.STACK_CAPS_V2), 2]);
    const remaining: number[] = [];
    let outstanding = 1, granted = 0, calls = 0;
    while (outstanding > 0 && calls < 4) {
      const result = await step(`Founder batch ${calls + 1} (ms)`, batch);
      expect(result).not.toHaveProperty('error');
      expect(result!.already).toBe(calls * 2);
      granted += result!.granted;
      outstanding = result!.remaining; remaining.push(outstanding); calls++;
    }
    expect(remaining).toEqual([3, 1, 0]); expect(granted).toBe(5); expect(calls).toBe(3);
    await step('verify Founder snapshots and caps (ms)', async () => {
      for (const id of ids.slice(0, 5)) {
        const snapshot = (await fn(db).snapshot(id))!;
        expect(snapshot.founder).toBe(true); expect(snapshot.stacks.fish).toBe(contents.fish); expect(snapshot.stacks.moonPearl).toBe(1);
        expect(snapshot.stacks.catKey).toBe(id === ids[0] ? v2.STACK_CAPS_V2.catKey : contents.catKey);
      }
      expect((await fn(db).snapshot(ids[5]!))!.founder).toBe(false);
    });
    await step('rerun is idempotent (ms)', async () => {
      expect(await batch()).toEqual({ granted: 0, already: 5, remaining: 0 });
      expect(await stack(db, ids[0]!, 'fish')).toBe(contents.fish);
    });
    await step('rollback v2 and verify v1 intact (ms)', async () => {
      await db.exec(rollbackSql()); expect(await listing()).toEqual(before);
      expect((await db.query(`select proname from pg_proc where pronamespace = 'public'::regnamespace and proname like 'v2\\_%'`)).rows).toEqual([]);
    });
  } finally {
    await db.close();
    if (process.env.CUTOVER_REHEARSAL_LOG) writeFileSync(process.env.CUTOVER_REHEARSAL_LOG, JSON.stringify(timings, null, 2));
  }
});
