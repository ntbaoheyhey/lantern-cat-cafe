# Taskbar Hero session state
PROMPT.md bytes (wc -c) = 45001
PROMPT.md SHA-256 = 288a635dd3436298f12d203c8174d0d75a62ad818f4be26908a8916a3542281f
REFERENCE: reports/cardrpg-big/memory/PROMPT.md

## NOW
Phase F0 · full validation passed. Corrected 610-case skill matrix running, pid 5413, exec session 2427, log validation/baseline-skills.log.
Worktree /Users/bao/taskbar-hero-cardrpg-big
Branch ai/codex-cardrpg-big-2026-11-06
Last work commit c7ffaeb4 · F0 baseline, instrumentation and profile attribution. State commit records this parent.
New draft PRs none. Existing integration base #332 at cd5edcc9895b42384578df9b040daac9ce51fccf.
F0 typecheck, lint, unit tests, build and E2E passed. E2E 421/421, web unit 1630. validation/f0.json.
Baseline validation session 44468 exited 0. Log validation/base-e2e.log.
Memory bootstrap pushed at 62036790. Seven cold-load scenarios and 45 screen captures completed.
Runtime edits only add isolated Feel lab fixtures/trigger and paused-scene invalidation. Rules unchanged.

## NEXT
1. Finish per-skill first/repeat matrix (tools/cardrpg-big/skill-measure.mjs), then baseline layout/poses and trace report.
2. Write the F0 measured baseline and hitch attribution, then validate, commit and open the F0 draft.
3. Complete F0 gate audit and draft. Then implement A with controller tests and before/after sims in isolated rules commits.

## DONE
F0 baseline · c7ffaeb4 · no PR yet · all five validation gates, 60-frame layout, sharpness crops, seven-run cold matrix, profile stacks, gallery fixtures committed.
A / F1 / F2 / F3 / F4 / F5 / M / I / G / F6 / F7 are pending.
Memory bootstrap · 62036790 pushed · source prefix byte-for-byte verified · memory/PROMPT.md, RULES.md and STATE.md created.

## PHASE GATES · F0 (copied requirements)
PASS “New worktree /Users/bao/taskbar-hero-cardrpg-big, branch ai/codex-cardrpg-big-2026-11-06 on the newest #332 tip.” Base cd5edcc matched git ls-remote.
PASS “Install, typecheck, lint, unit, E2E counts into reports/cardrpg-big/BASE-CHECK.md” · all exit 0, E2E 421 passed in 2.3m, summary written.
PASS “Record sim output hashes (scope lock proof).” baseline/sim-hashes.txt captures existing JSON hashes.
PASS “open docs/cardrpg2/index.html exactly as the user does (file://, fresh profile, cold cache), play the first battle by real mouse clicks at x1 with a Chrome performance trace” · baseline/1280x720-dpr1-cpu1-trace.json.gz.
PASS “list every frame > 33 ms with its cause” · seven intervals with main-thread events and CPU stacks in baseline/HITCHES.md + trace-attribution.json.
NOT YET “for every skill and ultimate of every cat” first/repeat, two sizes/DPR, 4x CPU, Low and 2560x1440 · gallery hook and full matrix pending.
PARTIAL “raw per-frame RAF deltas” and MAX, >25/>50 counts, heap/GPU, long entries, calls, triangles, duration · seven page-open runs saved in baseline/ and baseline/matrix/.
PASS “Sharpness baseline” fixed crops DPR1/2 and renderer/texture diagnostics · ten crops and variance in sharpness.json.
PASS screenshots battle idle, hero turn, three casts, enemy attack, boss, reward, map, hub · baseline/*.png, screens/ and layout/.
PASS “Layout baseline” stage %, hero %, facing angles, overlap and baseline/README.md · 60 frames / 3 sizes. 40 frames have HUD-body overlap, max face angle 96.60°.
PASS “FEEDBACK COVERAGE AUDIT” · baseline/COVERAGE.md has all 12 asks, source paths, fresh screenshots, initial subjective scores and gaps.

## DECISIONS · append only
2026-11-06 · Use requested branch name despite default codex/ prefix because user explicitly named it. Worktree created from origin/ai/codex-cardrpg-depth-2026-11-06.
2026-11-06 · Count 48 total skills including 12 ultimates, matching catalogue, since the brief's 48+12 overlaps. No new skills. RESEARCH-ADDENDUM-AUTO.md records this.
2026-11-06 · Reuse existing research, add a one-page mechanism-level auto presentation note. No new web research.
2026-11-06 · Cold timing harness uses real start/Auto mouse clicks, retains page-open RAF arrays and traces. CPU validation runs must finish before timing.
2026-11-06 · Memory-only immediate push follows the newer explicit user addendum while baseline E2E continues.

2026-11-06 · First-cast measurements must never render the selected effect while preparing actor fixtures. The pilot was superseded for this reason.
2026-11-06 · F0 Feel lab hook uses isolated max-level fixtures, same rendering path and no account changes. New docs/cardrpg3 artifact is instrumented baseline, old HTML preserved.
2026-11-06 · Heap measurements use Runtime.getHeapUsage because performance.memory rounded repeated snapshots to 148 MB. tools/cardrpg-big/skill-measure.mjs.
2026-11-06 · User requested hourly same-chat recovery script. Session automation rules prohibit job-to-completion scheduling, so no scheduler was created. Continue here, preserve checkpoints.
2026-11-06 · Brief references A1-A3 but contains no numbered definitions. Interpret as deterministic controller, default unlocked kits and watched/skip replay parity from phase A explicit requirements.

## MEASUREMENTS
Remote base verified cd5edcc9895b42384578df9b040daac9ce51fccf by git ls-remote before worktree creation.
Install completed in 5.3s, frozen lockfile. validation/install.log.
Typecheck exit 0, lint exit 0, unit exit 0, build exit 0. validation/base-*.log.
Unit counts from logs · web 1629 pass, rules 890 pass +2 expected fail +11 skip, chain 32 pass, auth 24 pass, API 16 pass, Supabase test package 581 pass. Script test count needs extraction.
Cold 1280x720 DPR1 MAX 366.7ms, >25ms 7, >50ms 4, p95 16.7ms. DPR2 MAX 333.3ms, >25ms 11, >50ms 7, p95 16.8ms. baseline/*cpu1.json.
Pose audit 60 frames · 40 HUD-body overlap frames (20 at 1280, 20 at 1024, zero at 1440); max face angle 96.5996°. baseline/layout/measurements.json.
Stage 57.1202% viewport height. Canvas DPR1 1280x411, DPR2 2560x822. Post samples 0. Metal Apple M3 Pro. 158 calls / 54,270 triangles at sampled end.
First scene ready 1744.7ms DPR1 / 2036.1ms DPR2 from navigation. Trace attributes largest DPR1 hitch to ParseHTML/EvaluateScript 355.4ms.
1440 DPR1/2 MAX 333.3/383.4ms; CPU4 1280 DPR1/2 MAX 1383.3/1333.3ms; 2560 MAX 333.3ms. baseline/matrix/summary.json.
Before auto starter campaign win rates train/heldout, 50 seeds/chapter · 66/74%, 48/46%, 48/42%. sim/auto-before*.json.
Baseline Laplacian variance DPR1/DPR2 · hero 8762.42/4517.40, enemy 8952.59/4200.52, HUD 14168.02/5188.71, portrait 1081.70/564.15, icon 1138.03/453.13. sharpness.json.
Path check captured 45 screens, zero console errors/network requests/writes. baseline/screens/check.json.
Source findings · depth/assets.ts maps all 48 skills to five shared EFFECT_REGISTRY templates and registers no matching EFFECT_DIRECTION entries. vfx.ts skips its effect body when direction is absent.
Source finding · default medium post uses zero MSAA samples. DPR cap 2, map 128×128, anisotropy 8.
Trace CPU stacks · 366.7ms base64 decoder; 150ms embedded script compile (106.2ms); 66.7ms scene construction/resize; 33.4/83.4ms first program uniforms and GPU command waits. baseline/trace-attribution.json.

## PROBLEMS / PARKED
No WIP commit. Completed F0 tools/evidence committed at c7ffaeb4. The exhaustive matrix remains running on its frozen HTML snapshot.
Pilot skill run stopped after noticing preview frame 0 preceded first-cast boundary. Page-open data valid, cast windows excluded from claims. Saved as baseline/skills-pilot/. Corrected fixture uses progress -1 to hide all spell frames until cast.
Heap pilot used rounded performance.memory values. Superseded by precise Runtime.getHeapUsage plus per-frame draw/triangle samples. Pilot kept in baseline/skills-coarse-heap/.
Sharpness tool deps installed in /tmp/cardrpg-big-tools. Run that Python. First gallery smoke stalled on paused scene, fixed invalidation; second smoke passes.
E2E resize-burst.spec.ts passed in this baseline run. Full E2E 421 passed in 2.3m.
User main/old worktrees contain existing untracked files. Leave them alone. Ledger copy is authorized only for requested report/state.

## COVERAGE
REFERENCE: reports/cardrpg-big/baseline/COVERAGE.md
Effects/motion · audited, improvement pending.
Image sharpness · all five DPR1/2 baseline crops measured, improvement pending.
Layout/scale/faces · 60 frames measured, 40 overlap frames, improvement pending.
Turn clarity/lag · seven cold-load runs and trace attribution complete, full per-skill matrix running.
Beyond battle · ten destinations exist, Prepare/Result pending.
Equipment · equip/enhance/reforge/salvage/tailor/set counts exist, visibility polish pending.
Items · existing types scattered, categorisation pending.
Rarity · four tiers/128 templates exist, visual tier separation pending.
Balance · prior sims hashed, new controller sims pending.
Gacha · earned-only odds/pity exist, ceremony/batch/history polish pending.
NFT-value limits · local capped effort design exists, clearer labels/help pending, chain code protected.
Research-based identity · original cafe assets/research inspected, one-page addendum written.

## TOOLING / RESUME
Use cwd above for all repo work. pnpm dependencies installed. Chromium ANGLE Metal is the baseline measurement target.
New scripts tools/cardrpg-big/measure.mjs and validate.mjs. Validation script phase argument names logs and runs all five gates sequentially on ports 5910-5913.
Existing tools/cardrpg-depth contain build, sims, model/portrait generation and prior evidence. Preserve docs/cardrpg2/index.html.
No agents, goals, automation or model tools have been started. Current primary agent continues autonomously.
