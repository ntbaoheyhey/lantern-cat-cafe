# CXR2 shared-dialog polish — builder in progress

Old15-file dirty polish work from the separate clone remains untouched and is preserved with hashes. Current isolated draft /private/tmp/tbh-cxr2-active on codex/cxr2-dialogs starts at reviewed-but-unmerged CXR1ed11f01; it must merge latest main after245 before any gate.

HowToPlay, WelcomeBack and ChestReveal now use the accepted shared Modal stack. Typed optional classes/close controls preserve Help naming and loot's one-action/no-backdrop-dismiss contract. Explicit return focus can resolve after DOM commit. Render-container assertions now query the portal root; controlled-close tests actually unmount from the callback, keeping immediate same-event focus checks. Every timing/count/reward/contrast assertion remains. Decisions document the exact changes.

Builder typecheck and44 focused cases pass, including two new simultaneous-dialog/out-of-order-close regressions. Browser PID37219 on5110–5113 covers both sizes/motion preferences, classic onboarding and full stocked gameplay. No full suite/grade/main/live acceptance yet. No backend/assets/flags/settings changes or transaction.


Browser builder1 finished1PASS/10FAIL: nine initial-load h1 accessibility queries conflict with the now-inert background, and one reduced-motion arena query runs after its chest has opened. Original failures preserved. The guard still checks actual painted h1 plus exact project/origin/build marker; it now additionally verifies an active dialog and inert/aria-hidden root when the heading is inaccessible. Reduced-only arena query includes painted background while retaining visibility. All assertion thresholds/waits unchanged; explanation in source decision. BuilderR2 reruns the full11-case targeted set on5110–5113.

BuilderR2:7PASS/4FAIL; new offline fixture omitted the prior-visit marker and normal30s claim tick. Corrected the local precondition, preserving all assertions and production code. R3 runs the unchanged11-case targets; two builder fixes used.

BuilderR3:all11 browser cases PASS. Reviewed Help, Welcome and Chest captures. Long Welcome loot scrolled the title/rule away on initial OK focus; final visual correction makes only the summary scroll, and requires header/rule/OK simultaneously visible. Initial v2 Help showed classic key/recipe rules; StageLayout now selects rule-derived v2 steps, retaining classic defaults unchanged. Final builder40798 runs new45-unit/11-browser controls. Draft now includes CXR1final187a1b5; must still merge actual main after245 before gate.
