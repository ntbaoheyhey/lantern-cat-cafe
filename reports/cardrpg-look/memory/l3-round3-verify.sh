#!/bin/zsh
set -e
LOOK_OUT=reports/cardrpg-look/rounds/post/runtime-3/cancellation node tools/cardrpg-look/loading-check.mjs
LOOK_ARTIFACT=docs/cardrpg-look/index.html LOOK_OUT=reports/cardrpg-look/rounds/post/runtime-3 LOOK_TIME=3.2 LOOK_SIZES='[[1440,900]]' LOOK_KINDS=stage node tools/cardrpg-look/capture.mjs
/Users/bao/tools/cardrpg-look/venv/bin/python tools/cardrpg-look/metrics/stage-sheets.py reports/cardrpg-look/rounds/post/runtime-3
LOOK_OUT=reports/cardrpg-look/rounds/post/runtime-3/post node tools/cardrpg-look/post-check.mjs
/Users/bao/tools/cardrpg-look/venv/bin/python tools/cardrpg-look/metrics/post.py reports/cardrpg-look/rounds/post/runtime-3/post
