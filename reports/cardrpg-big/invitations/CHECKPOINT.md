# G ceremony checkpoint
REFERENCE: ../memory/PROMPT.md lines136–140, PLAN.md, screens/checks.json, timing/checks.json

The three existing earned-stamp banners now have a paper invitation, rarity light, card flip, single/ten pulls, duplicate shards and Skip. Every batch commits before its ceremony. Navigation and Skip preserve its saved results. Featured cards share the collection component and run the skill-preview miniature.

## Measured interaction checks
REFERENCE: screens/checks.json, timing/checks.json, ../validation/g-final.json

Four fresh browser configurations cover three desktop sizes and CPU 4×. Thirty-six screenshots pass with zero overflow, browser errors or remote requests. Checks exercise free welcome, ten pulls, forced hard pity, featured guarantee, gear parcels, duplicate shards, Skip, insufficient stamps, daily cap, old history and reduced motion. Thirteen focused UI tests and all five source gates pass, including1,692web tests,903rules tests and421E2E tests.

| Screenshot-free configuration | Page MAX ms | p95 ms | Frames >25 / >50 ms | Frames ≤20 ms |
| --- | ---: | ---: | ---: | ---: |
| 1280×720 CPU1 | 49.9 | 16.8 | 1 / 0 | 99.710% |
| 1440×900 CPU1 | 50.0 | 16.7 | 2 / 0 | 99.422% |
| 1024×600 CPU1 | 50.1 | 16.7 | 1 / 1 | 99.713% |
| 1280×720 CPU4 | 266.7 | 16.8 | 14 / 4 | 96.690% |

Page opening remains included. CPU4MAX266.7ms misses100ms. This interaction sample covers gacha. The queued full720-case skill harness will provide its own receipt and five profiles under a separate lock per configuration.

## Phase acceptance review
REFERENCE: ../memory/PROMPT.md lines136–140, screens/1280x720-cpu1-ten-pull-legendary.png, screens/1024x600-cpu1-standard.png

| Requirement | Result |
| --- | --- |
| Per-pull and ten-pull anticipation, rarity hint, flip, duplicate shards, Skip | PASS in focused tests and real clicks |
| Epic/legendary3D model entrance | PENDING integration with published B2a playEntrance API |
| Published odds, pity, history, cost and earning sources | Present and verified, viewport persistence PARTIAL |
| Featured card art and skill-preview loop | PASS in real-click browser checks |
| Earned-only pulls and account-bound results | PASS through existing command, labels and guards |

Visual review at1280and1024 confirms readable cards and the reveal skip control. At1024×600, odds and pity sit below the initial viewport. Integration will add a compact persistent fairness summary alongside the3D entrance. The G source/artifact stay pinned for the queued full harness.

Artifact284976a9db6da0cbca0f1e5272959281bf87f9263a20e18c17fd79e9d176598d contains the sibling M340 economy. I221ec3a8 is the separate balance checkpoint.
