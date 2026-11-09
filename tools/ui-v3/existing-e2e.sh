#!/bin/bash
set -uo pipefail
# All four fixture servers stay in Lane U's reserved range; run after its Vite stops.
mkdir -p reports/ui-v3/u9
export E2E_PORT_CLASSIC=5950 E2E_PORT_V2=5951 E2E_PORT_SERVER=5952 E2E_PORT_API=5953
export PLAYWRIGHT_JSON_OUTPUT_NAME="$PWD/reports/ui-v3/u9/existing-e2e.json"
df -h ~ > reports/ui-v3/u9/e2e-disk.txt
pnpm --dir apps/web exec playwright test --workers=4 --reporter=line,json > reports/ui-v3/u9/existing-e2e.log 2>&1
status=$?
echo "$status" > reports/ui-v3/u9/existing-e2e.exit
exit "$status"
