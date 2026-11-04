#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 22.12+ (or 24+) is required. Install Node, then run pnpm demo again.' >&2; exit 1
fi
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22 || (a===22 && b>=12) ? 0 : 1)'; then
  echo 'Node.js 22.12+ (or 24+) is required.' >&2; exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo 'pnpm 10.28.0 is required. Install it with: npm install -g pnpm@10.28.0' >&2; exit 1
fi
if [[ "$(pnpm --version)" != 10.28.0 ]]; then
  echo 'Use pnpm 10.28.0 (the version pinned by this repository).' >&2; exit 1
fi
if [[ ! -f apps/web/node_modules/vite/bin/vite.js ]]; then
  echo 'Installing locked dependencies. A first install needs cached packages or network access.'
  pnpm install --frozen-lockfile --prefer-offline
fi
if [[ $# -gt 0 ]]; then
  exec node scripts/demo.mjs "$@"
else
  exec node scripts/demo.mjs
fi
