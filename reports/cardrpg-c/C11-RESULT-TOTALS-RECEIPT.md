# C11 — Include Rupture in recorded results

The result-card summary and tactical outcome summary omitted reaction-damage, although combat removed that HP and the event book showed it. Both now count the recorded amount for attacker damage, damage taken, row totals, contribution/star ranking and biggest hit. Combat rules, rewards and existing records are unchanged.

Four new rule-driven regression fixtures failed before the fix: incoming/outgoing Rupture, through shields, with36HP loss or a lethal10HP remainder. They now pass against actual HP changes, without counting absorbed damage, reaction markers or defeat events as extra damage. Final16web/20rules tests and workspace typecheck/lint PASS. Browser16cases cover both sizes/motion settings, compare the result/crew/moments/notes to actual HP loss, and preserve account/battle and return focus. Zero page errors. These are controlled reporting fixtures, not progression or recovery samples.

Inspected16captures in four contact sheets, plus1280outgoing crew and1440incoming notes at full size. The amounts, portraits, report controls and content fit; longer moments remain inside the scrollable report. Two representative captures retained in shots/c11-result-totals; raw16views and contacts stay in /tmp/cardrpg-c-result-totals*. Reproduce with tools/cardrpg-c/result-totals-review.mjs. Logs/receipt: checks/result-totals-* and checks/c11-result-totals.json. Older JSON whitespace was compacted with exact parsed-value equality, hashes and outside-git backups to keep evidence below120MB.

Designer inbox still empty; published PSDs remain Mochi/Clover; final0/25. Demo30,018,753bytes and score7.79 unchanged. No accepted balance/account reruns or new full-E2E/performance claim. Continue C8/C11.
