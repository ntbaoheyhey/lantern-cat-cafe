# Offline asset packaging comparison
REFERENCE: tools/cardrpg-big2/build.mjs; tools/cardrpg-big2/pack-images.py; pack.json

The current demo decreased from **24,153,004 to 21,045,365 bytes**, saving **3,107,639 bytes**. The 24,000,000-byte cap is met in this build with 2,954,635 bytes of headroom. This is a packaging sample; the final evidence-complete demo must be measured again.

Seventeen PNG assets now travel inside the offline HTML as lossless WebP: twelve existing 640×800 portraits and five 1024×1024 stage/felt textures. The original asset files are untouched. The builder chooses WebP only when its gzip payload is smaller. Pillow independently decodes each result and requires exactly equal dimensions and every RGBA byte, including fully transparent pixel RGB. `pack.json` records source, packaged and RGBA hashes.

The browser-side original/packed pixel comparison is queued under the shared lock. No browser decode or opening-speed pass is claimed yet. The accepted review run will repeat full functionality and timing on its actual bytes.

This comparison does not downsample textures, modify model geometry, reduce filmstrip resolution or change rendering parameters. Native sharpness crop PNGs retain their original bytes in the evidence panel.
