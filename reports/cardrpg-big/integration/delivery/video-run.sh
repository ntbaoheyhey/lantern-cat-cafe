#!/bin/sh
set -eu
cd /Users/bao/taskbar-hero-cardrpg-big-delivery
while kill -0 26101 2>/dev/null; do sleep 3; done
node -e 'const f=require("./reports/cardrpg-big/validation/delivery-v1.json");if(f.length!==5||f.some(x=>x.exit!==0))process.exit(1)'
# Start only after the functional series has finished successfully.
while test ! -f reports/cardrpg-big/integration/delivery/functional.json || ! node -e 'const f=require("./reports/cardrpg-big/integration/delivery/functional.json");if(f.rows.length!==10)process.exit(1)' 2>/dev/null; do sleep 3; done
node -e 'const f=require("./reports/cardrpg-big/integration/delivery/functional.json");if(f.rows.some(x=>x.exit!==0))process.exit(1)'
export BIG_ARTIFACT="$PWD/docs/cardrpg3/index.html"
export BIG_VIDEO_OUT=reports/cardrpg-big/video/delivery
node tools/cardrpg-big/video-series.mjs
nice -n 10 /tmp/cardrpg-big-tools/bin/python tools/cardrpg-big/video-sheets.py reports/cardrpg-big/video/delivery/captures.json
