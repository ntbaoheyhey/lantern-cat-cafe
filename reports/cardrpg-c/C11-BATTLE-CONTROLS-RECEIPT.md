# C11 — Battle guide input isolation and menu focus

The battle guide previously looked modal but allowed clicks on the top bar behind it. At both sizes, the baseline changed speed1→2 and pause true→false while the guide stayed open. It is now a native modal dialog: its backdrop blocks pointer input, native inertness blocks background focus, and the existing clock stays paused. Close button, Escape and cancel all restore the prior pause state and focus to Read battle guide. The existing guide layout and historical catalogue remain available.

A separate regression demonstrated that Escape from a focused More-menu option removed that button and left focus on body. Escape now returns focus to More battle options without changing pause/account state. The battle log retains its own native cancel/return handling.

18focused tests across BattleHudA6 and gameplay-a6 PASS, including the three added return/focus cases; workspace typecheck/lint and diff whitespace PASS. The failing menu-focus test is retained. No combat or progression rules changed.

Browser review:98checks/30captures PASS at1280x720 and1440x900, normal/reduced motion.24guide cases cover both prior pause states and three close paths;144physical clicks at background control positions cannot change battle/account/settings/clock, and background programmatic focus is rejected. Tab/Shift+Tab remains inside the guide. Separate checks cover1→2→3→1speed, Auto-next toggling, Pause/Resume, unearned/earned Skip, menu Escape from an option and log return. Two historical-mode guide cases retain layout/close/pause behavior. The first sweep stopped on a fixture-only missing-v4 assumption in historical setup; it was guarded and the final sweep passed. No page errors.

All30final views inspected through4contact sheets, with full-size current guide/menu and historical guide checks. No horizontal overflow or out-of-viewport dialog/top-bar controls. Menu intentionally overlays the stage while open. The initial baseline console output is retained as observed data; its scratch screenshot names were reused by the first pilot, so those original screenshots are not claimed as retained before evidence.

Evidence: checks/battle-controls-{before,browser}.json, battle-controls-{tests,types,lint}.log, battle-menu-focus-before.log and two shots/c11-battle-controls captures. Reproduce: tools/cardrpg-c/battle-controls-review.mjs. Other raw captures/attempts remain in /tmp/cardrpg-c-battle-controls-*.

Designer inbox remains empty, final0/25. Evidence stays below120MB; demo29,619,392bytes and weighted score7.79 unchanged. No new performance/recovery/population/full-E2E claim. Continue C8/C11 with remaining battle-option clarity.
