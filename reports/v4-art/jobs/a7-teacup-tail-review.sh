#!/bin/sh
cd /Users/bao/taskbar-hero-cardrpg-a6 || exit 1
tools/.venv/bin/python tools/v3craft-lab/v4-teacup-healer/verify-markers.py --capture-root reports/v3-feel/REVIEW/V4-A7-TEACUP-TAIL90 --out reports/v4-art/REVIEW/A7/teacup-healer/tail90/encoded-markers.json --fixtures wave1 wave3 || exit $?
tools/.venv/bin/python tools/v3craft-lab/v4-teacup-healer/review-films.py --capture-root reports/v3-feel/REVIEW/V4-A7-TEACUP-TAIL90 --root reports/v4-art/REVIEW/A7/teacup-healer/tail90 --fixtures wave1 wave3 --duration 90 --after 30 || exit $?
tools/.venv/bin/python tools/v3craft-lab/v4-teacup-healer/pack-review.py --root reports/v4-art/REVIEW/A7/teacup-healer/tail90
printf 'REVIEW_EXIT=%s\n' "$?"
