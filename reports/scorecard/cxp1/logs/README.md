# CXP1 command/exit inventory

Only targeted results are claimed. Exit 1 is expected for killed mutants, inherited link/Deno debt, and preserved unsuccessful verification-harness attempts. See reports/cxp1.md for interpretation.

| Log | Exit | Recorded command |
| --- | --- | --- |
| [bundle-classic.log](bundle-classic.log) | 0 | `node scripts/check-bundle.mjs apps/web/dist/e2e-4340` |
| [bundle-v2.log](bundle-v2.log) | 0 | `node scripts/check-bundle.mjs apps/web/dist-v2/e2e-4341` |
| [demo-review-corrected.log](demo-review-corrected.log) | 0 | `env SCREENSHOTS=1 node reports/scorecard/cxp1/tools/review-demo.mjs` |
| [demo-review.log](demo-review.log) | 1 | `env SCREENSHOTS=1 node reports/scorecard/cxp1/tools/review-demo.mjs` |
| [deno-drift.log](deno-drift.log) | 0 | `git diff --exit-code -- supabase/functions` |
| [deno-imports.log](deno-imports.log) | 1 | `node scripts/check-deno-imports.mjs` |
| [diff-check.log](diff-check.log) | 0 | `git diff --check origin/main` |
| [diff-stat-branch.log](diff-stat-branch.log) | 0 | `git diff --stat origin/main` |
| [diff-stat-continuation.log](diff-stat-continuation.log) | 0 | `git diff --stat 7a66b14` |
| [gen-deno.log](gen-deno.log) | 0 | `pnpm gen:deno` |
| [install.log](install.log) | 0 | `env CI=true pnpm install --frozen-lockfile` |
| [integrity-scope-secrets.log](integrity-scope-secrets.log) | 0 | `python3 reports/scorecard/cxp1/tools/audit.py` |
| [links-baseline-complete-mirror.log](links-baseline-complete-mirror.log) | 1 | `python3 reports/scorecard/cxp1/tools/check-baseline-links.py` |
| [links-baseline-corrected.log](links-baseline-corrected.log) | 1 | `python3 reports/scorecard/cxp1/tools/check-baseline-links.py` |
| [links-baseline.log](links-baseline.log) | 1 | `python3 reports/scorecard/cxp1/tools/check-baseline-links.py` |
| [links-corrected.log](links-corrected.log) | 1 | `node scripts/check-links.mjs --json` |
| [links-current.log](links-current.log) | 1 | `node scripts/check-links.mjs --json` |
| [links-report-corrected.log](links-report-corrected.log) | 0 | `node scripts/check-links.mjs --json reports/cxp1.md reports/scorecard/cxp1/ui-diff.md` |
| [links-report.log](links-report.log) | 1 | `node scripts/check-links.mjs --json reports/cxp1.md reports/scorecard/cxp1/ui-diff.md` |
| [links-touched.log](links-touched.log) | 0 | `node scripts/check-links.mjs --json docs/decisions/pets-preview.md docs/design/decisions.md packages/game-rules/src/v2/meta/pets/README.md` |
| [mutation-baseline-rules.log](mutation-baseline-rules.log) | 0 | `pnpm exec vitest run src/v2/meta/pets/pets.test.ts` |
| [mutation-baseline-store.log](mutation-baseline-store.log) | 0 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-corrupt-grants-selection.log](mutation-corrupt-grants-selection.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-equip-duplicate.log](mutation-equip-duplicate.log) | 1 | `pnpm exec vitest run src/v2/meta/pets/pets.test.ts` |
| [mutation-equip-third.log](mutation-equip-third.log) | 1 | `pnpm exec vitest run src/v2/meta/pets/pets.test.ts` |
| [mutation-hook-never-subscribes.log](mutation-hook-never-subscribes.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-migration-disabled.log](mutation-migration-disabled.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-persistence-dropped.log](mutation-persistence-dropped.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-preview-changes-power.log](mutation-preview-changes-power.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-refresh-delta-retained.log](mutation-refresh-delta-retained.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-restored-rules.log](mutation-restored-rules.log) | 0 | `pnpm exec vitest run src/v2/meta/pets/pets.test.ts` |
| [mutation-restored-store.log](mutation-restored-store.log) | 0 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-retired-cleanup-repeats.log](mutation-retired-cleanup-repeats.log) | 1 | `pnpm exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [mutation-unlock-round-up.log](mutation-unlock-round-up.log) | 1 | `pnpm exec vitest run src/v2/meta/pets/pets.test.ts` |
| [mutations-with-isolation.log](mutations-with-isolation.log) | 0 | `python3 reports/scorecard/cxp1/tools/mutate.py` |
| [mutations.log](mutations.log) | 0 | `python3 reports/scorecard/cxp1/tools/mutate.py` |
| [persistence-e2e.log](persistence-e2e.log) | 0 | `env E2E_PORT_CLASSIC=4340 E2E_PORT_V2=4341 E2E_PORT_SERVER=4342 E2E_PORT_API=4343 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= VITE_GAME_V2=1 SCREENSHOTS=1 SCREENSHOT_DIR=../../reports/scorecard/cxp1 pnpm test:e2e v2/pets-preview.spec.ts --project=v2-loop --workers=1` |
| [persistence-repeat.log](persistence-repeat.log) | 0 | `env E2E_PORT_CLASSIC=4340 E2E_PORT_V2=4341 E2E_PORT_SERVER=4342 E2E_PORT_API=4343 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= VITE_GAME_V2=1 pnpm test:e2e v2/pets-preview.spec.ts --project=v2-loop --workers=1 --repeat-each=10` |
| [port-check.log](port-check.log) | 1 | `lsof -nP -iTCP:4340 -iTCP:4341 -iTCP:4342 -iTCP:4343 -sTCP:LISTEN` |
| [rules-handoff.log](rules-handoff.log) | 0 | `pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/meta/pets/pets.test.ts` |
| [rules-targeted.log](rules-targeted.log) | 0 | `pnpm --filter @taskbar-hero/game-rules exec vitest run src/v2/meta/pets/pets.test.ts` |
| [rules-typecheck.log](rules-typecheck.log) | 0 | `pnpm --filter @taskbar-hero/game-rules typecheck` |
| [store-handoff.log](store-handoff.log) | 0 | `pnpm --filter @taskbar-hero/web exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [store-targeted.log](store-targeted.log) | 0 | `pnpm --filter @taskbar-hero/web exec vitest run src/pets/state.test.ts src/pets/isolation.test.ts` |
| [versions.log](versions.log) | 0 | `node -e 'const cp=require("node:child_process"); console.log("node",process.version); for (const args of [["--version"],["--filter","@taskbar-hero/web","exec","playwright","--version"]]) { const r=cp.spawnSync("pnpm",args,{encoding:"utf8"}); console.log(r.stdout.trim()); if(r.status) process.exit(r.status); }'` |
| [web-typecheck.log](web-typecheck.log) | 0 | `pnpm --filter @taskbar-hero/web typecheck` |
