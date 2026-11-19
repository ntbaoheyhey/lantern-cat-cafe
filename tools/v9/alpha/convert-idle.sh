#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PYTHON="${V9_PYTHON:-$ROOT/work/v9/CXV/.venv/bin/python}"
if [[ ! -x "$PYTHON" ]]; then
  printf 'Install dependencies: python3 -m venv work/v9/CXV/.venv && work/v9/CXV/.venv/bin/pip install -r tools/v9/alpha/requirements.txt\n' >&2
  exit 1
fi
exec "$PYTHON" "$ROOT/tools/v9/alpha/convert_idle.py" "$@"
