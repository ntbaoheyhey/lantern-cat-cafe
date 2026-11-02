# CXN3-FIX diagnosis — implementation not started

Updated 2026-11-02T00:20:19+07:00. The coordinator completed a bounded read-only investigation. No production code, function deployment, SQL, session or wallet action was performed.

## Current observations

Five fresh probes used the existing strict classifier and 15-second timeout, with no retries, Authorization, API key or session. Boss OPTIONS returned204 in1373ms; anonymous boss POST returned401 in1252ms; oversized boss POST returned401 in275ms and failed the required400/413 criterion. The v2-state control returned401 for the small anonymous request in1062ms; its oversized request timed out at15003ms. This is3PASS/2FAIL for a targeted subset, not a complete live health check. Original CXN3 evidence remains17PASS/10FAIL and is not overwritten.

The former boss timeout did not recur in this sample, while a timeout occurred on the state control. Do not claim a boss-specific implementation defect, a fixed timeout, or a provider root cause from this evidence. Request/runtime logs and further justified observation are still needed. Do not increase the checker timeout or retry away a failure.

Supabase metadata lists all nine v2 functions ACTIVE with verify_jwt=false. Boss is version8 and state version13; versions are per-function counters, not comparable source revisions. Metadata alone does not prove request health. See diagnosis-2026-11-02/deployed-functions.json.

## Source evidence and limits

Repository _shared/v2/http.ts authenticates atline69, admits the player budget, then reads the bounded8192-byte body atline77. An unauthenticated exception therefore returns401 before size validation. This is a concrete repository explanation consistent with the fresh oversized boss response. It is not yet proof of the deployed HTTP implementation.

The configured CLI was used only for functions list and download. Both downloads stopped with UnsafeFunctionDownloadPathError when monorepo source/packages/auth/src/index.ts would leave the allowed function directory. No guard bypass, CLI patch or alternative extraction was attempted. Each partial export contains its entrypoint and shared server.ts; those four files match local bytes. The HTTP handler and remaining dependency graph were not exported, so full deployed source identity remains unverified. Raw downloaded code remains in the private local handoff directory; only metadata/hashes and sanitized CLI logs are published.

## Required fix and verification

Preserve the strict unsigned oversized400/413 criterion and ordinary authentication, budget refusal, CORS, method and no-unauthorized-game-work behavior. Reproduce the body-size precedence locally before changing it; cover exact8192-byte boundaries, actual streamed bytes, absent/misleading Content-Length and cancellation/resource limits. Do not settle for a check that only makes one known probe green. Keep timeout investigation separate until its cause is evidenced. No live migration is assumed necessary.

The item still requires an isolated implementation branch, meaningful regression tests, at least five behavior mutants with green controls, full exact-head gates, two independent grades and the mission's documented release/rollback sequence. Existing credentials authorize only the later bounded release after those gates. No release was performed by this diagnosis.

## Scheduling correction

Insert CXN3-FIX after ART1 and before CXN3. The relative order of every previously prepared item remains unchanged. CXN3 introduces mandatory v2 health checking, whose known live failures would otherwise make its postmerge gate red. The handler/server already exist on main1fb25ed; the fix has no runtime dependency on the CXN3 documentation or checker implementation. The checker can be used as verification tooling from its immutable prepared checkout. This removes the earlier coordinator card's artificial CXN3-before-FIX dependency without waiving any score, serial merge, release or live gate. See docs/decisions/cxn3-fix-live-prerequisite.md on the ledger branch.
