# CXU5: Map data and presentation (2026-11-01)

Context: the approved Map mockup contains placeholder chapters, a three-attempt quota and dated history. The v2 API exposes real chapter clears/wins, keys and a loss cooldown, but neither a daily boss-attempt quota nor historical fight records. The classic API still has its existing daily attempt limit.

Choice: use the five registered chapters and unchanged backdrop/boss art. Keep the #226 compact ChapterMap API and desktop CSS; add an explicit path presentation for the full Map. Keep chapter shortcut names, gate reasons and Fight/Rematch names. The right card displays “Daily attempts: Key-limited”, the configured daily key grant and win cost. No game rule changes.

Recommended power is an explicitly labelled analytic estimate for the selected boss and the player's current build: use the exported boss stats and monsterFight rules; binary-search proportional HP/ATK/DEF using the existing power-search settings, then display powerRating. This is advice, not an eligibility gate or a guaranteed win; seeded boss attacks still decide results. Progress.neededPower describes idle progression and must not be presented as boss power. Reward previews read the chapter's first/repeat CHESTS table, including probability and ranges.

Past runs show the latest three completed, acknowledged fight results during this mounted session, newest first, filtered to the selected chapter. Keep more session records in memory for chapter selection (at most 30); never infer dates, losses or durations from win totals. Show the authoritative lifetime win count separately. Publish history only when the presentation reducer releases the outcome, so the existing replay concealment remains intact. Clear session history on account/mode changes. Failed/refused requests add nothing.

Alternatives: fabricate the mockup quota/history (rejected); introduce backend history (outside scope); show only clear counts (insufficient past-run detail). No new assets, dependencies, fonts, flags, backend requests or persistence.

Reversal: remove the optional path presentation and BossMapScreen wiring to restore the compact panel; remove the display-only history reducer field. A future server history endpoint can replace the explicitly scoped list without migrating stored data. Replace the recommendation adapter if authoritative boss guidance becomes available.

Resume implementation detail: full Map uses an opt-in path mode with visible lock explanations and a 400px fight column; desktop height-specific spacing fits the longest chapter5 reward/key state. Keep the fought chapter selected after the first clear to make its completed history/rematch readable. Key-source help sits below the path, freeing the fight column. No shared primitive additions are required from CXU4. Node geometry waits for font readiness in browser tests; tests keep their original timeouts and exact viewport bounds.
