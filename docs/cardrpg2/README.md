# The Lantern depth preview

Open `docs/cardrpg2/index.html` directly in a current desktop browser. The file embeds the application, models, icons and portraits in a gzip-compressed payload. Supported review sizes are 1024×600, 1280×720 and 1440×900.

REFERENCE: docs/cardrpg2/build.json; tools/cardrpg-depth/build.mjs; reports/cardrpg-depth/path/check.json.

## First visit

Try the practice table, read the intent and exploit the flavour advantage. Open the welcome invitation, equip a piece and build a three-cat team. Each cat equips three of its four individual skills. Begin Tangled Cafe, choose a route and select rewards between encounters. Later chapter clears open Rooftop Orchard, Midnight Pantry and the Tower.

REFERENCE: apps/web/src/game/cardrpg/depth/Pages.tsx; apps/web/src/game/cardrpg/depth/RunMap.tsx; packages/game-rules/src/cardrpg/depth/run.ts.

## Keep your progress

Open Save & settings, choose Export save code and keep the complete text. After reopening the file, paste it into the same screen and choose Import save code. The offline entry uses manual save codes. The opt-in app entry saves automatically in localStorage. Its development URL is `http://localhost:5173/?demo&squad=1&cardrpg2=1` after starting the existing web development command.

REFERENCE: packages/game-rules/src/cardrpg/depth/save.ts; apps/web/src/game/cardrpg/depth/model.ts; reports/cardrpg-depth/browser/app-check.json.

## Five-minute review

Save & settings contains visibly labelled demo shortcuts for all cats, build materials, stamps and chapter access. Review Team & cards, a Rooftop route, the Field guide, awakening and the fixture Fuji Relic panel. Before / after shows a source-referenced content census. The detailed report records the shortcuts used by the automated journey.

REFERENCE: apps/web/src/game/cardrpg/depth/Utility.tsx; reports/cardrpg-depth/path/check.json; reports/cardrpg-depth/CARDRPG-DEPTH-REPORT.md.

## Reproduce delivery checks

```sh
node tools/cardrpg-depth/build.mjs
node tools/cardrpg-depth/validate.mjs
python3 tools/cardrpg-demo/verify-delivery.py --depth --write-manifest
```

Commit runtime and tool changes before building so the verifier can bind the artifact to a source commit. Browser checks use local Playwright and Metal on the measured Mac. The report distinguishes functional checks, timing samples, behavioral simulations and the remaining balance and integration gaps.

REFERENCE: tools/cardrpg-depth/validate.mjs; tools/cardrpg-depth/verify-delivery.py; reports/cardrpg-depth/validation/delivery-results.json.
