#!/bin/sh
node tools/v3craft-lab/v4-clover/face-coverage.mjs > reports/v4-art/REVIEW/A5/face-coverage.log 2>&1
printf 'FACE_EXIT=%s\n' "$?"
node scripts/v3feel/capture.mjs --item V4-A5-PERF --fixture boss --seconds 30 --video-seconds 30 > reports/v4-art/jobs/a5-perf-capture.log 2>&1
printf 'PERF_EXIT=%s\n' "$?"
