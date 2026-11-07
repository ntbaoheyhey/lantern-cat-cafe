# Offline asset packaging comparison
REFERENCE: tools/cardrpg-big2/build.mjs; tools/cardrpg-big2/pack-images.py; pack.json

The first candidate decreased the demo from **24,153,004 to 21,045,365 bytes**. Pillow verified every RGBA byte and dimensions for all17 PNG-to-WebP conversions. **That candidate is rejected:** Chromium's canvas decoding differs on the first transparent portrait (Velvet):3,709 channels, maximum delta18. The failed browser array is retained in `browser-pixels.json`; the assertion stopped at that first failure, so the other16 conversions were not certified.

The correction keeps all12 translucent portraits in their original PNG transport and converts only5opaque1024×1024 stage/felt textures. Chromium's format-specific premultiplied-alpha rounding is therefore avoided for the portraits. Source assets are untouched. The corrected demo candidate is **22,029,297bytes**, under24,000,000; its5browser pixel comparisons are queued in`review/opaque-pack`. No corrected browser-equivalence or opening-speed pass is claimed before those checks finish.

Neither candidate downscales textures, modifies model geometry or lowers filmstrip resolution. Native sharpness crop PNGs retain their original bytes in the evidence panel. `pack.json` records the original17-image Pillow comparison; it is not browser proof. The final evidence-complete demo must be measured again.

## Source verification
REFERENCE: ../../validation/pack-source.json; ../../delivery/scope.json

Typecheck, demo TypeScript, lint, unit tests and production build pass. Tests:1,698web/935rules(+2expected failures,11skips),581Supabase/32chain/24auth/16APIcontract. This is source verification; browser E2E remains queued in the phase pipeline and does not inherit a pass from these counts. Scope audit includes14,133changed paths (mostly retained raw evidence),4rules files all inside`auto-extras`,zero protected-path changes and4exact immutable-source hashes. Both shared gallery/test edits are recorded as Lane A-authorized.
