#!/bin/sh
cd /Users/bao/taskbar-hero-cardrpg-a6 || exit 1
pnpm --dir apps/web test > reports/v4-art/jobs/a7-teacup-web-final.log 2>&1
teacup_exit=$?
printf "WEB_EXIT=%s\n" "$teacup_exit"
if [ "$teacup_exit" -ne 0 ]; then exit "$teacup_exit"; fi
pnpm --dir apps/web typecheck > reports/v4-art/jobs/a7-teacup-typecheck-final.log 2>&1
teacup_exit=$?
printf "TYPECHECK_EXIT=%s\n" "$teacup_exit"
if [ "$teacup_exit" -ne 0 ]; then exit "$teacup_exit"; fi
node scripts/v3feel/parity.mjs check > reports/v4-art/jobs/a7-teacup-parity.log 2>&1
teacup_exit=$?
printf "PARITY_EXIT=%s\n" "$teacup_exit"
if [ "$teacup_exit" -ne 0 ]; then exit "$teacup_exit"; fi
cp reports/v3-feel/parity-latest.json reports/v4-art/REVIEW/A7/teacup-healer/parity.json
node scripts/v3feel/capture.mjs --item V4-A7-TEACUP --seconds 30 --video-seconds 30 --frame-marker > reports/v4-art/jobs/a7-teacup-capture.log 2>&1
printf "CAPTURE_EXIT=%s\n" "$?"
