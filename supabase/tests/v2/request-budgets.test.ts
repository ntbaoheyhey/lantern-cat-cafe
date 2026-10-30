import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { admitPlayer, PLAYER_BUDGETS, playerBudgets, reserve, type Rpc } from "../../functions/_shared/v2/budgets.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";
import { as, migratedDb } from "../src/game-db.ts";

let db: PGlite;
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
const rpc: Rpc = async (name, args) => {
  try {
    const { rows } = await db.query<{ r: unknown }>(`select public.${name}($1::jsonb) r`, [JSON.stringify((args as { p_budgets: unknown }).p_budgets)]);
    return { data: rows[0]!.r, error: null };
  } catch (e) { return { data: null, error: e }; }
};
const json = (_req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const post = () => new Request("https://example.test/v2-craft", { method: "POST", body: "{}" });

describe("v2 request budget migration", () => {
  it("admits only the burst, refuses the rest with retryAfter, and keeps players separate", async () => {
    const budgets = [{ key: "player:a:route", perMinute: 6, burst: 2 }];
    const rs = await Promise.all(Array.from({ length: 5 }, () => rpc("v2_take_budgets", { p_budgets: budgets })));
    const data = rs.map(r => r.data as { allowed: boolean; retryAfter?: number });
    expect(data.filter(d => d.allowed)).toHaveLength(2);
    for (const d of data.filter(d => !d.allowed)) expect(d.retryAfter).toBeGreaterThanOrEqual(1);
    expect((await rpc("v2_take_budgets", { p_budgets: [{ key: "player:b:route", perMinute: 6, burst: 2 }] })).data).toEqual({ allowed: true });
  });
  it("rejects malformed budget input", async () => {
    for (const bad of [[], "x", [{ key: "", perMinute: 1, burst: 1 }], [{ key: "k", perMinute: 0, burst: 1 }], [{ key: "k", perMinute: 1, burst: 5000 }],
      Array.from({ length: 5 }, (_, i) => ({ key: `k${i}`, perMinute: 1, burst: 1 }))]) {
      expect((await rpc("v2_take_budgets", { p_budgets: bad })).error).toBeTruthy();
    }
  });
  it("is closed to anon and authenticated, open to service_role, and hides the table", async () => {
    for (const role of ["anon", "authenticated"] as const) {
      await expect(as(db, role, null, () => db.query("select public.v2_take_budgets('[]'::jsonb)"))).rejects.toThrow(/permission denied/);
      await expect(as(db, role, null, () => db.query("select public.v2_cleanup_budgets()"))).rejects.toThrow(/permission denied/);
      await expect(as(db, role, null, () => db.query("select * from private.v2_request_budgets"))).rejects.toThrow(/permission denied/);
    }
    expect((await as(db, "service_role", null, () => db.query("select public.v2_take_budgets('[{\"key\":\"svc\",\"perMinute\":1,\"burst\":1}]'::jsonb) r"))).rows).toHaveLength(1);
  });
  it("cleans expired buckets only", async () => {
    await db.exec("insert into private.v2_request_budgets values ('old', now(), now() - interval '1 hour'), ('fresh', now(), now() + interval '1 hour')");
    await db.exec("select public.v2_cleanup_budgets()");
    const left = (await db.query<{ bucket: string }>("select bucket from private.v2_request_budgets where bucket in ('old','fresh')")).rows;
    expect(left).toEqual([{ bucket: "fresh" }]);
  });
  it("is idempotent when applied twice", async () => {
    const { readFileSync } = await import("node:fs");
    const sql = readFileSync(new URL("../../migrations/20261104000000_v2_request_budgets.sql", import.meta.url), "utf8");
    await db.exec(sql);
    await db.exec(sql);
  });
});

describe("budget keys and fail-closed wrapper", () => {
  it("builds keys only from the player and the fixed route table", () => {
    expect(playerBudgets("v2-craft", "p1")).toEqual([
      { key: "player:p1:all", perMinute: 120, burst: 20 }, { key: "player:p1:v2-craft", perMinute: 10, burst: 2 }]);
    expect(Object.keys(PLAYER_BUDGETS)).toHaveLength(9);
  });
  it.each([
    ["rpc error", async () => ({ data: null, error: { message: "down" } })],
    ["rpc throws", async () => { throw new Error("net"); }],
    ["malformed data", async () => ({ data: { nope: 1 }, error: null })],
    ["null data", async () => ({ data: null, error: null })],
  ] as [string, Rpc][])("fails closed with 503 on %s", async (_n, bad) => {
    expect(await reserve(bad, [{ key: "k", perMinute: 1, burst: 1 }])).toEqual({ status: 503, error: "server_error", retryAfter: 5 });
  });
  it("maps a denial to 429", async () => {
    expect(await reserve(async () => ({ data: { allowed: false, retryAfter: 7 }, error: null }), [])).toEqual({ status: 429, error: "rate_limited", retryAfter: 7 });
  });
});

describe("handlerV2 admission", () => {
  it("returns 429 with Retry-After and does no game work once the budget is spent", async () => {
    const fn = vi.fn(async () => ({ ok: true }));
    const handle = handlerV2({ authenticate: async () => "p-limit", json }, fn, player => admitPlayer(rpc, "v2-relic-forge", player));
    expect((await handle(post())).status).toBe(200);
    const res = await handle(post());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(res.headers.get("Access-Control-Expose-Headers")).toContain("Retry-After");
    const body = await res.json() as Record<string, unknown>;
    expect(body).toMatchObject({ error: "rate_limited" });
    expect(Object.keys(body).sort()).toEqual(["error", "retryAfter"]);
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("returns 503 and does no game work when the counter store is down", async () => {
    const fn = vi.fn(async () => ({ ok: true }));
    const down: Rpc = async () => { throw new Error("db down"); };
    const handle = handlerV2({ authenticate: async () => "p", json }, fn, player => admitPlayer(down, "v2-state", player));
    const res = await handle(post());
    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("5");
    expect(fn).not.toHaveBeenCalled();
  });
  it("does not charge unauthenticated requests or OPTIONS to any player", async () => {
    const admit = vi.fn(async () => null);
    const handle = handlerV2({ authenticate: async () => { throw new Error("x"); }, json }, async () => ({}), admit);
    await handle(post());
    await handle(new Request("https://example.test/x", { method: "OPTIONS" }));
    expect(admit).not.toHaveBeenCalled();
  });
});
