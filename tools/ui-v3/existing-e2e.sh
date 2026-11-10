#!/bin/bash
set -uo pipefail
# All four fixture servers stay in Lane U's reserved range; run after its Vite stops.
phase=${1:-u9}
out="reports/ui-v3/$phase"
mkdir -p "$out"
export E2E_PORT_CLASSIC=5950 E2E_PORT_V2=5951 E2E_PORT_SERVER=5952 E2E_PORT_API=5953
export PLAYWRIGHT_JSON_OUTPUT_NAME="$PWD/$out/existing-e2e.json"
df -h ~ > "$out/e2e-disk.txt"
pnpm --dir apps/web exec playwright test --workers=4 --reporter=line,json > "$out/existing-e2e.log" 2>&1
status=$?
echo "$status" > "$out/existing-e2e.exit"
exit "$status"
