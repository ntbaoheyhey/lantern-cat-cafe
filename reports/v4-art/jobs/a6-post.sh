#!/bin/sh
while ps -p 68961 -o command= | rg -q 'a6-final.sh'; do sleep 5; done
node tools/v3craft-lab/v4-panko/live-probe.mjs all --all > reports/v4-art/jobs/a6-probe.log 2>&1
printf 'LIVE_EXIT=%s\n' "$?"
node tools/v3craft-lab/v4-panko/face-coverage.mjs > reports/v4-art/REVIEW/A6/face-coverage.log 2>&1
printf 'FACE_EXIT=%s\n' "$?"
node scripts/v3feel/capture.mjs --item V4-A6-PERF --fixture boss --seconds 30 --video-seconds 30 > reports/v4-art/jobs/a6-perf-capture.log 2>&1
printf 'PERF_EXIT=%s\n' "$?"
