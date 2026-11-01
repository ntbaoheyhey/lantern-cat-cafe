# Active runtime handoff — 2026-11-01

The mission is active and incomplete. No PR has been scored or merged. Read mega-scorecard.md, mega-ledger.md and MEGA-FINAL-REPORT.md first. Preserve all original dirty worktrees.

## Current code and branches

- Main remains 1fb25ed. Baseline logs are committed on ledger under reports/baseline/2026-11-01-main-1fb25ed.
- Ledger worktree /Users/bao/.codex/worktrees/mega-ledger/taskbar-hero on ai/codex-mega-ledger, PR #241. Full source brief is reports/mega-mission.md; plan is mega-plan.md.
- BASE0 builder /Users/bao/.codex/worktrees/mega-deno0/taskbar-hero, branch ai/codex-mega-deno0, draft #246. Latest code 1ea0c33 (classic smoke exact configured viewport fix). All app code is committed/pushed; accumulated verification evidence remains uncommitted in reports/scorecard/base0. DENO0 was folded into this baseline prerequisite before the queue. No score.
- BASE0 fresh verification worktree mega-base0-verify-r4/taskbar-hero at latest code; full run currently active, logs stored in builder reports/scorecard/base0/logs/full-r4. Earlier r3 at a40f7ff passed full 254 tests at default size; native 1600 run 253 pass/1 fail exposed fixed smoke assumption. Earlier r2 also 254 pass; initial r1 253 pass/1 fail topbar, fixed.
- Other BASE0 verify worktrees: mega-base0-verify at 1eb7d58; mega-base0-verify-r3 at a40f7ff. The r3 worktree currently runs 1600-default affected specs repeat10 on ports 4294–4297. Prior 1280-default repeat10 completed 360/360 in 450s, no failures. The smoke fix adds smoke.spec.ts to required repeats.
- BASE0 scratch mutation worktree mega-base0-mutations at b6c1201, currently restored/clean. 6 generator mutants + 5 scene/HUD/artifact mutants + 2 effects mutants detected. Raw logs in BASE0 and DENO0 scorecard folders; artifact contracts distinguish underlying test exit 0 from combined contract failure. Controls pass. Portable scripts still need to be copied/documented from /tmp/tbh-base0-mutants.py and /tmp/tbh-base0-effects-mutants.py.
- FXRB builder complete/pushed b5fd48e, existing PR #243. 120 repeats and 3 mutants pass; full gate pending BASE0. Worktree mega-fxrb/taskbar-hero clean.
- CXN3 builder complete/pushed detached 6257c0e, PR #244. Worktree mega-cxn3/taskbar-hero clean; old dirty local branch elsewhere preserved. 9 classifier +4 PGlite +11 mutants pass; live probe has 17 pass/10 fail, old oversized401 plus boss timeouts. Do not relabel findings as healthy.
- ART1 builder complete/pushed 4df594a, draft #247. Worktree mega-art1/taskbar-hero clean. 36 tests (coordinator rerun also passes), 8 mutants, 434 slots, 44 reference views in 8 PNGs. Full gates pending BASE0.

## Active independent workers (Astra Ultra, priority; no native subagent tools exposed)

CLI workers are ephemeral isolated contexts launched through /tmp/tbh-mega-run.py, not user-owned sidebar chats. Up to three workers plus parent. Never spawn cheaper models. No worker may merge.

- CXP1 builder: mega-cxp1/taskbar-hero, detached reusable #240. Handle 30591. Log /tmp/tbh-mega-workers/cxp1/worker.log; result.md when terminal. Ports 4340–4343.
- CXL1 builder: mega-cxl1/taskbar-hero on ai/codex-cxl1. Handle 39518. Log /tmp/tbh-mega-workers/cxl1/worker.log; result.md when terminal. Ports 4350–4353.
- BASE0 independent preflight reviewer (not yet formal grader): mega-base0-review/taskbar-hero at a40f7ff. Handle 5347. Log /tmp/tbh-mega-workers/base0-review/worker.log; result.md when terminal. Ports 4470–4473. It must not edit code or score, only report actionable issues.

Verify each handle/process before deciding it stopped. Temporary API429s have recovered in existing workers; do not downgrade models or start duplicates.

## Verification notes and next actions

- Native complete-suite viewport switch E2E_VIEWPORT=1280x720 or1600x900 added. The attempted external /tmp config failed module interop; its log is retained and not a PASS.
- E2E ports 4273–4276 used by full-r4; 4294–4297 by 1600 repeats. Stage development server on 4291 belongs to BASE0 builder (session92522); inspect PID/cwd before stopping. Tools audits use5199, signed audit4175/4176; effects5198.
- Guest and signed-in audits each measured18 screen/size pairs, zero findings. Re-run after latest code/evidence stabilization. Effects original extension9/9 bothsizes; after adding actual-visited coverage, 1280 control10/10. Need1600 control10/10 on latest candidate.
- Live initial pages load with no console errors at bothsizes. Guest progression diagnostic did not find visible canvas; current saved diagnostic must be inspected. No live writes or deployments. Supabase CLI is already authenticated and sees target project (no credential printed); Vercel CLI absent. Own CLI version-cache file was removed.
- Must finish G5 public-config production preview, UI/reference-diff+keyboard+contrast evidence, bundle numbers, secret/integrity/tier review, PR wrapper246 without comments, full exact-head verification and two fresh formal graders before any merge. Reviewer's findings may require further repairs.
- All screenshots limited to16/item, <200KB. BASE0 currently7 PNGs. Existing legacy screenshot/metric overwrites from first run were restored only in owned checkout; writers now opt-in or use ignored Playwright outputs.
- Parent runner /tmp/tbh-mega-run.py writes sanitized raw command logs and exit codes; default full sequence ends with complete e2e using4273–4276. Use command mode for arbitrary checks. No secret or test-wallet file created.
