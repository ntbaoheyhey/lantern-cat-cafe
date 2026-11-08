# A5 E2 discovery contract

THC13 adds optional `v4.journey` version1. Older THC7/THC12 load; existing discoveries migrate quietly. Legacy-only OFF exports remain THC7. Current journey progress survives toggling OFF.

`DiscoveryRevealV4` in events-v4.ts has version2, kind earned-reveal, sequence, round0, discovery `{kind: crew|set|rank|legendary|stars, id}`, itemId and text. It intentionally has no fabricated banner/draw/pity. Version1 invitation/battle events remain unchanged and readable. A DOM card handles discoveries outside battle in at most1.2s; skip and reduced motion are supported. Acknowledging changes only the queue.

A-owned Invitations passes the exact version1 receipt to CompanionPreview and its SceneView extension while V4 is ON. The existing B renderer in this branch ignores that extension; B's optional renderer8ba0a3879 is not adopted here. Do not claim3D celebration integration without testing an adopted renderer.

Stars are three independent achievements per chapter, band, node position and kind. Replays merge achievements and never manufacture duplicate reward identities. Combat: win, nobody fell, win within6/8/10rounds for ordinary/elite/boss. Noncombat: complete stop, everyone leaves with≥half HP, four-mark crew job active. Historical progress is retained in journal and board; once-only3/9/18star claims use existing shared daily currency caps. No per-node currency grant.

Verification plan: deterministic actual earned route; migration, failed/duplicate claims and all five discovery types in rule tests; timing/skip/OFF in DOM tests; real-click three-width route/journal/claim/receipt forwarding; six source gates; fresh OFF digest. Full screenshot pack and 30-minute engagement cadence remain Z/E3.
