#!/bin/sh
set -eu
cd /Users/bao/taskbar-hero-cardrpg-big-delivery
export BIG_ARTIFACT="$PWD/docs/cardrpg3/index.html"
export BIG_WRAPPER_OUT=reports/cardrpg-big/integration/delivery/pilot/wrapper
export BIG_PACK_RECEIPT=docs/cardrpg3/build.json
export BIG_PACK_OUT=reports/cardrpg-big/integration/delivery/pilot/packing
check_artifact() { test "$(shasum -a 256 "$BIG_ARTIFACT" | cut -d ' ' -f 1)" = 9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3; }
check_artifact
node tools/cardrpg-big/with-timing-lock.mjs delivery-wrapper-pilot node tools/cardrpg-big/wrapper-check.mjs > reports/cardrpg-big/integration/delivery/pilot/wrapper.log 2>&1
check_artifact
sleep 7
node tools/cardrpg-big/with-timing-lock.mjs delivery-packing-pilot node tools/cardrpg-big2/image-pack-check.mjs > reports/cardrpg-big/integration/delivery/pilot/packing.log 2>&1
check_artifact
