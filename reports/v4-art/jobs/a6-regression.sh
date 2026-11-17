#!/bin/sh
pnpm --filter @taskbar-hero/web test --reporter=dot > reports/v4-art/REVIEW/A6/web-tests.log 2>&1
printf 'WEB_EXIT=%s\n' "$?"
pnpm --filter @taskbar-hero/web typecheck > reports/v4-art/REVIEW/A6/typecheck-final.log 2>&1
printf 'TYPECHECK_EXIT=%s\n' "$?"
node scripts/v3feel/parity.mjs > reports/v4-art/REVIEW/A6/parity.log 2>&1
printf 'PARITY_EXIT=%s\n' "$?"
