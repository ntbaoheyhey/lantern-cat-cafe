# Twenty replay lifecycle checkpoint
REFERENCE: tools/cardrpg-big2/lifecycle.mjs; summary.json; ../navigation/checks.json

The pinned standalone demo `734d301c` completed one initial automatic fight and 20 natural x4 replays through real controls. There were zero runtime errors. Forced garbage collection occurred only between fights; the raw frame array marks these intervals separately.

Retained heap changed from 25,451,988 to 26,561,196 bytes: **+1,109,208 bytes (1.06 MiB)**, below the declared 2 MiB tolerance. Geometries remained 708, textures 120 and shader programs 50 throughout all 21 samples. This passes the stated 20-replay gate; it does not establish unlimited-session stability or zero heap growth. The harness also retains a growing frame array.

The separate 20 navigation cases (ten native, ten CPU4) navigated away during shader preparation. All warmups settled; each renderer was disposed once, its canvas removed and its context lost, with zero runtime errors. Source and artifact hashes remain in the JSON receipts. These measurements apply to the standalone B demo; accepted integrated main demo measurements are separate.
