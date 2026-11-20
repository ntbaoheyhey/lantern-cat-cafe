# Route decision order53 — staged, not adopted or sampled

Original Home03 minute5 route screenshot places the pending reward choice below the large scouting panel, goal list and route map. The player-facing banner asks for a choice whose controls are not in the viewport. Prepare44 already addressed this problem on a different screen; no route evidence is inferred from it.

This isolated prototype changes only DOM order in RunMap when run.gameplayV4 is true: the current reward/event/shop/camp/treasure/completion controls precede the map; scouting and the goal explanation follow it. All exact JSX, conditions, commands, prices, labels and map semantics are reused. OFF retains the original order. No CSS, rules, saved data, source fixture, battle rendering, dependencies or runtime changes yet.

Before adoption, reproduce the old below-viewport choice, then check actual public-command choices through saved earned fixtures at1280x720,1440x900,1024x600, baseline and alternate look. Compare the exact saved state after each click with the unchanged public command; assert primary decision visibility, keyboard operation, no horizontal overflow and scoped contrast. Cover pending reward, next-node route and route completion; also check event/shop/camp/treasure affordances where available and preserve OFF DOM ordering. Retain all original failures.

Only after prototype review may the exact component be adopted. Run six phase gates, exact ON/OFF build comparison and rulehash/OFF/baseline/13historical checks before a DRAFT on the preceding phase. This is a visibility fix, never a cadence or balance claim. No samples have been run and no production source is changed by this staging.
