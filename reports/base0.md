STATUS: IN-PROGRESS

# BASE0 — restore the existing verification baseline

Base: origin/main 1fb25ed. Branch: ai/codex-mega-deno0 (DENO0 was folded into this prerequisite before edits). No score, merge, deployment or full-suite PASS is claimed here.

## Changes and causality

1. The Deno generator omitted explicit index-module aliases while generating directory aliases. Five imports across sixteen function maps therefore failed resolution. Include index modules, retain directory aliases, test generation in isolated fixtures, and run script tests through the root test command. The focused guard now reports 18 functions clean.
2. Reuse FXRB's active-scene guard and regression: resize can reach Phaser before the scale plugin is injected; CREATE applies the latest layout. The original main browser suite lost its canvas during reduced-motion resize. The FXRB branch has separate repeated evidence; BASE0 still needs its own complete verification.
3. The new shell imported HUD primitives without their shared stylesheet or grid wrapper. Narrow content grew to 138px/214px inside a clipped 70px header. Restore the primitive stylesheet/grid classes and allocate real header rows. Preserve visible values, accessible names, all test identifiers, handlers, and all existing assertions. At the 600px boundary, both legacy and shell rules apply; the shell grid now has explicit specificity. Currency labels remain in accessible names and use the existing compact visual treatment at narrow widths.

Decision: [baseline compatibility](../docs/decisions/mission-baseline-compatibility.md).

## Test integrity: deliberate old → new behavior

- supabase/tests/src/deno-imports.test.ts: the existing expected-failure case becomes a normal test with identical success assertions because explicit-index resolution is repaired. The companion test no longer filters out known index failures: every stderr edge now fails. This strengthens the gate.
- Existing resize, redraw and HUD browser tests are unchanged. No retries, timeout increases, skips, removed assertions or changed snapshots.
- New generator fixtures cover root/nested index keys, ordinary modules, directory aliases, test/fixture exclusions, deterministic output and untouched auth mappings. Six scratch mutants all fail these tests; no mutant remains in the source tree.

## Targeted evidence

[Generator tests and mutations](scorecard/deno0/logs/) and [browser iteration logs](scorecard/base0/logs/) preserve actual commands and exit codes. Earlier failed iterations remain failures; later checks do not relabel them.

- Generator tests: 5 pass, exit 0.
- Deno guard: 18 functions clean, exit 0.
- Scratch mutations: 6/6 detected, each mutant exits 1.
- Focused Deno regression suite: 4 pass; StageScene/Hud units: 15 pass. These were run locally before the complete gate and will be re-run with saved output.
- Full verification, all-screen audits/effects, repeat checks, independent grading, PR-wrapper, production-config/live smoke and post-merge checks: NOT VERIFIED at this commit.

## Scope notes

Tier 1: scripts/gen-deno-json.mjs and its fixture test; generated game-function maps; StageScene readiness fix/test; shell Hud.tsx and shell.css; BASE0/DENO0 evidence.

Tier 2: root package.json adds the script-test runner without dependency changes; supabase/tests/src/deno-imports.test.ts promotes the repaired known defect to a mandatory normal regression; docs/decisions and docs/design record the authorized compatibility interpretation. Every change exists to repair an observed complete-gate blocker. No auth function source, workflow, contract, credentials, migration or art is changed.

Branch ai/codex-mega-deno0; merge commit none; PR pending; report reports/base0.md; status IN-PROGRESS.
