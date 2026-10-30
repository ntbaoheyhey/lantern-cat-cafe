# Security test matrix

Maps each security requirement to the test that proves it. All tests run offline against a disposable in-memory Postgres (PGlite) with the real migrations and the real Edge Function handlers; none touch a live database, the Fuji RPC or a live account. Run them with `pnpm --filter @taskbar-hero/supabase-tests test` (or `cd supabase/tests && npx vitest run`).

Paths are relative to `supabase/tests/`. **GAP** means the requirement is not enforced by code on `main` today, so there is no passing test for it; the linked proposal is the fix.

| # | Requirement | Test | Status |
| --- | --- | --- | --- |
| 1 | RLS enabled on every v1 public table; anon has no grants, authenticated at most SELECT, no writes, no column writes | `src/rls.test.ts` "every public table" | covered |
| 2 | Players see only their own rows; unknown or missing `sub` and forged wallet claims see nothing | `src/rls.test.ts` (reads nothing / forged wallet claim) | covered |
| 3 | RLS and grants on the six v2 tables; one select policy each; v2 functions service_role only, security definer with empty `search_path` | `v2/schema.test.ts` | covered |
| 4 | `siwe_nonces` is not readable or writable by clients | `src/siwe.test.ts` (functions not callable by anon/authenticated), `src/rls.test.ts` (no client read of server-only tables), `v2/security-proposals.test.ts` (proposal SQL, disposable DB) | covered by default-deny; the restrictive deny-all policy is **proposal only** ([sql/siwe-nonces-rls.sql](proposals/sql/siwe-nonces-rls.sql), U-2) |
| 5 | SIWE nonce is single use; reuse returns 401 `invalid_nonce` | `src/auth-wrappers.test.ts` "a used challenge cannot be replayed"; `src/siwe.test.ts` consume once and concurrently; `src/rls.test.ts` used nonce stays refused | covered |
| 6 | SIWE nonce expiry, unknown nonce, case sensitivity, empty nonce | `src/siwe.test.ts` (stale/unknown/just inside window); `src/rls.test.ts` "SIWE nonce edges"; `src/auth-wrappers.test.ts` unknown or expired challenge | covered |
| 7 | SIWE wrong domain, wrong chain, bad time window, forged signature (nonce stays usable after a bad signature) | `src/auth-wrappers.test.ts` "the signed message's time, domain and chain are enforced", "consumed only by a valid signature"; `../../packages/auth/src/index.test.ts` | covered |
| 8 | Malformed sign-in requests never reach the database; method and CORS handling | `src/auth-wrappers.test.ts` "malformed requests" | covered |
| 9 | Production must not accept mock sign-in when the backend URL is missing | none | **GAP**, proposal U-1 ([auth-hardening-v2.md](proposals/auth-hardening-v2.md)) |
| 10 | Voucher tampering: any changed field (player, relicId, rarity, nonce, expiry), contract address, chain id, domain name/version, signing key or signature bit does not recover the server signer | `src/voucher-security.test.ts` "voucher signature binds every field and the domain" | covered (new) |
| 11 | Mint receipt must match player, relicId, rarity, nonce, contract and success; reverted, missing, log-less and undecodable receipts rejected | `src/voucher-security.test.ts` "receiptMintsVoucher ..."; `src/forge.test.ts` "refuses receipts that do not mint exactly this voucher" | covered (new, plus existing) |
| 12 | Voucher nonce replay: minted nonce cannot be re-issued or re-signed; another player cannot report it; re-issued vouchers get new nonces; chain-used nonce is never re-signed | `src/concurrency.test.ts` "mint voucher nonce replay"; `src/forge.test.ts`; `src/voucher-security.test.ts` "replay of a used nonce or a reused mint transaction" (one player's mint tx cannot confirm another's voucher; second report keeps first tx hash; same-day forge after mint is blocked) | covered |
| 13 | Voucher signer misconfiguration fails before spending; malformed key never echoed | `src/forge.test.ts` "answers server_error when the signer is not configured"; `src/voucher-security.test.ts` "refuses a malformed private key" | covered |
| 14 | Double and concurrent claim | `src/concurrency.test.ts` idle-claim; `v2/concurrency.test.ts`; `v2/security-races.test.ts` "parallel claims credit one window" | covered |
| 15 | Double and concurrent craft/upgrade/salvage/equip | `src/concurrency.test.ts` upgrade; `v2/security-races.test.ts` craft, salvage, equip, class selection | covered |
| 16 | Double and concurrent boss fight (daily cap, one key, one first clear) | `src/concurrency.test.ts` boss-fight; `v2/concurrency.test.ts`; `v2/security-races.test.ts` "two boss requests using the last key" | covered |
| 17 | Concurrent Relic forge pays once, one voucher | `src/concurrency.test.ts` relic-forge; `v2/security-races.test.ts` "parallel forges and retry" | covered |
| 18 | requestId idempotency: bound to intent, scoped per player, failed mutations not cached, lost-response replay does not spend again | `v2/security-races.test.ts` (requestId tests at "binds a requestId...", "replaying a funded craft", "a lost boss response replay", "does not cache failed mutations") | covered |
| 19 | HTTP trust boundary: streamed body cap, authenticated identity wins over body fields, no internal error leaks | `v2/security-http.test.ts`; `src/malformed.test.ts` | covered |
| 20 | Request/rate limiting: repeated or hostile traffic is throttled | `v2/security-proposals.test.ts` tests the proposed SQL budget only | **GAP**: no limiter exists in the functions, proposal U-3 ([rate-limit-v2.md](proposals/rate-limit-v2.md)) |
| 21 | Paid-but-unminted Relic can be recovered after a cancelled voucher | none | **GAP**, proposal U-4 ([relic-recovery.md](proposals/relic-recovery.md)) |

## Not covered by any offline test (NOT VERIFIED)

- Live Supabase policies, grants and Edge Function secrets: tests prove the checked-in migrations, not what is applied live.
- The deployed RelicNFT contract's signature check: contract tests live in `contracts/` (Foundry) and need a contracts-capable session; this matrix only covers the server's signing side.
- Real Fuji RPC behaviour: receipts and `usedNonces` are faked through `ChainReader`.

## Result of the last run

See [reports/C2.md](../reports/C2.md).
