# Header recovery checkpoint
REFERENCE: ../F7-GATES.md; ../../validation/integration-header.json; meta/checks.json; path/checks.json

HTML SHA256 `162f3d2444e531cee6d6fed2899fe1d283af199f9a0247c71d83969d733f877d` remains unchanged throughout the series.
The original slider-center failure is retained in `../header/meta-check.log`; the corrected padding-origin click selects exactly 0 degrees at all three sizes without changing the strict 2-degree threshold.

- Meta screens: 39 captures across 1024×600, 1280×720 and 1440×900; zero page errors, remote requests and overflow. Filters, model rotation, drag/drop, presets and equip/enhance/reforge/salvage checked through UI.
- Normal path: all three sizes pass Cafe → team/gear → Prepare → Fight → Result → map, replay and save/import. Each export is 15,378 bytes. Three campaign wins per size.
- Earlier header checks: 21 lab, 32 rare reveal and 36 invitation captures pass. This recovery adds 39 meta captures plus path screenshots.
- Source gates: typecheck, lint, build, 1,722 web tests, 1,020 rules tests (2 inherited expected failures and 11 skips), and 421 E2E pass.

These receipts apply to the pre-wrapper header artifact only. The merged full-roster wrapper is checked independently before acceptance.
