# A4 specification review, one agent in four sequential roles
REFERENCE: docs/design/cardrpg/GAMEPLAY-V4.md; NFT-VALUE-SPEC.md; RESEARCH-GAMEPLAY-V4.md; G0-AUDIT.md.

2026-11-07. This is a sequential design review, not four agents or independent human playtesting. No gameplay implementation has begun. Current outcome: address the concrete issues below before the D commit; quantitative balance and usability remain NOT VERIFIED until implementation.

| Perspective | Problem found in first spec | Required correction / acceptance |
|---|---|---|
| New player |A primary job says2 marks but cannot activate by itself; this could look broken|Show both marks and contributing cats: "3/4 marks ·2 cats; small effect active". Explain the two-cat requirement beside the counter, not only in the guide|
| New player |Inventory called old consumables legacy-only without a complete usable path|Define each existing supply's between-fight effect or explicit deterministic conversion; do not leave unsupported buttons. Preserve the no-in-fight-input rule|
| Min-maxer |Rebuilding preparation after changing rows could restore HP or reroll enemy intent|Retain current health, seed, selected enemies, carried statuses and committed RNG provenance; restrict team replacement to the first untouched node. Test repeated edit cycles and identical choices/replay|
| Min-maxer |Utility scoring could be capped at10% while actual effects remain larger|Cap actual contribution/tune real effects; publish unclamped reference score and heldout residual. Paired utility remains the authoritative gate|
| Min-maxer |Highest-scoring crew picked after looking at heldout would inflate synergy improvement|Choose coherent teams on train only; freeze team, random-team sampling and situation distribution before heldout; show all tests and confidence intervals|
| Economy designer |A finite inventory conversion might allow acquire→salvage→craft positive-value loops|Run conversion-cycle checks and distinguish reward caps from recycling existing value. Never pay more salvage value than the consumed item/craft budget; atomic cap failure before spending|
| Economy designer |Direct repeated recipe crafts could overrun non-gear stack caps|Apply one cap/duplicate policy at every acquisition adapter, including old recipes, welcome and selector; migration over-cap inventory is preserved but further acquisition refused|
| Economy designer |Legacy seals and copied saves are not authenticated effort|Label migration anchors local; future issuer never accepts client-imported proof. One-authority replay/races PASS does not mean global or Sybil security|
| Demo judge |First draft supplies targets but no numbers for all drop-source odds|Read the exact existing drop distribution into the spec and UI; show the difference between drop chance and rarity conditional on a drop|
| Demo judge |Energy removal could still leave outdated charge/break copy in the B-owned renderer|Inspect the public renderer contract, request B mode-aware treatment if needed; A fallback states automatic kit/cooldowns. Unresolved presentation dependency is a MISS, not hidden with protected CSS edits|
| Demo judge |"Fun" was implied by adoption of successful patterns|Keep design hypotheses explicit; actual playthrough and before/after outcomes support only measured claims, no fabricated user retention or ratings|

Research limitations retained: no comprehensive current inventory/binding/ceremony audit across six external games; some papers use publisher abstracts/indexed records; current consolidated China and general enacted Dutch legal status remain unverified. These limits do not prevent the earned-only local prototype but must remain visible in the research/report.

## Corrections applied before D commit
The spec now shows contributor counts, fixes preparation RNG/HP invariants, freezes synergy selection before heldout, gives all five pantry supplies concrete pre-encounter uses with caps, and discloses the exact6-drops/day plus ordinary/elite/boss rarity tables. It requires conversion-cycle checks and explicitly labels local legacy issuance anchors. Source inspection finds Battle.tsx still renders ultimate charge; a mode-aware B REQUEST is required, with the unresolved rendering gate retained until adopted/verified. Real balance and usability remain unmeasured.
