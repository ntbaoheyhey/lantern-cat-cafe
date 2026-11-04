# Gameplay candidate — delivered draft stack
Updated 2026-11-04 14:48 UTC. Latest user instruction: “tiếp tục nha”. One agent only; no agents, schedulers or automations.

## Delivery
- Worktree `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`.
- Base visual PR #278: `f8837d650a7efa5d485223caf9846ef0f54a6494`, `ai/codex-visual-2026-11-04`.
- Published DRAFT stack: [#279](https://github.com/ntbaoheyhey/taskbar-hero/pull/279) guidance/claims → [#280](https://github.com/ntbaoheyhey/taskbar-hero/pull/280) original art → [#281](https://github.com/ntbaoheyhey/taskbar-hero/pull/281) item UI/juice → [#282](https://github.com/ntbaoheyhey/taskbar-hero/pull/282) offline demo/proof.
- Full future release order: #275 → #276 → #277 → #278 → #279 → #280 → #281 → #282. Never merge a tip directly; retarget/recheck each layer.
- Stable runtime `be4abe91cc3044bd34902851ec02cecceadd5df0`; byte-identical to measured runtime `501880eb12de866967ce317ed6fd869447c30a5a` for source, assets, tests, packages, package.json and art pipeline. Published proof checkpoint `64a1b86`; subsequent commits update documentation only. See `delivery.json`.
- Offline demo `/Users/bao/taskbar-hero-gameplay/docs/gameplay/index.html`; open with adjacent `img/`. 12 comparisons at 1280/1920, ordinary views also 1440, actual motion strips, timeline, numeric decisions and exact original-art provenance.
- Report `reports/gameplay/GAMEPLAY-REPORT.md`; evidence index `README.md`; original brief `BRIEF.md`. Candidate build, not live.

## Verified outcomes
- Two full normal-clock ten-minute guest runs. Reward 29.542 → 10.042s; available upgrade 30.196 → 10.146s; boss attempt ~301s unchanged and both lose after 9s. Use `before-corrected-run.json`, not exploratory `before-run.json`.
- Self-reviewed nine-axis score 8.0 → 8.7; Home/Boss/reveal 8.8, Market 8.4. Targets remain open. Long ~30s reward gaps and unaffordable minute-2 crafting remain; single seed does not prove retention/fun/loot distribution.
- 399/399 full E2E + 5/5 compact Forge rerun; 1482 web units; workspace/backend mock suites, typecheck/lint, art:check and 44 catalog tests pass. Eleven inherited rule skips and two expected failures remain unchanged.
- Isolated layers: G1 typecheck +46 focused UI +6 rule/economy tests; full E2E394 passes, all5 failures fixed and covered by9 targeted reruns. Art typecheck/generators/catalog +2 exact pixel tests. UI typecheck +35 focused tests. No skipped assertions; initial failures retained. Forge Cancel layout fix is in G1.
- 24 axe/keyboard views; 3 offline sizes including final draft links, both capture sets, 39 image elements, zero network/axe/overflow/broken links. Effects4/4 at60 FPS; production5-minute soak59.95–60 FPS, renderer3.46–4.38%, stable heap, hidden/reduced CSS0.
- JS+26,285 gzip bytes; 264 changed public images total243,695 bytes. Gallery13,304,053 bytes is documentation only. No need to repeat unchanged runtime tests.

## Boundaries and deferred work
No merge/deployment/Supabase/DB/contract/signing/funds. Protected PRs #244/#252/#257 untouched. Candidate/ledger Vercel Git deployment disabled at repo/web roots. Unrelated dirty main and desktop cwd left untouched; main is newer than the original brief, so do not reset or silently rebase. No WIP commit in the review stack. Existing Sample switches remain default-OFF; interactive boss rules and unsupported economy changes were deferred.

Backlog: sustained pacing/micro-events, human/multi-seed studies, two complete viable builds with unlocked gear, interactive per-chapter mechanics with server/replay agreement, additional portrait expression wiring, richer Market, defeat/loot arcs, time-of-day/audio and broader hardware/power tests. These are explicitly unshipped, not partially wired.

## Finalization checkpoint
Final link/label offline checks pass; task-owned local processes stopped. GitHub CI for new drafts is running; check remote status before final reply. Save final report/handoff/receipts to ledger `/Users/bao/taskbar-hero-ui-ledger`, branch `ai/codex-ui-ledger`, adding ONLY `reports/gameplay/`; unrelated untracked ledger files remain untouched. Final Vietnamese reply ≤10 lines with demo, PRs, score and top3 risks. No additional approval required for the already-authorized draft delivery.

## Local restart
`cd /Users/bao/taskbar-hero-gameplay && pnpm demo`
With coach: `http://127.0.0.1:5391/?demo#home`; skip coach: `http://127.0.0.1:5391/?demo&coach=off#home`. Saves preserved. Fresh profile needed to inspect first-guest coach.
Stopped with targeted TERM after verifying commands/cwd: baseline5390 PID41659, candidate5391 PID41657, production5392 PID58761. Pre-existing port5380 is not ours and remains untouched. No broad pkill.

## Skills
Sites local-only workflow: `/Users/bao/.codex/plugins/cache/openai-curated-remote/sites/1.1.3/skills/sites/SKILL.md`. No image generator, reference-game artwork, external hosting or delegation.
