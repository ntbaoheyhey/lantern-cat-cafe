#!/bin/sh
pnpm --filter @taskbar-hero/web test --reporter=dot > reports/v4-art/jobs/a7-binding-web.log 2>&1
printf 'WEB_EXIT=%s\n' "$?"
pnpm --filter @taskbar-hero/web typecheck > reports/v4-art/jobs/a7-binding-typecheck.log 2>&1
printf 'TYPECHECK_EXIT=%s\n' "$?"
node scripts/v3feel/parity.mjs > reports/v4-art/jobs/a7-binding-parity.log 2>&1
printf 'PARITY_EXIT=%s\n' "$?"
