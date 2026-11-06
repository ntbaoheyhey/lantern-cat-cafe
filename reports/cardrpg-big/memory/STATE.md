# Taskbar Hero session state
PROMPT.md bytes (wc -c) = 45001
PROMPT.md SHA-256 = 288a635dd3436298f12d203c8174d0d75a62ad818f4be26908a8916a3542281f
REFERENCE: reports/cardrpg-big/memory/PROMPT.md
## NOW
Phase F2 · six resize/DPR cases and 40 portrait/expression renders complete. Corrected five-gate run passes (validation/f2-fixed.json), 1646 web units, 903 rules units, 421 E2E. F1 matrix610 and five profiles complete, evidence01376850 pushed to draft #335 and primary. F2 crop +40% target passes2/10. Cold7 completed, CPU4 MAX283.3/283.4ms versus F1 1316.5/1466.5ms. Captured 1440 DPR2 MAX450ms, without capture83.4ms. No-capture CPU4 MAX333.4/416.7ms. Marked profile confirms capture-associated466.6–483.4ms gaps with idle main thread. Full skill timing pending. F2 self-check sharpness/GATES.md records misses.
Worktree /Users/bao/taskbar-hero-cardrpg-big
Branch ai/codex-cardrpg-big-2026-11-06
Last pushed commit 01376850674e9576323415992d3e44e3b8bcf85b, primary and F1 remotes verified. Draft F1 #335 (codex/cardrpg-big-f1-2026-11-06). Draft A #334 (codex/cardrpg-big-a-2026-11-06), F0 #333 (codex/cardrpg-big-f0-2026-11-06). Base #332 cd5edcc9895b42384578df9b040daac9ce51fccf.
Memory bootstrap 62036790, recovery c0f1c72a. F1 validation reports/cardrpg-big/validation/f1-final.json.
## NEXT
1. Commit/push validated F2 and open a stacked draft, disclosing crop2/10, startup hitch gate and pending matrix.
2. Run frozen F2 610-case matrix and five offender profiles, without concurrent builds/tests or git packing.
3. Author starter F3 motion data while F2 times, then validate F3 and build F4 effects before the slice checkpoint.
## DONE
F0 · 7a49705b / state 5f72e4a1 / draft #333 · baseline/GATES.md, 610 cases, 5 profiles, validation. Original 33.4ms cast attribution unresolved.
A1 · 6b48e0a2 · auto/A1.md, sim/auto-a1*.json, validation/a1.json. A2 · 74aa770e · auto/A2.md, sim/auto-a2*.json, validation/a2.json. A3 · c8695d6c · auto/A3.md, auto/screens/checks.json, validation/a3-final.json. A timing complete, 610 cases +7 cold +5 profiles in auto/PERFORMANCE.md. F1 source1bc9da20 / evidence01376850 / draft #335 / layout/README.md, validation/f1-final.json, complete 610-case matrix and 5 profiles in layout/PERFORMANCE.md. F2–F7 pending.
Memory bootstrap · 62036790 pushed · source prefix byte-for-byte verified · memory/PROMPT.md, RULES.md and STATE.md created.
## PHASE GATES · F2 (copied requirements)
PASS “renderer pixel ratio = min(devicePixelRatio, 2) with proper resize ... composer targets sized in device pixels with MSAA” · six resize/DPR cases, same-size DPR switch, cap2, MSAA4, matching canvas/post sizes. sharpness/checks.json.
PASS “texture anisotropy 8-16 and mipmaps ... >=1024 per hero atlas ... portraits ...2x ... 6 expressions ... blink” · shared1024 pair, anisotropy16, 800x960 portraits, six states and blink. Checks/provenance and five focused tests in f2-fixed units. Broader geometry is F3.
PASS “GLB total <=16MB, demo HTML <=24MB” · GLB15650856 bytes measured from25 files, HTML15952212 bytes with ten comparison pairs. docs/cardrpg3/build.json.
PARTIAL “sharpness metric on every baseline crop ... target >=+40% ... DPR1 and2 ... crops side by side in demo” · ten crops measured and embedded, target passes2/10. Laplacian drops on faces after antialiasing/layout/material changes. Native portrait resolution doubles. sharpness.json.
PARTIAL “slightly higher geometry detail ... bevels, paws, ears, faces” ·24×16 eye spheres added, broader geometry deferred F3. sharpness/GATES.md.
FAIL/PENDING “after each phase rerun the F0 harness; no phase may add a new hitch” ·cold7×2 complete, captured1440 DPR2 rose433.4→450ms. Marked capture MAX483.4ms has idle-main-thread gaps. No-capture CPU4 MAX416.7ms. Full610 matrix pending. sharpness/PERFORMANCE.md.
## PRIOR F1 GATES
PASS “stage ... at least 78% of viewport height at 1280x720” · F1 568/720=78.889%, 748/900=83.111%, 470/600=78.333%. layout/measurements.json.
PASS “one slim top bar ... party status ... slim bottom strip ... enemy info as world-anchored plates ... zero overlap ... 20 sampled frames per size” · 405 sampled frames, zero overlaps/missing plates. Full 2745-pose audit also zero.
PARTIAL “three camera/scale presets ... >=8% margin ... hero ...24–30% ... boss <=55% ... no figure cropped” · B margin 12.873%, boss42.358%, zero crops. Hero action bounds 13.189–32.975%, target band missed. layout/README.md.
PASS “head and eye look-at ... clamped yaw (about 35 degrees) ... smooth damping ... angle ... <=55 degrees ... measured distribution” · full-pose MAX 55.000000016° (floating tolerance), from F0 96.5996°. Six focused tests pass.
PARTIAL “coherent ... scene per chapter ... layered parallax ... warm key ... cool rim ... contact shadows ... ambient motion ... instancing/merging” · 3 dressed chapters, zero prop-face occlusions, peak220 calls. Optical DOF and independent pupil tracking pending F2/F3.
PARTIAL “after each phase rerun the F0 harness; no phase may add a new hitch” · cold7 +610 cases +5 profiles complete. Whole-page MAX1583.3ms fails. Cast MAX33.4/16.8ms passes, first >25 counts45 versus A32. Original spikes did not recur in profiles. layout/PERFORMANCE.md.
A self-check complete · auto/GATES.md and PERFORMANCE.md. Cast gate passes 33.4/16.8ms. Whole-session gate fails 1616.6ms, deferred loader fix. Isolated cold rerun retained alongside pilot.
## DECISIONS · append only
2026-11-06 14:56 · Retain captured and capture-disabled cold runs separately. Both start at page open. Main-thread profiles identify stage texture generation, getContext, shader uniform setup and texture uploads. F2 depth falloff/eye tracking now implemented. sharpness/PERFORMANCE.md.
2026-11-06 14:39 · F1 profile source offsets identify the async loader wrapper containing synchronous base64 conversion, not its callback alone. Corrected attribution wording in layout/PERFORMANCE.md. F2 first crop target passes2/10, all misses retained.
2026-11-06 13:59 · Recovered from user-supplied summary, verified PROMPT 45001 bytes/SHA and printed STATE first15. Renewed script request still conflicts with session Automations task-completion restriction, user informed. No recovery scheduler installed.
2026-11-06 13:59 · F2 fixes skill-ID expression mapping and releases partially loaded textures. Portrait tool owns a local Vite server. Pipeline session32918 waits for PID46381 before heavy work.
2026-11-06 13:39 · F2 also replaces synchronous base64 decoding with streamed per-asset unpacking because F0/A traces identify the loader as the dominant hitch. tools/cardrpg-big/build.mjs, offline-loader.js.
2026-11-06 13:25 · Choose B medium after all-pose comparison, disclose 24–30% band miss for action/accessory bounds. Optical depth blur and independent pupil tracking deferred F2/F3. layout/README.md.
2026-11-06 13:19 · Keep B medium provisional. Initial 1280 hero body heights 131–148px compared with A closer 146–165px. B preserves baseline screen scale more closely. Final all-pose check pending.
2026-11-06 12:47 · Rechecked renewed hourly recovery request after compaction. Current session Automations restriction still prohibits per-task completion scheduling. User informed directly, no scheduler installed.
2026-11-06 12:47 · F1 audit now includes six-unit paused gallery stress formations for all three chapters, plus optional all-skill sampling. Live encounter/account untouched. tools/cardrpg-big/layout-measure.mjs.
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
2026-11-06 · A functional gates pass and draft #334 is open. Its full performance gate remains open while F1 source authoring proceeds against a frozen A3 artifact. CPU-heavy checks wait.
2026-11-06 · Repeat A cold timing after detecting overlap with checkpoint git packing. Retain pilot raw data, use isolated rerun for comparison.
2026-11-06 · F1 render profile is opt-in through SceneView.autoBattle. Shared formation remains available for existing callers. Three provisional camera widths 12.4/13.8/15.4 await measured comparison. card-staging.ts.
## MEASUREMENTS
F2 no-capture cold7 · 1280 DPR1/2 MAX99.9/100.0ms, CPU4 333.4/416.7ms, 1440 DPR1/2 83.3/83.4ms, 2560 DPR1 100.0ms. Zero page errors. sharpness/performance-no-capture/summary.json. Full-session hitch gate still fails.
F2 cold7 with screenshots · 1280 DPR1/2 MAX116.6/300.0ms, CPU4 283.3/283.4ms, 1440 DPR1/2 66.7/450.0ms, 2560 DPR1 83.4ms. Zero page errors. sharpness/performance/summary.json. Screenshot capture timing markers were absent in this already-running version, so attribution awaits isolated rerun.
F2 report/evidence in sharpness/README.md, immutable crop copies sharpness/crops and metrics.json. Resize/DPR6 cases pass, MSAA4, 1024px felt pair anisotropy16/mips, 40 portrait/expression renders, HTML15952212 bytes. Crop target passes2/10. Face deltas -53.10/-49.84%, enemy -51.82/-46.28%, HUD0/0%, portrait -0.19/-3.34%, icon +366.30/+421.26%. sharpness/checks.json, sharpness.json.
F1 matrix610 · zero errors, 131781 frames. PageMAX1583.3ms, >25=5529, >50=3100. First/repeat MAX33.4/16.8ms, >25=45/0, >50=0/0. Five profiles first/repeat16.8ms, loader wrapper1160.2–1187.5ms sampled. layout/PERFORMANCE.md.
F1 cold7 · 1280 DPR1/2 MAX366.7/333.3ms, CPU4 MAX1316.5/1466.5ms, 1440 DPR2 MAX433.4ms (A383.4). Zero errors. layout/PERFORMANCE.md. Full-page hitch gate FAIL.
F1 final validation · typecheck/lint/build pass, web1641, rules903 (+2 expected fail,11 skip), E2E421. validation/f1-final.json.
F1 405 +2745 pose samples · zero HUD/body overlaps, missing plates, outside frames and prop-face occlusions. Face MAX 55.000000016°, B min margin 12.87%. Merged stage peak 220 calls/84,570 triangles. layout/measurements.json and layout/all-actions/measurements.json.
A matrix complete · 610 cases, zero page errors. Whole-page MAX 1616.6ms, first/repeat MAX 33.4/16.8ms, cast >25 counts 32/0, cast >50 counts 0/0. auto/skills/ranked.json. Seven isolated cold cases complete, 1280 DPR1/2 MAX 366.6/333.2ms, CPU4 1316.6/1399.8ms. auto/performance/summary.json. Five profiles complete. 33ms intervals partly overlap prior fixture/render work. auto/PERFORMANCE.md.
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
F1 source passes final five-gate validation. Seven cold scenarios, full matrix and five profiles complete. Camera B action bounds 13.189–32.975% miss the 24–30% target. Optical DOF and independent pupil tracking deferred to F2/F3.
A1/A2 validated and committed. A3 c8695d6c committed, natural-playback and final five-gate validation pass. Full cold/skill timing complete. Initial path selector included an aria-hidden icon and timed out. Fixed accessible name to Cafe and reran successfully. Offline builder and path tool generated current docs/cardrpg3 artifact. Skill harness now clicks Fight then Pause before fixture and asserts zero prior actions. Weak-target unit regression fixed before inspecting campaign results. A1 chapter-1 campaign rate drops 10pp training / 30pp held-out, pending I balance review. F0 original 33.4ms spike causes remain unresolved.
Pilot skill run stopped after noticing preview frame 0 preceded first-cast boundary. Page-open data valid, cast windows excluded from claims. Saved as baseline/skills-pilot/. Corrected fixture uses progress -1 to hide all spell frames until cast.
Heap pilot used rounded performance.memory values. Superseded by precise Runtime.getHeapUsage plus per-frame draw/triangle samples. Pilot kept in baseline/skills-coarse-heap/.
Sharpness tool deps installed in /tmp/cardrpg-big-tools. Run that Python. First gallery smoke stalled on paused scene, fixed invalidation; second smoke passes.
E2E resize-burst.spec.ts passed in this baseline run. Full E2E 421 passed in 2.3m.
User main/old worktrees contain existing untracked files. Leave them alone. Ledger copy is authorized only for requested report/state.
## COVERAGE
REFERENCE: reports/cardrpg-big/baseline/COVERAGE.md
Effects/motion · audited, improvement pending.
Image sharpness · F2 ten crop pairs embedded, target2/10 passes. MSAA4/DPR/texture and 2x portraits verified. sharpness/README.md.
Layout/scale/faces · F1 2745 poses, zero overlaps/crops, <=55° facing. Scale band partial. layout/README.md.
Turn clarity/lag · seven cold-load runs and trace attribution complete, 610-case matrix complete, opening hitch fixes pending.
Beyond battle · ten destinations plus Prepare/Result shipped A3, phase M presentation pending.
Equipment · equip/enhance/reforge/salvage/tailor/set counts exist, visibility polish pending.
Items · existing types scattered, categorisation pending.
Rarity · four tiers/128 templates exist, visual tier separation pending.
Balance · A1/A2 controller sims recorded, starter chapter-1 regression parked for I.
Gacha · earned-only odds/pity exist, ceremony/batch/history polish pending.
NFT-value limits · local capped effort design exists, clearer labels/help pending, chain code protected.
Research-based identity · original cafe assets/research inspected, one-page addendum written.
## TOOLING / RESUME
Use cwd above for all repo work. pnpm dependencies installed. Chromium ANGLE Metal is the baseline measurement target.
New scripts tools/cardrpg-big/measure.mjs and validate.mjs. Validation script phase argument names logs and runs all five gates sequentially on ports 5910-5913.
Existing tools/cardrpg-depth contain build, sims, model/portrait generation and prior evidence. Preserve docs/cardrpg2/index.html.
No agents, goals, automation or model tools have been started. Current primary agent continues autonomously.
