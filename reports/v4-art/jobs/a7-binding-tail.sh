#!/bin/sh
node tools/v3craft-lab/v4-binding-thread/live-probe.mjs 1 > reports/v4-art/jobs/a7-binding-second-probe.log 2>&1
printf 'SECOND_PROBE_EXIT=%s\n' "$?"
node scripts/v3feel/capture.mjs --item V4-A7-BINDING-TAIL60 --fixture boss --seconds 60 --video-seconds 60 > reports/v4-art/jobs/a7-binding-tail-capture.log 2>&1
printf 'TAIL_CAPTURE_EXIT=%s\n' "$?"
