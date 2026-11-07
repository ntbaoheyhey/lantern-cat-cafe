# Profiles of the five leading cast cases
REFERENCE: summary.json; ../ranked.json; tools/cardrpg-big/profile-skills.mjs

These sequential cold reruns use the same artifact SHA and configuration as the original cases, with tracing enabled from navigation. All five original 33.4 ms first-cast intervals were absent during profiled reruns. Their exact transient cause remains unresolved.

| Case | Original first MAX ms | Profiled first / repeat MAX ms | Profiled whole-session MAX ms | Largest-frame contributors |
| --- | ---: | ---: | ---: | --- |
| [Clover · Patient steep](1280x720-dpr1-cpu4-medium-clover-2/HITCHES.md) | 33.4 | 16.8 / 16.8 | 1483.3 | Decoder 1283.8 ms, GC 71.3 ms sampled |
| [Velvet · Velvet curtain](1280x720-dpr1-cpu4-medium-velvet-4/HITCHES.md) | 33.4 | 16.8 / 16.8 | 1516.7 | Decoder 1295.2 ms, GC 77.8 ms sampled |
| [Clover · Leaf tap](1440x900-dpr1-cpu4-medium-clover-1/HITCHES.md) | 33.4 | 16.8 / 16.8 | 1466.6 | Decoder 1269.6 ms, GC 72.1 ms sampled |
| [Brioche · Borrowed blanket](1280x720-dpr2-cpu4-medium-brioche-2/HITCHES.md) | 33.4 | 16.8 / 16.8 | 1450.0 | Decoder 1243.7 ms, GC 73.0 ms sampled |
| [Panko · Bread cover](1280x720-dpr1-cpu4-medium-panko-2/HITCHES.md) | 33.4 | 16.8 / 16.8 | 1483.3 | Decoder 1276.2 ms, GC 76.5 ms sampled |

## Attribution
REFERENCE: tools/cardrpg-big/build.mjs; docs/cardrpg3/index.html; */trace-attribution.json

All five largest whole-session frames contain the synchronous payload decoder. The sampled anonymous function at zero-based line 2, column 12883020 is the loader around `Uint8Array.from(atob(payload), callback)`. The callback at column 12883111 maps characters to bytes. Each trace also records garbage collection in that interval. Sampled durations are statistical, and main-thread task durations are inclusive. Each linked hitch table retains every interval above 33 ms and its overlapping work.

The original first-cast spikes remain an explicit attribution gap. The baseline adapter also lacks matching spell-direction entries, so these timings describe partially absent effects. Later phases must measure the fully rendered effects again.
