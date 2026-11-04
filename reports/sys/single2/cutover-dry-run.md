# CXN3 local cutover dry-run — repo-source only

Read-only source: #244/db0f9d6, especially docs/cutover-v2.md and docs/runbook.md. Neither #244 nor its branch was changed. A disposable detached1eefc3e checkout received the exact verifier/docs files listed in [source manifest](cxn3-local/source.json); imported code never ran the live-check main entry point.

| Runbook step | Local result / limit |
| --- | --- |
| Install lockfile | PASS in current stack and verifier checkout. |
| Generate Deno maps, verify no drift, strict import guard | PASS, all18functions. Generation and resolution were separate checks. |
| Pure response classifier | PASS; mocked transport exercises all27unsigned probe shapes. No live call. |
| Read-only17-object catalog | PASS against fully migrated PGlite; old Nov2snapshot correctly reports10present/7missing. |
| Pending migrations on prior schema, replay twice | PASS in verifier tests; full from-zero migration tests also pass in the package gate. |
| Classic/v2 isolated builds and browser journeys | Stack gate passes both configurations. Dedicated local cutover52/52 HTTP/browser cases pass against its migrated disposable snapshot. |
| Data/security-preserving local rollback | PASS at toolingf1a3388: exact current shared schema/RPC/grant/policy definitions retained; v1 sentinel gold123/shards50 and game_snapshot preserved; anon/authenticated nonce reads and budget RPC execution still denied. |
| Founder batch | N/A, explicitly dropped in #244; no batch migration imported, applied or fabricated. Existing table remains part of normal source tests. |
| Native Supabase/Deno | NOT RUN: Docker daemon unavailable and Deno absent. Node endpoint harness and PGlite are not a native gateway. |
| RC tag/push, live catalog, all deployed function versions, production flag, deploy/promote | PARKED: release/user gates, no real-project mutation. No RC was created. |
| Complete deployed backup, matching manual rollback files | BLOCKED: supported complete deployed export still missing; supabase-manual/v2-rollback.sql and per-migration live-approved rollbacks are absent. Disposable SQL fixture is not a replacement. |
| Production smoke and signed Fuji journey | PARKED: quota/owner prerequisites; no signature, funding or real transaction. |

The original rehearsal compared the post-security shared schema to the obsolete pre-security schema and failed after52passing browser cases. The fix compares the retained current shared objects exactly and removes only disposable v2 gameplay objects. Earlier failure logs are preserved in [local-system-final](local-system-final/). This is not a live SQL rollback procedure: live recovery must retain all player rows and use the verified frontend deployment/flag process only after owner authorization.

Evidence: [classifier/catalog log](cxn3-local/local-checks.log), [52-case and rollback log](local-system-final/local-system-security-builder.log), [repository restore evidence](repo-restore/f1a3388/receipt.json). Historical #244 runbook permissions do not override SINGLE2's explicit no-deploy/no-live-write rules. No rate limiter was bypassed.
