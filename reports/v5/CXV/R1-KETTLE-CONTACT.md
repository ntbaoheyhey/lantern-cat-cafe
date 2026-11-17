# R1 Kettle contact follow-up
Recorded 2026-11-17T09:02:27Z. Kettle-only contact anchor corrected; production integration/quality closure remains open.
R2 replaced the old large effect with smaller procedural accents. Its target vfxOrigin resolves to (317.17,641.43), near the feet, while source is (709.63,244.11). The new incoming torso edge is (467.01,574.03).
Only Kettle target layers use the contact anchor: 48% from feet to head, offset 0.34 actor units toward the caster. Ground decals keep feet. Release extent is0.66 units; material accent uses filled slice0.52/alpha0.72 for250ms; basics scale0.8. Timings, events, support behavior and masks are unchanged.
Retained b19b99c3d legacy broad mask remains. Earlier procedural extra-pass experiment was fully reverted08:49 and is not part of this change.
21/21 focused tests and typecheck0. Both Kettle forms land on the torso edge; reduced motion suppresses travel/rotation. Other enemy endpoints retain their original behavior.
Fresh URL http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1
Capture 2026-11-17T09:00:41.316Z–2026-11-17T09:00:55.157Z; source 19ffd32125f21e44dc80aa65d3ade3fda4279354; patch SHA256 78b7904362786b98d05a9bcccca55a3089e6558edacb4fa4bf149e3f2f9979aa; errors[].
Evidence work/v5/CXV/films/R1-kettle-contact-final/: six independently reset sheets, real fixture events. Baseline reconstructs original R2 Kettle settings in memory; registry presentation ID is asserted on every frame.
First capture R1-kettle-contact was invalid as a comparison: its @fs import created a second registry. R1-kettle-contact-r2 verified the canonical registry but had the earlier0.18-unit offset. Only -final is current acceptance evidence.
All six final sheets inspected: baseline accents hit the floor/rolling pin; corrected accents reach the shield/torso and linger at+90ms. Face and body remain readable; no broad gold wash restored. Reduced sheets retain localized static accents without white flash.
Scores readability/impact/beauty/motion: Kettle basic4/4/3/4; signature4/4/3/4. Thin gold material remains modest against Panko gold armor; improve that visual distinction during R10. This is a placement correction, not a declaration that full visual QA is complete.
