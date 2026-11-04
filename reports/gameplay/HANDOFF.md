# Gameplay pass — final delivery in progress
Updated 2026-11-04 14:35 UTC. One agent only. Original outer deadline 17:45:44 UTC. Latest user instruction is “tiếp tục nha”; the ledger's old paused checkpoint is superseded.

## Boundaries
Worktree `/Users/bao/taskbar-hero-gameplay`, branch `ai/codex-gameplay-2026-11-04`, visual base #278 `f8837d6` / `ai/codex-visual-2026-11-04`. Do not touch the dirty main or desktop cwd checkouts. No merge, deploy, Supabase, contracts, DB, signing or real funds; #244/#252/#257 untouched. Only draft PRs stacked after #278. Original brief: `reports/gameplay/BRIEF.md`.

## Completed
- Runtime through `501880e`: optional coach, contextual goals, verified early first claim; original Mochi/25 creatures/40 item silhouettes/4 Relics; truthful comparison and bonus-quality reveal; bounded replay feedback and no-coach guest entry.
- Two complete ten-minute normal-clock guest runs; final baseline is `before-corrected-run.json`, candidate `after-run.json`. Reward 29.542→10.042s, available upgrade 30.196→10.146s, boss ~301s unchanged. Long reward gaps and first boss loss remain. No claim of solved retention/fun or 9+ quality.
- 399/399 E2E, 5/5 final compact Forge regression, web 1482 units, root package/backend suites, typecheck/lint, art check +44 catalog tests PASS. Game-rules has 11 inherited skips +2 expected failures, none introduced. Current passing receipts: `logs/unit-verified.log`, `logs/art-tests-verified.log`; older failures retained.
- 24 axe/keyboard views PASS; offline gallery 3 sizes, both image sets, 39 image elements, no external resources/broken links/axe/overflow errors PASS.
- Effects 4/4 PASS (60 FPS, p95≤16.8ms, CLS0). Production 5-minute soak PASS: ~60 FPS, renderer3.46–4.38%, stable warm heap, hidden/reduced CSS0. Full changed public image payload243,695 bytes including SVG replacements; JS+26,285 gzip bytes. No need to repeat unchanged runtime tests.
- `docs/gameplay/index.html` has 12 matched comparison pairs at 1280/1920, ordinary views also at1440, actual motion strips, timeline, art/rarity gallery, numeric decisions, provenance. File check passed.
- `GAMEPLAY-REPORT.md` updated with results, strict score8.0→8.7, home/boss/reveal8.8, Market8.4; targets remain explicitly open. Skills used: Sites local-only. No agents/schedulers.

## Remaining delivery
1. Finish report/receipts consistency and compress bulky logs without deleting failure evidence.
2. Split unpushed history into logical draft review layers: G1/config/tests, art, UI/juice, proof. Before push, add explicit Vercel git deployment exclusions for every candidate branch at repo/web roots; inherited ignoreCommand alone produced skipped deployment attempts in old PRs. Fix G1's root gameplay export on its own layer (final tree already removes it), since backend uses restricted import maps. Preserve UI direct subpath imports; no package exports or Supabase map edits.
3. Push, create draft stack via GitHub connector, add URLs and merge order to report/gallery. Main stays untouched. No WIP commit in review stack. Verify final runtime diff unchanged by splitting.
4. Copy only our `reports/gameplay/` to ledger `/Users/bao/taskbar-hero-ui-ledger` on `ai/codex-ui-ledger`, commit/push only these paths, leaving unrelated untracked work intact.
5. Stop verified task-owned local processes after final checks; final Vietnamese answer ≤10 lines with demo path, PR links, score, top3 risks.

## Runtime processes
Baseline5390 PID41659, candidate5391 PID41657, production5392 PID58761. Verified task-owned. Other pre-existing port5380 is NOT ours. Kill only verified owned PIDs. Start candidate later with `pnpm demo`; with coach `http://127.0.0.1:5391/?demo#home`, skip coach `?demo&coach=off#home`; preserve saves. Performance source runtime501880e, production `apps/web/dist-gameplay-after`.
