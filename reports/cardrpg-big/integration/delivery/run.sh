#!/bin/sh
set -eu
cd /Users/bao/taskbar-hero-cardrpg-big-delivery
export BIG_ARTIFACT="$PWD/docs/cardrpg3/index.html"
export VITEST_MAX_WORKERS=2
expected=9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3
check_artifact() { test "$(shasum -a 256 "$BIG_ARTIFACT" | cut -d ' ' -f 1)" = "$expected"; }
check_artifact
node tools/cardrpg-big/with-timing-lock.mjs delivery-fivegates node tools/cardrpg-big/validate.mjs delivery-v1 > reports/cardrpg-big/validation/delivery-v1-run.log 2>&1
check_artifact
nice -n 10 pnpm --filter @taskbar-hero/web exec tsc -p ../../tools/cardrpg-big/tsconfig.json --noEmit > reports/cardrpg-big/integration/delivery/demo-types-current.log 2>&1
BIG_SCOPE_OUT=reports/cardrpg-big/integration/delivery/scope nice -n 10 node tools/cardrpg-big/scope-proof.mjs > reports/cardrpg-big/integration/delivery/scope.log 2>&1
check_artifact
