#!/bin/sh
cd /Users/bao/taskbar-hero-cardrpg-a6 || exit 1
pnpm --dir apps/web exec vitest run src/game/cardrpg/spine/utility-presentation.test.ts > reports/v4-art/jobs/a7-teacup-targeted-r2.log 2>&1
teacup_target_exit=$?
printf "TARGET_EXIT=%s\n" "$teacup_target_exit"
if [ "$teacup_target_exit" -ne 0 ]; then exit "$teacup_target_exit"; fi
pnpm --dir apps/web test > reports/v4-art/jobs/a7-teacup-web-r2.log 2>&1
printf "WEB_EXIT=%s\n" "$?"
pnpm --dir apps/web typecheck > reports/v4-art/jobs/a7-teacup-typecheck-r2.log 2>&1
printf "TYPECHECK_EXIT=%s\n" "$?"
