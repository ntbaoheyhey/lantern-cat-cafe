#!/bin/sh
cd /Users/bao/taskbar-hero-cardrpg-a6 || exit 1
pnpm --dir apps/web test > reports/v4-art/jobs/a7-teacup-web.log 2>&1
printf "WEB_EXIT=%s\n" "$?"
pnpm --dir apps/web typecheck > reports/v4-art/jobs/a7-teacup-typecheck.log 2>&1
printf "TYPECHECK_EXIT=%s\n" "$?"
