#!/bin/bash
set -uo pipefail
phase=${1:-u0}
out=reports/ui-v3/$phase
mkdir -p "$out"
status=0
for task in typecheck lint test build; do
 if [ "$task" = build ]; then df -h ~ > "$out/disk.txt"; fi
 if [ "$task" = test ]; then pnpm --filter @taskbar-hero/web test > "$out/$task.log" 2>&1
 else pnpm -r "$task" > "$out/$task.log" 2>&1; fi
 result=$?
 echo "$task $result" | tee -a "$out/checks.txt"
 if [ "$result" != 0 ]; then tail -n 25 "$out/$task.log"; status=1; fi
done
exit $status
