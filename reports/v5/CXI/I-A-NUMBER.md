# Number glyph metrics — independent production acceptance
CXV e58ef974c, integrated as4892934f453d16c3de37b943037ba50ac389c559, is accepted for bounded atlas work reduction. Per-color painting stays unchanged; only opaque glyph measurements share a font-keyed cache. Transparency still measures separately, and font readiness/disposal clears the cache.

Own exact-URL1280x720 captures17November2026,17:19–17:24UTC; m1.9 baseline indexa7a8c615, candidatead7c85b2. Full source/index/UTC and hashes: [evidence](evidence/v7-number-production.json).
-171 glyph rectangles/digit metrics and9complete RGBA atlas hashes match the actual m1.9 production baseline exactly. Nine palettes include transparency. Interleaved4xCPU attribution:171→38readbacks and62.4→25.5ms median atlas construction. This isolated diagnostic is not a gameplay frame-rate result.
- Normal32s boss:CPU median4.1→4.3ms,p956.2→6.5ms;framep9516.7→16.8ms;startupCPUmax53.6→53.3ms. Zero frames>50.5ms both sides.
-4xCPU32s boss:CPU median20.0→19.6ms,p9530.2→27.8ms;framep9550.1→50.0ms,p99 remains100ms;frames>50.5ms40→37. StartupCPUmax worsens184.4→196.5ms and maximumframe216.7→250ms. Both rates on both builds have26actor+3status presentations,6ults,171events,0errors.
-60 labelled number samples across normal/critical/heal/stack/reduced-critical have0face/label overlaps. Critical/stack cases are explicitly synthetic renderer fixtures. Five new1024x432 sheets and one1024x576 ordinary-boss image measured then inspected once; numbers are visible, faces/HP unobscured, feet clear.
-12focused tests across5files and production build/typecheck pass. Disposal probe confirms canvas removed and atlas/metric caches cleared. No full-suite-after-number change claim yet.

This single host pair supports reduced atlas work with identical pixels, not general startup/FPS improvement. Latest green remainsv5-m1.9 until the next full pipeline and films. Raw evidence remains ignored under work/v5/CXI/{number-atlas,number-captures,performance}/v7-number-*.
