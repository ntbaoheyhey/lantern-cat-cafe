# Taskbar Hero session state
PROMPT.md bytes (wc -c) = 45001
PROMPT.md SHA-256 = 288a635dd3436298f12d203c8174d0d75a62ad818f4be26908a8916a3542281f
REFERENCE: reports/cardrpg-big/memory/PROMPT.md

## NOW
Phase A · A3 UI/model first validation passed all five gates, including 421 E2E and 1,637 web units. Three-size real-click path passed. Fight/result actions moved above the fold after screenshot review. Natural watched/replay click checks passed at all three sizes. Final validation passed all five gates (421 E2E). Cold-load and 610-case timing session 36918 running.
Worktree /Users/bao/taskbar-hero-cardrpg-big
Branch ai/codex-cardrpg-big-2026-11-06
Last pushed commit dfdbc4c820dc1a1c159c89780d3fe537bb6c0294 · A2 plus validation. Current A3 UI/demo work is uncommitted.
Draft F0 #333 (codex/cardrpg-big-f0-2026-11-06), published and verified via gh + ls-remote. Base #332 at cd5edcc9895b42384578df9b040daac9ce51fccf.
F0 typecheck, lint, unit tests, build and E2E passed. E2E 421/421, web unit 1630. validation/f0-final.json.
Baseline validation session 44468 exited 0. Log validation/base-e2e.log.
Recovery checkpoint pushed at c0f1c72a. Memory bootstrap pushed at 62036790. Seven cold-load scenarios and 45 screen captures completed.
A1 validation session 39205 exited 0. Rules units 899 pass +2 expected fail +11 skip, web units 1630, E2E 421. validation/a1.json.

## NEXT
1. Finish natural watched/replay click checks and final A3 validation plus timing matrix.
2. Document measured phase-A gates, commit A3, push and open stacked draft A.
3. Begin F1 layout, camera presets, facing and stage dressing from measured baseline.

## DONE
F0 · 7a49705b / state 5f72e4a1 / draft #333 · baseline/GATES.md, 610 cases, 5 profiles, validation. Original 33.4ms cast attribution unresolved.
A1 · 6b48e0a2 · auto/A1.md, sim/auto-a1*.json, validation/a1.json. A2 · 74aa770e · auto/A2.md, sim/auto-a2*.json, validation/a2.json. A3 / F1 / F2 / F3 / F4 / F5 / M / I / G / F6 / F7 pending.
Memory bootstrap · 62036790 pushed · source prefix byte-for-byte verified · memory/PROMPT.md, RULES.md and STATE.md created.

## PHASE GATES · A (copied requirements)
PASS “Remove every manual battle control” · real-click assertions at 3 sizes find zero Play card/Defend/Pour/Auto controls. Read-only default-kit Team verified.
PASS “Keep speed x1/x2/x4 (remember the choice), Pause, Skip to result ... camera preset, Sound, Battle log, Leave.” · controls present, pause freezes choices+animation, skip/replay exact, speed survives export/import. auto/screens/checks.json.
PASS “controller must make sensible, readable choices ... log a short why per action” · 19 A1 focused tests, deterministic lookahead and pre-action HP descriptions. auto/A1.md.
PASS “Prepare screen ... chosen 3 cats, rows, gear ... team power vs enemy power ... expected-difficulty label (from the sim) ... Fight button.” · 5 alternate seeds, formula disclosed, screenshots and clicks at 3 sizes.
PASS “Skill loadout picking is removed ... default kit (unlocked ultimate at level 6 / 3 stars).” · 240 depth tests, Team has read-only kit. auto/A2.md.
PASS “result screen ... victory/defeat beat, MVP ... damage / healing / damage-taken bars ... key moments ... Watch replay ... Improve team.” · summary test and real natural replay, screenshot and Improve action at 3 sizes.
PASS “Run maps, events, shops, campfire and boss nodes keep working ... Tutorial text ... build team, press Fight, watch, improve.” · full chapter-1 path and Daily/Tower click checks pass at 3 sizes.
PASS “rules tests ... deterministic replay, skip-to-result == watched result ... UI/E2E ... training + held-out ... No battle path ... wait for player input.” · 12 focused UI-model tests, 421 E2E, 3-size automatic completion, A1/A2 50-seed cells.
NOT YET shared phase hitch gate · final cold-load and 610-case skill measurements queued after isolated validation. Opening hitches from F0 still pending F6.

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
2026-11-06 · User renewed hourly script authorization. Rechecked current app scheduling/thread tools and OpenAI Docs. Session constraint still blocks task-completion scheduling. No script or scheduler installed.
2026-11-06 · Brief references A1-A3 but contains no numbered definitions. Interpret as deterministic controller, default unlocked kits and watched/skip replay parity from phase A explicit requirements.

2026-11-06 · A1 uses one-action lookahead over existing legal actions with healing urgency and enemy removal value. Existing scoring/engine reused for bounded deterministic choices. depth/policies.ts.

2026-11-06 · A2 will use all unlocked default skills (3 ordinary + ultimate). The wider battle kit gets an explicit 0.6 save version and 0.5 migration, preserving old pending battles and recorded choices.

2026-11-06 · A3 screenshot review moved Fight and result actions above detail panels so the first viewport contains the primary action. Encounter.tsx.

## MEASUREMENTS
A3 final validation passes 421 E2E, 1,637 web units and 903 rules units (+2 expected fail, 11 skip). a3-final.json. Natural-playback click path passed all three sizes with zero page errors. auto/screens/checks.json. Focused model/summary tests 12/12. validation/a3-model-tests.log, a3-typecheck.log. Built offline demo about 12.89MB, exact receipt docs/cardrpg3/build.json.
A2 full validation pass · rules 903 +2 expected fail +11 skip, web 1630, E2E 421. validation/a2.json.
A2 level-6 train/held-out · ch1 100/100%, ch2 98/100%, ch3 100/100%. Before 74/74%, 98/98%, 76/90%. All 50 seeds per cell. Starter matches A1. auto/A2.md and sim/auto-a2*.json.
A1 starter campaign train/held-out · ch1 56/44%, ch2 88/90%, ch3 58/60% (50 seeds each). Before 66/74%, 48/46%, 48/42%. sim/auto-a1*.json, auto/A1.md. Chapter 1 regression parked for I.
A1 focused tests 19/19. Worst whole campaign runtime 14.03ms in headless held-out sample. validation/a1-controller-tests.log and sim/auto-a1-heldout.json.
610 cases / 1,220 casts / 129,685 raw frames. Whole-session MAX 1616.5ms, >25=5490, >50=3326. First cast MAX 33.4ms, >25=58. Repeat MAX 16.8ms, >25=0. Cast >50=0. baseline/skills/integrity.json.
Five profile reruns first/repeat MAX 16.8ms. Opening MAX 1450.0–1516.7ms, decoder 1243.7–1295.2ms sampled plus GC. baseline/skills/profiles/summary.json and README.md.
F0 report coverage now checks all ten configurations, 61 distinct actions each, missing and duplicate cases. tools/cardrpg-big/skill-report.mjs.
Remote base verified cd5edcc9895b42384578df9b040daac9ce51fccf by git ls-remote before worktree creation.
Install completed in 5.3s, frozen lockfile. validation/install.log.
Typecheck exit 0, lint exit 0, unit exit 0, build exit 0. validation/base-*.log.
Unit counts from logs · web 1629 pass, rules 890 pass +2 expected fail +11 skip, chain 32 pass, auth 24 pass, API 16 pass, Supabase test package 581 pass. Root script tests 11 pass.
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
A1/A2 validated and committed. A3 local edits in model/Battle/App/Pages/RunMap/Utility/depth.css, Encounter.tsx and battle-summary.ts, first full validation and three-size path pass, natural-playback recheck/final gates running. Initial path selector included an aria-hidden icon and timed out. Fixed accessible name to Cafe and reran successfully. Offline builder and path tool generated current docs/cardrpg3 artifact. Skill harness now clicks Fight then Pause before fixture and asserts zero prior actions. Weak-target unit regression fixed before inspecting campaign results. A1 chapter-1 campaign rate drops 10pp training / 30pp held-out, pending I balance review. F0 original 33.4ms spike causes remain unresolved.
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
Turn clarity/lag · seven cold-load runs and trace attribution complete, 610-case matrix complete, opening hitch fixes pending.
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
