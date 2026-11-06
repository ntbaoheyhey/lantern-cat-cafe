# Taskbar Hero session state
PROMPT.md bytes (wc -c) = 45001
PROMPT.md SHA-256 = 288a635dd3436298f12d203c8174d0d75a62ad818f4be26908a8916a3542281f
REFERENCE: reports/cardrpg-big/memory/PROMPT.md

## NOW
Phase F0 · baseline validation and cold-open measurement setup.
Worktree /Users/bao/taskbar-hero-cardrpg-big
Branch ai/codex-cardrpg-big-2026-11-06
Last commit at state capture cd5edcc9895b42384578df9b040daac9ce51fccf
New draft PRs none. Existing integration base #332 at cd5edcc9895b42384578df9b040daac9ce51fccf.
Baseline typecheck, lint, unit tests and build passed. E2E is running.
Active shell session 44468 runs baseline validation, log reports/cardrpg-big/validation/base-e2e.log.
Memory bootstrap is being committed and pushed immediately as explicitly requested.
Runtime source files have no edits yet.

## NEXT
1. Finish baseline E2E. Save counts in BASE-CHECK.md. Avoid concurrent performance measurement with test load.
2. Run node tools/cardrpg-big/measure.mjs --baseline. Resolve any harness errors, inspect screenshots and trace, produce sharpness/layout baselines.
3. Complete F0 gate audit and draft. Then implement A with controller tests and before/after sims in isolated rules commits.

## DONE
F0 setup · base cd5edcc · no PR yet · dependency install passed, baseline/sim-hashes.txt saved, initial COVERAGE.md and cold measurement harness written.
A / F1 / F2 / F3 / F4 / F5 / M / I / G / F6 / F7 are pending.
Memory bootstrap · source prefix byte-for-byte verified · memory/PROMPT.md, RULES.md and STATE.md created.

## PHASE GATES · F0 (copied requirements)
PASS “New worktree /Users/bao/taskbar-hero-cardrpg-big, branch ai/codex-cardrpg-big-2026-11-06 on the newest #332 tip.” Base cd5edcc matched git ls-remote.
PARTIAL “Install, typecheck, lint, unit, E2E counts into reports/cardrpg-big/BASE-CHECK.md” · first four and build passed, E2E running, summary pending.
PASS “Record sim output hashes (scope lock proof).” baseline/sim-hashes.txt captures existing JSON hashes.
NOT YET “open docs/cardrpg2/index.html exactly as the user does (file://, fresh profile, cold cache), play the first battle by real mouse clicks at x1 with a Chrome performance trace” · measure.mjs ready for execution.
NOT YET “list every frame > 33 ms with its cause” · trace attribution parser written, unverified.
NOT YET “for every skill and ultimate of every cat” first/repeat, two sizes/DPR, 4x CPU, Low and 2560x1440 · gallery hook and full matrix pending.
NOT YET “raw per-frame RAF deltas” and MAX, >25/>50 counts, heap/GPU, long entries, calls, triangles, duration · harness written, no measurements yet.
NOT YET “Sharpness baseline” fixed crops DPR1/2 and renderer/texture diagnostics · pending capture.
NOT YET screenshots battle idle, hero turn, three casts, enemy attack, boss, reward, map, hub · old screenshots inspected, new captures pending.
NOT YET “Layout baseline” stage %, hero %, facing angles, overlap and baseline/README.md · pending capture.
PARTIAL “FEEDBACK COVERAGE AUDIT” · baseline/COVERAGE.md has 12 asks, source paths, initial subjective scores and gaps, needs fresh screenshots.

## DECISIONS · append only
2026-11-06 · Use requested branch name despite default codex/ prefix because user explicitly named it. Worktree created from origin/ai/codex-cardrpg-depth-2026-11-06.
2026-11-06 · Count 48 total skills including 12 ultimates, matching catalogue, since the brief's 48+12 overlaps. No new skills. RESEARCH-ADDENDUM-AUTO.md records this.
2026-11-06 · Reuse existing research, add a one-page mechanism-level auto presentation note. No new web research.
2026-11-06 · Cold timing harness uses real start/Auto mouse clicks, retains page-open RAF arrays and traces. CPU validation runs must finish before timing.
2026-11-06 · Memory-only immediate push follows the newer explicit user addendum while baseline E2E continues.

## MEASUREMENTS
Remote base verified cd5edcc9895b42384578df9b040daac9ce51fccf by git ls-remote before worktree creation.
Install completed in 5.3s, frozen lockfile. validation/install.log.
Typecheck exit 0, lint exit 0, unit exit 0, build exit 0. validation/base-*.log.
Unit counts from logs · web 1629 pass, rules 890 pass +2 expected fail +11 skip, chain 32 pass, auth 24 pass, API 16 pass, Supabase test package 581 pass. Script test count needs extraction.
Frame MAX, hitch counts, sharpness deltas, stage %, new auto win rates are unmeasured.
Source findings · depth/assets.ts maps all 48 skills to five shared EFFECT_REGISTRY templates and registers no matching EFFECT_DIRECTION entries. vfx.ts skips its effect body when direction is absent.
Source finding · default account quality medium, post.ts uses zero MSAA samples in medium. DPR cap 2 and model texture anisotropy 8 already exist.

## PROBLEMS / PARKED
No WIP commit. Current F0 files are uncommitted except memory bootstrap about to publish.
Harness audit uses scene.audit(), confirmed available. Need verify trace origin attribution and Playwright selectors when first run.
E2E resize-burst.spec.ts is flagged flaky by brief. Actual result pending.
User main/old worktrees contain existing untracked files. Leave them alone. Ledger copy is authorized only for requested report/state.

## COVERAGE
REFERENCE: reports/cardrpg-big/baseline/COVERAGE.md
Effects/motion · audited, improvement pending.
Image sharpness · medium MSAA source cause found, crop metrics pending.
Layout/scale/faces · old screenshot inspected, measurement pending.
Turn clarity/lag · manual wait and warmup exclusion confirmed, cold measurements pending.
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
