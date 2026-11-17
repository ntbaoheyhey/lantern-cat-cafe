#!/bin/sh
sh reports/v4-art/jobs/a6-regression.sh
node scripts/v3feel/capture.mjs --item V4-A6 --seconds 30 --video-seconds 30 > reports/v4-art/jobs/a6-final-capture.log 2>&1
printf 'CAPTURE_EXIT=%s\n' "$?"
tools/.venv/bin/python tools/v3craft-lab/v4-panko/review-films.py > reports/v4-art/jobs/a6-film-review.log 2>&1
printf 'REVIEW_EXIT=%s\n' "$?"
node scripts/v3a2/battle-capture.mjs --fixture boss --width 1440 --height 900 --seconds 30 --out reports/v4-art/REVIEW/A6/boss900 > reports/v4-art/jobs/a6-900.log 2>&1
printf "BOSS900_EXIT=%s\n" "$?"
tools/.venv/bin/python tools/v3craft-lab/v4-panko/review-900.py > reports/v4-art/jobs/a6-900-review.log 2>&1
printf "REVIEW900_EXIT=%s\n" "$?"
