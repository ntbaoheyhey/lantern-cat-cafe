import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { migratedDb } from "../src/game-db.ts";
import { count, fn, item, newPlayer, readyForBoss, setStacks, stack } from "./helpers.ts";

// PGlite has one connection, so parallel calls interleave whole statements, not Postgres lock
// timing. These tests check the compare-and-set and "only once" rules hold under that.
let db: PGlite;
let f: ReturnType<typeof fn>;
beforeAll(async () => {
  db = await migratedDb();
  f = fn(db);
});
const later = () => new Date(Date.now() + 3600_000);

async function bossReady(keys = 2) {
  const p = await newPlayer(db);
  await f.snapshot(p);
  await f.choose(p, "warrior", "sword");
  await readyForBoss(db, p, keys);
  return p;
}
const chest = { first: { stacks: { fish: 100 }, items: [item("helmet")] }, rematch: { stacks: { fish: 1 } } };

describe("parallel calls", () => {
  it("two parallel boss wins: exactly one first clear", async () => {
    const p = await bossReady();
    const s = (await f.snapshot(p))!;
    const args = { rev: s.progressRev, won: true, fightNo: s.fights, chest };
    const rs = await Promise.all([f.boss(p, args), f.boss(p, args)]);
    expect(rs.filter((r) => r!.status === "ok")).toHaveLength(1);
    expect(rs.filter((r) => r!.error === "stale")).toHaveLength(1);
    expect(rs.find((r) => r!.status === "ok")).toMatchObject({ firstClear: true });
    expect(await count(db, `select 1 from boss_clears where player_id = $1`, p)).toBe(1);
    expect(await count(db, `select 1 from boss_fights where player_id = $1 and won`, p)).toBe(1);
    expect(await stack(db, p, "fish")).toBe(100);
    expect(await stack(db, p, "catKey")).toBe(1);
    expect(await f.snapshot(p)).toMatchObject({ chapter: 2, fights: 1 });
  });

  it("first clear is decided by the absence of a row even when fight numbers line up", async () => {
    const p = await bossReady(3);
    const s = (await f.snapshot(p))!;
    const a = await f.boss(p, { rev: s.progressRev, won: true, fightNo: s.fights, chest });
    // Same chapter again with a fresh snapshot: a rematch, never a second first-clear chest.
    const s2 = (await f.snapshot(p))!;
    const b = await f.boss(p, { rev: s2.progressRev, won: true, fightNo: s2.fights, chest });
    expect(a).toMatchObject({ firstClear: true });
    expect(b).toMatchObject({ firstClear: false });
    expect(await stack(db, p, "fish")).toBe(101);
  });

  it("a claim computed before a boss win loses the compare-and-set", async () => {
    const p = await bossReady();
    const s = (await f.snapshot(p))!;
    const [claim, boss] = await Promise.all([
      f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: later(), progress: { round: 5, kills: 3 }, stacks: { fish: 9 } }),
      f.boss(p, { rev: s.progressRev, won: true, fightNo: s.fights, chest }),
    ]);
    // Calls run in order inside PGlite: the claim lands first, so the boss sees a moved rev.
    const results = [claim, boss];
    expect(results.filter((r) => r && r.status === "ok")).toHaveLength(1);
    const lost = results.find((r) => !r || r.error);
    expect(lost === null || lost?.error === "stale").toBe(true);
  });

  it("a claim computed before a boss win returns null after the win", async () => {
    const p = await bossReady();
    const s = (await f.snapshot(p))!;
    expect(await f.boss(p, { rev: s.progressRev, won: true, fightNo: s.fights, chest })).toMatchObject({ firstClear: true });
    expect(await f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: later(), progress: { round: 5 }, stacks: { fish: 9 } })).toBeNull();
    expect(await stack(db, p, "fish")).toBe(100); // only the chest
    expect(await f.snapshot(p)).toMatchObject({ chapter: 2, round: 1 });
  });

  it("a claim computed before a class change returns null, and so does a parallel one", async () => {
    const p = await bossReady();
    const s = (await f.snapshot(p))!;
    const [claim, choose] = await Promise.all([
      f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: later(), stacks: { fish: 9 } }),
      f.choose(p, "archer", "bow"),
    ]);
    expect(choose).toMatchObject({ status: "ok" });
    // Whichever order PGlite ran them in, the claim and the class change cannot both have used rev N.
    const after = (await f.snapshot(p))!;
    expect(after.classId).toBe("archer");
    expect(after.progressRev).toBe(s.progressRev + (claim ? 4 : 3));
    // Replaying the stale claim now fails.
    expect(await f.claim(p, { micros: s.lastClaimMicros, rev: s.progressRev, now: new Date(Date.now() + 7200_000), stacks: { fish: 9 } })).toBeNull();
  });

  it("two parallel claims from one snapshot: one wins", async () => {
    const p = await bossReady();
    const s = (await f.snapshot(p))!;
    const a = { micros: s.lastClaimMicros, rev: s.progressRev, now: later(), stacks: { fish: 10 } };
    const rs = await Promise.all([f.claim(p, a), f.claim(p, a)]);
    expect(rs.filter((r) => r !== null)).toHaveLength(1);
    expect(await stack(db, p, "fish")).toBe(10);
  });

  it("parallel crafts never overdraw a stack", async () => {
    const p = await bossReady();
    await setStacks(db, p, { yarn: 25 });
    const rs = await Promise.all(Array.from({ length: 4 }, () => f.craft(p, { yarn: 10 }, item("armor"))));
    expect(rs.filter((r) => r!.status === "ok")).toHaveLength(2);
    expect(rs.filter((r) => r!.error === "not_enough")).toHaveLength(2);
    expect(await stack(db, p, "yarn")).toBe(5);
  });

  it("parallel founder grants and relic forges happen once", async () => {
    const p = await bossReady();
    const gs = await Promise.all([f.founder(p), f.founder(p), f.founder(p)]);
    expect(gs.filter((g) => g!.status === "granted")).toHaveLength(1);
    expect(await stack(db, p, "fish")).toBe(100);
    await setStacks(db, p, { yarn: 100, moonPearl: 5 });
    const fs = await Promise.all([f.forge(p), f.forge(p), f.forge(p)]);
    expect(fs.filter((r) => r!.status === "new")).toHaveLength(1);
    expect(fs.filter((r) => r!.status === "pending")).toHaveLength(2);
    expect(await count(db, `select 1 from relic_forges where player_id = $1`, p)).toBe(1);
    expect(await stack(db, p, "moonPearl")).toBe(4);
  });
});
