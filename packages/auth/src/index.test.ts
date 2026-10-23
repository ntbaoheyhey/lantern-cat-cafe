import { decodeProtectedHeader, SignJWT, UnsecuredJWT } from "jose";
import { privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { beforeEach, describe, expect, it } from "vitest";
import {
  AuthError,
  type AuthErrorCode,
  FUJI_CHAIN_ID,
  generateNonce,
  issueNonce,
  MAX_SESSION_TTL_SECONDS,
  verifySessionToken,
  verifySignIn,
} from "./index";
import { MemoryStore } from "./testing/memory-store";

// Well-known Anvil/Hardhat dev keys. Never fund these.
const alice = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const mallory = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const DOMAIN = "taskbarhero.test";
const SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";
const T0 = new Date("2026-10-23T12:00:00.000Z").getTime();

let now = T0;
const clock = () => new Date(now);
let store: MemoryStore;
const deps = () => ({ store, clock, config: { domain: DOMAIN, jwtSecret: SECRET } });

beforeEach(() => {
  now = T0;
  store = new MemoryStore(clock);
});

type MsgOverrides = Partial<Parameters<typeof createSiweMessage>[0]>;

async function signIn(opts: { overrides?: MsgOverrides; signer?: typeof alice; nonce?: string } = {}) {
  const nonce = opts.nonce ?? (await issueNonce({ store })).nonce;
  const message = createSiweMessage({
    domain: DOMAIN,
    address: alice.address,
    uri: `https://${DOMAIN}`,
    version: "1",
    chainId: FUJI_CHAIN_ID,
    nonce,
    issuedAt: new Date(now),
    expirationTime: new Date(now + 5 * 60_000),
    statement: "Sign in to Taskbar Hero.",
    ...opts.overrides,
  });
  const signature = await (opts.signer ?? alice).signMessage({ message });
  return { message, signature, nonce };
}

async function expectCode(p: Promise<unknown>, code: AuthErrorCode) {
  const err = await p.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(AuthError);
  expect((err as AuthError).code).toBe(code);
}

describe("nonces", () => {
  it("are 128-bit hex, unique, and stored", async () => {
    const a = generateNonce();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(new Set(Array.from({ length: 1000 }, generateNonce)).size).toBe(1000);
    const { nonce } = await issueNonce({ store });
    expect(store.nonces.has(nonce)).toBe(true);
  });
});

describe("verifySignIn", () => {
  it("valid signature gives a session whose JWT verifies with the right claims", async () => {
    const s = await verifySignIn(deps(), await signIn());
    expect(s.wallet).toBe(alice.address.toLowerCase());
    expect(decodeProtectedHeader(s.token)).toMatchObject({ alg: "HS256", typ: "JWT" });

    const claims = await verifySessionToken(s.token, { jwtSecret: SECRET }, clock);
    expect(claims).toMatchObject({ sub: s.playerId, role: "authenticated", aud: "authenticated", wallet: s.wallet });
    expect(claims.iat).toBe(T0 / 1000);
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(MAX_SESSION_TTL_SECONDS);
    expect(s.expiresAt).toBe(new Date(claims.exp * 1000).toISOString());
    expect(store.idleState.has(s.playerId)).toBe(true);

    // expired after 24h; wrong secret refused
    await expect(verifySessionToken(s.token, { jwtSecret: SECRET }, () => new Date(T0 + 86_401_000))).rejects.toThrow();
    await expect(verifySessionToken(s.token, { jwtSecret: SECRET.replace("t", "T") }, clock)).rejects.toThrow();
  });

  it("clamps a configured session ttl to 24h", async () => {
    const s = await verifySignIn({ ...deps(), config: { domain: DOMAIN, jwtSecret: SECRET, sessionTtlSeconds: 7 * 86400 } }, await signIn());
    const c = await verifySessionToken(s.token, { jwtSecret: SECRET }, clock);
    expect(c.exp - c.iat).toBe(86400);
  });

  it("JWT holds the lowercase wallet even though the message has a checksummed address", async () => {
    expect(alice.address).not.toBe(alice.address.toLowerCase());
    const s = await verifySignIn(deps(), await signIn());
    const c = await verifySessionToken(s.token, { jwtSecret: SECRET }, clock);
    expect(c.wallet).toBe(alice.address.toLowerCase());
    expect([...store.players.keys()]).toEqual([alice.address.toLowerCase()]);
  });

  it("second sign-in of the same wallet returns the same player id", async () => {
    const a = await verifySignIn(deps(), await signIn());
    now += 60_000;
    const b = await verifySignIn(deps(), await signIn());
    expect(b.playerId).toBe(a.playerId);
    expect(store.players.size).toBe(1);
  });

  it("refuses a replayed nonce", async () => {
    const req = await signIn();
    await verifySignIn(deps(), req);
    await expectCode(verifySignIn(deps(), req), "invalid_nonce");
  });

  it("lets exactly one of three concurrent verifications of the same nonce succeed", async () => {
    const req = await signIn();
    const results = await Promise.allSettled([1, 2, 3].map(() => verifySignIn(deps(), req)));
    expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
  });

  it("refuses an unknown nonce", async () => {
    await expectCode(verifySignIn(deps(), await signIn({ nonce: generateNonce() })), "invalid_nonce");
  });

  it("refuses a stale nonce (issued more than 10 minutes ago)", async () => {
    const { nonce } = await issueNonce({ store });
    now += 10 * 60_000 + 1000;
    await expectCode(verifySignIn(deps(), await signIn({ nonce })), "invalid_nonce");
  });

  it("refuses an expired message", async () => {
    const req = await signIn();
    now += 5 * 60_000; // exactly expirationTime
    await expectCode(verifySignIn(deps(), req), "expired");
    // the nonce was not burnt by the refused attempt
    expect(store.nonces.get(req.nonce)?.usedAt).toBeUndefined();
  });

  it("refuses a message without expirationTime", async () => {
    await expectCode(verifySignIn(deps(), await signIn({ overrides: { expirationTime: undefined } })), "invalid_message");
  });

  it("refuses issuedAt in the future beyond the skew, accepts within it", async () => {
    await expectCode(verifySignIn(deps(), await signIn({ overrides: { issuedAt: new Date(now + 120_000), expirationTime: new Date(now + 600_000) } })), "not_yet_valid");
    await verifySignIn(deps(), await signIn({ overrides: { issuedAt: new Date(now + 30_000) } }));
  });

  it("refuses a signature from another address", async () => {
    const req = await signIn({ signer: mallory });
    await expectCode(verifySignIn(deps(), req), "invalid_signature");
    expect(store.nonces.get(req.nonce)?.usedAt).toBeUndefined();
  });

  it("refuses a signature over a different message", async () => {
    const a = await signIn();
    const b = await signIn();
    await expectCode(verifySignIn(deps(), { message: a.message, signature: b.signature }), "invalid_signature");
  });

  it("refuses the wrong chainId", async () => {
    await expectCode(verifySignIn(deps(), await signIn({ overrides: { chainId: 43114 } })), "wrong_chain");
  });

  it("refuses the wrong domain", async () => {
    await expectCode(verifySignIn(deps(), await signIn({ overrides: { domain: "evil.test", uri: "https://evil.test" } })), "wrong_domain");
  });

  it("refuses a uri on another host", async () => {
    await expectCode(verifySignIn(deps(), await signIn({ overrides: { uri: "https://evil.test/login" } })), "wrong_uri");
  });

  it("refuses uris with a bad scheme, credentials or insecure http", async () => {
    for (const uri of [`javascript://${DOMAIN}/x`, `https://evil.test@${DOMAIN}/`, `http://${DOMAIN}`]) {
      await expectCode(verifySignIn(deps(), await signIn({ overrides: { uri } })), "wrong_uri");
    }
  });

  it("accepts http only for localhost", async () => {
    const localDeps = { ...deps(), config: { domain: "localhost:5173", jwtSecret: SECRET } };
    const req = await signIn({ overrides: { domain: "localhost:5173", uri: "http://localhost:5173" } });
    expect((await verifySignIn(localDeps, req)).wallet).toBe(alice.address.toLowerCase());
  });

  it("refuses notBefore in the future beyond the skew", async () => {
    const overrides = { notBefore: new Date(now + 120_000), expirationTime: new Date(now + 600_000) };
    await expectCode(verifySignIn(deps(), await signIn({ overrides })), "not_yet_valid");
    await verifySignIn(deps(), await signIn({ overrides: { notBefore: new Date(now + 30_000) } }));
  });

  it("refuses issuedAt older than the nonce window", async () => {
    const req = await signIn({ overrides: { issuedAt: new Date(now - 12 * 60_000), expirationTime: new Date(now + 5 * 60_000) } });
    await expectCode(verifySignIn(deps(), req), "expired");
    expect(store.nonces.get(req.nonce)?.usedAt).toBeUndefined();
  });

  it("refuses non-canonical or malformed messages", async () => {
    const req = await signIn();
    const extra = req.message + "\n\nextra";
    await expectCode(verifySignIn(deps(), { message: extra, signature: await alice.signMessage({ message: extra }) }), "invalid_message");
    const lower = req.message.replace(alice.address, alice.address.toLowerCase().replace("0xf", "0xF"));
    await expectCode(verifySignIn(deps(), { message: lower, signature: await alice.signMessage({ message: lower }) }), "invalid_message");
    await expectCode(verifySignIn(deps(), { message: "hello", signature: req.signature }), "invalid_message");
    await expectCode(verifySignIn(deps(), { message: 1, signature: req.signature }), "invalid_request");
    await expectCode(verifySignIn(deps(), { message: req.message, signature: "0x1234" }), "invalid_signature");
  });

  it("refuses a too-short JWT secret", async () => {
    await expect(verifySignIn({ ...deps(), config: { domain: DOMAIN, jwtSecret: "short" } }, await signIn())).rejects.toThrow(/at least 32/);
  });
});

describe("verifySessionToken", () => {
  it("rejects alg=none and tokens signed with another algorithm", async () => {
    const claims = { sub: "x", role: "authenticated", aud: "authenticated", wallet: "0x" };
    const none = new UnsecuredJWT(claims).setIssuedAt(T0 / 1000).setExpirationTime(T0 / 1000 + 60).encode();
    await expect(verifySessionToken(none, { jwtSecret: SECRET }, clock)).rejects.toThrow();
    const hs512 = await new SignJWT(claims)
      .setProtectedHeader({ alg: "HS512" })
      .setIssuedAt(T0 / 1000)
      .setExpirationTime(T0 / 1000 + 60)
      .sign(new TextEncoder().encode(SECRET));
    await expect(verifySessionToken(hs512, { jwtSecret: SECRET }, clock)).rejects.toThrow();
  });
});
