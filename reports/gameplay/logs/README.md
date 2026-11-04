# Validation receipts
Logs larger than 10 KB are losslessly gzip-compressed. `archive-manifest.json` records original byte counts and SHA-256. Read with `gzip -dc <name>.log.gz` (or Python gzip). Initial failures are retained as well as corrected passes.

Final receipts: `unit-verified.log`, `art-tests-verified.log`, `typecheck-delivery.log`, `lint-delivery.log`, `art-delivery.log`, `e2e-final.log.gz` (399 tests), `forge-compact-final.log` (5 tests), `a11y-final.log`, `gallery-check.log`, `effects.log`, `performance.log`. The failed initial effects build used the wrong cwd; `effects-build-fixtures.log` contains the corrected build. No source failure was hidden.

Native follow-up: initial Art/UI native runs each have397 passes and2 Landing PNG mismatches; their compressed failure/full logs are retained. `native-suite-reproduction.log` records the exact six-case Linux-container suite passing. A diagnostic G1 CI run now retains actual screenshot attachments for comparison; do not treat local passes as remote-green evidence.
