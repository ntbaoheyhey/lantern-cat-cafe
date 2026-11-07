# F0 phase-end self-check
REFERENCE: reports/cardrpg-big/memory/PROMPT.md lines 69–75; reports/cardrpg-big/memory/STATE.md

PASS “New worktree /Users/bao/taskbar-hero-cardrpg-big, branch ai/codex-cardrpg-big-2026-11-06 on the newest #332 tip.” Base cd5edcc matched git ls-remote.
PASS “Install, typecheck, lint, unit, E2E counts into reports/cardrpg-big/BASE-CHECK.md” · all exit 0, E2E 421 passed in 2.3m, summary written.
PASS “Record sim output hashes (scope lock proof).” baseline/sim-hashes.txt captures existing JSON hashes.
PASS “open docs/cardrpg2/index.html exactly as the user does (file://, fresh profile, cold cache), play the first battle by real mouse clicks at x1 with a Chrome performance trace” · baseline/1280x720-dpr1-cpu1-trace.json.gz.
PASS “list every frame > 33 ms with its cause” · seven intervals with main-thread events and CPU stacks in baseline/HITCHES.md + trace-attribution.json.
PASS “for every skill and ultimate of every cat” first/repeat, two sizes/DPR, 4x CPU, Low and 2560x1440 · 610/610 cases, 1,220 casts, zero errors. baseline/skills/ranked.json.
PASS “raw per-frame RAF deltas” and MAX, >25/>50 counts, heap/GPU, long entries, calls, triangles, duration · 129,685 raw frames verified. baseline/skills/integrity.json.
PARTIAL “root-cause note per top offender” · five traced reruns identify decoder/GC opening spikes. Original 33.4 ms cast spikes were absent on rerun, exact causes unresolved. baseline/skills/profiles/README.md.
PASS “Sharpness baseline” fixed crops DPR1/2 and renderer/texture diagnostics · ten crops and variance in sharpness.json.
PASS screenshots battle idle, hero turn, three casts, enemy attack, boss, reward, map, hub · baseline/*.png, screens/ and layout/.
PASS “Layout baseline” stage %, hero %, facing angles, overlap and baseline/README.md · 60 frames / 3 sizes. 40 frames have HUD-body overlap, max face angle 96.60°.
PASS “FEEDBACK COVERAGE AUDIT” · baseline/COVERAGE.md has all 12 asks, source paths, fresh screenshots, initial subjective scores and gaps.

