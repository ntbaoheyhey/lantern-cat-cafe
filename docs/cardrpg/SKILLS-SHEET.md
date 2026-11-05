# Skill direction and five-beat sheet

REFERENCE: apps/web/src/game/squad/turn3d/effects.ts; effect-direction.ts; choreography.ts; audio.ts; tools/art3d/skill-animation.mjs

Every action plays anticipation, travel, impact, reaction, residue. Full hero/enemy actions have named authored clips; secondary procs use role reaction clips with their own glyph/path/cue. Reduced motion removes camera movement, shake and hit-stop. Motion does not advance rules.

| Recipe | Name | Colour | Glyph / path | Particles | Five visual motifs | Motion |
|---|---|---|---|---|---|---|
| bossIntro | The knot awakens | #ff8b9e | woven-crown / helix | dust ×40 | woven-crown → red-spokes → knot-eye → thread-tension → dust-fall | telegraph + dedicated effect |
| healTonic | Warm Milk Tonic | #ffe4bd | heart / lob | petal ×16 | cork-pop → cream-helix → milk-crown → heart-rise → cream-drops | cast + dedicated effect |
| shieldBiscuit | Shield Biscuit | #eebc6e | biscuit / orbit | dust ×18 | biscuit-sigil → crumb-spiral → honey-facets → warm-shell → crumb-dust | guard + dedicated effect |
| quickenYarn | Quicken Yarn | #b7d6ff | chevrons / needle | spark ×17 | unspool → sky-loop → forward-chevron → step-lights → blue-fibres | cast + dedicated effect |
| cleanseTea | Clearleaf Tea | #bcecc9 | clearleaf / helix | petal ×21 | tea-steam → leaf-helix → clear-ripple → veil-lift → mint-dew | heal-receive + dedicated effect |
| ultimateTreat | Starlight Treat | #ffcaee | sugar-star / orbit | star ×25 | treat-glint → sugar-orbit → five-star → charge-rings → sugar-stars | cast + dedicated effect |
| relicProc | Relic Resonance | #edc888 | diamond / pillar | spark ×20 | engraved-sigil → relic-orbit → diamond-crown → brass-echo → fine-sparks | cast + dedicated effect |
| thorns | Quilted Return | #dcb080 | sewn-cross / needle | dust ×15 | stitch-tense → return-needles → sewn-cross → thread-snap → cotton-dust | attack + dedicated effect |
| guardianBasic | Hearthblade | #ffd48a | crescent / cut | spark ×19 | ladle-glint → crescent → star → recoil → gold-dust | Named clip; {"travel":0.52,"arc":0.03,"float":0,"side":-0.1,"hold":45} |
| shieldBash | Shield Bash | #ffd48a | paw-shield / pillar | dust ×28 | shield-charge → shield-rush → hexagon → stagger → shield-shards | Named clip; {"travel":0.7,"arc":0,"float":0,"side":0,"hold":75} |
| rally | Rally | #ffd48a | banner / orbit | star ×22 | paw-sigil → gold-ribbons → shield → salute → guard-dome | Named clip; {"travel":0,"arc":0,"float":0.02,"side":0,"hold":0} |
| hearthwall | Hearthwall | #ffd48a | gate / pillar | star ×42 | sunrise → three-pillars → hexagon-wall → guard → gold-canopy | Named clip; {"travel":0,"arc":0.12,"float":0,"side":0,"hold":85} |
| witchBasic | Wick Spark | #c49aff | wick / helix | ember ×17 | wick → ember-trail → four-star → recoil → embers | Named clip; {"travel":0,"arc":0,"float":0.08,"side":0,"hold":0} |
| threadSnare | Thread Snare | #c49aff | loom / helix | ink ×24 | spindle → looping-thread → woven-star → tether → thread-loops | Named clip; {"travel":0,"arc":0,"float":0.16,"side":0.06,"hold":0} |
| emberOrb | Ember Orb | #c49aff | flame / lob | ember ×36 | lantern-pulse → comet → ember-flower → stagger → embers | Named clip; {"travel":0,"arc":0,"float":0.23,"side":-0.08,"hold":60} |
| lanternstorm | Lanternstorm | #c49aff | constellation / fall | star ×54 | three-lanterns → falling-ribbons → triple-star → stagger → violet-cinders | Named clip; {"travel":0,"arc":0,"float":0.3,"side":0,"hold":80} |
| alchemistBasic | Sour Drop | #86ebc7 | splatter / lob | ink ×21 | flask-tilt → potion-arc → splash → recoil → bubbles | Named clip; {"travel":0,"arc":0.08,"float":0,"side":0.07,"hold":0} |
| milkFlask | Milk Flask | #86ebc7 | milk-crown / lob | petal ×23 | milk-glow → flask-arc → cream-splash → heal → soft-bubbles | Named clip; {"travel":0,"arc":0.04,"float":0,"side":-0.04,"hold":0} |
| mossFlask | Moss Flask | #86ebc7 | clover / orbit | petal ×29 | leaf-swirl → green-arc → petal-ring → heal → moss-garden | Named clip; {"travel":0,"arc":0.12,"float":0,"side":0.12,"hold":0} |
| nineLives | Nine-Lives Shelter | #86ebc7 | nine-leaf / pillar | petal ×48 | nine-seeds → spiral-leaves → petal-dome → heal → leaf-canopy | Named clip; {"travel":0,"arc":0.18,"float":0.06,"side":0,"hold":40} |
| steadfast | Steadfast | #ffd48a | keystone / pillar | dust ×12 | glow → ribbon → ring → sparks → afterglow | cast + dedicated effect |
| warmWick | Warm Wick | #c49aff | candle / helix | ember ×15 | glow → ribbon → ring → sparks → afterglow | cast + dedicated effect |
| lastSip | Last Sip | #86ebc7 | cup / lob | petal ×14 | glow → ribbon → ring → sparks → afterglow | cast + dedicated effect |
| lastLight | Last Light | #ffd48a | sunray / pillar | star ×16 | glow → ribbon → ring → sparks → afterglow | cast + dedicated effect |
| needleLantern | Needle Lantern | #c49aff | needle-eye / needle | spark ×13 | glow → ribbon → ring → sparks → afterglow | attack + dedicated effect |
| guardAttack | Button Cut | #e4bd8e | button / cut | dust ×17 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0.48,"arc":0,"float":0,"side":0.05,"hold":45} |
| flankerAttack | Sock Skip | #efaec6 | skip / fan | ink ×20 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0.74,"arc":0.27,"float":0,"side":0.35,"hold":40} |
| rangerAttack | Needle Shot | #d1c1ff | fletching / needle | spark ×18 | wing-glint → needle-ribbon → pin-star → recoil → thread-dust | Named clip; {"travel":0,"arc":0,"float":0.18,"side":-0.08,"hold":0} |
| healerAttack | Teacup Mend | #a3dfc1 | tea / helix | petal ×19 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0,"arc":0,"float":0.09,"side":0.04,"hold":0} |
| chargerAttack | Spool Charge | #edbb88 | spool / cut | dust ×35 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0.72,"arc":0.06,"float":0,"side":0,"hold":80} |
| eliteAttack | Kettle Crush | #bed4ed | hammer / pillar | spark ×34 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0.6,"arc":0.2,"float":0,"side":-0.15,"hold":85} |
| yarnAttack | Spindle Sweep | #ff8b9e | yarn-fan / fan | dust ×45 | red-arm → sweep-ribbon → thread-fan → knockback → red-fibres | Named clip; {"travel":0.15,"arc":0,"float":0,"side":0.1,"hold":90} |
| bindThread | Loose End | #ff8b9e | knot / helix | ink ×26 | launcher → red-helix → knot → bound → binding-loop | Named clip; {"travel":0,"arc":0,"float":0.03,"side":0,"hold":0} |
| crossSweep | Cross Stitch | #ff8b9e | cross-stitch / fan | spark ×52 | crossed-arms → cross-ribbons → red-cross → stagger → loose-threads | Named clip; {"travel":0.12,"arc":0.08,"float":0,"side":-0.12,"hold":90} |
| threadAttack | Tighten | #ff8b9e | cinch / orbit | ink ×14 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0.38,"arc":0.15,"float":0,"side":0.18,"hold":40} |
| dummyAttack | Cushion Nudge | #e4c3ad | pillow / cut | dust ×10 | glow → ribbon → ring → sparks → afterglow | Named clip; {"travel":0.3,"arc":0.18,"float":0,"side":0,"hold":40} |
| burn | Burn | #ffad7d | cinder / pillar | ember ×16 | glow → ribbon → ring → sparks → afterglow | attack + dedicated effect |
| status_apply | Status applied | #c49aff | seal / orbit | ink ×12 | glow → ribbon → ring → sparks → afterglow | cast + dedicated effect |
| status_expire | Status faded | #86ebc7 | unseal / fan | petal ×11 | glow → ribbon → ring → sparks → afterglow | idle + dedicated effect |
| death | Down | #ff8b9e | fallen-petal / fall | dust ×18 | glow → ribbon → ring → sparks → afterglow | down + dedicated effect |
| wave_clear | A breath between waves | #ffd48a | wreath / orbit | star ×28 | glow → ribbon → ring → sparks → afterglow | victory + dedicated effect |
| victory | The cafe is safe | #ffd48a | lantern-crown / pillar | star ×60 | glow → ribbon → ring → sparks → afterglow | victory + dedicated effect |
| defeat | A lesson for tomorrow | #ff8b9e | rain / fall | ink ×20 | glow → ribbon → ring → sparks → afterglow | down + dedicated effect |

Contact sheets and captured beats: reports/cardrpg/art/. The whole-stage dHash is deliberately retained; it is insensitive to small effects against a shared scene. A second audit reads the isolated actual VFX canvas synchronously (no DOM/UI/text), then normalizes each beat to its non-background bounds with a 12px margin to measure the spell signature. Both are proxies, not human ratings. The corrected signature audit has 0/903 pairs below its preselected 64-bit threshold (minimum 219/1280); the full-stage audit has 23/903 below 40 bits. These are separate tests, not interchangeable claims. Earlier whole-scene worst pairs were Last Sip / Milk Flask, Status Applied / Wick Spark, Clearleaf Tea / Shield Biscuit, Shield Biscuit / Starlight Treat, and Clearleaf Tea / Starlight Treat. Added rising cups, falling milk ribbons, stacked seals, orbiting leaves, biscuit walls, and a star orbit to separate those shapes.
