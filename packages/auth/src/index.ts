/**
 * Wallet sign-in (Sign-In with Ethereum, EIP-4361) for Taskbar Hero.
 *
 * Pure logic: storage and time are injected, so this runs unchanged in Node (vitest) and in
 * Deno (Supabase Edge Functions, see supabase/functions/auth-*). Keep this file free of
 * relative imports and Node-only APIs so Deno can import it by path with an import map that
 * maps `viem`, `viem/siwe` and `jose` to npm: specifiers.
 */
import { jwtVerify, SignJWT } from "jose";
import { getAddress, isAddress, isHex, recoverMessageAddress } from "viem";
import { createSiweMessage, parseSiweMessage } from "viem/siwe";

export const FUJI_CHAIN_ID = 43113;
/** A nonce must be consumed within this many seconds of being issued (matches the SQL). */
export const NONCE_TTL_SECONDS = 10 * 60;
/** Hard upper bound on a session's lifetime. */
export const MAX_SESSION_TTL_SECONDS = 24 * 60 * 60;
/** Tolerated difference between the client's and the server's clocks. */
export const DEFAULT_CLOCK_SKEW_SECONDS = 60;
/** Longer messages are refused before parsing. */
export const MAX_MESSAGE_LENGTH = 2048;

export interface AuthStore {
  /** Persist a freshly issued, unused nonce. */
  createNonce(nonce: string): Promise<void>;
  /**
   * Atomically mark the nonce used. Returns true exactly once per nonce, and only if it was
   * issued less than NONCE_TTL_SECONDS ago; false if unknown, already used or stale.
   */
  consumeNonce(nonce: string): Promise<boolean>;
  /** Return the player for this lowercase wallet, creating it (and its idle_state) if new. */
  upsertPlayerByWallet(wallet: string): Promise<{ id: string }>;
}

export type Clock = () => Date;

export interface AuthConfig {
  /** RFC 3986 authority the client must put in the message, e.g. "taskbarhero.app" or "localhost:5173". */
  domain: string;
  /** HS256 secret (the Supabase project's JWT secret). */
  jwtSecret: string;
  chainId?: number;
  sessionTtlSeconds?: number;
  clockSkewSeconds?: number;
  /** Optional `iss` claim. */
  issuer?: string;
}

export interface AuthDeps {
  store: AuthStore;
  config: AuthConfig;
  clock?: Clock;
}

export type AuthErrorCode =
  | "invalid_request"
  | "invalid_message"
  | "wrong_domain"
  | "wrong_uri"
  | "wrong_chain"
  | "not_yet_valid"
  | "expired"
  | "invalid_signature"
  | "invalid_nonce";

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface Session {
  token: string;
  playerId: string;
  wallet: string;
  expiresAt: string;
}

export interface SessionClaims {
  sub: string;
  role: "authenticated";
  aud: "authenticated";
  wallet: string;
  iat: number;
  exp: number;
  iss?: string;
}

const systemClock: Clock = () => new Date();

/** 128 random bits from the platform CSPRNG, as 32 hex chars (EIP-4361: alphanumeric, >= 8). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** POST /auth-nonce: issue and store a single-use nonce. */
export async function issueNonce(deps: Pick<AuthDeps, "store">): Promise<{ nonce: string }> {
  const nonce = generateNonce();
  await deps.store.createNonce(nonce);
  return { nonce };
}

function secretKey(secret: string): Uint8Array {
  if (secret.length < 32) throw new Error("JWT secret must be at least 32 characters");
  return new TextEncoder().encode(secret);
}

function hostOf(uri: string): string | undefined {
  try {
    return new URL(uri).host.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * POST /auth-verify: check a signed SIWE message and return a Supabase-compatible session.
 * All stateless checks (format, domain, uri, chain, time, signature) run before the nonce is
 * consumed, so a forged request cannot burn someone else's nonce.
 */
export async function verifySignIn(deps: AuthDeps, input: { message: unknown; signature: unknown }): Promise<Session> {
  const { store, config } = deps;
  const clock = deps.clock ?? systemClock;
  const chainId = config.chainId ?? FUJI_CHAIN_ID;
  const skewMs = (config.clockSkewSeconds ?? DEFAULT_CLOCK_SKEW_SECONDS) * 1000;
  const ttl = Math.min(config.sessionTtlSeconds ?? MAX_SESSION_TTL_SECONDS, MAX_SESSION_TTL_SECONDS);
  const key = secretKey(config.jwtSecret);

  const { message, signature } = input;
  if (typeof message !== "string" || typeof signature !== "string" || message.length > MAX_MESSAGE_LENGTH) {
    throw new AuthError("invalid_request");
  }
  if (!isHex(signature) || signature.length !== 132) throw new AuthError("invalid_signature");

  // Parse, then require the message to be exactly what createSiweMessage would produce from
  // the parsed fields. This rejects trailing junk, odd date formats and any parser ambiguity,
  // so the bytes that were signed are exactly the fields we check below.
  const f = parseSiweMessage(message);
  if (
    !f.domain ||
    !f.address ||
    !f.uri ||
    f.version !== "1" ||
    f.chainId === undefined ||
    !f.nonce ||
    !f.issuedAt ||
    !f.expirationTime ||
    Number.isNaN(f.issuedAt.getTime()) ||
    Number.isNaN(f.expirationTime.getTime()) ||
    (f.notBefore && Number.isNaN(f.notBefore.getTime())) ||
    !isAddress(f.address, { strict: true })
  ) {
    throw new AuthError("invalid_message");
  }
  let canonical: string;
  try {
    canonical = createSiweMessage({ ...f, address: f.address, chainId: f.chainId, domain: f.domain, nonce: f.nonce, uri: f.uri, version: "1" });
  } catch {
    throw new AuthError("invalid_message");
  }
  if (canonical !== message) throw new AuthError("invalid_message", "message is not in canonical EIP-4361 form");

  const domain = config.domain.toLowerCase();
  if (f.domain.toLowerCase() !== domain) throw new AuthError("wrong_domain");
  if (hostOf(f.uri) !== domain) throw new AuthError("wrong_uri");
  if (f.chainId !== chainId) throw new AuthError("wrong_chain");

  const now = clock().getTime();
  if (f.issuedAt.getTime() > now + skewMs) throw new AuthError("not_yet_valid", "issuedAt is in the future");
  if (f.notBefore && f.notBefore.getTime() > now + skewMs) throw new AuthError("not_yet_valid");
  if (f.expirationTime.getTime() <= now) throw new AuthError("expired");
  if (f.issuedAt.getTime() < now - NONCE_TTL_SECONDS * 1000 - skewMs) throw new AuthError("expired", "issuedAt too old");

  let recovered: string;
  try {
    recovered = await recoverMessageAddress({ message, signature });
  } catch {
    throw new AuthError("invalid_signature");
  }
  if (recovered.toLowerCase() !== f.address.toLowerCase()) throw new AuthError("invalid_signature");

  if (!(await store.consumeNonce(f.nonce))) throw new AuthError("invalid_nonce");

  const wallet = getAddress(f.address).toLowerCase();
  const player = await store.upsertPlayerByWallet(wallet);

  const iat = Math.floor(now / 1000);
  const exp = iat + ttl;
  const jwt = new SignJWT({ role: "authenticated", wallet })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(player.id)
    .setAudience("authenticated")
    .setIssuedAt(iat)
    .setExpirationTime(exp);
  if (config.issuer) jwt.setIssuer(config.issuer);
  const token = await jwt.sign(key);

  return { token, playerId: player.id, wallet, expiresAt: new Date(exp * 1000).toISOString() };
}

/** Verify a session token we issued. Pins HS256 so alg=none / RS256 confusion is impossible. */
export async function verifySessionToken(
  token: string,
  config: Pick<AuthConfig, "jwtSecret" | "issuer">,
  clock: Clock = systemClock,
): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secretKey(config.jwtSecret), {
    algorithms: ["HS256"],
    audience: "authenticated",
    ...(config.issuer ? { issuer: config.issuer } : {}),
    currentDate: clock(),
    requiredClaims: ["sub", "exp", "iat"],
  });
  if (payload.role !== "authenticated" || typeof payload.wallet !== "string") {
    throw new Error("not a Taskbar Hero session");
  }
  return payload as unknown as SessionClaims;
}
