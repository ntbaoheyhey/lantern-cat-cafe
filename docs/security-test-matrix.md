# Security test matrix (S2/C2)

Where each required expectation is tested. All run offline on PGlite (`pnpm --filter @taskbar-hero/supabase-tests test`).
Proposals for decisions U-1 to U-4 already exist as docs only: see the last section.

| Area | Expectation | Test |
| --- | --- | --- |
| RLS | every public table has RLS, anon reads/writes nothing, authenticated is SELECT-only on own rows, server-only tables unreadable, forged wallet claim does not widen access | `supabase/tests/src/rls.test.ts` |
| RLS | public functions executable by service_role only; security definer pins empty `search_path`; new objects are not client-accessible | `src/rls.test.ts`, `src/siwe.test.ts` |
| SIWE | nonce used once, concurrent use has one winner, stale/unknown/empty/differently-cased nonce refused | `src/siwe.test.ts`, `src/rls.test.ts` |
| SIWE | replay is 401 `invalid_nonce`; forged signature leaves nonce usable; wrong time, domain, chain are 401 and create no player | `src/auth-wrappers.test.ts` (needs `jose`) |
| EIP-712 voucher | signer recovered for exact voucher; any changed field (player, relicId, rarity, nonce, expiry), other contract, other chain, other key does not recover the server signer; mint receipt must match player, relicId, rarity, nonce, contract and succeed | `src/voucher-security.test.ts` (new, 19 tests) |
| EIP-712 voucher | re-issue after expiry, same-day return of the same voucher, expired-but-minted recorded | `src/forge.test.ts` |
| Idempotency | parallel claim, boss (last key), craft, salvage, equip, forge, class select; `requestId` bound to intent and player; lost-response replay does not charge twice | `v2/security-races.test.ts`, `v2/concurrency.test.ts`, `src/concurrency.test.ts` |
| Rate limit | burst budget across parallel calls, anonymous RPC denied (budget SQL applied only to a disposable clone) | `v2/security-proposals.test.ts` |
| HTTP boundary | body bound at 8 KiB by streamed bytes, identity from the token not the body, no internal error leaks | `v2/security-http.test.ts`, `src/malformed.test.ts` |

## Defects found
None new. No failing-then-documented test was needed. Existing proposals still stand and were not changed:
U-1 production must not fall back to mock sign-in (`docs/proposals/auth-hardening-v2.md`), U-2 service-only `siwe_nonces`
(`docs/proposals/sql/siwe-nonces-rls.sql`), U-3 request limiter (`docs/proposals/rate-limit-v2.md`), U-4 recovering a stuck
Relic voucher (`docs/proposals/relic-recovery.md`). The user applies migrations by hand.
