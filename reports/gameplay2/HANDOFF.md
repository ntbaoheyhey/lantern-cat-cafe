# Gameplay 2 — delivered candidate

2026-11-05 09:47 Vietnam. One agent; no merge or deploy. Work resumed at 09:41 after the user's 08:34 travel pause. The runtime is frozen; remaining quality limits are reported, not hidden.

## Start here

- Offline demo: `/Users/bao/taskbar-hero-gameplay2/docs/gameplay2/index.html`.
- Final report: `/Users/bao/taskbar-hero-ui-ledger/reports/gameplay2/GAMEPLAY-2-REPORT.md`.
- Full raw receipts, screenshots, failed runs and CI logs are archived in this ledger folder. `receipt-manifest.json` records hashes; `delivery.json` binds demo/source identities.
- Source: `/Users/bao/taskbar-hero-gameplay2`, branch `codex/gameplay2-proof-2026-11-05`, proof HEAD `0b925536685512a0672a784fcfffe80097a0a821`, measured runtime `629aa8b3dd0120f1a3e9556b699d539155202296`. Tracked source is clean; untracked local evidence is retained.

## Publication

Drafts #283 rules → #284 original art → #285 UI → #286 proof/demo are pushed, open and unmerged. All exact published heads have green hosted CI. Required full order: #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282 → #283 → #284 → #285 → #286. Never merge a tip directly.

| PR | Head | CI run | E2E | Web units | Native preflight |
|---|---|---|---:|---:|---:|
| #283 | 0dbfd6a | 41942315178 | 399 | 1483 | 6 |
| #284 | 8ccf969 | 41942746535 | 399 | 1483 | 6 |
| #285 | ea8080d | 41945861445 | 412 | 1498 | 6 |
| #286 | 0b92553 | 41949368025 | 413 | 1498 | 6 |

Every node job passes typecheck, lint, workspace tests, build and the unchanged Deno-map drift guard. Rules: 482 passes plus two inherited expected failures/11 inherited skips; backend mock 581, auth 24, chain 32, API contract 16. No new skips. PR #285/#286 descriptions now link the final report/CI. Remote receipts: `ci-final.json`, `draft-prs-final.json`.

Base #282 remains 7eb1ee7; remote main 340f88b; unrelated local main 6144d42 untouched. No Supabase, contracts, DB, migration, signing, funds or protected-PR changes. Vercel is disabled at both candidate configuration roots.

## Findings to preserve

- Main actual-reward max gaps: 30.01–30.20 → 18.01–18.03s across three normal-clock ten-minute walks. Sample opportunity max: 11.27–15.95s. Do not call opportunities human decisions. All nine walk receipts are complete.
- Main first reward at 10.049–10.075s misses strict 10s slightly. Main idle boss still loses, unchanged. New depth is a default-off local Sample with no server grants. Sample idle room-one wins 5/5 model seeds; natural min-max room-two fights take 25–31s.
- Thirty Sample views and 198 keyboard targets across all three desktops: zero axe, overflow, offscreen focus, errors or writes. Existing UI audit: 18 clean views.
- Payload: +23,964 gzipJS bytes, 3,268 image bytes. Production p95 ≤16.8ms, global CLS ≤0.000154, renderer task 0.60–1.16%. Synthetic hidden pauses; real OS visibility/battery unverified. Failed diagnostic is archived, not shipped.
- Offline file: 3,345,132 bytes, 37 embedded assets, 9 timeline rows; all three desktops have zero external requests/errors/axe. Source runtime equals the measured build.
- Retrospective same-rubric early Sample → corrected Sample: 8.34 → 8.56, below 9+. Prior 8.7 visual rubric is not comparable. Scripts are not human retention research; rapid returning/min-max fixture walks are disclosed.
- All 137 numeric decisions and 16 original runtime assets have provenance. No installed skills recorded this pass; no delegation.

## Next user decision

Review the offline candidate; choose further gameplay iteration or ordered merge/release review. Backlog is in the report. Main-game boss changes need a separate server/replay design. No automatic implementation, merge or deployment is queued. Recheck the full stack after any future retarget/merge. Original request: `/Users/bao/.codex/attachments/03d0fb7a-0c2c-4c33-a968-3c39abf27cf3/Pasted text.txt`.

The baseline server was stopped at the travel pause. Final cleanup at 09:50 found the original candidate server (wrapper24197/child24219) still listening on loopback5391 and stopped both task-owned PIDs. The earlier pause handoff incorrectly said the candidate was already stopped. No task browser/test/build is now running. No broad kill. The ledger has unrelated pre-existing untracked files; only gameplay2 paths belong to this delivery.
