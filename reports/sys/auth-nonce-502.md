# Auth-nonce 502 — overnight diagnosis

**Health HOLD CLEARED**, by the user's two-successes-at-least-ten-minutes-apart rule. No production fix/deployment/migration was performed. The previous historical 502 remains a recorded incident with **unproven root cause**; do not describe this code patch as its repair.

| Probe (client-equivalent public POST, no auth headers/body) | UTC request timestamp | Status | Observation |
| --- | --- | --- | --- |
| 1 | 2026-11-03T19:20:48.838570Z | 200 | JSON nonce, redacted; expected live-origin CORS |
| 2 | 2026-11-03T19:31:17.468499Z | 200 | JSON nonce, redacted; 628.629929 seconds after first |

Exactly two public nonce probes. Status, selected response headers and at most200 body characters saved in auth-evidence; no nonces or tokens retained. Separate execution IDs show distinct invocations. No real wallet connection, signature, session or gameplay write.

## Evidence and classification

Logged-in Supabase CLI reports auth-nonce/auth-verify ACTIVE v46, last updated2026-10-31T03:54:09.558Z, verify_jwt=false. ACTIVE is metadata rather than runtime proof. Installed CLI2.122.0 has no function-log subcommand; Vercel CLI is absent. No credentials requested/read/printed and no log-access guard bypassed. Docker daemon is unavailable, so `supabase functions serve` was not used.

Read-only supported `supabase functions download auth-nonce --project-ref qoalewtxflagoprrxrgh --use-api --workdir /tmp/taskbar-hero-ovn-auth-source` stops with UnsafeFunctionDownloadPathError on source/packages/auth/src/index.ts. Partial downloaded auth-nonce/index.ts and _shared/auth.ts are byte-identical to current main. The complete deployed package graph/import maps remain unverified; this is not a valid rollback backup and #244 stays blocked.

Downloaded nonce wiring calls create_siwe_nonce directly and does not call v2_take_budgets or any limiter. A local PGlite created with migrations before20261103 proves successful nonce issuance without20261103/04/06 (and without private.v2_request_budgets). This disproves a missing-budget-table explanation for that wiring. It models the requested old migration state; the actual live migration inventory was not independently established. Do not apply speculative migrations.

Both live probes show the configured production URL and CORS currently work. No evidence distinguishes an earlier cold-start/worker crash, gateway timeout or transient upstream outage. Missing configuration and a missing create_siwe_nonce RPC are locally reproducible failure modes, not asserted historical causes.

## Local hardening — draft ca26498, not live

The original entrypoint initializes pgStore before Deno.serve. The unmodified original fails the added startup reproducer with missing SUPABASE_SERVICE_ROLE_KEY before registering a handler (baseline red log retained). The patch initializes the store within the request boundary. Database/configuration failure returns503, `{error:"auth_unavailable",retryAfter:30}`, Retry-After30, no-store and expected CORS. It never returns an unstored nonce or bypasses limits. Preflight/method rejection remain independent of the database; auth verification semantics remain unchanged.

The client retries only nonce transport/5xx failures, bounded to three requests with250ms/500ms backoff and10s request timeouts. A server Retry-After ends automatic retries; verification is never retried. A 5xx/transport/malformed-success state displays “Wallet sign-in is temporarily unavailable, guest play still works.” The wallet wrapper now has named group semantics. A mocked502 component spec proves the message, visible retry action, no signature/verification and no session. A new scripts/health-auth.sh suppresses all bodies/credentials and exits nonzero for5xx, other non2xx and transport failures.

Builder:31 edge tests,21 wallet/client tests,6 health-script tests PASS before the final null-response regression was added. Final exact-head A/B receipts supersede these builder counts; see logs/auth-a and auth-b. Baseline red skips are setup-failure consequences, not skipped/quarantined green tests.

## What remains

No owner backend repair is required for the now-cleared health rule. The optional hardening patch still needs the full gate, deployment capacity and a future backend deployment explicitly performed by the owner; this session is not authorized to deploy it. Complete function source/dependency/import-map backup and tested rollback remain prerequisites; the supported download fails, so do not proceed to deployment commands. User steps and quota recheck are recorded in OPTIONAL-USER-STEPS.md. Frontend merges remain parked by S2's capacity rule, independently of this cleared health hold.
