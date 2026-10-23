# Wallet sign-in (B2)

Players sign in by signing a Sign-In with Ethereum (EIP-4361) message with their wallet. There is no email or password. The server returns a Supabase-compatible JWT whose `sub` is `players.id`, so the RLS rule `player_id = auth.uid()` (see [database.md](database.md)) applies directly.

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
  | supabase-js with Authorization: Bearer <token>  -> PostgREST / RLS as auth.uid() = playerId
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
  expirationTime: new Date(Date.now() + 5 * 60_000),
  statement: "Sign in to Taskbar Hero.",
});
const signature = await walletClient.signMessage({ account: address, message });
const { data: session } = await anon.functions.invoke("auth-verify", { body: { message, signature } });

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${session.token}` } },
});
db.realtime.setAuth(session.token); // if realtime is used
```

Build the message with viem's `createSiweMessage`: the server rebuilds the message from its parsed fields and refuses anything that is not byte-for-byte the canonical form (ISO dates with milliseconds, EIP-55 address). There is no refresh token; sign in again when `expiresAt` passes.

Errors are `{ error: code }` with HTTP 400 (`invalid_request`) or 401: `invalid_message`, `wrong_domain`, `wrong_uri`, `wrong_chain`, `not_yet_valid`, `expired`, `invalid_signature`, `invalid_nonce`. Other failures are 500 `internal_error`.

## What is checked

- Message: required fields present (domain, address, uri, version 1, chainId, nonce, issuedAt, expirationTime), canonical form, at most 2048 chars.
- `domain` equals `SIWE_DOMAIN` (case-insensitive) and the host of `uri` equals it too.
- `chainId` is 43113 (Avalanche Fuji).
- Time, against the server clock: `expirationTime` must be in the future (no tolerance); `issuedAt`/`notBefore` may be at most 60 s in the future (client clock skew); `issuedAt` may not be older than the nonce window.
- Signature: 65-byte `personal_sign` signature, recovered address must equal the message address. Smart-contract wallets (ERC-1271/6492) are not supported.
- Nonce: consumed last, so failed checks do not burn it. `consume_siwe_nonce` runs one `UPDATE siwe_nonces SET used_at = now() WHERE nonce = $1 AND used_at IS NULL AND created_at > now() - interval '10 minutes' RETURNING`, which succeeds once per nonce even under concurrency. Nonces are 128 random bits from `crypto.getRandomValues` (viem's `generateSiweNonce` uses `Math.random`, so it is not used).
- Session JWT: HS256 with the project JWT secret (>= 32 chars); claims `sub` = `players.id`, `role` = `authenticated`, `aud` = `authenticated`, `wallet` = lowercase address, `iat`, `exp` <= 24 h. `verifySessionToken` pins `algorithms: ["HS256"]`.

## Code layout

- `packages/auth/src/index.ts`: all logic (`issueNonce`, `verifySignIn`, `verifySessionToken`), with an injected `AuthStore` and clock. Tested in Node with vitest (`pnpm --filter @taskbar-hero/auth test`), using an in-memory store and real viem signatures.
- `supabase/migrations/20260102000000_siwe_auth.sql`: `consume_siwe_nonce` and `upsert_player_by_wallet`, executable by `service_role` only. Tested with PGlite in `supabase/tests/src/siwe.test.ts`.
- `supabase/functions/_shared/auth.ts`: Postgres store (supabase-js with the service role key, RPC to the two functions), env config, CORS and error mapping.
- `supabase/functions/auth-nonce`, `supabase/functions/auth-verify`: thin `Deno.serve` handlers.

Deno imports `packages/auth/src/index.ts` by relative path. That file has no relative imports, and its bare imports (`jose`, `viem`, `viem/siwe`) resolve through each function's `deno.json` import map to `npm:` specifiers pinned to the same versions as `packages/auth/package.json`. Keep the versions in sync when upgrading.

## Configuration

Edge Function secrets (see `.env.example`):

- `SIWE_DOMAIN`: the web app's host, e.g. `localhost:5173` locally.
- `SUPABASE_JWT_SECRET`: the project's JWT secret (Dashboard, Project Settings, JWT). Hosted Supabase may refuse custom secrets that start with `SUPABASE_`; the function also reads `AUTH_JWT_SECRET` as a fallback.
- `SIWE_ALLOWED_ORIGIN` (optional): CORS origin; defaults to `*`.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the platform.

Functions keep Supabase's default `verify_jwt`, so the client calls them with the anon key (as `functions.invoke` does).

## Not verified yet

- The functions were type-checked and the shared logic was run under Deno 2.9 locally, but they have not been served with `supabase functions serve` or deployed. Check that the deploy bundler includes `packages/auth` (imported from outside `supabase/functions`); if it does not, copy or symlink it into `supabase/functions/_shared`.
- PostgREST must accept HS256 tokens signed with the legacy JWT secret. Projects switched to asymmetric JWT signing keys need the legacy secret kept as a verification key.
- Used and stale rows in `siwe_nonces` are never deleted; add a periodic cleanup (e.g. pg_cron) if the table grows.
