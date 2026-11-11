# C11 — Distinguish absent HP damage from a zero back-row share

The empty report showed “Back row took 0% of the damage” because the arithmetic fallback was zero even with no incoming HP damage. Show an explicit no-recorded-crew-HP-damage state when the denominator is empty. Keep the actual percentage when the crew took damage, and label its scope as crew HP damage so shields and outgoing hits are not implied. No combat, reducer, save or settlement change.

Partial records also said “1 rounds played.” Current and legacy results now identify the recorded round. Without a measured highlight, empty logs say no battle effects were recorded; other logs say where the record ends. This does not claim a partial round was completed.

Six focused assertions reproduced the missing/ambiguous copy. Final 28 tests in OutcomeV4/battle-summary, workspace typecheck/lint and diff check PASS. Forty browser cases PASS across five fixtures, current/legacy reports, both requested sizes and both motion settings: empty, blocked, shield-only, front-only damage and mixed 25% back-row damage. Exact account/record preservation, keyboard disclosure/return, no horizontal overflow and visible full notes checked. Zero page errors. Inspected all 16 final captures in four sheets and the full-size 720p mixed report; two representatives retained. Raw receipt/captures under /tmp/cardrpg-c-row-share.

Designer final exports remain 0/25; inbox empty. Demo 30,018,753 bytes and score 7.79 retained. Evidence under 120 MB. No new full E2E, balance seed or real-account performance claim. Continue C8/C11.
