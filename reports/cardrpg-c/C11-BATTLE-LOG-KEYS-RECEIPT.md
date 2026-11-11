# C11 — Reading the battle log keeps combat paused

Reproduced: with the event list focused, Space escaped the modal and toggled the global battle shortcut. In 407.6ms the supposedly paused log advanced from40 to44events. The dialog now stops keyboard bubbling while preserving native scrolling defaults. Escape/Close restore the prior pause state and More-button focus; Space outside the book still pauses/resumes normally.

29focused tests across BattleHudA6/gameplay-a6, workspace typecheck/lint PASS. The new regression covers both previous pause states and verifies native default handling, unchanged combat/account and held playback. The failing baseline is retained.

Browser:120checks PASS over24combinations:1280x720/1440x900, normal/reduced motion, x1/x2/x3, previously playing/paused. Space/Shift+Space, PageDown, End, Home and ArrowDown scroll while battle/account/plan/animation/playback stay unchanged. Tab/Shift+Tab remain in the modal, the final entry is reachable, close restores prior pause/focus, outside Space still works. No page errors. All8final screenshots inspected at full size: readable book, visible return copy/focus outline, no horizontal or dialog overflow. The partly visible first line after scrolling is the natural scroll boundary; the oldest entry fits fully.

Evidence: checks/c11-log-keys.json, log-key-{tests,types,lint,browser,tests-before,baseline2}.log; two representative shots/c11-log-keys captures. All8raw views remain in /tmp/cardrpg-c-battle-log-keys. Reproduce: tools/cardrpg-c/battle-log-key-review.mjs. Earlier outcome-attempt JSON compacted losslessly with original backup and equality/hash receipt to keep retained evidence below120MB; no records removed. No new full-E2E/performance/gameplay-population claim.

Designer inbox empty; published PSDs remain Mochi/Clover, final0/25. Demo30,018,753bytes and score7.79 unchanged. Continue C8/C11, next review the event book's bare damage/status rows seen in these captures.
