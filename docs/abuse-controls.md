# Abuse-controls assessment

## Current source status — 3 November 2026

V2 per-player route/aggregate request budgets are implemented in [budgets.ts](../supabase/functions/_shared/v2/budgets.ts), with 429/Retry-After denial and 503 fail-closed counter errors. [Hardening tests](../supabase/tests/src/request-budgets-hardening.test.ts) exercise parallel bursts and an actually missing RPC. V2 actual-byte limits, fatal UTF-8 decoding and a total read deadline are covered by [body-limit tests](../supabase/tests/src/v2-body-limits.test.ts). Request-ID replay, revision/ownership checks, starter protection and voucher recovery now have [current source coverage](security-test-matrix.md).

Per-IP/auth-challenge throttling, Sybil resistance and live enforcement are not established by these tests. Production function-source backup/restore remains unresolved in #244. No deployment or migration follows from this documentation. [Consolidated overview](security-overview.md).

## Historical assessment (superseded where corrected above)

Status update (2026-10-26, S2): historical v1 assessment retained; new v2 concurrency tests confirm several atomic boundaries and expose gated retry/equipment/starter gaps; bounded v2 JSON parsing is fixed, request budgets remain proposal-only. See [current review](security-review-2026-10.md).

Assessed on 2026-10-24 against `main` commit `e64934d`, for B3-CX3. This is a source review, not a live penetration test or a deployment/configuration audit. No application, database, contract or game-rule changes are proposed by this patch.

The main exposure is availability: valid and invalid requests can consume Edge Function, database and Fuji RPC resources without an application request budget. Existing checks substantially constrain forged rewards, ownership violations and replay, but gameplay caps do not throttle HTTP requests. Wallet sign-in also does not establish one human per account.

## Evidence and shared boundaries

Reviewed all nine endpoint handlers and the four shared modules under [supabase/functions](../supabase/functions), [auth.md](auth.md), [api.md](api.md), [packages/auth](../packages/auth/src/index.ts), [game rules](../packages/game-rules/src/config.ts), all [database migrations](../supabase/migrations), and [RelicNFT](../contracts/src/RelicNFT.sol). Package rules and SQL were inspected because the handlers delegate their checks there.

- `supabase/config.toml` disables gateway JWT verification for all nine functions. The two auth endpoints are unauthenticated; the seven game endpoints verify the application's HS256 JWT before parsing JSON or querying player state. The verifier pins HS256, audience `authenticated`, required `sub`/`exp`/`iat`, role and wallet type. Issued sessions last at most 24 hours. There is no session revocation list or per-session request quota in the reviewed code; a stolen bearer token remains useful until expiry or signing-secret rotation.
- The caller is the verified JWT `sub`. Body-supplied player IDs, wallet addresses, rewards, timestamps, combat outcomes and seeds do not control those values. Server time determines the game day, resetting at midnight UTC+7. Gameplay limits apply per player, not per IP or human.
- Both HTTP wrappers accept POST and OPTIONS only. Exact allowed origins receive CORS response headers, but an unlisted or absent Origin does **not** reject a POST. Scripts can call the Supabase URL directly. CORS and a public anon key are not bot barriers, and protecting only the Vercel frontend would leave these functions reachable.
- No application-level per-IP/per-player limiter, challenge verification, explicit HTTP body-byte cap, or global admission budget was found. `rate_limited` is reserved in the game API; these routes do not currently emit it. JSON is parsed before auth payload field-length checks, so those checks do not bound the incoming body. Platform limits may exist; their deployed settings and effectiveness were not verified.
- RLS is enabled on all eight tables. Player tables have own-row SELECT policies (`id` or `player_id = auth.uid()`), with no client write policies; anon/authenticated table privileges are revoked and only authenticated SELECT is restored. `siwe_nonces` has no client grants or policies. Public RPCs used by the server grant execution only to `service_role`; internal helpers are further restricted, and default privileges for future objects are hardened.
- The Edge Functions use the service role, which bypasses RLS. Their JWT-derived player ID and explicit SQL ownership predicates are therefore the effective isolation boundary for requests through these endpoints. RLS does not rate-limit them. The app's custom JWT is not a Supabase Auth session and, per [auth.md](auth.md), is not accepted by PostgREST with the normal separate signing secret. Do not assume the client can exercise those SELECT policies with its app token.

Supabase's primary documentation confirms the [service-role RLS bypass](https://supabase.com/docs/guides/database/postgres/row-level-security) and provides an [application rate-limiting example](https://supabase.com/docs/guides/functions/examples/rate-limiting). These references explain platform behavior, not evidence that a limiter is deployed here.

## Endpoint assessment

### Auth challenge: `auth-nonce`

**Abuse:** An anonymous script can repeatedly request challenges, causing an RPC, cleanup work and an insert per request. Parallel requests can grow the set of fresh unused nonces and consume database/Edge quotas without owning a wallet.

**Existing limits:** Nonces use 128 random bits from WebCrypto. Redemption is single-use and limited to ten minutes. `create_siwe_nonce` deletes **up to 1,000 used or older-than-ten-minute rows per creation**; it does not delete fresh unused nonces. This is cleanup, not a hard table-size limit or request throttle. The description of a bounded table in `auth.md` should not be read as a fixed maximum under sustained issuance; without new calls, stale rows also remain until later cleanup. Nonces are server-only via grants/RLS. No issuance cap or binding to an IP/wallet exists.

### Sign-in: `auth-verify`

**Abuse:** Repeated well-shaped messages can force parsing and signature recovery, including replayed signatures whose nonce check eventually fails. A bot can generate many wallet keypairs and sign in to create many players and idle-state rows. It can also repeatedly sign in to one wallet; authentication has no wallet balance, NFT ownership or human-uniqueness prerequisite.

**Existing limits:** Message length is at most 2,048 characters and the signature must be a 65-byte hex signature. Canonical SIWE, expected domain/URI, Fuji chain ID 43113, issue/not-before times (60-second future skew), non-expired message, and recovered signer are checked. Issue-time age permits the ten-minute window plus skew, but database nonce redemption itself requires creation less than ten minutes ago. Atomic `consume_siwe_nonce` prevents concurrent replay; it runs after signature verification, so invalid signatures cannot burn another nonce. Wallet uniqueness maps repeat sign-ins to one player. JWT expiry limits session duration, not request count. No failed-login throttle, player-creation budget or Sybil resistance is present.

### `game-state`

**Abuse:** Any valid session can poll continuously. Each snapshot aggregates the player's entire inventory and queries keys, attempts and vouchers; repeated legitimate claims can grow inventory and future response/aggregation costs. Many wallets amplify that load.

**Existing limits:** JWT-derived ownership isolates snapshots. Starter gear is initialized under a player lock with a second existence check, preventing parallel first loads from duplicating starters. This is not strictly read-only: snapshots also ensure idle state exists, and shared `load` can sign/store an unsigned pending voucher. There is no polling limit, inventory pagination or lifetime inventory cap in this path. The 40-drop claim cap below does not bound total inventory.

### `idle-claim`

**Abuse:** A bot can automate claims at the best allowed cadence and send overlapping claims, invent body fields, or flood requests that earn nothing. Frequent claims can keep receiving the full-rate online window without proving active human play.

**Existing limits:** Elapsed time and gains are server-derived. Claims less than ten seconds apart return 200 with no new drops and leave the claim timestamp unchanged; they still load state. A successful claim credits at most eight hours, with the first five minutes at full rate and the rest at 50%, and returns at most 40 new gear items. There is no separate daily claim/reward cap. SQL locks the player/state and compares the exact previous microsecond timestamp before crediting, so concurrent claims against one window cannot both pay. A secret HMAC over player and previous claim timestamp fixes that window's seed, preventing a retry from choosing a new seed. Automated play within these rules remains possible.

**Concurrency boundary:** Gear/power and gains are read/computed before the credit transaction; the SQL compare checks the claim timestamp, not a gear version. This review does not prove that interleaved equip/upgrade requests use one consistent gameplay snapshot. That is a source-level concern, not a demonstrated reward exploit.

### `boss-fight`

**Abuse:** A bot can immediately consume all attempts, repeat requests after exhaustion, or race fights to try to duplicate a win/key or select results. Client-side replay animation does not slow a direct API caller.

**Existing limits:** Server simulation uses equipped power, boss level and an HMAC seed over player/day/next attempt. SQL locks the player and rechecks the five-attempt daily limit; wins and losses consume attempts. Boss level is capped at 50 and updated using `greatest`/`least`, so two parallel wins at the same level advance it only once. A unique player/day Boss Key row limits key grants to one per day. Exhaustion returns 409 `no_attempts_left`, not an HTTP throttle.

**Concurrency boundary:** Simulation and the next-attempt seed are computed from a snapshot before SQL acquires its lock. SQL does not compare an expected attempt number or boss level. Concurrent requests can therefore compute the same attempt seed/stale level while recording separate attempts. The daily cap and key uniqueness still hold; the claim that every recorded attempt necessarily has a distinct simulation seed is not established. Fairness impact needs a focused concurrency test; no exploit was run here.

### `upgrade`

**Abuse:** A player can spam valid/invalid gear IDs or race upgrades to try to overspend gold, use stale prices or modify another player's gear. Automatic upgrades can also contend on that player's locks.

**Existing limits:** Gear IDs must be UUIDs and owned by the JWT player. Server rules compute cost and power. SQL locks player/item/state, checks the expected current level, available gold and maximum level 30, then spends gold and increments the level atomically. Stale requests are repriced at most three times before `server_error`. Unknown and foreign items return `not_owner`. No request cooldown or daily upgrade count exists; gold and level limits constrain successful actions, not failed-request load.

### `equip`

**Abuse:** Repeated swaps or foreign UUID guesses can consume snapshots, transactions and player-lock time. A client can try equipping multiple items in one slot or items it does not own.

**Existing limits:** UUID validation and SQL's `player_id` predicate enforce ownership. A player lock serializes swaps, and the partial unique index allows at most one equipped item per slot. Re-equipping the same item avoids unnecessary gear updates but still invokes the route/queries. No cooldown, daily cap or HTTP request budget exists.

### `relic-forge`

**Abuse:** Race requests to double-spend resources or reroll rarity; repeatedly retrieve/reissue vouchers; withhold mint reports to try to obtain a second voucher for an already minted forge. Even blocked calls consume server/database work, and expired-pending calls can trigger Fuji reads.

**Existing limits:** One paid forge per player per UTC+7 day is enforced by a unique row and player lock. A new forge costs 30 shards and one Boss Key, deducted transactionally. An issued pending voucher is returned without another spend or reroll, even if from an earlier day. Rarity is fixed by the HMAC of player/day. Voucher lifetime is 30 minutes. Reissue waits until more than 120 seconds after expiry, checks `usedNonces` on Fuji, and either marks the old voucher minted or replaces it with a fresh nonce for the same paid forge/relic/rarity. SQL serializes reissue; only one issued voucher per forge is allowed. Repeated renewals can accumulate expired rows; there is no lifetime renewal count.

EIP-712 binds the voucher to player, relic ID, rarity, nonce, expiry, chain 43113 and the configured RelicNFT address. The contract requires the caller to be that player, a valid authorized signature, an unexpired voucher and an unused nonce; it marks the nonce used before the ERC-1155 receiver hook. These protect replay across callers/chains/contracts and reuse of one nonce. The contract itself has no per-human or daily forge cap: it trusts server issuance.

**Assumptions:** Reissue safety depends on the configured RPC seeing the mint before reporting an old nonce unused; the grace period is not a finality proof. `usedNonces` also becomes true for owner cancellation, which this server path treats as minted without a receipt/hash. No stale-RPC or reorg exploit was demonstrated. Deployed signer/address/RPC correctness was not verified.

### `relic-mint-report`

**Abuse:** Submit fabricated hashes, another player's nonce, or repeatedly submit distinct nonexistent hashes for an owned unminted voucher to force Fuji receipt reads and retries.

**Existing limits:** Nonces must be positive decimal strings within signed Postgres bigint range; hashes must be 32-byte hex. SQL first loads the caller's voucher, so an unknown/foreign nonce returns `not_found` before a chain read. Unminted reports require a successful receipt containing a `RelicForged` log emitted by configured RelicNFT with matching player, relic ID, rarity and nonce. A successful unrelated tx or event from another contract is insufficient. An already minted voucher returns state without another receipt read. Errors return 409 `mint_not_confirmed` and remain retryable. The RPC transport has a ten-second timeout and one retry, but there is no per-player RPC budget, persistent negative cache or application concurrency cap. Receipt validation does not wait for a confirmation depth or recheck canonicality later; it validates event provenance, not the outer transaction's destination.

## Recommended controls (five maximum)

These are future work, in priority order, not implemented here. Dollar figures are **incremental estimates**, assuming the existing free project has headroom; effort is one developer's estimate including tests. They are not vendor pricing/availability guarantees. None requires changing game economy numbers, NFT contracts or introducing a fungible token.

| Priority | Practical control | Cost and effort | Coverage and limitations |
| --- | --- | --- | --- |
| 1 | Add shared, atomic request budgets before expensive work. Start with auth issuance/verification per trusted client IP (e.g. 10/minute, burst 5), and game calls per verified player (e.g. 120/minute overall, burst 20), with stricter RPC-bound budgets. Return 429 with `Retry-After`; keep only short-lived counters. | Estimated $0 extra service spend using a private Postgres counter/RPC; extra DB writes per accepted/checked request. About 1–2 days. | Tune against real client traffic; these are proposed HTTP budgets, not gameplay changes. Use only a platform-verified IP source, not arbitrary forwarded headers; allow for shared Wi-Fi/NAT. Atomic shared storage is needed across isolates. An in-function limiter still consumes an invocation and a counter lookup, so it cannot by itself prevent quota exhaustion. A future external gateway must prevent direct-origin bypass to protect invocation quota. |
| 2 | Bound request parsing in shared wrappers: cap actual streamed bytes (e.g. 8 KiB), reject oversized bodies early with 413, constrain JSON structure/field types, and avoid trusting only `Content-Length`. | Estimated $0 extra services, lower wasted parsing/memory; about half a day. | Apply before `req.json()`, including ignored-body routes. Retain current field validation. Stops body amplification, not floods of small valid requests; verify configured platform limits separately. |
| 3 | Budget Fuji lookups per player/voucher, coalesce duplicate in-flight reads and briefly cache pending/not-found receipt results (e.g. 5 seconds); bound outstanding lookups and back off on upstream errors. | Estimated $0 extra services with existing storage; counters/cache add DB work, but reduce RPC traffic. About 1 day. | Reject/report retry timing without breaking eventual mint reporting. An isolate-local cache alone is only best effort. Never reuse cached `nonceUsed = false` to authorize voucher reissue; use a fresh authoritative read and fail closed on RPC trouble. Distinct fake hashes still require the player-level budget. |
| 4 | For a small hackathon demo, optionally gate **new-player creation** behind a server-validated, expiring, single-use invite code, while allowing existing players to sign in. Keep a bounded invite pool and revoke unused codes after the event. | Estimated $0 service spend; about 1 day plus manual distribution. | Practical friction against many-wallet farming without changing per-player rewards. Requires an approved sign-in/API change and reduces open access. It is not proof of one human: invitations can be shared. A wallet signature alone is not Sybil resistance. |
| 5 | Set a small global admission/RPC budget and a server-side emergency switch for new sign-ins/forges, supported by aggregate endpoint/status/RPC-error and new-wallet counts. Give the owner a short recovery runbook and expiry for temporary blocks/counters. | Estimated $0 extra services with existing logs/config and private counters; about half to one day plus manual monitoring during the demo. | Log no bearer tokens, signatures, message bodies or secrets. Test that disabling issuance preserves reads and mint-report recovery. A global budget can deny legitimate users during abuse, so it is a last-resort availability tradeoff; it also cannot refund already invoked functions. |

## Unverified points and open questions

- This assessment assumes the migrations and reviewed source are deployed together. Live grants, RLS policies, function bundles, secrets, allowed origins, RPC configuration, usage quotas and any external firewall rules were not inspected. No requests were sent to the live app or chain for abuse testing.
- No application-level limiter in this repository does not prove there is no platform DDoS mitigation. Conversely, provider infrastructure protection does not establish a usable per-player budget. Verify available settings and current plan terms before selecting a gateway or new service.
- Suggested thresholds, dollar costs, effort and likely quota bottlenecks are estimates; traffic measurements and shared-network behavior may require different values. The reviewed code does not establish how quickly a real attacker could exhaust the free deployment.
- Decide whether automated play within the normal rules is acceptable for the demo, and whether restricting new-player access is worth the onboarding friction. Current caps are per wallet/player, with no global NFT issuance cap or human identity guarantee.
- Resolve the boss attempt/snapshot concurrency concern and the voucher reissue finality assumptions with focused tests before describing those properties as absolute guarantees. Neither was verified with a live exploit in this docs-only task.
