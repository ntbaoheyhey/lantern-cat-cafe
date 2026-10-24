import type { PGlite } from "@electric-sql/pglite";
import { createSiweMessage } from "viem/siwe";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { FUJI_CHAIN_ID, MAX_MESSAGE_LENGTH, verifySessionToken } from "../../../packages/auth/src/index.ts";
import { as, migratedDb } from "./game-db.ts";

// The real auth-nonce and auth-verify entry points (index.ts), imported with Deno.serve captured
// and @supabase/supabase-js replaced by a client whose rpc() runs the migrated SQL functions in
// PGlite as service_role. So the real handler wrapper, CORS, pgStore, authConfig and
// packages/auth run end to end; only the network hop to Supabase is replaced.

const SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";
const DOMAIN = "taskbarhero.test";
const ORIGIN = "https://app.taskbarhero.test";

let db: PGlite;
const rpcLog: string[] = [];

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcLog.push(fn);
      const keys = Object.keys(args);
      const sql = `select public.${fn}(${keys.map((_, i) => `$${i + 1}`).join(", ")}) r`;
      try {
        const r = await as(db, "service_role", null, () => db.query<{ r: unknown }>(sql, keys.map((k) => args[k])));
        return { data: r.rows[0]!.r, error: null };
      } catch (e) {
        return { data: null, error: { message: (e as Error).message } };
      }
    },
  }),
}));

type Serve = (req: Request) => Promise<Response>;
let nonceEndpoint: Serve;
let verifyEndpoint: Serve;

async function load(importIndex: () => Promise<unknown>): Promise<Serve> {
  let served: Serve | undefined;
  (globalThis as Record<string, unknown>).Deno = {
    env: {
      get: (k: string) =>
        ({ SUPABASE_URL: "http://db.local", SUPABASE_SERVICE_ROLE_KEY: "x", SUPABASE_JWT_SECRET: SECRET, SIWE_DOMAIN: DOMAIN, SIWE_ALLOWED_ORIGIN: ORIGIN })[k],
    },
    serve: (h: Serve) => {
      served = h;
    },
  };
  await importIndex();
  return served!;
}

beforeAll(async () => {
  db = await migratedDb();
  nonceEndpoint = await load(() => import("../../functions/auth-nonce/index.ts"));
  verifyEndpoint = await load(() => import("../../functions/auth-verify/index.ts"));
});

const post = (url: string, body?: string, headers: Record<string, string> = {}) =>
  new Request(`http://local/${url}`, { method: "POST", body, headers: { Origin: ORIGIN, ...headers } });
const getNonce = async () => ((await (await nonceEndpoint(post("auth-nonce"))).json()) as { nonce: string }).nonce;

const account = privateKeyToAccount(generatePrivateKey());
async function signed(o: { nonce?: string; issuedAt?: Date; expirationTime?: Date; domain?: string; chainId?: number; signer?: typeof account } = {}) {
  const now = new Date();
  const message = createSiweMessage({
    domain: o.domain ?? DOMAIN,
    address: account.address,
    uri: `https://${DOMAIN}`,
    version: "1",
    chainId: o.chainId ?? FUJI_CHAIN_ID,
    nonce: o.nonce ?? (await getNonce()),
    issuedAt: o.issuedAt ?? now,
    expirationTime: o.expirationTime ?? new Date(now.getTime() + 5 * 60_000),
  });
  return { message, signature: await (o.signer ?? account).signMessage({ message }) };
}
const verify = (body: unknown) => verifyEndpoint(post("auth-verify", typeof body === "string" ? body : JSON.stringify(body)));
const count = async (sql: string) => (await db.query<{ n: number }>(sql)).rows[0]!.n;
const players = () => count(`select count(*)::int n from players`);

describe("auth-nonce", () => {
  it("POST returns a fresh nonce and stores it", async () => {
    const res = await nonceEndpoint(post("auth-nonce"));
    expect(res.status).toBe(200);
    const { nonce } = (await res.json()) as { nonce: string };
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(await count(`select count(*)::int n from siwe_nonces where nonce = '${nonce}' and used_at is null`)).toBe(1);
    expect(await getNonce()).not.toBe(nonce);
  });

  it("answers other methods with 405 and preflight with 204 + CORS", async () => {
    for (const method of ["GET", "PUT", "DELETE"]) {
      const res = await nonceEndpoint(new Request("http://local/auth-nonce", { method }));
      expect(res.status, method).toBe(405);
      expect(await res.json()).toEqual({ error: "method_not_allowed" });
    }
    const pre = await nonceEndpoint(new Request("http://local/auth-nonce", { method: "OPTIONS", headers: { Origin: ORIGIN } }));
    expect(pre.status).toBe(204);
    expect(pre.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(pre.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
  });

  it("reflects only the allowed origin", async () => {
    const ok = await nonceEndpoint(post("auth-nonce", undefined, { Origin: ORIGIN }));
    expect(ok.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    for (const origin of ["https://evil.example", "null", ORIGIN + ".evil.example"]) {
      const res = await nonceEndpoint(post("auth-nonce", undefined, { Origin: origin }));
      expect(res.headers.get("Access-Control-Allow-Origin"), origin).toBeNull();
    }
  });
});

describe("auth-verify: a real sign-in", () => {
  it("signs in, creates the player once, and the token is a valid session for that player", async () => {
    const before = await players();
    const res = await verify(await signed());
    expect(res.status).toBe(200);
    const s = (await res.json()) as { token: string; playerId: string; wallet: string; expiresAt: string };
    expect(s.wallet).toBe(account.address.toLowerCase());
    expect(Object.keys(s).sort()).toEqual(["expiresAt", "playerId", "token", "wallet"]);
    expect(await players()).toBe(before + 1);
    expect(await count(`select count(*)::int n from idle_state where player_id = '${s.playerId}'`)).toBe(1);

    const claims = await verifySessionToken(s.token, { jwtSecret: SECRET });
    expect(claims).toMatchObject({ sub: s.playerId, role: "authenticated", aud: "authenticated", wallet: s.wallet });
    await expect(verifySessionToken(s.token, { jwtSecret: "another-secret-that-is-long-enough!!" })).rejects.toThrow();
    // exp is in the future but within the maximum session length.
    expect(claims.exp * 1000).toBeGreaterThan(Date.now());
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(24 * 3600);

    // Signing in again gives the same player, not a second one.
    const again = (await (await verify(await signed())).json()) as { playerId: string };
    expect(again.playerId).toBe(s.playerId);
    expect(await players()).toBe(before + 1);
  });

  it("a used challenge cannot be replayed: second use is 401 invalid_nonce", async () => {
    const body = await signed();
    expect((await verify(body)).status).toBe(200);
    const replay = await verify(body);
    expect(replay.status).toBe(401);
    expect(await replay.json()).toEqual({ error: "invalid_nonce" });
  });

  it("an unknown or expired challenge is 401 invalid_nonce and creates no player", async () => {
    const before = await players();
    const unknown = await verify(await signed({ nonce: "neverissued123" }));
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toEqual({ error: "invalid_nonce" });

    const nonce = await getNonce();
    await db.query(`update siwe_nonces set created_at = now() - interval '11 minutes' where nonce = $1`, [nonce]);
    const stale = await verify(await signed({ nonce }));
    expect(stale.status).toBe(401);
    expect(await stale.json()).toEqual({ error: "invalid_nonce" });
    expect(await players()).toBe(before);
  });

  it("a challenge is consumed only by a valid signature: a forged one leaves it usable", async () => {
    const nonce = await getNonce();
    const forged = await signed({ nonce, signer: privateKeyToAccount(generatePrivateKey()) });
    const res = await verify(forged);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "invalid_signature" });
    expect((await verify(await signed({ nonce }))).status).toBe(200);
  });

  it("the signed message's time, domain and chain are enforced (401, no player)", async () => {
    const before = await players();
    const now = Date.now();
    const cases: [string, Parameters<typeof signed>[0], string][] = [
      ["expired message", { issuedAt: new Date(now - 3600_000), expirationTime: new Date(now - 60_000) }, "expired"],
      ["issued in the future", { issuedAt: new Date(now + 3600_000), expirationTime: new Date(now + 4000_000) }, "not_yet_valid"],
      ["wrong domain", { domain: "evil.example" }, "wrong_domain"],
      ["wrong chain", { chainId: 1 }, "wrong_chain"],
    ];
    for (const [name, o, error] of cases) {
      const res = await verify(await signed(o));
      expect(res.status, name).toBe(401);
      expect(await res.json(), name).toEqual({ error });
    }
    expect(await players()).toBe(before);
  });
});

describe("auth-verify: malformed requests", () => {
  const sig = "0x" + "a".repeat(130);
  const bad: [string, unknown][] = [
    ["no body", ""],
    ["invalid JSON", "{not json"],
    ["JSON null", "null"],
    ["an array", "[]"],
    ["a string", '"x"'],
    ["empty object", {}],
    ["numbers", { message: 1, signature: 2 }],
    ["nulls", { message: null, signature: null }],
    ["objects", { message: {}, signature: [] }],
    ["message too long", { message: "x".repeat(MAX_MESSAGE_LENGTH + 1), signature: sig }],
    ["a 1 MB message", { message: "x".repeat(1_000_000), signature: sig }],
    ["short signature", { message: "x", signature: "0x12" }],
    ["non-hex signature", { message: "x", signature: "0x" + "z".repeat(130) }],
    ["junk message", { message: "hello", signature: sig }],
    ["control characters", { message: "\u0000".repeat(40), signature: sig }],
  ];

  it.each(bad)("%s -> 4xx with an error code, never 5xx", async (_name, body) => {
    const before = await players();
    const res = await verify(body);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(await res.json()).toEqual({ error: expect.stringMatching(/^(invalid_request|invalid_message|invalid_signature)$/) });
    expect(await players()).toBe(before);
  });

  it("answers other methods with 405 and preflight with 204", async () => {
    for (const method of ["GET", "PUT", "DELETE"]) {
      const res = await verifyEndpoint(new Request("http://local/auth-verify", { method }));
      expect(res.status, method).toBe(405);
    }
    const pre = await verifyEndpoint(new Request("http://local/auth-verify", { method: "OPTIONS", headers: { Origin: ORIGIN } }));
    expect(pre.status).toBe(204);
  });

  it("malformed requests do not touch the database", async () => {
    rpcLog.length = 0;
    await verify("{not json");
    await verify({ message: 1, signature: 2 });
    expect(rpcLog).toEqual([]);
  });
});
