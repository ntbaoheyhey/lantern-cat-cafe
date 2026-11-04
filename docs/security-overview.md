# Security overview

Taskbar Hero separates local guest play, authenticated server state and Fuji transactions. This is a source based overview, not a production penetration-test report. [Current evidence and limits](../reports/n2-security-docs.md) distinguish checked-in protections from deployed verification.

## Sign-in and identity

Wallet sign-in uses EIP-4361. The server checks the canonical message, domain, URI, Fuji chain 43113, time window and recovered signer before atomically consuming a ten minute nonce. Sessions use HS256, require subject/expiry/issued-at, pin the authenticated audience and role, and last at most 24 hours. Gameplay uses the verified player subject; body-supplied wallets and player IDs are not authority. See [auth.md](auth.md), [auth-wrappers.test.ts](../supabase/tests/src/auth-wrappers.test.ts) (“a used challenge cannot be replayed: second use is 401 invalid_nonce”) and [auth unit tests](../packages/auth/src/index.test.ts).

Guest saves are editable browser data. They are not proof of server progress, ownership or mint eligibility. The production sign-in path without a configured backend refuses access unless explicitly built for mock authentication; [authApi.test.ts](../apps/web/src/wallet/authApi.test.ts) and [prodBundle.test.ts](../apps/web/src/wallet/prodBundle.test.ts) cover that boundary.

## Server authority and database isolation

Server handlers derive rewards, time, costs, seeds and combat outcomes from owned state and checked-in rules. SQL ownership predicates, row locks, revision checks, resource checks and unique constraints enforce the relevant atomic boundary. A valid wallet does not authorize another player's inventory.

Local migration tests check RLS and grants, including nonce and budget tables and service-role-only RPCs. The service role bypasses RLS, so explicit ownership checks inside handlers/RPCs remain essential. [new-migration-security.test.ts](../supabase/tests/src/new-migration-security.test.ts) applies the real migrations to disposable PGlite and tests denied client privileges. That is not proof of production policy state or multi-connection PostgreSQL scheduling.

## Availability and safe retries

V2 route and aggregate budgets are keyed by verified player identity. Denial returns 429 with Retry-After; an unavailable counter fails closed with 503 before game work. [request-budgets-hardening.test.ts](../supabase/tests/src/request-budgets-hardening.test.ts) includes “a genuinely missing v2_take_budgets RPC returns HTTP 503 and never runs game work”. These are per-player protections; per-IP limits and human uniqueness remain gaps. CORS is not authentication or a bot barrier.

V2 parsing bounds actual request bytes to 8,192 and the total body-read deadline to ten seconds, rejects invalid UTF-8 and cancels oversized/incomplete streams. [v2-body-limits.test.ts](../supabase/tests/src/v2-body-limits.test.ts) covers exact limits, chunked bodies, stalled cancellation and aborts.

Request IDs bind retries to player and intent. [security-races.test.ts](../supabase/tests/v2/security-races.test.ts) checks “replaying a funded craft must reuse the original result rather than charge again” and “does not cache failed mutations and rolls back SQL exceptions with their spend”. [concurrency-hardening.test.ts](../supabase/tests/src/concurrency-hardening.test.ts) forces shared snapshots and cross-player reports. No claim is made that every route or distinct request is globally idempotent.

## Relics and recovery

RelicNFT is ERC-1155. EIP-712 vouchers bind player, Relic ID, rarity, nonce, expiry, chain and contract. Minting requires the intended caller and signer; used nonces prevent replay. Receipt reporting verifies the successful mint's contract and fields. [voucher-security.test.ts](../supabase/tests/src/voucher-security.test.ts) and [VoucherReplay.t.sol](../contracts/test/VoucherReplay.t.sol) test these boundaries locally.

Paid-but-unminted claims stay recoverable. Reissue uses fresh nonces, ownership and lease checks, with a second chain read before releasing a replacement signature. [relic-recovery.test.ts](../supabase/tests/src/relic-recovery.test.ts) includes “state and a concurrent forge cannot sign a replacement before the creator's second chain read”. Recovery is not permission to erase live player data.

Help's public proof panel reads Fuji 43113 at the configured NFT `0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D` and Market `0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93`. Code presence, linkage and bounded recent events are read-only observations, not a mint/list/buy receipt, source verification or lifetime supply count.

## Release evidence and unresolved limits

The [Deno import guard](../scripts/check-deno-imports.mjs) resolves each function's transitive imports with its own map; [deno-imports.test.ts](../supabase/tests/src/deno-imports.test.ts) detects missing map edges. The historical extensionless-import defect is repaired in merged source. [Bundle scanning](../scripts/check-bundle.mjs) rejects secret-looking output; it is a limited check, not a guarantee against every leak.

PR #244 remains unmerged: a complete deployed Supabase function backup and tested restore path are unavailable. CLI export failed with UnsafeFunctionDownloadPathError. Partial files do not form a rollback bundle. The [owner recovery step](https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/OPTIONAL-USER-STEPS.md) requires supported recovery of source, dependencies and import maps, then local restoration testing. No backend deployment/migration or production flag change is authorized here.

Merged code, limited live health checks and deployed-source identity are separate claims. Live function identity, full policy enforcement and a fresh funded wallet journey remain NOT VERIFIED. This overview neither certifies an audit nor clears #244. See the [security test matrix](security-test-matrix.md) for source coverage and gaps.

As of the [November 4 release check](release-status.md), two earlier public nonce HTTP 200 probes 628.63 seconds apart cleared the availability hold. The historical 502 cause remains unproven. Draft #269 adds nonce failure handling and client guidance; its edge source is not deployed, and this overview does not attribute those protections to production. Deployment capacity separately holds the frontend release.
