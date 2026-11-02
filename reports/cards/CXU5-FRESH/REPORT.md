# CXU5 — active fresh-session gate

Builder pass: 51 focused unit cases and 18 browser cases passed at source 5d77800 (see pass1).
The 18 cover Map at both sizes plus resize/HUD; no retries, skips or assertions changed.
Local a4dc85e only fixes historical report pointers; its exact-head full grader-A gate is running.
No current score, merge or live claim. Grader B will use a clean checkout and other ports.
Historical missing-suffix merge 806800d predates this session and is retained under no-history-rewrite authority.
No new product behavior was needed in pass 1. Backend blocker #244 is unrelated.

Count correction: initial ledger prose said 72; the retained pass1 unit log says 51. No test failed or was omitted from that focused command. Exact-head verification uses raw receipts.

Audit launch attempt ui-a failed on a quoting typo before any test ran. Corrected harness passes node --check; ui-a-r2 runs unchanged assertions on reserved ports. Original failure retained.

Verification allocation: one complete browser matrix per exact head (both viewports) in A. B uses a separate clean checkout, frozen install, other ports, fresh core/build/unit checks, all classic cases and ten changed-spec repeats at both sizes, plus a different five-mutant set; the shared exact-head full-browser receipts are explicitly cited rather than falsely claimed as another run. Historical whitespace in raw logs is preserved; product/docs diff whitespace is clean. No new author/suffix violations; inherited merge 806800d is retained under the no-rewrite rule and excluded from main by the intended correctly authored squash.

PR #249 body refreshed: stale BASE0-unmerged/current-blocked wording removed; active source a4dc85e and only completed fresh checks identified. Full suites and B are explicitly pending.

## First product failure and repair, 2026-11-03
A exact a4dc85e full1280: 296 pass / 1 fail. G2 320×568 found Fight below the viewport; full1600 stopped by the failed gate. No grade pass or merge. Root cause: desktop path was stacked before the action on narrow widths. Fix 3678bc3 restores the old compact BossGatePanel at <=1100px, retaining existing scroll/pinned-action behavior and all old assertions. Adds compact component and 320/390/1024 browser coverage. This is fix round 1 of 3. Focused repair tests running; all previous receipts remain tied to a4dc85e.

Repair verification on 3678bc3: focused units 52/52 and browser 28/28 pass, including the unchanged G2 failing assertion. Exact-head A rerun now active. No passing grade yet.

Second audit harness failure: ui-a-r3 signed-in 1280 passed nine screens; 1600 timed out loading the app. Parallel root build/classic build emptied dist, deleting the audit's nested dist/ui-audit-signed-in. output-race.json records the missing directory and exact build timestamps. The corrected harness allocates a unique /tmp build directory; no assertion/timeout is changed. Re-run is required after this infrastructure fix, not a retry of unchanged conditions. Product fix count remains one.
