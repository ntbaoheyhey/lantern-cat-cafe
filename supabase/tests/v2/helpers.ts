import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { as } from "../src/game-db.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = join(here, "../../migrations");
export const V2_MIGRATION = "20261101000000_v2_cat_rpg.sql";

export type J = Record<string, any>;

/** A fresh PGlite with the Supabase stubs and the v1 migrations only (all migrations preceding the first v2 migration). */
export async function v1OnlyDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(here, "../sql/bootstrap.sql"), "utf8"));
  for (const f of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql") && f < V2_MIGRATION).sort()) {
    await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
  }
  return db;
}
/** Every additive v2 migration, in order, so rollback/reapply tests cover the complete schema. */
export const v2MigrationSql = () => readdirSync(migrationsDir).filter(f => f.endsWith('.sql') && f >= V2_MIGRATION).sort().map(f => readFileSync(join(migrationsDir, f), 'utf8')).join('\n');
export const rollbackSql = () => readFileSync(join(here, "rollback.sql"), "utf8");

let n = 1;
export async function newPlayer(db: PGlite): Promise<string> {
  const k = n++;
  const id = `00000000-0000-4000-8000-${String(0xd00000 + k).padStart(12, "0")}`;
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [id, "0x" + (0xd00000 + k).toString(16).padStart(40, "0")]);
  return id;
}

export const CAPS = { catKey: 5, yarn: 999999 };

/** Call a SQL function as service_role like the Edge Functions do; returns the jsonb result. */
export async function call(db: PGlite, sql: string, params: unknown[]): Promise<J | null> {
  return as(db, "service_role", null, async () => (await db.query<{ r: J | null }>(`select ${sql} r`, params)).rows[0]!.r);
}
const j = JSON.stringify;

export const fn = (db: PGlite) => ({
  snapshot: (p: string, day = "2026-11-01") => call(db, `public.v2_snapshot($1, $2)`, [p, day]),
  choose: (p: string, cls: string, wt: string, starter: unknown[] = [starterWeapon(wt)]) =>
    call(db, `public.v2_choose_class($1, $2, $3, $4::jsonb)`, [p, cls, wt, j(starter)]),
  claim: (p: string, o: { micros: number; rev: number; now: Date; progress?: J; stacks?: J; items?: unknown[]; bag?: number; day?: string | null }) =>
    call(db, `public.v2_claim($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)`, [
      p, o.micros, o.rev, o.now.toISOString(), j(o.progress ?? {}), j(o.stacks ?? {}), j(CAPS), j(o.items ?? []), o.bag ?? 200, o.day ?? null,
    ]),
  equip: (p: string, item: string | null, slot: string, cls: string | null, wt: string | null, unlocked: string[] = ["weapon", "helmet", "armor", "gloves", "boots"]) =>
    call(db, `public.v2_equip($1, $2, $3, $4, $5, $6::jsonb)`, [p, item, slot, cls, wt, j(unlocked)]),
  boss: (p: string, o: { chapter?: number; rev: number; won: boolean; fightNo: number; keyCost?: number; cooldown?: number; chest?: J; bag?: number; bossRound?: number }) =>
    call(db, `public.v2_boss_fight($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11)`, [
      p, o.chapter ?? 1, o.rev, o.won, o.fightNo, o.keyCost ?? 1, o.cooldown ?? 60, j(o.chest ?? {}), o.bag ?? 200, j(CAPS), o.bossRound ?? 10,
    ]),
  craft: (p: string, cost: J, item: J, bag = 200) => call(db, `public.v2_craft($1, $2::jsonb, $3::jsonb, $4)`, [p, j(cost), j(item), bag]),
  salvage: (p: string, ids: string[], gains: J = { fish: 5 }) => call(db, `public.v2_salvage($1, $2::uuid[], $3::jsonb, $4::jsonb)`, [p, ids, j(gains), j(CAPS)]),
  lock: (p: string, id: string, locked: boolean) => call(db, `public.v2_lock($1, $2, $3)`, [p, id, locked]),
  forge: (p: string, day = "2026-11-01", yarn = 30, pearl = 1) =>
    call(db, `public.v2_relic_forge($1, $2, 7, 'rare', $3, $4, now() + interval '1 hour')`, [p, day, yarn, pearl]),
  founder: (p: string, contents: J = { fish: 100, catKey: 2, moonPearl: 1 }) => call(db, `public.v2_grant_founder($1, $2::jsonb, $3::jsonb)`, [p, j(contents), j(CAPS)]),
});

export function starterWeapon(wt = "sword"): J {
  return { itemKey: `wpn.${wt}.starter`, slot: "weapon", weaponType: wt, rarity: "common", level: 1, salvage: { fish: 1 } };
}
export function item(slot = "helmet", rarity = "common", extra: J = {}): J {
  return { itemKey: `${slot}.test`, slot, rarity, level: 1, bonus: [], salvage: { fish: 2, fluffTuft: 1 }, ...extra };
}
export const manyItems = (n: number, extra: J = {}) => Array.from({ length: n }, () => item("helmet", "common", extra));

export async function setStacks(db: PGlite, p: string, s: J) {
  for (const [k, v] of Object.entries(s)) {
    await db.query(`insert into player_stacks (player_id, stack_id, qty) values ($1, $2, $3) on conflict (player_id, stack_id) do update set qty = excluded.qty`, [p, k, v]);
  }
}
export async function stack(db: PGlite, p: string, k: string): Promise<number> {
  const r = await db.query<{ qty: string }>(`select qty::text from player_stacks where player_id = $1 and stack_id = $2`, [p, k]);
  return r.rows.length ? Number(r.rows[0]!.qty) : 0;
}
export async function count(db: PGlite, sql: string, p: string): Promise<number> {
  return Number((await db.query<{ n: string }>(`select count(*)::text n from (${sql}) t`, [p])).rows[0]!.n);
}
/** Put the cat at the boss of its chapter with keys, ready to fight. */
export async function readyForBoss(db: PGlite, p: string, keys = 1) {
  await fn(db).snapshot(p);
  await db.query(`update cat_state set round = 10 where player_id = $1`, [p]);
  await setStacks(db, p, { catKey: keys });
}
