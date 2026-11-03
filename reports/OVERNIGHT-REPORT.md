# Taskbar Hero overnight report

Session authorized for ALL lanes on November 4, 2026 Vietnam time. Work began around 2026-11-03T19:17Z. Local work and final SYS gates are complete. Production release is parked by the deployment quota.

## Main and live release

No PR was merged during this overnight session. Main remains `340f88b92405ceb6b5421b207307fdbb283b2ca3`, the previously accepted [#261](https://github.com/ntbaoheyhey/taskbar-hero/pull/261). The live site remains [taskbarhero-eight.vercel.app](https://taskbarhero-eight.vercel.app). Its recorded live entrypoints are `index-Ccs5evFH.js` and `index-jL_b_lsJ.css`. No newer live build is claimed.

GitHub was rechecked during this session. The repository remains private. Superseded drafts #252 and #257 remain open. #244 remains untouched and blocked by its backup/rollback requirement.

## Parked drafts

All scores use the label self-graded (fresh pass). Existing accepted heads retain their receipts.

| PR | Work | Exact head | A / B | Release |
| --- | --- | --- | --- | --- |
| [262](https://github.com/ntbaoheyhey/taskbar-hero/pull/262) | Original additive art | `a9afaad` | 96 / 96 | Parked |
| [263](https://github.com/ntbaoheyhey/taskbar-hero/pull/263) | Motion, HUD containment, stage semantics and reward contrast | `4b0e69a` | 95 / 95 | Parked |
| [264](https://github.com/ntbaoheyhey/taskbar-hero/pull/264) | Labelled conditional samples | `949cc44` | 95 / 95 | Parked |
| [265](https://github.com/ntbaoheyhey/taskbar-hero/pull/265) | Guest first play | `7d0d08e` | 95 / 95 | Parked |
| [266](https://github.com/ntbaoheyhey/taskbar-hero/pull/266) | 624-capture static gallery | `f2a0588` | 95 / 95 | Parked |
| [267](https://github.com/ntbaoheyhey/taskbar-hero/pull/267) | Overnight gallery, static entrypoint and judge walkthrough refresh | `e161f06` | 95 / 95 | Parked |
| [268](https://github.com/ntbaoheyhey/taskbar-hero/pull/268) | Session-expiry explanation and class-confirmation keyboard focus | `afd0699` | 95 / 95 | Parked |
| [269](https://github.com/ntbaoheyhey/taskbar-hero/pull/269) | Nonce hardening, wallet notifications and compact connected-wallet HUD | `85a6919` | 95 / 95 | Parked |

Release order remains #262 → #263 → #264 → #265 → #266, then recovery #268 and SYS #269, followed by final gallery refresh #267. Refresh #267 after the final merged screens are known and verify its 624 hashes again. #267 depends on #266. The recovery and SYS candidates use the accepted FIRSTPLAY parent. Their final merge refresh must wait until that parent reaches main. SYS changes span ten owned paths. Its cumulative diff against current main includes the held UI dependency, so SYS cannot be merged directly onto current main.

## SYS S1 and S2

The nonce health hold is **CLEARED**. Two client-equivalent public POST probes returned HTTP 200 at 2026-11-03T19:20:48Z and 19:31:17Z, 628.63 seconds apart, with valid CORS. Exactly two public nonce probes were made. Historical HTTP 502 root cause remains unproven. Production configuration was untouched. [Diagnosis and evidence](sys/auth-nonce-502.md)

Local PGlite with the migration state before November 3 successfully issues a nonce without the later budget table. This disproves the missing-budget-table explanation for the downloaded wiring. Docker was unavailable, the installed Supabase CLI lacked function logs, and Vercel CLI was absent. The actual live migration inventory and complete deployed dependency graph remain unverified.

Draft hardening initializes dependencies inside the request boundary, fails closed with a CORS-readable 503 and Retry-After, bounds nonce-only retries, and explains that guest play still works. Verification remains single-attempt. The read-only health script suppresses bodies and exits nonzero on failure. Wallet errors use a persistent dismissible notification. Connected controls cause the compact HUD to wrap before Power overlaps Live. Tests cover old migration state, missing configuration/RPC, database failure, retries, malformed nonce responses, notification dismissal and health-script status handling. No nonce limiter is bypassed.

Deployment capacity remains the release blocker. Git fallback counts were 23 main commits and seven merged PRs on November 3 UTC. These do not establish the actual deployment count. Vercel explicitly reported more than 100 deployments and `api-deployments-free-per-day`, again on draft #268 at 2026-11-03T20:41:35Z. The next UTC boundary is **2026-11-04T00:00Z**, a recheck time. Draft #269 exact-head commit status again reports “Deployment rate limited — retry in 24 hours” at 2026-11-03T20:51:55Z. Its other project check was canceled by its existing Ignored Build Step. The latest provider 24-hour warning runs through **2026-11-04T20:51:55Z**. Verify account usage before any release. [Capacity evidence](sys/deploy-capacity.md)

## SYS S3 and UI U2

Current-main regression passed all commands, including 1,448 web unit cases and 368 full browser cases at each desktop size. The known resize-burst check passed five repeats per size, 20 executions total, failure rate 0/20. No main full suite was repeated. [Raw receipt](sys/logs/main-regression/receipt.json)

All SYSTEM request lines received a disposition. Authoritative rune/companion/skill ownership fields were declined because their server contract is absent and this night prohibits inventing new scope. Existing Sample/Unavailable previews remain. CXS1 security overview and CXS2 submission draft already exist on main. No duplicate submission package was created. Original-economy remains default OFF and no economy number changed. [Request dispositions](sys/requests-response.md)

The live UX audit walked fresh and saved-guest journeys, every nav route, Forge modes, Market, read-only Chain proof, Help, offline, mocked API 503, expired session and synthetic wrong network at both sizes. First natural rewards arrived in **29.49 and 29.96 seconds**, meeting the 36-second target. Normal journeys had no product console errors or document overflow. [Live audit and native screenshots](ui/cards/OVN-U2/live-audit.md)

Confirmed medium defects remain live until release. Stage semantics and reward contrast are fixed in held #263. Missing expiry explanation is fixed in #268. Wallet notification and connected-HUD overlap are repaired in the SYS candidate. No other high/medium issue was confirmed within this bounded audit.

## Fresh overnight gates and retained failures

Gallery refresh #267 passed A95/B95, all 624 capture hashes, product gates and standalone artifact gates. Both reviewers passed 20 resize executions, 18 strict audit views and 28 axe scans. Captures retain their candidate-head labels and correctly distinguish current live `340f88b`. Both `docs/ui/gallery/index.html` and `docs/ui/demo/index.html` exist as static HTML. [Gallery refresh report](ui/cards/OVN-GALLERY/REPORT.md)

Recovery #268 passed A95/B95. A passed 16 commands and clean tests-first B passed 14 commands, each with 1,455 web units, typecheck, lint, build, art checks, 33 changed browser executions per size with repeat-each=3, 20 resize executions, 18 strict audit views and 28 axe scans. A ran the full browser matrix once per size, 391/391 each. Native recovery checks add six scans per reviewer and verify Enter, Escape, Cancel and focus return. Scope and all 1,141 original images pass. [Recovery report](ui/cards/OVN-RECOVERY/REPORT.md)

The earlier recovery candidate `993bfc4` passed command gates but failed supplemental keyboard review. Its original baseline and subsequent delayed navigation-focus race remain preserved. Corrected builder passed 100 targeted executions before the new exact-head gates. No failing candidate received a passing overall grade.

SYS `e2994f6` was rejected after native1280 inspection exposed connected-wallet Power/Live overlap that the earlier general geometry audit missed. New explicit HUD geometry checks reproduced it. Corrected `85a6919` passed 24 wallet/error cases per reviewer plus eight late-game/maximum-balance cases each, at both sizes, with zero confirmed axe violations, clipping, unexpected errors, signatures or transactions. A2 hit an inherited five-second StageLayout unit timeout, 1/1,467 failures. B2 passed 1,467/1,467. Five isolated StageLayout runs passed with unchanged timeouts. Fresh serialized A3 passed all 14 commands, including 1,467 web units, 388 full browser cases per size once, 69 changed executions per size with repeat-each=3, 20 resize executions and 18 strict audit views. Clean tests-first B2 passed its 12 commands with the same checks except the shared one-time full matrix. Each reviewer also passed 28 pinned axe scans. Final SYS self-graded (fresh pass) A95/B95. [SYS report and receipts](sys/cards/OVN-AUTH/REPORT.md) Earlier failures remain failed receipts.

An orphaned local server from the interrupted own gate blocked its old ports. Its PID67797 and exact worktree cwd were verified before stopping only that PID. No foreign process was stopped. Existing environment-gated skips and expected-failure cases in the package suite remain unchanged. No test was newly skipped, quarantined or weakened. Axe incompletes remain in raw evidence.

## UI U3

Exact recovery-head effects checks passed 10/10 per size, approximately 60 fps with p95 around 17 ms and no long-frame stalls. Four separate normal/reduced-motion samples measured 60.001–60.004 fps, p95≤16.8 ms and CLS 0. The recovery full suite also asserts zero layout shift in the MOTION fixtures. Main versus the complete held UI stack increases the compressed entry chunk by 1.24 kB. Phaser, stage/arena code and optional art/catalog/sample views already use dynamic imports. [Performance and bundle receipts](ui/cards/OVN-U3/polish-summary.json)

Existing art remains intact. The static gallery preserves 624 captures and native links at 1280×720 and 1600×900. The refreshed 90-second walkthrough and local demos remain reviewable while hosting is blocked. [Local gallery](/Users/bao/taskbar-hero-ovn-ui/docs/ui/gallery/index.html)

## Exact owner steps

1. Open the existing Vercel account usage dashboard after the recheck time and verify actual available quota. A date boundary alone cannot establish capacity.
2. After verification, refresh and release the held stack in order through the documented merge lock. At most one merge per 20 minutes. Stop at 80 deployments or any cap error. Verify live asset hashes and both-size returning/fresh guest, Home and Forge smoke after every merge.
3. Optional backend hardening requires a complete off-repository backup of the deployed function, dependencies and import maps, followed by a successful local restore rehearsal. The supported download attempt fails with `UnsafeFunctionDownloadPathError`. Its partial output is not a rollback backup. Obtain a supported complete export from Supabase before preparing a deployment/rollback command. #244 remains blocked.

The exact attempted read-only backup command and local gallery-open command are recorded in [OPTIONAL-USER-STEPS](OPTIONAL-USER-STEPS.md). Production database mutation, migration, edge/contract deployment, settings/env change, funded wallet action and contest submission remain user-gated and were not performed. No agents, helper sessions, scheduler or orchestrator was started. No merge lock was acquired. The final stop condition is the remaining deployment-capacity and owner backup gates.
