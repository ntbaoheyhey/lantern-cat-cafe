# Body status mapping
All gameplay IDs are mapped. The renderer never changes the rules or adds a status.

| Rules IDs | Body effect |
|---|---|
| scald | Burn: stepped flame shapes, orange 0.6s tint, rising embers |
| snag | Bleed: red falling drips |
| bitter | Poison visual: green bubbles and green tint; rules remain reduced healing/shields |
| drowsy | Stun visual: three orbiting stars; rules remain Daze, not turn skipping |
| glaze, decoy, shield HP | Shield: radial rim bubble, pale overlay on HP |
| cozy, steep, shelter, riposte, link, sprout | Buff: upward arrows |
| tangle, crumb, scent, rattled, hush, brittle | Debuff: downward arrows and dark foot haze |
| freeze/frozen (renderer vocabulary only) | Cyan crystal, frozen animation sample, shatter on removal |

The current rules engine has no freeze status. Freeze is a supported presentation contract, never applied by the UI. Icons show at most three entries, overflow +N; stacks and descriptions are accessible by focus/hover. Reduced motion disables orbit/particle travel.
