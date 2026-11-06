# Phase A self-check
REFERENCE: reports/cardrpg-big/memory/PROMPT.md, auto/A1.md, auto/A2.md, auto/A3.md

## Requirements
PASS “Remove every manual battle control” · real-click assertions at 3 sizes find zero Play card/Defend/Pour/Auto controls. Read-only default-kit Team verified.
PASS “Keep speed x1/x2/x4 (remember the choice), Pause, Skip to result ... camera preset, Sound, Battle log, Leave.” · controls present, pause freezes choices+animation, skip/replay exact, speed survives export/import. auto/screens/checks.json.
PASS “controller must make sensible, readable choices ... log a short why per action” · 19 A1 focused tests, deterministic lookahead and pre-action HP descriptions. auto/A1.md.
PASS “Prepare screen ... chosen 3 cats, rows, gear ... team power vs enemy power ... expected-difficulty label (from the sim) ... Fight button.” · 5 alternate seeds, formula disclosed, screenshots and clicks at 3 sizes.
PASS “Skill loadout picking is removed ... default kit (unlocked ultimate at level 6 / 3 stars).” · 240 depth tests, Team has read-only kit. auto/A2.md.
PASS “result screen ... victory/defeat beat, MVP ... damage / healing / damage-taken bars ... key moments ... Watch replay ... Improve team.” · summary test and real natural replay, screenshot and Improve action at 3 sizes.
PASS “Run maps, events, shops, campfire and boss nodes keep working ... Tutorial text ... build team, press Fight, watch, improve.” · full chapter-1 path and Daily/Tower click checks pass at 3 sizes.
PASS “rules tests ... deterministic replay, skip-to-result == watched result ... UI/E2E ... training + held-out ... No battle path ... wait for player input.” · 12 focused UI-model tests, 421 E2E, 3-size automatic completion, A1/A2 50-seed cells.
PASS cast hitch regression check · 610/610 cases, zero errors, first/repeat MAX 33.4/16.8ms, >50 counts 0/0. Same measured first-cast MAX as F0. PERFORMANCE.md.
FAIL full-session performance gate · page MAX 1616.6ms. Seven isolated cold scenarios and five profiles complete. Loader and 20-battle stability work remain for F6.

