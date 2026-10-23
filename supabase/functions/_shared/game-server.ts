// Deno wiring for the B3 Edge Functions: session JWT check, Postgres store (service role,
// RPC to the B3 SQL functions), and error mapping to docs/api.md codes. Logic is in game.ts.
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "../../../packages/auth/src/index.ts";
import { json } from "./auth.ts";
import { GameError, gameHandler, routes, type GameDeps, type GameStore } from "./game.ts";

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

// Same secret lookup as authConfig() in auth.ts (hosted Supabase may refuse SUPABASE_ names).
function jwtSecret(): string {
  const s = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("AUTH_JWT_SECRET");
  if (!s) throw new Error("missing env SUPABASE_JWT_SECRET");
  return s;
}

/** Postgres-backed store using the service role; the SQL functions are service_role only. */
export function pgGameStore(): GameStore {
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    async snapshot(playerId, day, starter) {
      const { data, error } = await db.rpc("game_snapshot", { p_player: playerId, p_day: day, p_starter: starter });
      if (error) throw new Error(`game_snapshot: ${error.message}`);
      return data;
    },
    async claim(a) {
      const { data, error } = await db.rpc("game_claim", {
        p_player: a.playerId,
        p_expected_last_micros: a.expectedLastMicros,
        p_now: a.now,
        p_gold: a.gold,
        p_shards: a.shards,
        p_drops: a.drops,
      });
      if (error) throw new Error(`game_claim: ${error.message}`);
      return data;
    },
    async equip(playerId, gearId) {
      const { data, error } = await db.rpc("game_equip", { p_player: playerId, p_gear_id: gearId });
      if (error) throw new Error(`game_equip: ${error.message}`);
      return data === true;
    },
  };
}

/**
 * GAME_SEED_SECRET keys the claim seed (see claimSeed in game.ts). Falls back to the JWT secret
 * so no extra secret is needed; set it separately to rotate one without the other.
 */
export function gameDeps(): GameDeps {
  return { store: pgGameStore(), seedSecret: Deno.env.get("GAME_SEED_SECRET") || jwtSecret() };
}

/** Player id from `Authorization: Bearer <session JWT>`; the request body never names the player. */
async function authenticate(req: Request): Promise<string> {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!m) throw new GameError("unauthenticated");
  try {
    return (await verifySessionToken(m[1]!, { jwtSecret: jwtSecret() })).sub;
  } catch {
    throw new GameError("unauthenticated");
  }
}

/** Deno.serve handler for one B3 Edge Function. */
export function serveGame(name: keyof ReturnType<typeof routes>): (req: Request) => Promise<Response> {
  return gameHandler({ authenticate, json }, routes(gameDeps())[name]);
}
