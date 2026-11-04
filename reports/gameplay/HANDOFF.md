# Gameplay candidate — final container CI and ledger delivery
Updated 2026-11-04 16:37 UTC. Latest user instruction: “tiếp tục nha”. One agent only; no delegation, schedulers or automations. Original five-hour deadline: 17:45:44 UTC; report honestly and stop by then.

## Delivered work and boundaries
- Worktree `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`. Desktop cwd/main are unrelated dirty checkouts: do not reset/stash/checkout there.
- Base #278 `f8837d650a7efa5d485223caf9846ef0f54a6494`, `ai/codex-visual-2026-11-04`.
- DRAFT stack #279 guidance → #280 original art → #281 items/juice → #282 offline proof. Full later merge order #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282. Never merge the tip directly.
- G1 `70594b3bce68df32f8a25ed901f0677446b9806f`, Art `68b00038a09e5b47c1fd0ad25b71372678fd3339`, UI `6888df5e15ec2e514c03469110866ce50b882b4f` are pushed. Proof branch1f6313b is pushed on final UI; current report/PR-body checkpoint needs a regular commit/push.
- G1 checkout `/Users/bao/taskbar-hero-gameplay-review`; UI checkout `/Users/bao/taskbar-hero-gameplay-art-review` (Art branch available there).
- No merge/deploy/preview, DB/Supabase/contracts change, signing or funds. Protected #244/#252/#257 untouched. Candidate/ledger Git deployments explicitly disabled. Existing Sample features default-OFF. No partial/WIP gameplay delivered.

## Actual results and limits
- Two complete seeded normal-clock guest runs: first reward29.542→10.042s; available upgrade30.196→10.146s; boss~301s unchanged and both lose after9s. Correct baseline `before-corrected-run.json`. Long~30s reward gaps and unaffordable minute2 craft remain.
- Strict nine-axis self-review8.0→8.7; Home/Boss/reveal8.8 and Market8.4 miss requested targets. One seed and self-review do not establish human fun/retention/distribution.
- Pre-follow-up local E2E399/399; web1482/1482; workspace/backend mocks, lint/typecheck/art/44 catalog tests pass. Eleven inherited rule skips and two expected failures unchanged. 24 axe/keyboard views; four effects cases~60FPS; five-minute soak59.95–60FPS, stable warm heap, hidden/reduced CSS0. Soak source501880e, with later narrow Landing fixes documented, not rerun.
- Final JS+26,194 gzip bytes;264 changed public images243,695 bytes. Gallery13,304,053 bytes is docs only. Application source/assets in6888df5 are exactly identical to9051efc; only CI config and native-platform documentation changed.
- Offline `docs/gameplay/index.html` + adjacent `img/`:12 before/after pairs, full ten-minute timeline, original sprites/animation strips, decisions/provenance. Report `reports/gameplay/GAMEPLAY-REPORT.md`; full brief `BRIEF.md`.

## Native CI diagnosis and current runs
Initial CI uncovered Deno-map drift (browser helpers moved to `packages/game-rules/client/gameplay.ts` without touching backend), misplaced art assertions, and Landing late-font geometry. Those were fixed; earlier Art/UI suites reached397/399, with only two Landing PNGs failing and all four delayed-font checks passing.

Diagnostic run41863629344 onb46a691 retained PNG artifact13341362610. Each1280/1600 image differs in exactly859 pixels, confined to the proof-strip arrows/checkmark/adjacent label. All other pixels identical. Hosted Ubuntu fallback symbol fonts differ from the Noble container used for reviewed baselines. See `native-font-diagnosis.md`, `native-delta-*.json`, original `native-failure-41863629344/`. The local exact six-case suite had passed inside that same container with Chromium156.0.8078.4.

Commitc8a8474 pins E2E to `mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`. Final70594b3 also avoids apt upgrades of pinned fonts and allows20 minutes for container startup plus the full suite. No source, baselines or tolerances changed. It also retains the earlier PNG upload and six-case preflight. Propagated G1→Art→UI→Proof via rebase, separate assertions preserved; G1/Art/UI pushed. Final runs: G1 **41866021161**, Art **41866016850**, UI **41866018424** (41865323933 superseded duplicate). The superseded first pinned run41865231768 passed6/6 preflight cases on GitHub, then was cancelled by final70594b3. All three final runs now officially completed successfully; each passes6/6 preflight and399/399 E2E. All node jobs pass; G1 contracts96/96. Exact receipts:ci-final.json and logs/ci-final-*.log.gz.

GitHub run-list/job-list status can lag badly: prior run still reported queued after its artifact and completed job logs existed. Prefer fetching job logs by ID for final evidence. Read job IDs from each final run before fetching logs. GitHub connector supports job logs; `structuredContent.content` is log text. A404 BlobNotFound means the log is not finalized yet, not a test failure.

## Remaining actions
1. Final runtime CI is complete: G1/Art/UI all green, each6/6 preflight+399/399 E2E. All four PR descriptions now include exact final runtime results. Gallery6888df5 label passes all three desktop sizes. Do not rerun unchanged gameplay/perf.
2. Commit/push the final proof changes now (regular push, no rebase needed). Use a normal CI-triggering commit, without skip-ci, for an exact final proof-head check. Onlydocs/gameplay/index.html andreports/gameplay/are modified. Proof application paths exactly match UI6888df5.
3. After proof CI completes, record its exact SHA/run/logs in the ledger copy ofci-final.json,delivery.json,GAMEPLAY-REPORT.md,HANDOFF.md and PR282 body. Keep the tested proof commit unchanged; the proof report already links to the ledger post-publication receipt. This avoids an endless cycle of changing a commit to record its own check.
4. Copy ONLYreports/gameplay/to ledger `/Users/bao/taskbar-hero-ui-ledger`, branchai/codex-ui-ledger; stage that subtree only, commit/push. Preserve unrelated untracked files. Ledger checkpointdb51796 is already pushed, with earlier partial receipts; final refresh remains.
5. No task server/process currently remains; prior PIDs80310/80594 stopped. Do not stop pre-existing servers. Production builds retained/private/tmp/taskbar-hero-gameplay-final-builds-20261104.
6. Vietnamese final≤10 lines: candidate demo/report, four draft PRs,8.0→8.7, reward29.5→10.0s and top3 risks. Candidate only, no merge/deploy. Mark the delivery goal complete only after proof CI and ledger finalization.

## Resume demo and backlog
`cd /Users/bao/taskbar-hero-gameplay && pnpm demo`
Coach: `http://127.0.0.1:5391/?demo#home`; skip: `http://127.0.0.1:5391/?demo&coach=off#home`. Preserves saves; fresh profile for new coach.
Only Sites skill used earlier (local-only), at `/Users/bao/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md`. No external art, generator or hosting.
Backlog: sustained pacing/micro-events, human/multi-seed studies, two complete viable gear builds, interactive chapter mechanics requiring replay/server agreement, fuller portraits, Market polish, defeat/loot arcs, time-of-day/audio, broader hardware/power proof. These remain explicitly unshipped.
