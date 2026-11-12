# CHAIN request boundary — 2026-11-12

The three authenticated demo functions now read at most 1,024 actual UTF-8 bytes with a ten-second total upload deadline. Chunked bodies, false Content-Length, invalid UTF-8, non-object JSON, unsupported actions, extra client authority fields and malformed seal IDs are rejected before RPC, inventory access or signing. Timeout, abort and oversized-body cleanup never wait for an uncooperative producer.

Only exact, intentional PostgreSQL P0001 exceptions from an allowlist become recovery codes. Raw SQL/RPC messages, hints and details remain hidden. Quotas return429, missing player-owned items404, unpaid seals and missing judge passes409. Browser text comes from a fixed local dictionary; unknown codes and gateway HTML have a generic retry message. No payment, fee, allocation or authentication rule changed.

The disposable Anvil HTTP harness now uses the same parser and error mapping. check-drip.mjs proves rejected payloads create no drip or judge entitlement, then verifies the actual0.05 AVAX transfer, idempotency and crash recovery. Existing seal tests still prove payment amount/ownership/nonce integrity.

Focused tests: 40 SQL/domain/request and19 browser error cases initially passed; the full suite also covers an added already-aborted upload case. Deno2.5.6 checks all three actual function entry points. Full gate results are recorded in PROGRESS.log and tests/http-*.log. Feature flags remain the existing opt-in flags. User redeployment is required for these source changes to reach hosted functions; no migration, secret change or public operation was performed here.
