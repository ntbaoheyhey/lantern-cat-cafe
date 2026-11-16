#!/bin/sh
while ps -p 88959 -o command= | rg -q 'V4-A7-BINDING'; do sleep 5; done
tools/.venv/bin/python tools/v3craft-lab/v4-binding-thread/blind-read.py prepare
printf 'BLIND_PREPARE_EXIT=%s\n' "$?"
tools/.venv/bin/python tools/v3craft-lab/v4-binding-thread/review-films.py
printf 'FILM_REVIEW_EXIT=%s\n' "$?"
