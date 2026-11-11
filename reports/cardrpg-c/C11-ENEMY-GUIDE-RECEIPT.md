# C11 — Current enemy tactics and preparation notes

All13enemy notes now describe the current A6 rage-driven actions, V5 status effects and boss phases. The same read-only text feeds the handbook, paused battle guide, preparation and forecast. It explains healer even-round/full-rage recovery, Daze replacing a signature with a basic hit, shield removal, Crumb detonation and linked helper departures. Historical catalogue behavior and combat rules are unchanged.

Longer tactics initially pushed the preparation forecast outside its panel. The enemy column now reserves the forecast and bounds the note to an independently scrollable keyboard region with a visible hint. Switching enemies resets the scroll position. Fight, crew cards and enemy choices remain visible at1280x720 and1440x900. The smallest tested body is90px, with Home/End reaching the full boss note; this is not a claim that all text fits at once.

Inherited final verification:37tests in5files, workspace typecheck and lint PASS. Tests exercise actual rage/full-rage enemy actions and Daze substitution, read-only catalogue/preparation navigation, and current versus historical forecast/guide copy. No balance seeds or accepted gameplay sessions were repeated.

Final browser coverage uses62handbook/battle checks and68captures from the initial sweep, plus26preparation checks and36captures after the layout repair. All13enemies are checked in each mode at both sizes; Home/End, search, reset, focus return, unchanged state and battle pause are checked. Zero page errors. The initial26preparation captures are superseded.

Inspected104views through13contact sheets, with full-size review of the longest notes and both guide layouts. Two Rain Spool selected views were caught before ResizeObserver displayed the hint; a targeted2check/4capture supplement waits for hint/overflow agreement and replaces both endpoints at both sizes. All4replacement views inspected full size. Final set remains104views;108views inspected including the four replaced views. No horizontal overflow or hidden forecast/Fight in the final audit.

Evidence: checks/enemy-guide-{initial,prepare,settled}.json, enemy-guide-{tests,types,lint}.log and two representative shots/c11-enemy-guide images. Reproduce with tools/cardrpg-c/enemy-guide-review.mjs; --modes=prepare --prepare-id=rain-spool isolates the settled supplement. Raw attempts stay in /tmp/cardrpg-c-enemy-guide-*.

Four existing large JSON reports were compacted without any value/record loss (parsed equality checked against HEAD), recovering1094332bytes. Retained evidence remains below120MB. Demo29,619,392bytes and weighted score7.79 are unchanged. No new performance, recovery-rate or full-E2E claim. Designer inbox empty; final0/25. Continue C8/C11 battle-control review.
