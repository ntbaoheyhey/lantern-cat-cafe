# MEGA ledger — living draft

Updated 2026-11-01 (Asia/Ho_Chi_Minh). Baseline: `1fb25ed` (`origin/main`). Work is serial; existing unrelated checkout changes are preserved in their original worktree. No merges to main, deployments, art changes, or live writes are authorized.

| item | branch | PR URL | state | rounds used | last verify result | notes |
| --- | --- | --- | --- | --- | --- | --- |
| FXRB | ai/codex-fxrb | https://github.com/ntbaoheyhey/taskbar-hero/pull/243 | PARTIAL | 2 | Burst 40/40; continuous 80/80; core checks pass twice; full e2e fails known excluded mobile HUD cases | Canvas race fixed; isolated resource error cause NOT VERIFIED; reports/fxrb.md; full-suite gate not falsely called green |
| CXN3 | ai/codex-n3-cutover-truth | https://github.com/ntbaoheyhey/taskbar-hero/pull/244 | PARTIAL | 2 | All applicable local checks pass twice; classifier 8/8; PGlite 3/3; live 18 pass/9 fail | Deno import guard 80 failures identical on main; reports/n3-cutover-truth.md; no live/auth changes |
| CXP1 | ai/codex-cxp1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/240 | PARTIAL | 2 | Unit 2310 pass; desktop persistence 6/6; full e2e twice 256 pass/2 excluded mobile failures; committed map drift clean | Fixed refresh backfill/cleanup; generated map metadata only; preview isolation preserved; reports/cxp1.md |
| CXR1 | ai/codex-redesign-cxr1 | https://github.com/ntbaoheyhey/taskbar-hero/pull/245 | PARTIAL | 3 | Compile/build pass; unit 2318 pass/1 active AA failure; e2e 252 pass/2 excluded mobile; audit 18/18 clear | 16 PNGs + comparison + 12 findings; AGR3/AGR4 deferred; CXR2 owns cosmetic fixes; recheck at queue end |
| CXR2 | ai/codex-redesign-cxr2 | — | IN-PROGRESS | 1 | Latest main remains 1fb25ed; CXR1 findings reviewed | Fix merged-screen cosmetic/copy findings; AGR3/AGR4 redesign scope stays deferred |
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

## CXP1 plan
1. Read the design/demo and existing registry, store, observer, tests and report; inspect the demo in a browser.
2. Reproduce the unfinished refresh regression and fix only the local observer; retain twelve original DEMO_PREVIEW pets and equip-two rules.
3. Verify storage parsing/migration, exact progress boundaries, lifecycle deduplication and runtime isolation; add desktop browser coverage of local persistence.
4. Run install, Deno drift, typecheck, lint, unit tests, build and affected e2e at both desktop sizes, then the existing suite; capture required evidence without changing art.
5. Refresh reports/cxp1.md, push the existing draft branch, run the PR wrapper and update this ledger with exact results and limitations.

## CXR1 plan
1. Confirm the AGR merge gate and read existing tests, shell/navigation, merged screen code and approved mockup at both desktop sizes.
2. Activate the real-shell smoke with no missing-contract skip; add registry/onboarding, merged component and guest-to-Bag flow coverage without changing product behavior.
3. Extend contrast coverage for the new text tokens and report any failing pairs or other bugs with file/line evidence.
4. Run the full local verification order, desktop UI/effects audits, screenshots and side-by-side mockup review; record every difference and route cosmetic fixes to CXR2.
5. Publish reports/redesign/CXR1.md and a draft PR as PARTIAL if AGR3/AGR4 remain absent; recheck after the queue.

## CXR2 plan
1. Read CXR1 findings, AGR reports and current CSS/component code; retain the same missing-AGR3/AGR4 gate.
2. Correct warning contrast, approved surface/type tokens, desktop Home/Class/Landing/Bag layout, HUD clipping and false display-copy claims while preserving art, handlers and game rules.
3. Add targeted desktop geometry/copy/keyboard checks; extend audit capture selection and effects viewport input without changing assertions or thresholds.
4. Run the full verification order, all nine-state audits and motion checks at both sizes; compare updated screens with the approved mockup and measure bundle changes.
5. Publish a small draft PR and reports/redesign/CXR2.md with real results and larger-feature proposals; verify against CXR1 during the requested integration pass.
