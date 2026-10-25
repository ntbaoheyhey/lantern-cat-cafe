// Deno-only wiring; all game logic remains in game.ts.
import { createClient } from "@supabase/supabase-js";
import { verifySessionToken } from "../../../../packages/auth/src/index.ts";
import fuji from "../../../../packages/chain/deployments/43113.json" with { type: "json" };
import { json } from "../auth.ts";
import { GameError } from "../game.ts";
import { voucherSigner, type VoucherSigner } from "../relic.ts";
import { routesV2, type V2Deps, type V2Store } from "./game.ts";
import { handlerV2 } from "./http.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing env ${name}`);
  return value;
}
function jwtSecret(): string {
  const secret = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("AUTH_JWT_SECRET");
  if (!secret) throw new Error("missing env SUPABASE_JWT_SECRET");
  return secret;
}

export function pgV2Store(): V2Store {
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  const rpc = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error(`${name}: ${error.message}`);
    return data;
  };
  return {
    snapshot: (playerId, day) => rpc("v2_snapshot", { p_player: playerId, p_day: day }),
    chooseClass: (playerId, classId, weaponType, starter) => rpc("v2_choose_class", { p_player: playerId, p_class_id: classId, p_weapon_type: weaponType, p_starter: starter }),
    claim: a => rpc("v2_claim", { p_player: a.playerId, p_expected_last_micros: a.expectedLastMicros, p_expected_rev: a.expectedRev,
      p_now: a.nowIso, p_progress: a.progress, p_stack_deltas: a.stackDeltas, p_caps: a.caps, p_items: a.items, p_bag_limit: a.bagLimit, p_daily_key_day: a.dailyKeyDay }),
    equip: (playerId, itemId, slot, expectedClass, weaponType, unlocked) => rpc("v2_equip", { p_player: playerId, p_item_id: itemId, p_slot: slot,
      p_expected_class: expectedClass, p_weapon_type: weaponType, p_unlocked: unlocked }),
    async voucherSign(playerId, nonce, signature) {
      await rpc("game_voucher_sign", { p_player: playerId, p_nonce: nonce, p_signature: signature });
    },
  };
}

export function v2Deps(): V2Deps {
  const key = Deno.env.get("VOUCHER_SIGNER_PRIVATE_KEY");
  let signer: VoucherSigner | undefined;
  if (key) {
    try { signer = voucherSigner(key.trim(), fuji.RelicNFT as `0x${string}`); }
    catch { console.error("VOUCHER_SIGNER_PRIVATE_KEY is malformed; relic forge disabled"); }
  }
  return { store: pgV2Store(), seedSecret: Deno.env.get("GAME_SEED_SECRET") || jwtSecret(), relic: { signer } };
}

async function authenticate(req: Request): Promise<string> {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization") ?? "");
  if (!m) throw new GameError("unauthenticated");
  try {
    return (await verifySessionToken(m[1]!, { jwtSecret: jwtSecret() })).sub;
  } catch {
    throw new GameError("unauthenticated");
  }
}

export function serveV2(name: keyof ReturnType<typeof routesV2>): (req: Request) => Promise<Response> {
  return handlerV2({ authenticate, json }, routesV2(v2Deps())[name]);
}
