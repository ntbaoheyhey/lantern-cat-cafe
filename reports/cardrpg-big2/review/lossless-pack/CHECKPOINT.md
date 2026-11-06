# Offline asset packaging comparison
REFERENCE: tools/cardrpg-big2/build.mjs; tools/cardrpg-big2/pack-images.py; pack.json

The current demo decreased from **24,153,004 to 21,045,365 bytes**, saving **3,107,639 bytes**. The 24,000,000-byte cap is met in this build with 2,954,635 bytes of headroom. This is a packaging sample; the final evidence-complete demo must be measured again.

Seventeen PNG assets now travel inside the offline HTML as lossless WebP: twelve existing 640×800 portraits and five 1024×1024 stage/felt textures. The original asset files are untouched. The builder chooses WebP only when its gzip payload is smaller. Pillow independently decodes each result and requires exactly equal dimensions and every RGBA byte, including fully transparent pixel RGB. `pack.json` records source, packaged and RGBA hashes.

The browser-side original/packed pixel comparison is queued under the shared lock. No browser decode or opening-speed pass is claimed yet. The accepted review run will repeat full functionality and timing on its actual bytes.

This comparison does not downsample textures, modify model geometry, reduce filmstrip resolution or change rendering parameters. Native sharpness crop PNGs retain their original bytes in the evidence panel.

## Source verification
REFERENCE: ../../validation/pack-source.json; ../../delivery/scope.json

Typecheck, demo TypeScript, lint, unit tests and production build pass. Tests:1,698web/935rules(+2expected failures,11skips),581Supabase/32chain/24auth/16APIcontract. This is source verification; browser E2E remains queued in the phase pipeline and does not inherit a pass from these counts. Scope audit includes14,133changed paths (mostly retained raw evidence),4rules files all inside`auto-extras`,zero protected-path changes and4exact immutable-source hashes. Both shared gallery/test edits are recorded as Lane A-authorized.
