# Lane B offline integration hooks
REFERENCE: tools/cardrpg-big2/{offline,MechanicsLab,ReviewStudio}.tsx; tools/cardrpg-big2/mechanics-model.ts; tools/cardrpg-big2/{build,embed-evidence}.mjs; tools/cardrpg-big2/offline-loader.js

These are the concrete dependencies of Lane B’s separate offline demo. Source is implemented locally; B1, the three cat batches, B3 (draft349) and B5 (draft350) are published as of 2026-11-06 20:43 UTC. Do not copy unpublished source into an accepted integration. Later checkpoints identify the published head and browser receipts. Keep all existing feature flags and automatic extras default off.

## Entry and isolated accounts
REFERENCE: tools/cardrpg-big2/offline.tsx; tools/cardrpg-big2/MechanicsLab.tsx; tools/cardrpg-big2/mechanics-model.ts; tools/cardrpg-big2/ReviewStudio.tsx

- `MechanicsLab({close})` owns a disposable `MechanicsModel(true)` and imports its own `lab.css`. Never pass the real account into it. `DEFAULT_AUTO_EXTRAS` supplies all-off defaults; options are frozen for a fight. It uses the ordinary `BattleView` and disposes its audio on unmount.
- `ReviewStudio({close, go, openMechanics})` imports `studio.css`, owns an isolated `DepthModel(true)` for gallery previews and exposes all 25 units / 86 actions. `go(screen)` closes the studio and navigates the main model. `openMechanics()` changes the isolated panel.
- `FrameMeter()` is optional. Its bounded 180-frame buffer updates canvas/text imperatively; it is a local overlay, not a substitute for the saved gate arrays.
- The B wrapper renders `<DepthApp offline />`, inserts its panels into `.cr-content` with `createPortal`, stores the main `screen` and `sceneStarted`, then sets `sceneStarted=false` and navigates to `evidence`. Closing restores both values. Opening is ignored when `model.showBattle` is true. This ensures only one active 3D scene and preserves the main account. Keep the existing A FeelLab unchanged.
- The test handles are `window.__mechanicsLab`, `window.__b2Gallery` and the existing `window.__depthReview` / `window.__depthScene`. They are inspection handles, not save data. The panel class `b2-demo-lab-open` hides the underlying evidence screen.
- Main demo authoring remains A-owned. Adapt these exports in A’s entry or adopt the wrapper after merging the final B checkpoint; do not mount two application roots. Keep these imports in the offline demo entry so the live flag-off startup remains free of Three.js/model modules.

## Embedded evidence and assets
REFERENCE: tools/cardrpg-big2/build.mjs; tools/cardrpg-big2/embed-evidence.mjs

The builder’s URL plugin turns each imported GLB/PNG/WebP/SVG URL into `window.__cardAssets[key]`. It stores gzip/base64 asset tags plus a manifest. Preserve the manifest keys and loader contract if adapting A’s builder. This includes the baked stage textures from B1.

Call `evidencePayload(root)` at build time. Insert its `tags` before the application, and its `script` in a script tag before the app starts. The script defines `window.__b2Evidence` and `window.__b2Checks`. Comparison images resolve the matching DOM IDs lazily. Motion strips use 480×270 WebP thumbnails; original captures stay in reports. Sharpness crops stay native PNG pixels. The build requires `/tmp/cardrpg-big-tools/bin/python` with Pillow, or an explicit `BIG_PYTHON`; this is only a build dependency. No Python/server/network dependency is present when opening the delivered HTML.

The later B6 builder also supports lossless PNG transport through `pack-images.py`: keep each original manifest key, replace only opaque texture bytes and MIME with lossless WebP when the gzip payload is smaller. Transparent portraits retain their original PNG transport: the first candidate was exact in Pillow but FAILED Chromium canvas equivalence (3,709 channel differences on Velvet). The corrected candidate is22,029,297bytes; all five opaque textures now have exact decoded Chromium RGBA. The later Focus-stage candidate is22,060,373bytes; verify the accepted delivery bytes again. Source assets stay untouched. The packer uses the same Pillow build dependency.

The evidence builder only includes files already present. Rebuild after enemy/boss/stage captures arrive; inspect `build.json.evidence` and the browser receipt before claiming full inclusion. Boss videos remain external artifacts to avoid inflating the offline payload.

## Loading and measurements
REFERENCE: tools/cardrpg-big2/offline-loader.js; tools/cardrpg-big2/opening-compare.mjs; tools/cardrpg-big2/measure.mjs

B1’s published loader decodes one asset at a time through `DecompressionStream`, yields between assets and advances real `<progress id="opening-progress">`. The fallback message uses `#loading`. It records `window.__b2Load.started`, `assets[]` and `scriptStarted`. Keep the progress element alongside the loading text in `#root`.

The current local follow-up uses a `blob:` URL and asynchronous script loading, rather than inline synchronous compilation. It additionally records `scriptLoaded` and revokes the temporary application URL after load. It requires `script-src 'unsafe-inline' blob:` in the offline CSP. Only local embedded data/blob resources are permitted. The identical-JS/CSS paired cold comparison is complete: CPU4 whole-page MAX116.7→100ms and compile81.9→6.5ms, with zero runtime errors. It is retained provisionally; the exhaustive final matrix must follow. One CPU4 battle-ready sample rose9.12→10.12s. Do not describe the strict opening gate as fixed; existing B1 exhaustive MAX300ms remains a miss. See performance/async-opening/CHECKPOINT.md. This loader source will be published after its later predecessor gates.

## Rules runner and integration gates
REFERENCE: packages/game-rules/src/cardrpg/depth/auto-extras/{index,runner}.ts; reports/cardrpg-big2/mechanics/SUMMARY.md

`createAutoExtrasRunner(options)` provides the optional `(battle, policy) => Battle` adapter requested by A. The native runner must remain the default. A completed its full gear and 45-day economy ON/OFF comparisons in aa977f0f. Native/OFF arrays match in six gear and six economy groups; positive tier steps26/48→27/48, while broad balance gaps remain. All extras remain off. See mechanics/INTEGRATION-COMPARISON.md for attributed numbers. The B lab’s 18,000 fights used the older inherited rules and do not substitute for integration balance evidence.

After A announces an integrated checkpoint: reconcile the unpublished B continuation with it, preserve the pinned phase artifacts, rebuild the B offline demo, rerun source gates and browser functionality, and measure the actual integrated HTML. Required checks include isolated account restoration, default-off parity, invitation entrance, three desktop sizes, audio, page opening, full skill matrix and 20-battle lifecycle. Neither lane promotes extras or merges/deploys.
