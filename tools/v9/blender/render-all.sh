#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BLENDER="${V9_BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
PYTHON="${V9_PYTHON:-$ROOT/work/v9/CXV/.venv/bin/python}"
EFFECT="${1:-all}"
"$BLENDER" -b --python-exit-code 1 -P "$ROOT/tools/v9/blender/render_effects.py" -- --effect "$EFFECT"
"$PYTHON" "$ROOT/tools/v9/blender/pack_effects.py" --effect "$EFFECT"
