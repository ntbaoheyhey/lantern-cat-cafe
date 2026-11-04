# Gameplay candidate — final container CI and ledger delivery
Updated 2026-11-04 16:17 UTC. Latest user instruction: “tiếp tục nha”. One agent only; no delegation, schedulers or automations. Original five-hour deadline: 17:45:44 UTC; report honestly and stop by then.

## Delivered work and boundaries
- Worktree `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`. Desktop cwd/main are unrelated dirty checkouts: do not reset/stash/checkout there.
- Base #278 `f8837d650a7efa5d485223caf9846ef0f54a6494`, `ai/codex-visual-2026-11-04`.
- DRAFT stack #279 guidance → #280 original art → #281 items/juice → #282 offline proof. Full later merge order #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282. Never merge the tip directly.
- G1 `c8a8474f1ce04fdeb958dd51dcd7b55272417698`, Art `e1ba53c756a57d58dacbb6e94e5fbc15437c8ec6`, UI `24809e94dfd4d0074e3d0ccc8f9e4344ddbf7d6b` are pushed. Proof branch rebased locally onto final UI; pending evidence changes must be committed/pushed with explicit lease against remote `4ae6d29` (resolve full SHA first).
- G1 checkout `/Users/bao/taskbar-hero-gameplay-review`; UI checkout `/Users/bao/taskbar-hero-gameplay-art-review` (Art branch available there).
- No merge/deploy/preview, DB/Supabase/contracts change, signing or funds. Protected #244/#252/#257 untouched. Candidate/ledger Git deployments explicitly disabled. Existing Sample features default-OFF. No partial/WIP gameplay delivered.

## Actual results and limits
- Two complete seeded normal-clock guest runs: first reward29.542→10.042s; available upgrade30.196→10.146s; boss~301s unchanged and both lose after9s. Correct baseline `before-corrected-run.json`. Long~30s reward gaps and unaffordable minute2 craft remain.
- Strict nine-axis self-review8.0→8.7; Home/Boss/reveal8.8 and Market8.4 miss requested targets. One seed and self-review do not establish human fun/retention/distribution.
- Pre-follow-up local E2E399/399; web1482/1482; workspace/backend mocks, lint/typecheck/art/44 catalog tests pass. Eleven inherited rule skips and two expected failures unchanged. 24 axe/keyboard views; four effects cases~60FPS; five-minute soak59.95–60FPS, stable warm heap, hidden/reduced CSS0. Soak source501880e, with later narrow Landing fixes documented, not rerun.
- Final JS+26,194 gzip bytes;264 changed public images243,695 bytes. Gallery13,304,053 bytes is docs only. Application source/assets in24809e9 are exactly identical to9051efc; only CI config and native-platform documentation changed.
- Offline `docs/gameplay/index.html` + adjacent `img/`:12 before/after pairs, full ten-minute timeline, original sprites/animation strips, decisions/provenance. Report `reports/gameplay/GAMEPLAY-REPORT.md`; full brief `BRIEF.md`.

## Native CI diagnosis and current runs
Initial CI uncovered Deno-map drift (browser helpers moved to `packages/game-rules/client/gameplay.ts` without touching backend), misplaced art assertions, and Landing late-font geometry. Those were fixed; earlier Art/UI suites reached397/399, with only two Landing PNGs failing and all four delayed-font checks passing.

Diagnostic run41863629344 onb46a691 retained PNG artifact13341362610. Each1280/1600 image differs in exactly859 pixels, confined to the proof-strip arrows/checkmark/adjacent label. All other pixels identical. Hosted Ubuntu fallback symbol fonts differ from the Noble container used for reviewed baselines. See `native-font-diagnosis.md`, `native-delta-*.json`, original `native-failure-41863629344/`. The local exact six-case suite had passed inside that same container with Chromium156.0.8078.4.

Commitc8a8474 pins E2E to `mcr.microsoft.com/playwright:v1.64.1-noble@sha256:2f05f8a734509a7b3f26a912639488ee08f58a7b292d14d62271bcff9038768f`. No source, baselines or tolerances changed. It also retains the earlier PNG upload and six-case preflight. Propagated G1→Art→UI→Proof via rebase, separate assertions preserved; G1/Art/UI pushed. Final runs: G1 **41865231768**, Art **41865325281**, UI **41865324182** (41865323933 superseded duplicate). Await completion before claiming green.

GitHub run-list/job-list status can lag badly: prior run still reported queued after its artifact and completed job logs existed. Prefer fetching job logs by ID for final evidence. G1 E2E126697947666, node126697947595, contracts126697947509. GitHub connector supports job logs; `structuredContent.content` is log text. A404 BlobNotFound means the log is not finalized yet, not a test failure.

## Remaining actions
1. Check final container CI and fix concrete failures without skipping tests. No need to rerun unchanged ten-minute/perf runs.
2. Update final report/delivery/equivalence/handoff and all four PR bodies with exact receipts. Runtime SHA24809e9; gallery generator reads delivery.json. Gallery check with new label was just launched; collect its result.
3. Commit/push proof with explicit lease, preserving reports. Run final proof CI if time permits; distinguish source-equivalent evidence from exact proof-head CI.
4. Copy ONLY `reports/gameplay/` to ledger `/Users/bao/taskbar-hero-ui-ledger`, branch `ai/codex-ui-ledger`; stage that subtree only, commit/push. Preserve unrelated untracked ledger files. Ledger still has older handoff.
5. Stop owned processes only; no task server presently running. Previous ports5393/5394 PIDs80310/80594 already stopped. Builds retained `/private/tmp/taskbar-hero-gameplay-final-builds-20261104`.
6. Final Vietnamese≤10 lines: offline demo/report, draft PRs,8.0→8.7, key metrics and top3 risks. Existing draft-delivery authorization needs no additional permission.

## Resume demo and backlog
`cd /Users/bao/taskbar-hero-gameplay && pnpm demo`
Coach: `http://127.0.0.1:5391/?demo#home`; skip: `http://127.0.0.1:5391/?demo&coach=off#home`. Preserves saves; fresh profile for new coach.
Only Sites skill used earlier (local-only), at `/Users/bao/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md`. No external art, generator or hosting.
Backlog: sustained pacing/micro-events, human/multi-seed studies, two complete viable gear builds, interactive chapter mechanics requiring replay/server agreement, fuller portraits, Market polish, defeat/loot arcs, time-of-day/audio, broader hardware/power proof. These remain explicitly unshipped.
