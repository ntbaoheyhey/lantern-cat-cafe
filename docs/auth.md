# Wallet sign-in (B2)

Current source review (3 November 2026): the flow below describes checked-in code. Nonces are single-use with a ten minute window; sessions pin HS256/audience/role and are capped at 24 hours. A valid signature precedes nonce consumption. Tests are linked from the [security overview](security-overview.md). No fresh live sign-in/security audit or deployed-source identity is claimed. PR #244 still lacks a complete function backup and tested restore path; do not bypass the export guard or change production settings.

Players sign in by signing a Sign-In with Ethereum (EIP-4361) message with their wallet. There is no email or password. The server returns an application JWT whose `sub` is `players.id`; Edge handlers and RPCs bind requests to that identity. RLS separately restricts client access (see [database.md](database.md)). Acceptance of this application token by PostgREST depends on deployed signing configuration and is not verified here.

## Flow

```
client                         auth-nonce (Edge Fn)        auth-verify (Edge Fn)          Postgres
  | POST /functions/v1/auth-nonce  |                             |                            |
  |------------------------------->| insert siwe_nonces(nonce)   |                            |
  |<-------------------------------| { nonce }                   |                            |
  | build SIWE message (viem createSiweMessage):                 |                            |
  |   domain, address, uri, chainId 43113, nonce,                |                            |
  |   issuedAt, expirationTime                                   |                            |
  | wallet.signMessage(message)  (personal_sign)                 |                            |
  | POST /functions/v1/auth-verify { message, signature }        |                            |
  |------------------------------------------------------------->| parse + canonical check    |
  |                                                              | domain, uri, chain, times  |
  |                                                              | recover signer == address  |
  |                                                              | consume_siwe_nonce(nonce) ->| UPDATE .. RETURNING
  |                                                              | upsert_player_by_wallet  -->| players + idle_state
  |                                                              | sign HS256 JWT             |
  |<-------------------------------------------------------------| { token, playerId, wallet, expiresAt }
  | game calls: POST /functions/v1/<name> with Authorization: Bearer <token>  (sub = playerId)
```

## Client usage

```ts
import { createClient } from "@supabase/supabase-js";
import { createSiweMessage } from "viem/siwe";

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data: { nonce } } = await anon.functions.invoke("auth-nonce", { method: "POST" });
const message = createSiweMessage({
  domain: window.location.host,            // must equal SIWE_DOMAIN
  uri: window.location.origin,             // host must equal SIWE_DOMAIN
  address,                                 // checksummed, from the wallet
  chainId: 43113,
  version: "1",
  nonce,
  issuedAt: new Date(),
  expirationTime: new Date(Date.now() + 10 * 60_000), // the app uses 10 minutes
  statement: "Sign in to Lantern Cat Cafe.",
});
const signature = await walletClient.signMessage({ account: address, message });
const { data: session } = await anon.functions.invoke("auth-verify", { body: { message, signature } });

// The web client does not query PostgREST: it sends the token to the game Edge Functions
// (docs/api.md). The token is signed with our own secret, so PostgREST would not accept it.
const headers = { Authorization: `Bearer ${session.token}` };
```

Build the message with viem's `createSiweMessage`: the server rebuilds the message from its parsed fields and refuses anything that is not byte-for-byte the canonical form (ISO dates with milliseconds, EIP-55 address). There is no refresh token; sign in again when `expiresAt` passes.

Errors are `{ error: code }` with HTTP 400 (`invalid_request`) or 401: `invalid_message`, `wrong_domain`, `wrong_uri`, `wrong_chain`, `not_yet_valid`, `expired`, `invalid_signature`, `invalid_nonce`. Other failures are 500 `internal_error`.

## What is checked

- Message: required fields present (domain, address, uri, version 1, chainId, nonce, issuedAt, expirationTime), canonical form, at most 2048 chars.
- `domain` equals `SIWE_DOMAIN` (case-insensitive). `uri` is parsed with `new URL`: protocol `https:` (or `http:` only for `localhost`/`127.0.0.1`), no username or password, and `host` equal to `SIWE_DOMAIN`.
- `chainId` is 43113 (Avalanche Fuji).
- Time, against the server clock: `expirationTime` must be in the future (no tolerance); `issuedAt`/`notBefore` may be at most 60 s in the future (client clock skew); `issuedAt` may not be older than the nonce window.
- Signature: 65-byte `personal_sign` signature, recovered address must equal the message address. Smart-contract wallets (ERC-1271/6492) are not supported.
- Nonce: consumed last, so failed checks do not burn it. `consume_siwe_nonce` runs one `UPDATE siwe_nonces SET used_at = now() WHERE nonce = $1 AND used_at IS NULL AND created_at > now() - interval '10 minutes' RETURNING`, which succeeds once per nonce even under concurrency. Creating a nonce (`create_siwe_nonce`) first deletes up to 1000 used or expired rows. Nonces are 128 random bits from `crypto.getRandomValues` (viem's `generateSiweNonce` uses `Math.random`, so it is not used).
- Session JWT: HS256 with our own secret (`AUTH_JWT_SECRET`, >= 32 chars; `SUPABASE_JWT_SECRET` is read first if set, but the platform does not set it); claims `sub` = `players.id`, `role` = `authenticated`, `aud` = `authenticated`, `wallet` = lowercase address, `iat`, `exp` <= 24 h. `verifySessionToken` pins `algorithms: ["HS256"]`.

## Code layout

- `packages/auth/src/index.ts`: all logic (`issueNonce`, `verifySignIn`, `verifySessionToken`), with an injected `AuthStore` and clock. Tested in Node with vitest (`pnpm --filter @taskbar-hero/auth test`), using an in-memory store and real viem signatures.
- `supabase/migrations/20260102000000_siwe_auth.sql`: `consume_siwe_nonce` and `upsert_player_by_wallet`, executable by `service_role` only. Tested with PGlite in `supabase/tests/src/siwe.test.ts`.
- `supabase/functions/_shared/auth.ts`: Postgres store (supabase-js with the service role key, RPC to the two functions), env config, CORS and error mapping.
- `supabase/functions/auth-nonce`, `supabase/functions/auth-verify`: thin `Deno.serve` handlers.

Deno imports `packages/auth/src/index.ts` by relative path. That file has no relative imports, and its bare imports (`jose`, `viem`, `viem/siwe`) resolve through each function's `deno.json` import map to `npm:` specifiers pinned to the same versions as `packages/auth/package.json`. The import maps are generated by `scripts/gen-deno-json.mjs` (`pnpm gen:deno`); keep the versions in sync when upgrading.

## Configuration

Edge Function secrets (see `.env.example`):

- `SIWE_DOMAIN`: the web app's host, e.g. `localhost:5173` locally. A comma-separated list accepts each host (for example `lantern-cat-cafe.vercel.app,taskbarhero-eight.vercel.app,127.0.0.1:6301`); the message `uri` host must still equal the message's own `domain`.
- `AUTH_JWT_SECRET`: our session-signing secret, at least 32 bytes (`openssl rand -base64 48`). Hosted Supabase refuses custom secrets that start with `SUPABASE_`, so this is the one to set; `SUPABASE_JWT_SECRET` is read first when present.
- `SIWE_ALLOWED_ORIGIN` (required for browsers): comma-separated list of exact origins, e.g. `https://lantern-cat-cafe.vercel.app,https://taskbarhero-eight.vercel.app,http://127.0.0.1:6301`. The request `Origin` is reflected only if listed; if the variable is missing or the origin is not listed, no `Access-Control-Allow-Origin` header is sent (fail closed).
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform.

Functions are deployed with `--no-verify-jwt` (also in `supabase/config.toml`): the gateway does not check the `Authorization` header, because the functions verify our own session JWT themselves. See [go-live](go-live.md) for all secrets.

## Known limits

- Per-IP rate limiting is not implemented (Supabase free tier has no built-in per-IP limiter for Edge Functions). `auth-nonce` is unauthenticated, so an attacker can still create nonces quickly; the table stays bounded because `create_siwe_nonce` deletes up to 1000 used or older-than-10-minutes rows on each call, but request volume is not throttled. Add a gateway or WAF limit if abuse appears.
- Migration `20260103000000_auth_hardening.sql` also revokes default privileges on future tables and functions in `public` for `anon`, `authenticated` and `public` (and, role-wide, the implicit `PUBLIC` EXECUTE on new functions); new objects must grant access explicitly.

## Deployment status

The functions are deployed by GitHub Actions (see [go-live](go-live.md)); the deploy bundler includes `packages/auth` through each function's `deno.json`. Live wallet sign-in and saving were confirmed by the project owner on 2026-10-23. Sign-in uses our own HS256 session token, not a Supabase Auth session, so it does not depend on the project's JWT signing keys.
