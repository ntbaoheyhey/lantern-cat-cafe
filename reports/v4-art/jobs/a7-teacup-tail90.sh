#!/bin/sh
cd /Users/bao/taskbar-hero-cardrpg-a6 || exit 1
for fixture in wave1 wave3; do
 node scripts/v3feel/capture.mjs --item V4-A7-TEACUP-TAIL90 --fixture "$fixture" --seconds 90 --video-seconds 90 --frame-marker > "reports/v4-art/jobs/a7-teacup-tail90-$fixture.log" 2>&1
 code=$?
 printf '%s_CAPTURE_EXIT=%s\n' "$fixture" "$code"
 if [ "$code" -ne 0 ]; then exit "$code"; fi
done
node scripts/v3a2/battle-capture.mjs --fixture wave3 --width 1440 --height 900 --seconds 30 --complete-actions --out reports/v4-art/REVIEW/A7/teacup-healer/raw/wave3-900 > reports/v4-art/jobs/a7-teacup-900.log 2>&1
printf 'LAYOUT900_EXIT=%s\n' "$?"
