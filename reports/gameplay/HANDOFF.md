# Gameplay pass — final delivery in progress
Updated 2026-11-04 14:49 UTC. One agent only. Original outer deadline 17:45:44 UTC. Latest user instruction is “tiếp tục nha”; the ledger's old paused checkpoint is superseded.

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

## Delivery checkpoint
- Four clean review layers prepared: onboarding `7d8d821`, original art `6b532f6`, item UI/juice `be4abe9`, proof branch `ai/codex-gameplay-2026-11-04`.
- All candidate branches and ledger exclude Vercel Git deployment at repository/web roots. No WIP commit is in the review ancestry. No backend/contract files changed.
- G1 typecheck, 46 focused UI tests, 6 rule/economy tests, full E2E 394 passes with all 5 failures fixed and covered by 9 targeted reruns. Compact Forge Cancel fix lives in G1. Art layer typecheck, generators, 44 catalog tests and 2 exact pixel tests pass. UI layer typecheck and 35 focused tests pass. Initial failures retained.
- Original measured runtime `501880e` and isolated runtime `be4abe9` have an empty diff for application source, public assets, E2E, packages, root package and art pipeline. Full existing runtime proof remains applicable.
- `delivery.json` and gallery label now reference stable runtime SHA; URLs will be inserted after draft PR creation.

## Remaining delivery
1. Commit/push proof plus three preceding branches; create four DRAFT PRs stacked after #278. User explicitly authorized push/draft delivery. Never merge/deploy.
2. Insert actual PR URLs in delivery.json, report and generated gallery; rerun the offline gallery check for changed links/label; commit/push documentation only.
3. Copy only our `reports/gameplay/` to ledger `/Users/bao/taskbar-hero-ui-ledger` on `ai/codex-ui-ledger`, commit/push only these paths, leaving unrelated untracked work intact. Ledger deployment is already explicitly disabled.
4. Verify remote stack/draft state; stop only verified task-owned local processes; final Vietnamese answer ≤10 lines with demo path, PR links, score, top3 risks.

## Runtime processes
Baseline5390 PID41659, candidate5391 PID41657, production5392 PID58761. Verified task-owned. Other pre-existing port5380 is NOT ours. Kill only verified owned PIDs. Start candidate later with `pnpm demo`; with coach `http://127.0.0.1:5391/?demo#home`, skip coach `?demo&coach=off#home`; preserve saves. Performance source runtime501880e, production `apps/web/dist-gameplay-after`.
