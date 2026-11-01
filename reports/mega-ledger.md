# MEGA ledger — living draft

Updated 2026-11-01 (Asia/Ho_Chi_Minh). Baseline: `1fb25ed` (`origin/main`). Work is serial; existing unrelated checkout changes are preserved in their original worktree. No merges to main, deployments, art changes, or live writes are authorized.

| item | branch | PR URL | state | rounds used | last verify result | notes |
| --- | --- | --- | --- | --- | --- | --- |
| FXRB | ai/codex-fxrb | https://github.com/ntbaoheyhey/taskbar-hero/pull/243 | PARTIAL | 2 | Burst 40/40; continuous 80/80; core checks pass twice; full e2e fails known excluded mobile HUD cases | Canvas race fixed; isolated resource error cause NOT VERIFIED; reports/fxrb.md; full-suite gate not falsely called green |
| CXN3 | ai/codex-n3-cutover-truth | https://github.com/ntbaoheyhey/taskbar-hero/pull/244 | PARTIAL | 2 | All applicable local checks pass twice; classifier 8/8; PGlite 3/3; live 18 pass/9 fail | Deno import guard 80 failures identical on main; reports/n3-cutover-truth.md; no live/auth changes |
| CXP1 | ai/codex-cxp1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/240 | TODO | 0 | Not run in this mission | Existing draft; inspect and complete missing verification |
| CXR1 | ai/codex-redesign-cxr1 | — | TODO | 0 | Not run | Check merged AGR3/AGR4 gate |
| CXR2 | ai/codex-redesign-cxr2 | — | TODO | 0 | Not run | Follow CXR1 findings; same AGR gate |
| CXL2 | ai/codex-cxl2 | — | TODO | 0 | Signature not checked | Skip unless dated user SIGNED line exists in design section 6 |
| Re-check | ai/codex-redesign-cxr1 / ai/codex-redesign-cxr2 | — | TODO | 0 | Not run | Refresh main and repeat CXR1; extend if AGR3/AGR4 land |
| Integration | local throwaway branch (never pushed) | — | TODO | 0 | Not run | Merge mission branches locally; publish reports/mega-final.md here |

## FXRB plan
1. Read resize specs, layout metrics/lifecycle, AGR0 and CXR0 evidence; reproduce the failure.
2. Fix the synchronization or stage-sizing cause, preserving exact canvas count, dimensions, actor checks and recreation budget.
3. Install pnpm 10.28.0 dependencies; check Deno drift; run typecheck, lint, unit tests and build in order.
4. Run resize specs with repeat-each=20 at both desktop starts and the complete existing e2e suite; retain every failure as evidence.
5. Write reports/fxrb.md, commit with [skip ci], push only ai/codex-fxrb, open a draft PR and update this ledger.

## CXN3 plan
1. Read the existing implementation, C3 findings, operational runbooks, migration inventory and shared HTTP handler; confirm CXN2 is merged.
2. Preserve and review the two unfinished documentation corrections in an isolated checkout; fix any in-zone issues discovered.
3. Run the catalog-only SQL against both PGlite migration sets and test the strict unsigned result classifier without network.
4. Run the full local checks in order, compare link debt, and execute only the authorized unsigned live probes; retain live failures as findings.
5. Push the report to ai/codex-n3-cutover-truth, open a draft PR, run verify-pr without comments and record honest status in this ledger.
