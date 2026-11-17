#!/bin/sh
set -eu
tools/.venv/bin/python tools/v3craft-lab/v4-binding-thread/review-films.py --root reports/v4-art/REVIEW/A7/binding-thread/tail60 --duration 60 --after 30 --fixtures boss
tools/.venv/bin/python tools/v3craft-lab/v4-binding-thread/pack-review.py --root reports/v4-art/REVIEW/A7/binding-thread/tail60
