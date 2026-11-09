#!/bin/bash
set -euo pipefail
branch=$(git branch --show-current)
case "$branch" in codex/cardrpg-ui-v3-*) ;; *) echo 'Wrong lane branch'; exit 1;; esac
for delay in 0 2 4 8 16; do
 if [ "$delay" -gt 0 ]; then sleep "$delay"; fi
 if git push -u origin "$branch"; then exit 0; fi
done
exit 1
