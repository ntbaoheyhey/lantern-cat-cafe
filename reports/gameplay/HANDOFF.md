# Gameplay candidate — final CI and ledger delivery
Updated 2026-11-04 15:40 UTC. Latest user instruction: “tiếp tục nha”. One agent only; no subagents, schedulers or automations.

## Delivered candidate
- Worktree `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`. Desktop cwd and main are unrelated dirty checkouts: do not reset, stash or checkout there.
- Visual base #278: `f8837d650a7efa5d485223caf9846ef0f54a6494`, `ai/codex-visual-2026-11-04`.
- DRAFT stack: #279 guidance/claims → #280 original art → #281 item UI/juice → #282 offline demo/proof. Full future merge order #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282; never merge a tip directly.
- Final runtime `9051efccc9b24fa29b9f575e6935bb6222cd300f`. Source in proof worktree matches #281 exactly. Compared to measured `501880e`, only the documented client-helper relocation and final Landing geometry/candidate-label/test/native-baseline changes differ. Gameplay, economy, replay and original art are unchanged. See `runtime-equivalence.json`.
- G1 `1f5ead0a18ee7fbba1691225e61fe8fc51ff83b9`, Art `88d65d43a3c95caf5229f8837b32fc1a33da3a7f`, UI `9051efccc9b24fa29b9f575e6935bb6222cd300f`. G1 worktree `/Users/bao/taskbar-hero-gameplay-review`; UI currently checked out in `/Users/bao/taskbar-hero-gameplay-art-review`.
- Offline demo `/Users/bao/taskbar-hero-gameplay/docs/gameplay/index.html` with adjacent `img/`. Twelve matched comparisons, full ten-minute timeline, looping original sprites and actual animation strips, decisions and provenance. Label: Candidate build, not live.
- Report `reports/gameplay/GAMEPLAY-REPORT.md`; evidence index `README.md`; exact original request `BRIEF.md`.

## Measured outcomes and limits
- Two full normal-clock seeded guest runs: first reward29.542 →10.042s, available upgrade30.196 →10.146s. Boss attempt~301s unchanged; both lose after9s. Corrected baseline is `before-corrected-run.json`; exploratory baseline retained separately.
- Strict nine-axis self-review8.0 →8.7; Home/Boss/reveal8.8, Market8.4. Requested9+/8.5 targets remain open. Long~30s reward gaps and unaffordable minute2 crafting remain. One seed and self-review do not establish fun, retention or loot distribution.
- Local pre-follow-up full E2E399/399 plus compact Forge5/5; web1482/1482; workspace/backend mocks, typecheck/lint, art check and44 catalog tests pass. Eleven inherited rule skips and two expected failures unchanged.
- 24 axe/keyboard views; offline artifact at1280/1440/1920 passes again on the final runtime label, with39 image elements, no requests/errors/broken links/overflow/axe findings. Four effects cases~60 FPS. Five-minute optimized build soak59.95–60 FPS, renderer task time3.46–4.38%, stable warm heap; hidden/reduced CSS0. Soak source remains501880e, not rerun for Landing-only edits.
- Final production JS+26,194 gzip bytes;264 changed public images total243,695 bytes. Gallery13,304,053 bytes is documentation only.

## CI follow-up
Initial GitHub failures exposed Deno-map drift, misplaced art-layer test assertions, native screenshot differences and actual late-font shifts on Landing. Helpers now live in `packages/game-rules/client/gameplay.ts` without changing Supabase or its generator. Art assertions live in Art. Landing reserves text/button/proof-link geometry and displays the candidate label. Native baselines use exact comparison with documented Linux/macOS captures; no checks/tolerances skipped. Four native Linux delayed-font cases and final six local pixel/font cases pass. All initial failure receipts remain.

At the latest checkpoint (15:49 UTC), native Art41858845586 and UI41858844077 both pass397/399 E2E and all node checks; only the two exact Landing PNG comparisons fail. All four delayed-font cases pass. G1 run41858775255 was superseded by diagnostic run41861194618 on72b30e2. The exact six-case suite passes inside local Noble Linux with Chromium156.0.8078.4 (not a version mismatch); therefore do not blindly regenerate/relax native baselines. The existing GitHub workflow did not upload attached failure screenshots. G1 commit72b30e2 adds only an actions/upload-artifact step on browser failure; it is pushed and its CI is running. The next step is to download its browser-failure-evidence artifact and inspect the exact pixel delta. Initial/final failed logs are retained. No remote-green claim is valid yet.

Proof branch is published at57f04c2 and matches9051efc UI runtime; it has not yet inherited72b30e2 CI diagnostics. UI currently checked out in the art-review worktree. After fixing native evidence, propagate G1→Art→UI→Proof with explicit force-with-lease for task branches, retaining separate layer assertions.

Local reproduction: `/private/tmp/taskbar-gameplay-ci-local/config.cjs` selects the unchanged two pixel and four font tests against `/private/tmp/taskbar-hero-gameplay-final-builds-20261104/dist-gameplay-final-perf`; its server is isolated inside a transient `mcr.microsoft.com/playwright:v1.64.1-noble` linux/amd64 container. Mount repo read-only at/repo, builds at/build, `/private/tmp/taskbar-gameplay-chrome-156` at/browser and diagnostics at/proof. Exact shell path `/browser/chrome-headless-shell-linux64/chrome-headless-shell`. Six cases pass in24.5s; container stopped. See `logs/native-suite-reproduction.log`.

## Remaining delivery steps
1. Check final native CI; resolve any concrete failures without skipping tests. No need to rerun unchanged full local gameplay or ten-minute sessions.
2. Update report, delivery manifest, this handoff and draft PR bodies with exact CI outcomes. Save/push proof branch with explicit lease (own task branch only).
3. Copy ONLY `reports/gameplay/` into ledger `/Users/bao/taskbar-hero-ui-ledger`, branch `ai/codex-ui-ledger`; stage that subtree only, commit/push. Preserve all unrelated ledger files. Ledger currently contains an obsolete pause handoff and must be refreshed.
4. Final font-check servers80310 (G1 port5393) and80594 (proof port5394) were stopped after verifying command/cwd. No task server remains. Production build outputs were retained at `/private/tmp/taskbar-hero-gameplay-final-builds-20261104`. Never broad-pkill or stop pre-existing servers.
5. Vietnamese final reply≤10 lines: offline demo/report links, draft PR links,8.0→8.7 score and top3 remaining risks. No additional approval needed for already-authorized draft delivery.

## Boundaries and backlog
No merge, deploy/preview, Supabase/DB/contract change, signing or funds. Protected PRs#244/#252/#257 untouched. Candidate and ledger Vercel Git deployment disabled. No WIP in delivered stack; existing Sample switches stay default-OFF. Unsupported interactive mechanics and reward changes were deferred.
Backlog: sustained pacing/micro-events; human and multi-seed studies; two complete viable gear builds; interactive chapter mechanics with replay/server agreement; fuller portrait wiring, Market, defeat/loot arcs, time-of-day/audio and broader hardware/power measurements. All explicitly unshipped.

## Local restart and skill
`cd /Users/bao/taskbar-hero-gameplay && pnpm demo`
Coach: `http://127.0.0.1:5391/?demo#home`; skip: `http://127.0.0.1:5391/?demo&coach=off#home`. Saves preserved; fresh profile for new-guest coach.
Sites local-only workflow: `/Users/bao/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md`. No external hosting, image generator, reference-game art or delegation.
Original work start12:45:44 UTC and outer five-hour deadline17:45:44 UTC. Continue only within that budget, then report honestly and stop.
