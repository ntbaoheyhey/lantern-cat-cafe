# SYS-HEALTH-001 — auth-nonce HTTP502

Status: OPEN. This is a backend health failure, separate from the corrected returning-guest UI defect.

## Observations

- Exact frontend source340f88b matches35/35 live assets before and after independent guest tests.
- The unchanged legacy check-live run at2026-11-03T12:57:22–12:57:58UTC returned21PASS/1FAIL: auth-nonce POST returned502 instead of200.
- One bounded follow-up POST at13:00:01UTC also returned502; request id01a1a17e-c155-7e0e-96dc-5e95d8bf01ad.
- A diagnostic GET at13:25:02UTC returned502,text/plain for auth-nonce; request id01a1a195-a8b3-769f-89a1-1817f9fd4cd0.
- The auth-verify control GET returned405,application/json as expected. The checked-in common handler rejects non-POST before issuing any nonce.
- Authenticated CLI metadata reports auth-nonce and auth-verify ACTIVE,version46,updated2026-10-31T03:54:09.558Z,verify_jwt=false. ACTIVE does not establish runtime health or source identity.
- PR261 changes no Supabase,auth-package or wallet source. These observations do not establish the deployed failure's cause.
- The installed CLI functions commands expose metadata/download/deploy/serve, not function logs. No download guard was bypassed and no deployment was attempted.

The original failing gate remains failed; no retry-to-green or weakened assertion was used. Response bodies, nonces and tokens were not retained. Two CLI-created local metadata cache files contained no credential-named fields and were removed only from the owned clean worktree.

## Owner diagnostic step

Open Supabase projectqoalewtxflagoprrxrgh → Edge Functions → auth-nonce → Logs/Invocations. Inspect2026-11-03 12:57–13:25UTC (19:57–20:25 Vietnam time), using the request ids above. Provide only the sanitized platform error category and a redacted diagnostic message. Do not share credentials, database URLs, session tokens, nonces or raw exports.

This step is read-only. Do not redeploy, migrate, edit player data, rotate credentials, bypass the export guard or change production flags based on this report. The separate #244 complete-backup/tested-restore prerequisite remains unresolved.

## Evidence

[Original gate](../CXQ1-FRESH/post-cxr2/logs/health.log), [follow-up](../CXQ1-FRESH/post-cxr2/auth-nonce-followup.json), [method diagnostic](../CXQ1-FRESH/post-cxr2/method-diagnostic.json), [deployment metadata](../CXQ1-FRESH/post-cxr2/function-metadata.json).

New sign-ins may fail. Existing sessions and guest play are separate; the guest path passed. Unrelated main merges remain held while this required health check fails. Independent local work can continue without backend activation.
