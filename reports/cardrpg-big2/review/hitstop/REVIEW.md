# Current-artifact impact holds
REFERENCE: checks.json; apps/web/src/game/squad/turn3d/card-impact.ts; card-motion-data.ts

HTML SHA256 `734d301c5dfc192e6e0a74e03311deff2fde93acd673983724813bec96a7cfec`. Actual rendered mixer samples cover 74 authored attack/skill IDs, three impact offsets, and both ordinary/reduced-motion settings: 444 samples, zero runtime errors.

Seventy clips retain exactly the same animation time from offset 0 to 20 ms. Four advance normally: `mochi-2`, `soot-2`, `clover-2`, `clover-3`; their original authored hold values are all zero. All 74 reduced-motion variants advance at 20 ms with shake zero. These are direct comparisons of saved mixer times, not an inference from distinct recipe names. Action budgets remain unchanged in source/unit evidence.

The sampled head quaternion can still change during an ordinary hold because the scene includes independent facing/ambient adjustments; this is a clip hold, not a claim that every scene pixel freezes. These fixed-time probes verify the mechanism, not perceived impact quality, kill timing or real-time frame performance.

Raw receipt SHA256 `389a2b1789e70e43e74f38bf5624f4d8e775c4f54761fd70a2da13fbcc6c7b46`.
