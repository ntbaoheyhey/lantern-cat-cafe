#!/bin/sh
pnpm --filter @taskbar-hero/web typecheck > reports/v4-art/REVIEW/A6/typecheck-route.log 2>&1
printf 'TYPECHECK_EXIT=%s\n' "$?"
pnpm --filter @taskbar-hero/web exec vitest run src/game/cardrpg/battle-v3/class-motion.test.ts src/game/cardrpg/stage/layout-c2.test.ts --reporter=dot > reports/v4-art/REVIEW/A6/route-tests.log 2>&1
printf 'ROUTE_TEST_EXIT=%s\n' "$?"
node tools/v3craft-lab/v4-panko/live-probe.mjs all --all > reports/v4-art/jobs/a6-probe.log 2>&1
printf 'LIVE_PROBE_EXIT=%s\n' "$?"
