import type { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { as, migratedDb } from '../src/game-db.ts';
import { call, fn, newPlayer, rollbackSql, setStacks, stack, v1OnlyDb, v2MigrationSql } from './helpers.ts';
let db: PGlite;
const cutoff = '2026-11-13T07:00:00Z'; // EXAMPLE test clock, never a selected live cut-over.
const example = { fish: 100, catKey: 9, moonPearl: 1 };
const sql = `public.v2_grant_founder_batch($1::timestamptz, $2::jsonb, $3::jsonb, $4)`;
const batch = (contents: unknown = example, limit = 500, cut: string | null = cutoff) => call(db, sql, [cut, JSON.stringify(contents), JSON.stringify(v2.STACK_CAPS_V2), limit]);
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
beforeEach(async () => { await db.exec('delete from public.players'); });
async function players(before: number, after = 0) {
  const ids = [];
  for (let i = 0; i < before + after; i++) {
    const id = await newPlayer(db); ids.push(id);
    await db.query('update public.players set created_at = $2::timestamptz where id = $1', [id, i < before ? '2026-11-12T07:00:00Z' : '2026-11-14T07:00:00Z']);
  }
  return ids;
}
it('grants only eligible players, clamps caps, snapshots founder and reruns without credit', async () => {
  const ids = await players(3, 1);
  expect(await batch()).toEqual({ granted: 3, already: 0, remaining: 0 });
  for (const id of ids.slice(0, 3)) {
    expect(await stack(db, id, 'catKey')).toBe(5); expect(await stack(db, id, 'fish')).toBe(100);
    expect((await fn(db).snapshot(id))!.founder).toBe(true);
  }
  expect((await fn(db).snapshot(ids[3]!))!.founder).toBe(false);
  expect(await batch()).toEqual({ granted: 0, already: 3, remaining: 0 });
  expect(await stack(db, ids[0]!, 'fish')).toBe(100);
});
it('counts an existing grant and orders bounded batches by created_at then id', async () => {
  const ids = await players(5);
  await fn(db).founder(ids[0]!, { fish: 7 });
  expect(await batch(example, 2)).toEqual({ granted: 2, already: 1, remaining: 2 });
  const granted = (await db.query<{ player_id: string }>('select player_id from founder_grants order by player_id')).rows.map(r => r.player_id);
  expect(granted).toEqual(ids.slice(0, 3).sort());
  expect(await stack(db, ids[0]!, 'fish')).toBe(7);
});
it('five players with limit two leave three, one, then zero', async () => {
  await players(5);
  expect(await batch(example, 2)).toMatchObject({ granted: 2, remaining: 3 });
  expect(await batch(example, 2)).toMatchObject({ granted: 2, remaining: 1 });
  expect(await batch(example, 2)).toMatchObject({ granted: 1, remaining: 0 });
});
it('rejects invalid contents and null cutoff atomically', async () => {
  const [id] = await players(1);
  await setStacks(db, id!, { fish: 13 });
  for (const invalid of [{ unknown: 1 }, { fish: -1 }, { catKey: 1.5 }, [], null, { yarn: '1' }, { fish: 1, yarn: -1 }]) {
    expect(await batch(invalid)).toEqual({ error: 'invalid_request' });
    expect((await db.query('select * from founder_grants')).rows).toHaveLength(0);
    expect(await stack(db, id!, 'fish')).toBe(13);
  }
  expect(await batch(example, 500, null)).toEqual({ error: 'invalid_request' });
  expect((await db.query('select * from founder_grants')).rows).toHaveLength(0);
});
it('excludes the exact cutoff and clamps nonpositive limits to one', async () => {
  const ids = await players(3);
  await db.query('update players set created_at = $2::timestamptz where id = $1', [ids[2], cutoff]);
  expect(await batch({}, 0)).toEqual({ granted: 1, already: 0, remaining: 1 });
  expect(await batch({}, -8)).toEqual({ granted: 1, already: 1, remaining: 0 });
  expect((await fn(db).snapshot(ids[2]!))!.founder).toBe(false);
});
it('has one material allowlist equal to STACK_CAPS_V2, with Fish handled as currency', () => {
  const migration = readFileSync(new URL('../../migrations/20261110000000_v2_founder_batch.sql', import.meta.url), 'utf8');
  const keys = [...migration.match(/v_material_keys constant text\[\] := array\[([^\]]+)\]/)![1]!.matchAll(/'([^']+)'/g)].map(m => m[1]!).sort();
  expect(keys).toEqual(Object.keys(v2.STACK_CAPS_V2).sort());
  expect(migration).not.toMatch(/\b(?:create|alter) table\b/i);
});
it('denies anon/authenticated and allows only service_role', async () => {
  await players(1);
  for (const role of ['anon', 'authenticated'] as const) {
    await expect(as(db, role, null, () => db.query('select '+sql, [cutoff, '{}', '{}', 500]))).rejects.toThrow(/permission denied/);
  }
  expect(await batch({})).toMatchObject({ granted: 1 });
});
it('applies V8 plus the additive function and rollback leaves v1 data and routines intact', async () => {
  const d = await v1OnlyDb();
  const listing = async () => (await d.query(`select proname from pg_proc where pronamespace = 'public'::regnamespace order by proname`)).rows;
  const before = await listing();
  const id = await newPlayer(d); await d.query('insert into idle_state(player_id, shards) values ($1, 17)', [id]);
  await d.exec(v2MigrationSql());
  expect((await d.query(`select proname from pg_proc where proname = 'v2_grant_founder_batch'`)).rows).toHaveLength(1);
  await d.exec(rollbackSql()); expect(await listing()).toEqual(before);
  expect((await d.query<{ shards: number }>('select shards from idle_state where player_id = $1', [id])).rows[0]!.shards).toBe(17);
  await d.close();
});

it('normalizes whole JSON numeric spellings without accepting fractional quantities', async () => {
  const [id] = await players(1);
  expect(await call(db, sql, [cutoff, '{"fish":1.0}', '{}', 500])).toMatchObject({ granted: 1 });
  expect(await stack(db, id!, 'fish')).toBe(1);
});
