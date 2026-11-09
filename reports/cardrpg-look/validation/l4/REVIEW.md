# L4 phase visual review — partial visual acceptance

Artifactfb56cd44b747 /23,995,962bytes, runtimeb5e7c16c on acceptedA3daba7d7c.
The own11commit rebase preserves owned runtime bytes. This review does not
substitute for source gates or timing measurements; those have completed; see checkpoint-audit.json.

Full-resolution Mochi4 and Soot3 final scene frames personally inspected.
Mochi's curved paper roofs and filled ribbed lanterns are clear. Its large roofs
still compete with the faces. The large pale Soot3 object is an expanding,
fading lantern, as confirmed by recipe start.47/end.78/offset+.7. Transparent
front/back faces create its layered appearance; it is not the flame mesh. The
small rising flames are orange. Do not misattribute the lantern to flame alpha.

Metric caveat: the legacy field estimatedGpuBytes counts geometry attributes
plus a64x64RGBA allowance, not total texture/render-target memory. Do not quote
its~5.8MB as total GPU memory. Six1536x1536RGBA8 atlases alone require56,623,104
uncompressed texture bytes (no mipmaps), before model/stage/post resources.
The phase resource checks use actual renderer object counts and disposal
events; twenty-battle heap/GPU stability remains an L7 gate.

All 19 phase contact sheets were personally inspected: 12 four-skill cat sheets, three passive sheets and four enemy sheets, covering all 67 recipes at t=.30/.60/.76. Full-resolution Mochi4 and Soot3 were also inspected earlier. This is sampled image review, not a claim of continuous playback inspection. Prior material rounds and their misses remain preserved.


## Observed remaining flaws

Coordinates below use the 1200px-wide contact sheets. Each row names five concrete limitations; earlier material rounds contain the implemented top-three corrections and comparison images. No source was changed during this immutable phase run.

| Sheet | Five remaining limitations |
|---|---|
| Mochi | R1 x650–700 gate remains mostly linework; R2 foot rings dominate small spark detail; R3 x540 cup/paper body is pale; R4 x480–580 broad roofs compete with heads; R4 stacked circles make the left carpet busier than the impact. |
| Soot | R1 x580 flame is a small isolated lobe; R2 purple cup reads as monochrome; R3 x1060 lantern shows layered transparent faces; R4 pale paper at x1040 competes with target; dark caster body still loses detail against the teal background (L5/model limit). |
| Clover | R1 leaves at x580–620 remain flat; R2 impact is very quiet at this scale; R3 vine arcs form repeated wire hoops; R4 greenhouse lacks clear glass reflections; all four use similarly pale mint accents. |
| Biscuit | R1 loaf/flight shape is small; R2 paper canopy at x950 is a broad pale patch; R3 dash trail almost disappears; R4 beige impact blends with enemy carpet; warm outline and warm floor reduce local contrast. |
| Panko | R1 projectile resembles another gold loop; R2 halo is much stronger than particles; R3 banners are pale sheets; R4 nested arches at x500 dominate the head; yellow family needs more material/value separation. |
| Sorrel | R1 spoon is thin; R2 steam swirls are sparse; R3 cup body is almost white; R4 white steam/cups crowd caster feet; cool effects look close to Clover at thumbnail size. |
| Mallow | R1 orange wire sphere is visually light; R2 flame barely separates from rug; R3 orange footprint is a broad soft patch; R4 lantern arch is more legible than the fire; dark actor remains undersized/inherited. |
| Inkcap | R1 butterflies resemble line glyphs; R2 spores are low contrast; R3 broad purple paper covers torso edge; R4 triangles look faceted; purple highlights offer little material variety. |
| Cinnamon | R1 starbursts are uniform; R2 pale cup at x950 lacks rim contrast; R3 small warm shards vanish against floor; R4 broad gold banner competes with face; orange body and effects have weak value separation. |
| Brioche | R1 hanging triangle reads flat; R2 small notes are faint; R3 curl is too thin at thumbnail size; R4 lavender sheets fill much of carpet; broad paper bends are still weak despite improved normals. |
| Velvet | R1 purple diamond is a flat patch; R2 hanging charm is large relative to target; R3 paired shards repeat Inkcap language; R4 smoke is soft and sparse; caster silhouette remains dark/inherited. |
| Marigold | R1 hexagonal seed/leaf reads as a plate; R2 leaves accumulate around feet; R3 projectile is very small; R4 pale cans compete with faces; body shading on cans remains insufficient at this scale. |
| Three passives | Tiny pulse may be missed; gold/purple/mint identity relies mainly on colour; all repeat floor circles; no strong material read at thumbnail size; late sampled frame appears almost settled. |
| Enemy special 1 | Button pulse blends into beige carpet; sock ribbons look flat; spool arcs crowd Mochi; moth impact is faint; purple thread family is too similar across enemies. |
| Enemy special 2 | Teapot overhead leaves are pale; yarn giant attack trails look like rods; binding spikes are faceted; cushion canopy is broad; hostile/support distinction depends on actor and trajectory more than material. |
| Enemy basic 1 | Button disc linework is thin; sock slash is pale; spool hit disappears into feet; moth trail is nearly invisible; four attacks need stronger contact accents. |
| Enemy basic 2 | Teapot arc is faint; yarn rods lack fibre at this scale; binding thread is one thin squiggle; cushion flash is small; basic impact accents share too much low-saturation shading. |

## Four-role self-review

- First-time player: the gold, mint, violet and ember families are readable, and faces survive effects; oversized roofs/cans and thin basics still weaken the watch-only battle.
- Art director: the cafe and rounded hero models establish a coherent handmade setting; flat-looking pale paper and repeated hoops do not yet meet the premium target.
- VFX director: sampled separation, face masking, pooled light contribution, depth behavior and disposal checks pass; 1,162/2,211 numeric pair distances regress (worst -0.122392341). No-regression remains a MISS despite zero existing threshold offenders and minimum distance 0.653016622.
- Skeptical three-minute judge: visibly improved materials and original atlases are demonstrated, but a numerical pass cannot justify calling the effects beautiful or complete. Provisional effect self-grade 6/10. Priorities: selective stronger body shading, narrower paper coverage, and distinct silhouettes for the most regressed pairs; keep original pacing and face budgets.

Phase evidence peak: 18 overlapping instances at a pixel, below unchanged limit24; zero face/empty/error/threshold offenders. Timing and full source gates completed; see checkpoint-audit.json. Full L7 matrix and twenty-battle memory check remain unrun.

Actual 1440×900 close and 1024×600 wide battle screenshots also inspected. HUD text remains outside the post stack and legible; camera framing contains actors. The 1024 layout is dense and the right health labels dominate their small actors, but no overlap/overflow was observed by the phase harness.
