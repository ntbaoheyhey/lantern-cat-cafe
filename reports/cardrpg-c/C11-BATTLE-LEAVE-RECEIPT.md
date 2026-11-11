# C11 — Explain leaving before ending the patrol

Leave table previously settled the route immediately. It now opens a native modal with a read-only quote from the same abandonRun rule used by the model. It shows actual capped currencies/XP/materials, shared route-gift use, daily challenge consumption, retained Bag items and the end of route-only boosts/points/tonics. A used packed supply stays spent. Tower/practice have their own consequences; replay/gallery return directly with explicit labels. No settlement or combat rules changed.

The dialog pauses the existing clock, initially focuses Keep fighting and blocks background interaction. Cancel, Escape and native cancel restore the exact prior pause state and focus to More. Confirmation invokes the existing leave method once. The daily gift consequence is disclosed even when currencies are capped; no additional gift is promised after a prior challenge claim or six daily route gifts.

11 new regression tests failed before implementation. All27focused tests (11new+16HUD) PASS, followed by11final leave tests after copy refinement. Workspace typecheck/lint and diff whitespace PASS. Browser:68checks/48finalcaptures across1280x720/1440x900 and normal/reduced motion, including24cancel cases,144blockedphysicalclicks,40exact settlements and4replay returns. No page errors. New UI is read-only until confirm; each settled state matches the existing rule exactly.

Two initial browser sweeps stopped on harness assumptions: an empty replay advanced before its menu was clicked; then returning correctly reopened Prepare but the harness prohibited every dialog. Pinning the replay and checking only the leave dialog fixed both. A stray unused fixture property was removed before the final sweep. Third sweep completed. These are fixture repairs, not product fixes.

All48final captures inspected through8contact sheets; daily720p and spent-supply900p additionally inspected full-size. Every modal, text and action fits, with visible keyboard focus. Raw captures and the earlier attempts stay in /tmp/cardrpg-c-battle-leave-*. Two representative views and compact checks are retained here. Harness: tools/cardrpg-c/battle-leave-review.mjs.

Designer inbox remains empty, final0/25. Evidence<120MB; demo29,619,392bytes and weighted score7.79 unchanged. No new balance/account/performance/full-E2E sample. Continue C8/C11 with Auto-next/result review.
