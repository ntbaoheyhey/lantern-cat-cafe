# CXR2 shared-dialog polish — builder in progress

Old15-file dirty polish work from the separate clone remains untouched and is preserved with hashes. Current isolated draft /private/tmp/tbh-cxr2-active on codex/cxr2-dialogs starts at reviewed-but-unmerged CXR1ed11f01; it must merge latest main after245 before any gate.

HowToPlay, WelcomeBack and ChestReveal now use the accepted shared Modal stack. Typed optional classes/close controls preserve Help naming and loot's one-action/no-backdrop-dismiss contract. Explicit return focus can resolve after DOM commit. Render-container assertions now query the portal root; controlled-close tests actually unmount from the callback, keeping immediate same-event focus checks. Every timing/count/reward/contrast assertion remains. Decisions document the exact changes.

Builder typecheck and44 focused cases pass, including two new simultaneous-dialog/out-of-order-close regressions. Browser PID37219 on5110–5113 covers both sizes/motion preferences, classic onboarding and full stocked gameplay. No full suite/grade/main/live acceptance yet. No backend/assets/flags/settings changes or transaction.
