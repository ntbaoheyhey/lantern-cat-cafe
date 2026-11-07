#!/bin/sh
set -eu
cd /Users/bao/taskbar-hero-cardrpg-big-integration
export BIG_ARTIFACT="$PWD/docs/cardrpg3/index.html"
expected=162f3d2444e531cee6d6fed2899fe1d283af199f9a0247c71d83969d733f877d
check_artifact() {
  actual=$(shasum -a 256 "$BIG_ARTIFACT" | cut -d ' ' -f 1)
  test "$actual" = "$expected"
}
export BIG_META_OUT=reports/cardrpg-big/integration/header-recovery/meta
export BIG_PATH_OUT=reports/cardrpg-big/integration/header-recovery/path
for step in meta-check auto-path-check; do
  check_artifact
  node tools/cardrpg-big/with-timing-lock.mjs "header-recovery-$step" node "tools/cardrpg-big/$step.mjs" > "reports/cardrpg-big/integration/header-recovery/$step.log" 2>&1
  check_artifact
  sleep 7
done
node tools/cardrpg-big/with-timing-lock.mjs integration-header-gates node tools/cardrpg-big/validate.mjs integration-header > reports/cardrpg-big/validation/integration-header-run.log 2>&1
check_artifact
