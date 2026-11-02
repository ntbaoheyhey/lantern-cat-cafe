# CXU4 — active fresh-session gate

Branch ai/codex-cxu4 refreshed with main1b299c4 via merge8f2e3fe, without rewriting history. Only docs/design/decisions.md conflicted; both decision entries were kept. Application code merged cleanly.

Builder is inspecting Hero/Help/shared primitives against the reference. Existing Help strings fixture is retained. A new out-of-order modal cleanup regression is being run against unchanged implementation before any fix. No current score, complete gate, merge or live claim.

Scope: Hero/Character, Help, notices, shared UI and associated tests. No dependency on #244; no backend activation, art replacement, provider change or new rail entry.

Builder found a real shared-modal defect: older-dialog cleanup unlocked the page under a newer dialog (47 existing focused tests passed, new regression failed). Repair9c7adc8 makes background restoration stack-wide and restores the original opener;49 focused units and20 browser cases pass. A final native-disabled/tabindex guard and regression are included before freezing the formal review head. No prior assertion changed.

Builder final50 focused units pass at577e0e2. Formal fresh A now runs core, changed-spec repeat10 and full browser matrix on4800–4803, PID19642. No score/merge claim. User explicitly authorized a same-chat hourly handoff heartbeat; recorded in SESSION-HOURLY-CHECKPOINT.md.

## First formal gate failure and Help repair
Head577e0e2 passed core2411 cases,200 changed browser repeats, UI/effects and10 mutants, but full1280 failed4 cases (309 pass): independent Help stub missing the new selectors at both sizes, and Help primary action absent in desktop/phone checks. Full1600 was not run after the failure. No grade pass. A new phrase-search regression also failed for configured30 Yarn (3 existing search tests passed).

Repair3ed0633 restores Start Exploring as primary, updates the independent hand-written fixture to the actual Help contract, and indexes rendered inline text with normalized whitespace. It does not alter existing assertions. Fresh targeted typecheck/51 units/22 browser cases pass, including return to Home. This is fix round2 (the earlier builder round repaired modal stack/focus). Exact-head fresh A rerun is active; B remains pending.

## Fresh grader A complete
Self-graded (fresh pass)95/100 at3ed0633, zero auto-fails. Core2412 cases; full313/313 both sizes;360 repeats;11 mutants;36 UI/20 effects checks and modal captures green. Exact old Help text independently matches actual main in all3 configurations. Minor design departures and one duplicated contrast pair are deducted explicitly. B tests-first starts in clean /private/tmp/tbh-cxu4-fresh-b on4810–4813, PID29718.

## Grader B control failure; third fix round
B core,360 repeats,38 classic cases,96 Forge tests and UI/effects passed on3ed0633, but its unmodified mutation control failed: dialog already absent, root still inert/aria-hidden, success status inaccessible (50 pass/1 fail). No mutants were run or credited. This is a real passive-effect cleanup timing defect, not a setup failure or a retry candidate. Grader B fails and3ed0633 is not mergeable under the gate, despite A95.

Third repair d969f16 changes Modal to a layout effect so restoration completes before paint/DOM-removal observation. Original immediate status/focus assertions remain. A browser observer now checks accessible background at dialog removal. Targeted checks running, PID32491. Fresh A/B must be rerun on this head; if the third repair cannot clear the gate, record PARTIAL and move on per the user's limit.
