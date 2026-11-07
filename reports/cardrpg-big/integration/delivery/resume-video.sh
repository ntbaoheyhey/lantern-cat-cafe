#!/bin/sh
set -eu
cd /Users/bao/taskbar-hero-cardrpg-big-delivery
while test ! -f reports/cardrpg-big/integration/delivery/functional-resumed.json; do sleep 3; done
node -e 'const r=require("./reports/cardrpg-big/integration/delivery/functional-resumed.json");if(!r.complete||r.completed!==10||r.sha256!=="9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3")process.exit(1)'
export BIG_ARTIFACT="$PWD/docs/cardrpg3/index.html"
export BIG_VIDEO_OUT=reports/cardrpg-big/video/delivery
node tools/cardrpg-big/video-series.mjs
nice -n 10 /tmp/cardrpg-big-resume-tools/bin/python tools/cardrpg-big/video-sheets.py reports/cardrpg-big/video/delivery/captures.json
