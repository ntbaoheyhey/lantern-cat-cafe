// Deno wiring for the game Edge Functions: session JWT check, Postgres store (service role,
// RPC to the game SQL functions), and error mapping to docs/api.md codes. Logic is in game.ts.
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "../../../packages/auth/src/index.ts";
import { json } from "./auth.ts";
import { GameError, gameHandler, routes, type GameDeps, type GameStore, type RelicDeps } from "./game.ts";
import { fujiReader, voucherSigner } from "./relic.ts";
import fuji from "../../../packages/chain/deployments/43113.json" with { type: "json" };

const DEFAULT_FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

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
    async bossFight(a) {
      const { data, error } = await db.rpc("game_boss_fight", {
        p_player: a.playerId,
        p_day: a.day,
        p_boss_level: a.bossLevel,
        p_won: a.won,
        p_max_attempts: a.maxAttempts,
        p_max_level: a.maxLevel,
      });
      if (error) throw new Error(`game_boss_fight: ${error.message}`);
      return data;
    },
    async forge(a) {
      const { data, error } = await db.rpc("game_forge", {
        p_player: a.playerId,
        p_day: a.day,
        p_relic_id: a.relicId,
        p_rarity: a.rarity,
        p_shard_cost: a.shardCost,
        p_key_cost: a.keyCost,
        p_expires_at: a.expiresAt,
      });
      if (error) throw new Error(`game_forge: ${error.message}`);
      return data;
    },
    async voucherSign(playerId, nonce, signature) {
      const { data, error } = await db.rpc("game_voucher_sign", { p_player: playerId, p_nonce: nonce, p_signature: signature });
      if (error) throw new Error(`game_voucher_sign: ${error.message}`);
      return data === true;
    },
    async voucherReissue(playerId, nonce, now, expiresAt) {
      const { data, error } = await db.rpc("game_voucher_reissue", {
        p_player: playerId,
        p_nonce: nonce,
        p_now: now,
        p_expires_at: expiresAt,
      });
      if (error) throw new Error(`game_voucher_reissue: ${error.message}`);
      return data;
    },
    async voucher(playerId, nonce) {
      const { data, error } = await db.rpc("game_voucher", { p_player: playerId, p_nonce: nonce });
      if (error) throw new Error(`game_voucher: ${error.message}`);
      return data;
    },
    async voucherMinted(playerId, nonce, txHash) {
      const { data, error } = await db.rpc("game_voucher_minted", { p_player: playerId, p_nonce: nonce, p_tx_hash: txHash });
      if (error) throw new Error(`game_voucher_minted: ${error.message}`);
      return data === true;
    },
  };
}

/**
 * RelicNFT from packages/chain/deployments/43113.json; the signer only when
 * VOUCHER_SIGNER_PRIVATE_KEY is set (relic-forge then answers server_error). The key is never
 * logged: a malformed value is reported by name only.
 */
function relicDeps(): RelicDeps {
  const nft = fuji.RelicNFT as `0x${string}`;
  const key = Deno.env.get("VOUCHER_SIGNER_PRIVATE_KEY");
  let signer: RelicDeps["signer"];
  if (key) {
    try {
      signer = voucherSigner(key.trim(), nft);
    } catch {
      console.error("VOUCHER_SIGNER_PRIVATE_KEY is malformed; relic forge disabled");
    }
  }
  return { nft, signer, chain: fujiReader(Deno.env.get("FUJI_RPC_URL") || DEFAULT_FUJI_RPC, nft) };
}

/**
 * GAME_SEED_SECRET keys the claim seed (see claimSeed in game.ts). Falls back to the JWT secret
 * so no extra secret is needed; set it separately to rotate one without the other.
 */
export function gameDeps(): GameDeps {
  return { store: pgGameStore(), seedSecret: Deno.env.get("GAME_SEED_SECRET") || jwtSecret(), relic: relicDeps() };
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

/** Deno.serve handler for one game Edge Function. */
export function serveGame(name: keyof ReturnType<typeof routes>): (req: Request) => Promise<Response> {
  return gameHandler({ authenticate, json }, routes(gameDeps())[name]);
}
