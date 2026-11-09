#!/bin/sh
# Native, read-only fixture polling. No timing lock, browser, or model requests.
# Caller runs `timeout 1200 ...`, preserving V5_WAIT_SINCE across chunks.
set -eu
sync=/Users/bao/taskbar-hero-cardrpg-sync
started=${V5_WAIT_SINCE:-$(date -u +%s)}
deadline=$((started + 129600))
while [ "$(date -u +%s)" -lt "$deadline" ]; do
  pulled=0
  for pause in 0 2 4 8 16; do
    [ "$pause" -eq 0 ] || sleep "$pause"
    if git -C "$sync" pull --rebase -q; then pulled=1; break; fi
  done
  if [ "$pulled" -eq 1 ]; then
    # Match the published DONE entry as a whole: the heading carries V5A-S4
    # and DONE; its body carries the fixture path/schema/timing contract.
    entry=$(awk '
      function emit() { if (block ~ /^## [^\n]*V5A-S4[^\n]*DONE/ && block ~ /events v2 fixture/) { printf "%s",block; found=1 } }
      /^## / { emit(); block="" }
      { block=block $0 "\n" }
      END { emit(); if (!found) exit 1 }
    ' "$sync/coord/cardrpg-big/A-OUTBOX.md") && { printf '%s\n' "$entry"; exit 0; }
  fi
  remaining=$((deadline - $(date -u +%s)))
  [ "$remaining" -gt 0 ] || break
  [ "$remaining" -ge 300 ] || { sleep "$remaining"; break; }
  sleep 300
done
printf '%s\n' 'V3 NOT STARTED: fixture not published within 36 h'
exit 3
