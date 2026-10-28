// Local-only adapter: real JWT verification, HTTP handlers, rules, RPCs and SQL.
// Fixtures only establish preconditions; browser mutations never use a mock API.
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { verifySessionToken } from "../../../packages/auth/src/index.ts";
import { GameError } from "../../functions/_shared/game.ts";
import { routesV2 } from "../../functions/_shared/v2/game.ts";
import { handlerV2 } from "../../functions/_shared/v2/http.ts";
import { voucherSigner } from "../../functions/_shared/relic.ts";
import { generatePrivateKey } from "viem/accounts";
import { v2 } from "@taskbar-hero/game-rules";
import { mockV2Save } from "../../../apps/web/src/api/mockV2Fixtures.ts";
import { pgliteV2Store } from "./v2-store.ts";
import { setStacks } from "./helpers.ts";
import type { PGlite } from "@electric-sql/pglite";

export function localRuntime(db: PGlite, origin: string) {
  const secret = randomBytes(48).toString("hex");
  const offsets = new Map<string, number>();
  const store = pgliteV2Store(() => db);
  // Ephemeral signing key and local chain reader: no wallet, RPC or remote fetch.
  const relic = { signer: voucherSigner(generatePrivateKey(), "0x0000000000000000000000000000000000000001"),
    chain: { nonceUsed: async () => false, receipt: async () => null } };
  const now = (player: string) => Date.now() + (offsets.get(player) ?? 0);
  const deps = (player: string) => ({ store, seedSecret: secret, now: () => now(player), relic });
  const json = (req: Request, value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { "Content-Type": "application/json", Vary: "Origin",
      ...(req.headers.get("Origin") === origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
  });
  async function authenticate(req: Request) {
    const token = /^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization") ?? "")?.[1];
    try { if (token) return (await verifySessionToken(token, { jwtSecret: secret })).sub; } catch { /* same fail-closed boundary */ }
    throw new GameError("unauthenticated");
  }
  async function fixture(kind: string) {
    if (!["fresh", "stocked", "strong", "weak", "equip"].includes(kind)) throw new Error("Unknown local fixture");
    const playerId = randomUUID();
    const wallet = `0x${randomBytes(20).toString("hex")}`;
    await db.query("insert into players (id, wallet) values ($1, $2)", [playerId, wallet]);
    await store.snapshot(playerId, new Date().toISOString().slice(0, 10));
    if (kind !== "fresh") {
      const saved = mockV2Save(kind === "strong" || kind === "equip" ? "bossReadyStrong" : kind === "weak" ? "bossReadyWeak" : "forgeRich", { nowMs: Date.now() }).state;
      await db.query(`update cat_state set class_id=$2, level=$3, chapter=$4, round=$5, kills=$6,
        best_stage=$7, last_daily_key_day=$8 where player_id=$1`,
        [playerId, saved.classId, saved.level, saved.chapter, saved.round, saved.kills, saved.bestStage, new Date().toISOString().slice(0, 10)]);
      for (const item of saved.items) {
        await db.query(`insert into items (player_id,item_key,slot,weapon_type,rarity,level,bonus,source,equipped,locked)
          values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)`, [playerId,item.itemKey,item.slot,item.weaponType ?? null,item.rarity,item.level,JSON.stringify(item.bonus),item.source,kind === "equip" ? false : item.equipped,item.locked]);
      }
      await setStacks(db, playerId, { ...saved.stacks, yarn: 500, fish: 5000, moonPearl: 2 });
    }
    const iat = Math.floor(Date.now() / 1000), exp = iat + 86400;
    const encode = (data: object) => Buffer.from(JSON.stringify(data)).toString("base64url");
    const unsigned = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: playerId, aud: "authenticated", role: "authenticated", wallet, iat, exp })}`;
    const token = `${unsigned}.${createHmac("sha256", secret).update(unsigned).digest("base64url")}`;
    await verifySessionToken(token, { jwtSecret: secret });
    return { token, playerId, wallet, expiresAt: exp * 1000 };
  }
  async function handle(name: string, req: Request) {
    // Reuse the production handler and route functions; the storage transport alone differs.
    const route = routesV2(deps("unused"))[name as keyof ReturnType<typeof routesV2>];
    if (!route) return json(req, { error: "not_found" }, 404);
    return handlerV2({ authenticate, json }, (player, body) => routesV2(deps(player))[name as keyof ReturnType<typeof routesV2>](player, body))(req);
  }
  return { fixture, handle, async advance(player: string, seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400) throw new Error("Invalid local clock advance");
    offsets.set(player, (offsets.get(player) ?? 0) + seconds * 1000);
  }, async inspect(player: string) {
    return { raw: await store.snapshot(player, new Date(now(player)).toISOString().slice(0, 10)),
      actions: (await db.query("select route, request_id, result from v2_action_results where player_id=$1", [player])).rows };
  }, caps: v2.STACK_CAPS_V2 };
}
