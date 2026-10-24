import type { PGlite } from "@electric-sql/pglite";
import { ENDPOINTS, ERROR_CODES, HTTP_STATUS } from "@taskbar-hero/api-contract";
import { CONFIG, relicIdFor } from "@taskbar-hero/game-rules";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { routes } from "../../functions/_shared/game.ts";
import { migratedDb } from "./game-db.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const deployWorkflowPath = join(repoRoot, ".github/workflows/deploy-functions.yml");
const functionsDir = join(here, "../../functions");
const publicRelicsDir = join(repoRoot, "apps/web/public/relics");
const supabaseGameApiPath = join(repoRoot, "apps/web/src/api/SupabaseGameApi.ts");

const TEST_PLAYER_ID = "00000000-0000-4000-8000-000000000001";
const TEST_WALLET = "0x" + "1".repeat(40);

let db: PGlite;

interface ConstraintRow {
  conname: string;
  table_name: string;
  def: string;
}

beforeAll(async () => {
  db = await migratedDb();
  // Base test player for check constraint enforcement tests
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [TEST_PLAYER_ID, TEST_WALLET]);
  await db.query(`insert into idle_state (player_id, gold) values ($1, 0)`, [TEST_PLAYER_ID]);
});

/** Helper to extract string array literals from a Postgres CHECK definition like:
 *  CHECK ((col = ANY (ARRAY['a'::text, 'b'::text])))
 */
function extractTextArrayFromCheck(def: string): string[] {
  return [...def.matchAll(/'([^']+)'::text/g)].map((m) => m[1]!);
}

describe("R1 consistency: 1. SQL CHECK rarity/slot lists == CONFIG", () => {
  it("gear.rarity, relic_forges.rarity and relic_vouchers.rarity check constraints match CONFIG.rarities", async () => {
    const res = await db.query<ConstraintRow>(`
      select c.conname, c.conrelid::regclass::text as table_name, pg_get_constraintdef(c.oid) as def
      from pg_constraint c
      where c.contype = 'c' and c.conrelid::regclass::text in ('gear', 'relic_forges', 'relic_vouchers')
    `);

    const rarityConstraints = res.rows.filter(
      (r) => r.def.includes("rarity = ANY") || r.def.includes("rarity in") || r.conname.includes("rarity"),
    );

    expect(rarityConstraints.length).toBeGreaterThanOrEqual(3);

    const tablesChecked = new Set<string>();
    for (const constraint of rarityConstraints) {
      const allowed = extractTextArrayFromCheck(constraint.def);
      expect(allowed, `${constraint.table_name} rarity check constraint`).toEqual([...CONFIG.rarities]);
      tablesChecked.add(constraint.table_name);
    }

    expect(tablesChecked.has("gear")).toBe(true);
    expect(tablesChecked.has("relic_forges")).toBe(true);
    expect(tablesChecked.has("relic_vouchers")).toBe(true);
  });

  it("gear.slot check constraint matches CONFIG.slots", async () => {
    const res = await db.query<ConstraintRow>(`
      select c.conname, c.conrelid::regclass::text as table_name, pg_get_constraintdef(c.oid) as def
      from pg_constraint c
      where c.contype = 'c' and c.conrelid::regclass::text = 'gear'
    `);

    const slotConstraint = res.rows.find(
      (r) => r.def.includes("slot = ANY") || r.def.includes("slot in") || r.conname.includes("slot"),
    );
    expect(slotConstraint).toBeDefined();

    const allowed = extractTextArrayFromCheck(slotConstraint!.def);
    expect(allowed, "gear slot check constraint").toEqual([...CONFIG.slots]);
  });

  it("all database columns named 'rarity' and 'slot' in public schema have check constraints", async () => {
    const colRes = await db.query<{ table_name: string; column_name: string }>(`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public' and column_name in ('rarity', 'slot')
      order by table_name, column_name
    `);

    // Expected tables with rarity: gear, relic_forges, relic_vouchers; slot: gear
    expect(colRes.rows).toEqual([
      { table_name: "gear", column_name: "rarity" },
      { table_name: "gear", column_name: "slot" },
      { table_name: "relic_forges", column_name: "rarity" },
      { table_name: "relic_vouchers", column_name: "rarity" },
    ]);
  });

  it("rejects invalid rarity or slot on insertion / allows all valid CONFIG rarities and slots", async () => {
    // Valid slots and rarities can be inserted
    for (const slot of CONFIG.slots) {
      await db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, $2, $3, $4, 1, 10)`,
        [TEST_PLAYER_ID, `test:${slot}`, slot, "common"],
      );
    }
    for (const rarity of CONFIG.rarities) {
      await db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, $2, $3, $4, 1, 10)`,
        [TEST_PLAYER_ID, `test:${rarity}`, "weapon", rarity],
      );
    }

    // Invalid slot rejected
    await expect(
      db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'bad:slot', 'invalid_slot', 'common', 1, 10)`,
        [TEST_PLAYER_ID],
      ),
    ).rejects.toThrow(/check constraint/i);

    // Invalid rarity rejected for gear
    await expect(
      db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'bad:rarity', 'weapon', 'mythic', 1, 10)`,
        [TEST_PLAYER_ID],
      ),
    ).rejects.toThrow(/check constraint/i);

    // Invalid rarity rejected for relic_forges
    await expect(
      db.query(
        `insert into relic_forges (player_id, day, relic_id, rarity) values ($1, '2026-05-01', 1, 'invalid_rarity')`,
        [TEST_PLAYER_ID],
      ),
    ).rejects.toThrow(/check constraint/i);

    // Invalid rarity rejected for relic_vouchers
    await expect(
      db.query(
        `insert into relic_vouchers (player_id, relic_id, rarity, expires_at) values ($1, 1, 'invalid_rarity', now() + interval '1 hour')`,
        [TEST_PLAYER_ID],
      ),
    ).rejects.toThrow(/check constraint/i);
  });
});

describe("R1 consistency: 2. SQL level bounds == gear.maxLevel/boss.maxLevel", () => {
  it("gear.level check bounds match [1, CONFIG.gear.maxLevel]", async () => {
    const res = await db.query<ConstraintRow>(`
      select c.conname, c.conrelid::regclass::text as table_name, pg_get_constraintdef(c.oid) as def
      from pg_constraint c
      where c.contype = 'c' and c.conrelid::regclass::text = 'gear' and c.conname = 'gear_level_check'
    `);
    expect(res.rows.length).toBe(1);
    const def = res.rows[0]!.def;

    const minMatch = def.match(/level\s*>=\s*(\d+)/);
    const maxMatch = def.match(/level\s*<=\s*(\d+)/);
    expect(minMatch).not.toBeNull();
    expect(maxMatch).not.toBeNull();

    expect(Number(minMatch![1])).toBe(1);
    expect(Number(maxMatch![1])).toBe(CONFIG.gear.maxLevel);
  });

  it("idle_state.boss_level check bounds match [1, CONFIG.boss.maxLevel]", async () => {
    const res = await db.query<ConstraintRow>(`
      select c.conname, c.conrelid::regclass::text as table_name, pg_get_constraintdef(c.oid) as def
      from pg_constraint c
      where c.contype = 'c' and c.conrelid::regclass::text = 'idle_state' and c.conname = 'idle_state_boss_level_check'
    `);
    expect(res.rows.length).toBe(1);
    const def = res.rows[0]!.def;

    const minMatch = def.match(/boss_level\s*>=\s*(\d+)/);
    const maxMatch = def.match(/boss_level\s*<=\s*(\d+)/);
    expect(minMatch).not.toBeNull();
    expect(maxMatch).not.toBeNull();

    expect(Number(minMatch![1])).toBe(1);
    expect(Number(maxMatch![1])).toBe(CONFIG.boss.maxLevel);
  });

  it("enforces level bounds at runtime for gear and boss_level", async () => {
    // gear level valid bounds: 1 and maxLevel
    await db.query(
      `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'bound:min', 'weapon', 'common', 1, 10)`,
      [TEST_PLAYER_ID],
    );
    await db.query(
      `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'bound:max', 'weapon', 'common', $2, 10)`,
      [TEST_PLAYER_ID, CONFIG.gear.maxLevel],
    );

    // gear level invalid: 0 and maxLevel + 1
    await expect(
      db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'bound:zero', 'weapon', 'common', 0, 10)`,
        [TEST_PLAYER_ID],
      ),
    ).rejects.toThrow(/check constraint/i);
    await expect(
      db.query(
        `insert into gear (player_id, item_key, slot, rarity, level, power) values ($1, 'bound:over', 'weapon', 'common', $2, 10)`,
        [TEST_PLAYER_ID, CONFIG.gear.maxLevel + 1],
      ),
    ).rejects.toThrow(/check constraint/i);

    // idle_state boss_level valid bounds: 1 and maxLevel
    await db.query(`update idle_state set boss_level = 1 where player_id = $1`, [TEST_PLAYER_ID]);
    await db.query(`update idle_state set boss_level = $2 where player_id = $1`, [
      TEST_PLAYER_ID,
      CONFIG.boss.maxLevel,
    ]);

    // idle_state boss_level invalid: 0 and maxLevel + 1
    await expect(
      db.query(`update idle_state set boss_level = 0 where player_id = $1`, [TEST_PLAYER_ID]),
    ).rejects.toThrow(/check constraint/i);
    await expect(
      db.query(`update idle_state set boss_level = $2 where player_id = $1`, [
        TEST_PLAYER_ID,
        CONFIG.boss.maxLevel + 1,
      ]),
    ).rejects.toThrow(/check constraint/i);
  });
});

describe("R1 consistency: 3. public/relics/{id}.json + 64-hex copies exist and match", () => {
  const relicIds = CONFIG.rarities.map((r) => relicIdFor(r));

  it("every relic id from CONFIG rarities has decimal and 64-hex json metadata files that match exactly", () => {
    expect(relicIds.length).toBeGreaterThan(0);

    for (const id of relicIds) {
      const decFileName = `${id}.json`;
      const hexFileName = `${id.toString(16).padStart(64, "0")}.json`;

      const decPath = join(publicRelicsDir, decFileName);
      const hexPath = join(publicRelicsDir, hexFileName);

      expect(existsSync(decPath), `${decFileName} exists in public/relics`).toBe(true);
      expect(existsSync(hexPath), `${hexFileName} exists in public/relics`).toBe(true);

      const decContent = readFileSync(decPath, "utf8");
      const hexContent = readFileSync(hexPath, "utf8");

      // Verify raw file content is identical
      expect(hexContent).toBe(decContent);

      // Verify JSON parses properly
      const decJson = JSON.parse(decContent);
      const hexJson = JSON.parse(hexContent);
      expect(hexJson).toEqual(decJson);
      expect(decJson.name).toBeTruthy();
      expect(decJson.image).toBeTruthy();
    }
  });

  it("public/relics/ directory contains only known relic decimal and 64-hex json files", () => {
    const allJsonFiles = readdirSync(publicRelicsDir).filter((f) => f.endsWith(".json"));
    const expectedFiles = new Set<string>();

    for (const id of relicIds) {
      expectedFiles.add(`${id}.json`);
      expectedFiles.add(`${id.toString(16).padStart(64, "0")}.json`);
    }

    expect(new Set(allJsonFiles)).toEqual(expectedFiles);
  });
});

describe("R1 consistency: 4. deploy-functions.yml FUNCTIONS == function folders", () => {
  it("deploy-functions.yml FUNCTIONS matches existing supabase/functions folders", () => {
    expect(existsSync(deployWorkflowPath)).toBe(true);
    const deployContent = readFileSync(deployWorkflowPath, "utf8");

    // Match FUNCTIONS: fn1 fn2 ...
    const match = deployContent.match(/FUNCTIONS:\s*([^\n]+)/);
    expect(match).not.toBeNull();

    const ymlFunctions = match![1]!.trim().split(/\s+/).filter(Boolean).sort();

    // Read function folders in supabase/functions (excluding _shared and any non-directories)
    const folderFunctions = readdirSync(functionsDir)
      .filter((name) => !name.startsWith("_") && statSync(join(functionsDir, name)).isDirectory())
      .sort();

    expect(ymlFunctions).toEqual(folderFunctions);
    expect(ymlFunctions.length).toBeGreaterThan(0);
  });
});

describe("R1 consistency: 5. routes() keys have folders", () => {
  it("every key returned by routes() corresponds to an existing Edge Function folder with index.ts", () => {
    // Calling routes({} as any) produces the dictionary of endpoints
    const r = routes({} as any);
    const routeKeys = Object.keys(r);

    expect(routeKeys.length).toBeGreaterThan(0);

    for (const key of routeKeys) {
      const folder = join(functionsDir, key);
      expect(existsSync(folder), `folder supabase/functions/${key} must exist`).toBe(true);
      expect(statSync(folder).isDirectory(), `${folder} must be a directory`).toBe(true);
      expect(existsSync(join(folder, "index.ts")), `index.ts in supabase/functions/${key} must exist`).toBe(true);
    }
  });
});

describe("R1 consistency: 6. error codes and endpoints are defined once in packages/api-contract", () => {
  it("HTTP_STATUS covers exactly ERROR_CODES, with no duplicate codes", () => {
    expect(ERROR_CODES.length).toBeGreaterThan(0);
    expect(new Set(ERROR_CODES).size).toBe(ERROR_CODES.length);
    expect(Object.keys(HTTP_STATUS)).toEqual([...ERROR_CODES]);
  });

  it("SupabaseGameApi takes its codes from the contract instead of keeping a copy", () => {
    expect(existsSync(supabaseGameApiPath)).toBe(true);
    const src = readFileSync(supabaseGameApiPath, "utf8");
    expect(src).toContain("isGameApiErrorCode");
    expect(src).not.toMatch(/\bCODES\b/);
    expect(src).not.toMatch(/'unauthenticated'\s*,\s*'not_owner'/);
  });

  it("ENDPOINTS matches the routes() keys and the deployed function list", () => {
    expect(Object.keys(routes({} as any)).sort()).toEqual([...ENDPOINTS].sort());
    const deployContent = readFileSync(deployWorkflowPath, "utf8");
    const deployed = (deployContent.match(/FUNCTIONS:\s*([^\n]+)/)?.[1] ?? "").trim().split(/\s+/);
    for (const name of ENDPOINTS) expect(deployed, `${name} must be deployed`).toContain(name);
  });
});
