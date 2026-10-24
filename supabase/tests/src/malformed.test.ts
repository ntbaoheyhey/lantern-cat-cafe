import type { PGlite } from "@electric-sql/pglite";
import { createHmac, randomUUID } from "node:crypto";
import { generatePrivateKey } from "viem/accounts";
import { beforeAll, describe, expect, it } from "vitest";
import { GameError, gameHandler, getState, routes, type GameDeps } from "../../functions/_shared/game.ts";
import { voucherSigner, type ChainReader } from "../../functions/_shared/relic.ts";
import { migratedDb, pgliteStore } from "./game-db.ts";

// Every game endpoint is driven through the real gameHandler. Garbage must come back as a documented
// 4xx, never a 5xx or a thrown exception, and never change the database.
//
// authenticate() below stands in for the one in game-server.ts (Deno-only): same Bearer parsing, and
// an HS256 check with exp done here with node:crypto. packages/auth cannot be imported by this test
// package (the vitest alias for `viem` also captures `viem/siwe`, which that package imports), so
// the real jose-based verifier is covered by packages/auth/src/index.test.ts, not here.

const SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";
const NFT = "0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D" as const;
const T0 = Date.UTC(2026, 10, 1, 10, 0, 0);
const ENDPOINTS = ["game-state", "idle-claim", "equip", "boss-fight", "upgrade", "relic-forge", "relic-mint-report"] as const;
const BODY_ENDPOINTS = ["equip", "upgrade", "relic-mint-report"] as const;
/** docs/api.md error codes that are a client mistake (4xx). */
type BodyInit = string | null;
const CLIENT_ERRORS = new Set([
  "unauthenticated", "not_owner", "not_enough_gold", "max_level", "no_attempts_left", "forge_blocked",
  "not_found", "mint_not_confirmed", "method_not_allowed",
]);

const chain: ChainReader = { receipt: async () => null, nonceUsed: async () => false };
let db: PGlite;
let clock = T0;
const deps: GameDeps = {
  store: pgliteStore(() => db),
  seedSecret: "test-seed-secret",
  now: () => clock,
  relic: { signer: voucherSigner(generatePrivateKey(), NFT), chain, nft: NFT },
};

const b64 = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString("base64url");
const sign = (header: object, payload: object, secret = SECRET) => {
  const body = `${b64(header)}.${b64(payload)}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
};
let authClock = new Date(T0);
const http = {
  authenticate: async (req: Request) => {
    const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization") ?? "");
    if (!m) throw new GameError("unauthenticated");
    try {
      const [h, p, sig, extra] = m[1]!.split(".");
      if (!h || !p || !sig || extra !== undefined) throw new Error("shape");
      if (JSON.parse(Buffer.from(h, "base64url").toString()).alg !== "HS256") throw new Error("alg");
      const want = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
      if (sig !== want) throw new Error("signature");
      const claims = JSON.parse(Buffer.from(p, "base64url").toString()) as { sub?: string; exp?: number };
      if (!claims.sub || !claims.exp || claims.exp * 1000 <= authClock.getTime()) throw new Error("claims");
      return claims.sub;
    } catch {
      throw new GameError("unauthenticated");
    }
  },
  json: (_req: Request, body: unknown, status = 200) => Response.json(body, { status }),
};
const handlers = routes(deps);

let token: string;
let playerId: string;
let weapon: string;

/** Everything in every public table, so any write shows up. */
async function dump(): Promise<string> {
  const names = (await db.query<{ t: string }>(`select tablename t from pg_tables where schemaname = 'public' order by 1`)).rows.map((r) => r.t);
  const out: Record<string, unknown> = {};
  for (const t of names) out[t] = (await db.query(`select to_jsonb(x) j from public.${t} x order by 1`)).rows;
  return JSON.stringify(out);
}

function req(endpoint: string, o: { method?: string; auth?: string | null; body?: BodyInit | null; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...o.headers };
  if (o.auth !== null) headers.Authorization = o.auth ?? `Bearer ${token}`;
  return new Request(`http://local/${endpoint}`, { method: o.method ?? "POST", headers, body: o.body ?? undefined });
}
const call = (endpoint: (typeof ENDPOINTS)[number], r: Request) => gameHandler(http, handlers[endpoint])(r);

/** A response must be a documented client error: 4xx with { error: <known code> }. */
async function expectClientError(res: Response, label: string) {
  expect(res.status, label).toBeGreaterThanOrEqual(400);
  expect(res.status, label).toBeLessThan(500);
  const body = (await res.json()) as { error?: string };
  expect(CLIENT_ERRORS.has(body.error ?? ""), `${label}: ${JSON.stringify(body)}`).toBe(true);
}

beforeAll(async () => {
  db = await migratedDb();
  playerId = randomUUID();
  token = sign({ alg: "HS256", typ: "JWT" }, { sub: playerId, role: "authenticated", aud: "authenticated", iat: T0 / 1000, exp: T0 / 1000 + 3600 });
  await db.query(`insert into players (id, wallet) values ($1, $2)`, [playerId, "0x" + "5".repeat(40)]);
  await db.query(`insert into idle_state (player_id, gold, shards) values ($1, 100000, 100)`, [playerId]);
  weapon = (await getState(deps, playerId)).inventory.find((g) => g.slot === "weapon")!.id;
});

describe.each(ENDPOINTS)("%s: wrong method", (endpoint) => {
  it("answers non-POST methods with 405 method_not_allowed and changes nothing", async () => {
    const before = await dump();
    for (const method of ["GET", "PUT", "DELETE", "PATCH"]) {
      const res = await call(endpoint, req(endpoint, { method }));
      expect(res.status, method).toBe(405);
      expect(await res.json()).toEqual({ error: "method_not_allowed" });
    }
    expect(await dump()).toBe(before);
  });

  it("answers the CORS preflight with 204 and no body", async () => {
    const res = await call(endpoint, req(endpoint, { method: "OPTIONS", auth: null }));
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });
});

describe.each(ENDPOINTS)("%s: authentication", (endpoint) => {
  const cases: [string, () => string | null][] = [
    ["no Authorization header", () => null],
    ["empty header", () => ""],
    ["Bearer with no token", () => "Bearer"],
    ["Bearer and spaces only", () => "Bearer    "],
    ["Basic scheme", () => "Basic dXNlcjpwYXNz"],
    ["two tokens", () => `Bearer ${token} ${token}`],
    ["not a JWT", () => "Bearer not-a-jwt"],
    ["three empty segments", () => "Bearer .."],
    ["alg none", () => `Bearer ${b64({ alg: "none", typ: "JWT" })}.${token.split(".")[1]}.`],
    ["tampered payload", () => `Bearer ${token.split(".")[0]}.${b64({ sub: playerId, exp: 9999999999 })}.${token.split(".")[2]}`],
    ["signed with another secret", () => `Bearer ${sign({ alg: "HS256", typ: "JWT" }, { sub: playerId, exp: T0 / 1000 + 3600 }, "another-secret-that-is-long-enough!!")}`],
    ["no sub claim", () => `Bearer ${sign({ alg: "HS256", typ: "JWT" }, { exp: T0 / 1000 + 3600 })}`],
    ["tampered signature", () => `Bearer ${token.slice(0, -4)}AAAA`],
    ["very long token", () => `Bearer ${"a".repeat(100_000)}`],
  ];

  it.each(cases)("%s -> 401 unauthenticated, nothing written", async (_name, header) => {
    const before = await dump();
    const res = await call(endpoint, req(endpoint, { auth: header(), body: "{}" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthenticated" });
    expect(await dump()).toBe(before);
  });

  it("an expired token -> 401 unauthenticated, nothing written", async () => {
    const before = await dump();
    authClock = new Date(T0 + 2 * 3600_000); // token lasts 1 hour
    try {
      const res = await call(endpoint, req(endpoint, { body: "{}" }));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "unauthenticated" });
    } finally {
      authClock = new Date(T0);
    }
    expect(await dump()).toBe(before);
  });
});

describe("endpoints that ignore the body", () => {
  const junk: [string, BodyInit][] = [
    ["no body", null], ["invalid JSON", "{not json"], ["JSON null", "null"], ["a string", '"hello"'],
    ["an array", "[1,2,3]"], ["a number", "42"], ["huge extra fields", JSON.stringify({ playerId: "x", gold: 1e308, now: 9e15 })],
  ];
  it.each(["game-state", "boss-fight", "relic-forge"] as const)("%s ignores a malformed body: never a 5xx", async (endpoint) => {
    for (const [name, body] of junk) {
      const res = await call(endpoint, req(endpoint, { body }));
      expect(res.status, `${endpoint} ${name}`).toBeLessThan(500);
      if (res.status >= 400) await expectClientError(res, `${endpoint} ${name}`);
    }
  });

  it("idle-claim ignores a malformed body and credits only what the server computes", async () => {
    clock = T0 + 3600_000;
    const res = await call("idle-claim", req("idle-claim", { body: JSON.stringify({ gold: 1e308, elapsed: 9e15 }) }));
    expect(res.status).toBe(200);
    const gold = Number((await db.query<{ g: string }>(`select gold::text g from idle_state where player_id = $1`, [playerId])).rows[0]!.g);
    expect(gold).toBeLessThan(1e7);
    for (const [name, body] of junk) {
      const r = await call("idle-claim", req("idle-claim", { body }));
      expect(r.status, name).toBe(200);
    }
    clock = T0;
  });
});

describe("endpoints that read the body", () => {
  const uuid = "00000000-0000-4000-8000-00000000ffff";
  const weird: unknown[] = [
    undefined, null, "", "x", 0, -1, 1.5, 1e308, Number.MAX_SAFE_INTEGER, true, [], [uuid], {}, { nested: uuid }, "a".repeat(100_000),
    "0".repeat(5000), "../../etc/passwd", "'; drop table players; --", "\u0000", uuid.toUpperCase().slice(0, -1),
  ];
  const bodies = (field: string): [string, BodyInit][] => [
    ["no body", null],
    ["empty string", ""],
    ["invalid JSON", "{not json"],
    ["truncated JSON", `{"${field}":`],
    ["JSON null", "null"],
    ["an array", "[]"],
    ["a string", '"x"'],
    ["a number", "7"],
    ["empty object", "{}"],
    ...weird.map((v): [string, BodyInit] => [`${field}=${JSON.stringify(v)?.slice(0, 30)}`, JSON.stringify({ [field]: v })]),
    ["wrong content type, valid JSON", JSON.stringify({ [field]: uuid })],
  ];

  it.each(["equip", "upgrade"] as const)("%s: a bad or missing gearId is a 4xx not_owner and writes nothing", async (endpoint) => {
    const before = await dump();
    for (const [name, body] of bodies("gearId")) {
      const res = await call(endpoint, req(endpoint, { body, headers: { "Content-Type": "text/plain" } }));
      await expectClientError(res, `${endpoint} ${name}`);
      expect(res.status, `${endpoint} ${name}`).toBe(new GameError("not_owner").status);
    }
    expect(await dump()).toBe(before);
  });

  it("relic-mint-report: a bad or missing nonce or txHash is a 4xx and writes nothing", async () => {
    const before = await dump();
    const hash = `0x${"a".repeat(64)}`;
    const cases: [string, unknown][] = [
      ["nothing", {}],
      ...weird.map((v): [string, unknown] => [`nonce=${JSON.stringify(v)?.slice(0, 30)}`, { nonce: v, txHash: hash }]),
      ...weird.map((v): [string, unknown] => [`txHash=${JSON.stringify(v)?.slice(0, 30)}`, { nonce: "1", txHash: v }]),
      ["nonce beyond uint64", { nonce: "9".repeat(40), txHash: hash }],
      ["nonce beyond bigint", { nonce: "9223372036854775808", txHash: hash }],
      ["short txHash", { nonce: "1", txHash: "0x1234" }],
      ["non-hex txHash", { nonce: "1", txHash: `0x${"z".repeat(64)}` }],
      ["well-formed but unknown", { nonce: "424242", txHash: hash }],
    ];
    for (const [name, payload] of cases) {
      await expectClientError(await call("relic-mint-report", req("relic-mint-report", { body: JSON.stringify(payload) })), name);
    }
    for (const [name, body] of bodies("nonce").slice(0, 9)) {
      await expectClientError(await call("relic-mint-report", req("relic-mint-report", { body })), name);
    }
    expect(await dump()).toBe(before);
  });

  it("a valid request still works after all that (the player and gear are intact)", async () => {
    const res = await call("upgrade", req("upgrade", { body: JSON.stringify({ gearId: weapon }) }));
    expect(res.status).toBe(200);
  });
});

describe("a valid token for a player that does not exist", () => {
  it.each(ENDPOINTS)("%s answers 404 not_found and writes nothing", async (endpoint) => {
    const ghost = sign({ alg: "HS256", typ: "JWT" }, { sub: randomUUID(), exp: T0 / 1000 + 3600 });
    const before = await dump();
    const body = JSON.stringify({ gearId: weapon, nonce: "1", txHash: `0x${"a".repeat(64)}` });
    const res = await call(endpoint, req(endpoint, { auth: `Bearer ${ghost}`, body }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(await dump()).toBe(before);
  });
});
