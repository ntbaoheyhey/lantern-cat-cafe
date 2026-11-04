# Gameplay candidate — delivery complete

Final receipt updated 2026-11-04 23:45 UTC (2026-11-05 06:45 in Vietnam). Latest user brief repeats the original request. One agent; no delegation, workers, schedulers or automations. Implementation and validation are closed for this pass; the remaining quality gaps are explicitly deferred below.

## Published candidate and review stack

- Candidate checkout: `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`.
- Exact final proof commit: `7eb1ee7ef052ec90ee2cbc9e2299b185c8ab11b5`. Pushed, clean and independently checked. Keep this commit unchanged; its post-publication receipts live in this ledger.
- Visual base: PR #278, `f8837d650a7efa5d485223caf9846ef0f54a6494`, branch `ai/codex-visual-2026-11-04`.
- #279 guidance: `70594b3bce68df32f8a25ed901f0677446b9806f`, branch `codex/gameplay-onboarding-2026-11-04`.
- #280 art: `68b00038a09e5b47c1fd0ad25b71372678fd3339`, branch `codex/gameplay-art-2026-11-04`.
- #281 UI/juice: `6888df5e15ec2e514c03469110866ce50b882b4f`, branch `codex/gameplay-juice-2026-11-04`.
- #282 proof: exact final candidate commit above; application source/assets/tests/packages/art tools match #281. The proof diff contains docs, reports, tools and `.gitattributes` metadata only.
- All four PRs remain DRAFT and unmerged. Later merge order: #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282. Never merge the tip directly.
- Ledger: `/Users/bao/taskbar-hero-ui-ledger`, branch `ai/codex-ui-ledger`. This final receipt changes only `reports/gameplay/`. Preserve unrelated untracked files. The commit containing this handoff is the final ledger receipt; `delivery.json.ledgerCheckpoint` identifies its preceding published checkpoint.

## Final verification

| Layer | Exact run | Native preflight | E2E | Web units |
|---|---|---:|---:|---:|
| G1 | 41866021161 | 6/6 | 399/399 | 1477/1477 |
| Art | 41866016850 | 6/6 | 399/399 | 1477/1477 |
| UI | 41866018424 | 6/6 | 399/399 | 1482/1482 |
| Proof | 41869199176 | 6/6 | 399/399 | 1482/1482 |

All four official run conclusions are successful. Final proof CI completed at 2026-11-04 16:50:24 UTC. Its node job is 126711578995 and E2E job is 126711579074. The latter log confirms 6 passed in preflight and 399 passed in the full suite. Original logs are `logs/ci-final-proof-node.log.gz` and `logs/ci-final-proof-e2e.log.gz`; all 27 compressed logs match their original byte lengths and SHA-256 hashes in `logs/archive-manifest.json`.

Every node job passes Deno map drift guard, typecheck, lint, workspace/backend mock tests and build. Final proof units include web 1482, game-rules 437, backend mocks 581, auth 24, chain 32 and API contract 16. The 11 inherited rule skips and two expected failures remain unchanged. No E2E test is skipped. G1 also verifies 96 contract tests and the ABI drift guard; unchanged contract jobs are skipped by the existing path filter in later layers.

Final receipts: `ci-final.json`, `delivery.json`, `delivery-integrity.json`, `GAMEPLAY-REPORT.md` and saved PR282 body. The actual proof runtime remains source/asset-identical to UI6888df5. Backend and contract paths remain unchanged from visual base. All 72 gallery image hashes match (13,304,053 bytes).

## Delivered results and explicit limits

- Offline demo: `/Users/bao/taskbar-hero-gameplay/docs/gameplay/index.html` with adjacent `img/`. Twelve matched before/after views, full ten-minute timelines, original sprite previews, animation strips, item ladder, decisions and provenance. Candidate build, not live.
- Guest guidance, visible next goals, earlier server-compatible claims, original Mochi/25 creature/40 item/four Cat Relic art, item comparison/locking/readability and bounded combat/reward feedback are delivered. Detailed research-to-change mapping is in `GAMEPLAY-REPORT.md` and `RESEARCH.md`.
- Both full normal-clock guest runs use the same seed. First acknowledged reward 29.542 → 10.042 seconds; available upgrade 30.196 → 10.146 seconds. Boss attempt stays about 301 seconds and both attempts lose after 9 seconds. Correct baseline: `before-corrected-run.json`.
- Strict nine-axis self-review 8.0 → 8.7. Home/Boss/reveal 8.8 and Market 8.4 miss requested targets. Long ~30-second reward gaps and minute-two crafting affordability remain open. One seed and self-review do not establish human fun, retention or drop distribution.
- Local proof: art check and 44 catalog tests; 24 axe/keyboard views; all three offline gallery sizes; four effects cases near 60 FPS. Five-minute soak: 59.95–60 FPS, stable warmed heap, hidden/reduced CSS animations 0. The soak source remains 501880e; documented narrow Landing fixes were not a new soak.
- Final JS increase: 26,194 gzip bytes. All 264 changed public image files: 243,695 bytes. Documentation images are separate from game payload.

## CI diagnosis retained for reproducibility

Initial CI uncovered a browser-helper Deno import-map issue, art assertions placed too late in the stack and Landing late-font geometry. All were fixed without backend changes. Diagnostic run41863629344 retained the original failing PNGs: each Landing capture differed in exactly859 pixels, confined to fallback symbol glyphs and an adjacent label. All other pixels matched.

E2E now pins the reviewed image `mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`, avoids apt font upgrades, allows20 minutes and retains failure PNGs. No baseline, assertion or tolerance was relaxed. See `native-font-diagnosis.md`, `native-delta-*.json`, the original artifact and `runtime-equivalence.json`.

## Resume demo and backlog

Run `cd /Users/bao/taskbar-hero-gameplay && pnpm demo`.
Coach: `http://127.0.0.1:5391/?demo#home`; skip coach: `http://127.0.0.1:5391/?demo&coach=off#home`. Saves are preserved; use a fresh profile for new-guest onboarding. No task-owned local server remains. Retained production builds are in `/private/tmp/taskbar-hero-gameplay-final-builds-20261104`.

Future work: sustained pacing/micro-events, multi-seed and human first-session studies, two complete viable builds, interactive chapter mechanics needing replay/server agreement, fuller portrait wiring, Market polish, defeat/loot arcs, time-of-day/audio and broader hardware/power proof. These are not represented as shipped. Top risks: passive reward gaps; single-seed/subjective quality evidence; compatibility when the full unmerged stack is eventually released.

Needs the user: review candidate art/feel and decide whether to commission another pass for the documented pacing and 9+ gaps. Later ordered merge/release is a separate step. No required implementation or verification task remains for this delivered pass.

## Boundaries

No merge, deploy/preview, Supabase/DB/contract change, wallet signing or real funds. Protected PRs #244/#252/#257 untouched. Candidate and ledger Git deployment is disabled. Existing Sample flags stay default-OFF. Main and desktop cwd are unrelated dirty checkouts: never reset, stash or checkout there. Never broad-pkill.

Only the Sites skill was used earlier, for local work: `/Users/bao/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md`. No image generation, reference-game art, delegation or external hosting.
