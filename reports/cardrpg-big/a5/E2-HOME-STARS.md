# Home star destination follow-up

An original Home02 earned checkpoint had all three chapters cleared and unfinished stars in Tangled Cafe. Home named that star but the primary button always revisited Midnight Pantry. A selected challenge band could also disagree with the hint's recorded band. This follow-up makes the suggested star, primary chapter and challenge band agree.

Newly unlocked, uncleared chapters still take priority. After all chapters are cleared, the default band follows a reachable unfinished star; an explicitly selected band chooses a star from that band. Hints above the crew ceiling or in a locked chapter are excluded. An active route retains its own chapter/band and Continue only opens the map. Completed recorded stars never prompt a first-star claim. Gameplay v4 OFF and all combat/reward/save rules are unchanged.

## Verified evidence

Registered source: `96b32a5d3`, exact two-file draft hashes from [registration](e2-home-stars/registration.json). The original minute42 checkpoint is retained verbatim; its continuation uses public commands. Separate synthetic cases exercise band selection, locked progression, inaccessible high-band goals, all recorded stars complete and an existing active route. These cases do not establish earned progression rates.

All six original first-attempt source checks pass: typecheck, lint, 1,771 web tests, 1,192 rule tests (two expected failures / eleven skipped), 421 E2E tests and full build. The original mismatch is reproduced with real clicks: hint chapter1, actual destination chapter3. The corrected build passes36browser checks and42targeted captures at1280×720,1440×900 and1024×600 across both looks. Primary actions remain visible, horizontal overflow is zero, and minimum scoped contrast is6.858:1. Keyboard activation, no-spending route starts and exact active-route state are checked.

The [source-bound audit](e2-home-stars/audit.json) verifies original source/log hashes, exact artifact inputs, unchanged OFF8,250-route digest by all original rule hashes and complete package diff, baseline-v1 and all13historical simulations. Artifact20,927,513bytes, SHA-256 `754d3806f31595c168f84e9c17d5c203be144e9abdd602c96e3c907e60dcd761`. The1280earned-star screen was personally inspected; additional1024/1440review is recorded in the checkpoint.

The original Home02 elapsed journey uses the immutable earlier artifact; this fix has no measured cadence benefit. Its60.78minute receipt audit passes, but reward cadence and dead-time targets still MISS. Fresh acceptance seeds remain unused and the public A4 game/guide remain unchanged. These are automated proxies, not a human playtest or the Z screenshot pack.
