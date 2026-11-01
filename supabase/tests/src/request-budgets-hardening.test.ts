import type { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { admitPlayer, PLAYER_BUDGETS, type Rpc } from "../../functions/_shared/v2/budgets.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";
import { as, migratedDb } from "./game-db.ts";

let db: PGlite;
beforeAll(async () => { db = await migratedDb(); });
afterAll(async () => { await db.close(); });
// Role transitions and the RPC are one serialized unit on PGlite's single connection.
// The handlers still overlap. This does not prove multi-connection Postgres lock timing.
let tail: Promise<unknown> = Promise.resolve();
let lastRpcError: unknown;
const rpc: Rpc = (name, args) => {
  const result = tail.then(async () => {
    try {
      expect(name).toBe("v2_take_budgets");
      const { rows } = await as(db, "service_role", null, () => db.query<{ r: unknown }>(
        "select public.v2_take_budgets($1::jsonb) r", [JSON.stringify((args as { p_budgets: unknown }).p_budgets)]));
      return { data: rows[0]!.r, error: null };
    } catch (error) { lastRpcError = error; return { data: null, error }; }
  });
  tail = result;
  return result;
};
const post = (player: string) => new Request("https://example.test/v2-craft", { method: "POST", headers: { "x-test-player": player }, body: "{}" });
const http = {
  authenticate: async (req: Request) => req.headers.get("x-test-player")!,
  json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }),
};

it("20 parallel calls admit exactly the route burst, return integer Retry-After >= 1, and do not charge player B", async () => {
  const game = vi.fn(async () => ({ ok: true }));
  const handle = handlerV2(http, game, player => admitPlayer(rpc, "v2-craft", player));
  const results = await Promise.all(Array.from({ length: 20 }, () => handle(post("n2-a"))));
  const burst = PLAYER_BUDGETS["v2-craft"][1];
  expect(results.filter(r => r.status === 200)).toHaveLength(burst);
  expect(results.filter(r => r.status === 429)).toHaveLength(20 - burst);
  expect(game).toHaveBeenCalledTimes(burst);
  for (const response of results.filter(r => r.status === 429)) {
    const retry = response.headers.get("Retry-After");
    expect(retry).toMatch(/^\d+$/);
    expect(Number(retry)).toBeGreaterThanOrEqual(1);
    expect(await response.json()).toEqual({ error: "rate_limited", retryAfter: Number(retry) });
  }
  const buckets = (await db.query<{ bucket: string }>("select bucket from private.v2_request_budgets order by bucket")).rows;
  expect(buckets.map(row => row.bucket)).toEqual(["player:n2-a:all", "player:n2-a:v2-craft"]);
  const other = await Promise.all(Array.from({ length: burst + 1 }, () => handle(post("n2-b"))));
  expect(other.map(r => r.status)).toEqual([...Array<number>(burst).fill(200), 429]);
  expect(game).toHaveBeenCalledTimes(burst * 2);
});

it("a genuinely missing v2_take_budgets RPC returns HTTP 503 and never runs game work", async () => {
  await db.exec("drop function public.v2_take_budgets(jsonb)");
  try {
    const game = vi.fn(async () => ({ ok: true }));
    const handle = handlerV2(http, game, player => admitPlayer(rpc, "v2-craft", player));
    const response = await handle(post("n2-no-rpc"));
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({ error: "server_error", retryAfter: 5 });
    expect(game).not.toHaveBeenCalled();
    expect(lastRpcError).toMatchObject({ code: "42883" });
  } finally {
    await db.exec(readFileSync(new URL("../../migrations/20261104000000_v2_request_budgets.sql", import.meta.url), "utf8"));
  }
});
