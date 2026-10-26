import type { PGlite } from "@electric-sql/pglite";
import { v2 } from "@taskbar-hero/game-rules";
import { afterAll, beforeAll, expect, it } from "vitest";
import { withConfigV2 } from "../../../packages/game-rules/src/v2/sim/config.ts";
import { fightBossV2 } from "../../functions/_shared/v2/boss.ts";
import { chooseClassV2, getStateV2, type V2Deps } from "../../functions/_shared/v2/game.ts";
import { migratedDb } from "../src/game-db.ts";
import { pgliteV2Store } from "./v2-store.ts";

let db: PGlite;
const store = pgliteV2Store(() => db);
const deps: V2Deps = { store, seedSecret: "test-seed-secret", now: () => Date.now() };
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });

it("B1 first clear with one key spends keyCost and grants one first-clear key", async () => {
  const p = "00000000-0000-4000-8000-000000ee0001";
  await db.query("insert into players (id, wallet) values ($1, $2)", [p, "0x0000000000000000000000000000000000ee0001"]);
  await getStateV2(deps, p);
  await chooseClassV2(deps, p, { classId: "warrior" });
  const chapter = v2.CHAPTERS[0]!;
  await db.query("update cat_state set round = $2, kills = $3, level = $4 where player_id = $1",
    [p, chapter.roundsPerChapter, chapter.killsPerRound, v2.V2_CONFIG.cat.maxLevel]);
  await db.query("insert into player_stacks (player_id, stack_id, qty) values ($1, 'catKey', 1) on conflict (player_id, stack_id) do update set qty = excluded.qty", [p]);
  let observedAtWrite: number | undefined;
  const using: V2Deps = { ...deps, store: { ...store, bossFight: async args => {
    observedAtWrite = v2.V2_CONFIG.boss.firstClearKeys;
    console.log(`KW1 config at SQL write: firstClearKeys=${observedAtWrite}; first chest catKey=${args.chest.first.stacks.catKey}`);
    return store.bossFight(args);
  } } };
  const result = await withConfigV2({ boss: { firstClearKeys: 1 } }, () => {
    expect(v2.V2_CONFIG.boss.firstClearKeys).toBe(1);
    return fightBossV2(using, p, { chapter: chapter.index });
  });
  expect(result.won).toBe(true);
  expect(result.keySpent).toBe(true);
  expect(observedAtWrite).toBe(1);
  const keys = await db.query<{ qty: number }>("select qty from player_stacks where player_id = $1 and stack_id = 'catKey'", [p]);
  expect(Number(keys.rows[0]?.qty ?? 0)).toBe(1 - v2.V2_CONFIG.boss.keyCost + 1);
});
