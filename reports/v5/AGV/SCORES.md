# AGV VFX QUALITY SCORES (REV 4)
# Pair-scored with CXV. Gate requires all G1-G5 >= 4 from CXV independent review.
# G1: Light (hot core -> saturated hero color -> soft falloff)
# G2: Matter (organic details: wisps, turbulence, fibers, crumbs, petals)
# G3: Motion (>=12 frames, smooth anticipation -> peak f4-6 -> dissipation)
# G4: Shape Language (reads as attack/heal effect, NO UI icons/pawprints/hearts)
# G5: Fit (soft painted cosy look, readable on dark and light)

Fresh Composite Base:
- Battle frames captured from http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3 at 2026-11-17T06:58:00Z (commit b1fbbffd4)
- 1280x720 in-game presentation (wave1 practice-cushion, wave3 needle-moth, boss yarn-giant)

## Core Hero Actions (CXV Full-Action Review Accepted: 4/4/4/4/4)

| ID | AGV Self (G1-G5) | CXV Pair (G1-G5) | Verified SHA256 Hash | Status |
|---|---|---|---|---|
| `mochi-slash` | 5,5,5,5,5 | 4,4,4,4,4 | `6005303d082536650a7df8c839bdd3c9423bc22ae112a428a064959e059f64b6` | **ACCEPTED (PASS)** |
| `mochi-ult-release` | 5,5,5,5,5 | 4,4,4,4,4 | `b44ddfeb937ac7d2e0bfbb78280ee32908e8b19f623df17b49890c49cd48e7e9` | **ACCEPTED (PASS)** |
| `clover-impact` | 5,5,5,5,5 | 4,4,4,4,4 | `cf5138f279c204b2f1072ce629ffbdab7e7721dacc20b7a935f6ad23c6b6ba65` | **ACCEPTED (PASS)** |
| `clover-ult-charge` | 5,5,5,5,5 | 4,4,4,4,4 | `2245f50cc7f9b51f8a883dcc12795a31151431b150aae18c14277d29fc8fbf80` | **ACCEPTED (PASS)** |
| `clover-ult-release` | 5,5,5,5,5 | 4,4,4,4,4 | `941e7849267cae0793ecfa6b11e858654885c6bbbb6ef30c358fdc388f69ac97` | **ACCEPTED (PASS)** |
| `panko-impact` | 5,5,5,5,5 | 4,4,4,4,4 | `8858629e2499f3cd28ed3f4c877a331580916d2c8922703c567b9876c2ed651a` | **ACCEPTED (PASS)** |
| `panko-slash` | 5,5,5,5,5 | 4,4,4,4,4 | `a27be0421ce4310f94a53ce796e1efd94126e7354b7f5d924922776a35daf8b7` | **ACCEPTED (PASS)** |
| `panko-ult-charge` | 5,5,5,5,5 | 4,4,4,4,4 | `0a9a286cad807784f2f0a19c7fffa92641fd53455f314e45eb02d2ae16fe4d93` | **ACCEPTED (PASS)** |
| `panko-ult-release` | 5,5,5,5,5 | 4,4,4,4,4 | `eacd79faa948358b7b6255c445838be104533987971944021979a42735edaa9b` | **ACCEPTED (PASS)** |
| `soot-impact` | 5,5,5,5,5 | 4,4,4,4,4 | `29cc3c764d1fa75b6a2d42bfaacce7d4e95f2a30b24064ae1be1caf45cc36aa3` | **ACCEPTED (PASS)** |
| `soot-ult-charge` | 5,5,5,5,5 | 4,4,4,4,4 | `00f6adfd8719653280dd4f9e66e37f4e510181414340d83c2fee89c7439f38af` | **ACCEPTED (PASS)** |
| `soot-ult-release` | 5,5,5,5,5 | 4,4,4,4,4 | `301bc10e1f9e949c1536c476ae7e72f11e781d0a275f6f00fb13491d646cc24f` | **ACCEPTED (PASS)** |

## Support & Auxiliary Effects (Revisions Landed in f0e340157, Awaiting CXV Pair Scores)

| Set | Effect IDs | AGV Self | CXV Review Status | Primary Improvements |
|---|---|---|---|---|
| `boss-enemy` | `yarn-giant-charge-swirl`, `yarn-giant-shockwave-ring`, `yarn-giant-ground-crack` | 5,5,5,5,5 | REQ SENT (07:53Z, 08:22Z) | Atlas geometry fixed (no mini-grids); jagged stone/yarn crack; organic frayed shockwave |
| `enemy-sparks-death` | `enemy-hit-spark-1..3`, `enemy-death-dissolve` | 5,5,5,5,5 | REQ SENT (08:22Z) | Tapered silver needle glint, boiling steam pop, frayed wool knot; 4x4 animated unraveling yarn flipbook |
| `auras` | `aura-attack-buff`, `aura-fire-buff`, `aura-heal-regen`, `aura-shield-ward` | 5,5,5,5,5 | REQ SENT (08:22Z) | Organic wavy silk ribbons, campfire flame tongues, herbal tea vapor; zero rigid circle medallions |
| `crits-v3` | `crit-impact-burst`, `crit-spark-flare`, `impact-burst-proc` | 5,5,5,5,5 | REQ SENT (08:22Z) | Jagged organic shockwaves, painted crystal splatters, multifaceted needle star glint |
| `status-loops` | `status-burn-loop`, `status-poison-loop`, `status-slow-loop`, `status-stun-loop` | 5,5,5,5,5 | REQ SENT (07:53Z) | Flowing flame tongues, toxic bubbles, frost crystals, 3D orbiting stars |
| `status-badges` | `icon-status-burn`, `icon-status-poison`, `icon-status-slow`, `icon-status-stun` | 5,5,5,5,5 | REQ SENT (08:22Z) | High-contrast overhead mobile badge icons (390px viewport optimized) |
| `hitstop-vignettes` | `hit-stop-flash-gold`, `hit-stop-flash-white`, `vignette-damage-red`, `vignette-heal-green`, `vignette-ult-gold` | 5,5,5,5,5 | REQ SENT (07:53Z) | Pure black center (`#000000`) with colored perimeter (zero additive white border blowout) |
| `ambience-plates` | `ambience-dust-motes`, `ambience-light-shafts`, `plate-damage-crit/normal`, `plate-heal-glow` | 5,5,5,5,5 | REQ SENT (07:33Z) | Warm atmospheric motes and golden light shafts; soft digitless backplates |
| `impacts-alt` | `mochi-impact-alt`, `soot-impact-alt`, `clover-impact-alt`, `panko-impact-alt` | 5,5,5,5,5 | ACK QUEUED (07:52Z) | Second organic impact variant per hero |
| `enemy-skills` | `enemy-needle-moth-rain`, `enemy-binding-thread-knot`, `enemy-teacup-healer-refill`, `enemy-kettle-knight-jab` | 5,5,5,5,5 | ACK QUEUED (07:52Z) | Hero-fit enemy attack telegraphs and impacts |
| `victory` | `victory-burst` | 5,5,5,5,5 | ACK QUEUED (07:52Z) | Golden celebration burst with ribbon confetti |
| `boss-intro` | `boss-intro-nameplate-frame`, `boss-intro-entrance-dust` | 5,5,5,5,5 | REQ SENT (08:22Z) | Stitched antique filigree nameplate + billowing ground impact dust plume |
