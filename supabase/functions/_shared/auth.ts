// Shared wiring for the auth-* Edge Functions (Deno). The logic lives in packages/auth and is
// imported by relative path; `jose`, `viem` and `@supabase/supabase-js` resolve through each
// function's deno.json import map (npm: specifiers, same versions as packages/auth).
import { createClient } from "@supabase/supabase-js";
import { AuthError, type AuthConfig, type AuthStore } from "../../../packages/auth/src/index.ts";

export { AuthError, issueNonce, verifySignIn } from "../../../packages/auth/src/index.ts";

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

/** Postgres-backed store using the service role (bypasses RLS; siwe_nonces is server-only). */
export function pgStore(): AuthStore {
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    async createNonce(nonce) {
      const { error } = await db.from("siwe_nonces").insert({ nonce });
      if (error) throw new Error(`createNonce: ${error.message}`);
    },
    async consumeNonce(nonce) {
      // Single atomic UPDATE ... WHERE used_at IS NULL AND created_at > now() - 10 min RETURNING
      // (see supabase/migrations/20260102000000_siwe_auth.sql).
      const { data, error } = await db.rpc("consume_siwe_nonce", { p_nonce: nonce });
      if (error) throw new Error(`consumeNonce: ${error.message}`);
      return data === true;
    },
    async upsertPlayerByWallet(wallet) {
      const { data, error } = await db.rpc("upsert_player_by_wallet", { p_wallet: wallet });
      if (error || typeof data !== "string") throw new Error(`upsertPlayer: ${error?.message ?? "no id"}`);
      return { id: data };
    },
  };
}

export function authConfig(): AuthConfig {
  // Hosted Supabase reserves the SUPABASE_ prefix for secrets it sets itself; if
  // `supabase secrets set SUPABASE_JWT_SECRET=...` is refused, set AUTH_JWT_SECRET instead.
  const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET") || Deno.env.get("AUTH_JWT_SECRET");
  if (!jwtSecret) throw new Error("missing env SUPABASE_JWT_SECRET");
  return { domain: env("SIWE_DOMAIN"), jwtSecret };
}

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("SIWE_ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

/** Wrap a POST handler: CORS preflight, method check, AuthError -> 4xx, anything else -> 500. */
export function handler(fn: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof AuthError) return json({ error: e.code }, e.code === "invalid_request" ? 400 : 401);
      console.error(e);
      return json({ error: "internal_error" }, 500);
    }
  };
}
