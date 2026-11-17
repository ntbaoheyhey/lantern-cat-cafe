#!/bin/sh
sh reports/v4-art/jobs/a5-regression.sh
node scripts/v3feel/capture.mjs --item V4-A5 --seconds 30 --video-seconds 30 > reports/v4-art/jobs/a5-final-capture.log 2>&1
printf 'CAPTURE_EXIT=%s\n' "$?"
tools/.venv/bin/python tools/v3craft-lab/v4-clover/review-films.py > reports/v4-art/jobs/a5-film-review.log 2>&1
printf 'REVIEW_EXIT=%s\n' "$?"
