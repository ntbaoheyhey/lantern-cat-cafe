# Runtime material round3 — personally inspected

Viewed three actual 1200×952 Mochi/Soot/Clover sheets (12skills, times .30/.60/.76) from the unchanged material3 artifact. The complete67-recipe check is still running; screenshots use round2 atlases. The review is independent of the forthcoming round3 Blender source.

- Mochi: roof faces at x877–936,y797–841 remain planar; apron x926–976,y579–614 has insufficient fold shading; three ultimate gold outlines compete with the silhouettes; x1063–1102,y93–148 door lacks material contrast; glints are tiny. Fix actual bent surface normals for paper, then inspect at runtime. Preserve recipe structure and timings.
- Soot: x1035–1084,y569–612 flame still looks like peach smoke; x612–640,y320–357 cup reads as an outline; frame3 ember x574–593,y94–110 too faint; ultimate x1035–1104,y806–844 lacks bright focal centre; steam merges with floor. Round3 Blender orange core/density is already rendering. Add narrow luminous glass rims instead of uniformly increasing opacity.
- Clover: water x851–978,y575–655 has tapered strokes but no luminous core; x881–969,y792–878 greenhouse has wireframe read; x589–630,y95–114 leaves remain flat chips; x879–930,y333–382 tiny drops disappear; repeated shield rings crowd feet. Fix ribbon core with selective HDR energy, paper bent normals, and glass Fresnel edge energy; keep alpha/face/depth safety.

The earlier GPU pilot asserted before asynchronous scene cleanup, reporting82/0resources,0duplicates. Corrected harness awaits warming and task completion; retry82/82 exactly once, lights/root detached,0errors. Six active light ablations actually modify183–506non-face pixels, inner-face fractions all<1%; per-tier GPU counts stable and no effect-root reparenting during renders. Preserve the failed receipt as a harness timing error, not a runtime leak claim.

Remaining concerns: pastel colours and sparse glints; no beauty acceptance or new cast-time claim. Next run must check the three material refinements together with actual round3 atlases and retain strict numeric uniqueness deltas.

## Nine-cat follow-up review (second actual runtime round)

Personally viewed rest-group1/2/3 at1440×648, four skill columns × three cat rows, sampled .76. Marigold4 is explicitly missing in group3 while its capture waits; do not count that target as reviewed yet. Rows below describe five visible limitations per cat, with approximate regions on its group sheet.

|Cat|Five observed limitations|Corrections to inspect next|
|---|---|---|
|Panko|pan x150,y108 nearly lost; bread x485,y100 still a flat tile; shield slab x843,y130 opaque; oven arch x1195,y80 reads tubing; foot glow too pale|paper normal curvature; ceramic/metal specular; sparse warmer source glints|
|Mallow|first impact x230,y324 faint; second impact x586,y324 loses shape; third ember x947,y326 tiny; ultimate x1305,y326 peach smoke; glints weak|orange flame density/core; stronger narrow atlas highlights; utensil metal shine|
|Sorrel|spoon x230,y541 disappears; water x586,y540 thin; shield x845,y536 not glasslike; ultimate teapot x1198,y516 only outline; cups x1219,y557 crowd feet|ribbon HDR core; glass Fresnel; ceramic glaze|
|Biscuit|bread x155,y99 looks slab; blanket x502,y107 straight edge; third impact x949,y115 too pale; ultimate smear x1309,y116 looks dust; small spark lost|paper fold normals; revised volume source; ceramic/metal contrast|
|Inkcap|first fan x233,y328 lacks folds; second x591,y325 cluttered; cloak x830,y312 giant chip; ultimate sphere x1316,y320 flat; dark ink barely differentiated|paper normals; curved glass response; denser smoke source|
|Cinnamon|spice x231,y539 too small; cup x512,y527 wire outline; tea x950,y538 too subtle; fourth x1205,y538 too pale; tiny scattered glints compete with warm fur|ceramic glaze; revised warm glints; glass edge energy|
|Brioche|first star x231,y108 barely distinct; second paper x505,y110 rigid; third fan x950,y117 too faint; ultimate x1207,y133 planar sheets; gold rings crowd ears|paper normal folds; metal accent; revised sparse glints|
|Velvet|first glint x232,y326 too faint; second x592,y329 panel flat; third x949,y330 washed lilac; fourth x1313,y329 repeats same planar colour; dark body remains weak (L5)|paper folds; narrower brighter core; revised smoke volumes|
|Marigold|first target x235,y546 faint; second leaves x485,y554 large flat chips; third drops x950,y545 pastel; leaf edges x495,y571 hard; fourth target unreviewed because unavailable|paper normal curve; droplet glass energy; revised glints; inspect fourth when captured|

Material3 keeps all original geometries/timings. These snapshots do not establish continuous-motion beauty, first-cast performance, or strict numerical uniqueness. Ceramic/glazed and metal highlight responses are now added for utensils, alongside the three previously documented corrections; they need real-browser confirmation.

Flame shader inspection found a concrete reason the source orange would remain dim: grayscale luminance discounts red emission before the recolouring step. For flames only, use maximum linear source channel as emission energy; retain luminance for smoke/steam and cat-keyed colours. This lets a red hot core cross the existing HDR bloom threshold without globally whitening opacity. Pending real render/face/overdraw checks.

## Completed 67-target review and Low program diagnosis

Material3 completed67 targets/2,211 pairs: minimum distance0.681068, zero indistinguishability/face/overdraw/empty/error failures. Strict numeric regressions remain1,015, worst−0.065656; these are a missed criterion, not waived by the threshold pass. Typecheck/lint/14 focused tests passed before the following warmup fix.

Viewed Marigold's four-skill sheet1200×952: ultimate x865–956,y816–884 has flat leaf tiles, near-white tips, weak veins, hard corners, and too many similar pale planes around feet. Pending curved paper normal/glass-rim changes address the first three without changing its recipe. Also viewed all three passive rows at1200×238: each has thin nested circles, weak material separation, low floor contrast, tiny sparse detail, and little visible temporal change in the three sampled instants. Keep their restrained intensity, but test the improved finishes and do not claim a new passive animation.

Viewed16enemy variants in two1440×840 sheets at .76. Local cell coordinates below refer to480×280 cells. Five issues for each special (basic counterparts share weak small impact marks):
- button-guard: shield x290,y125 too wirelike; foot ring too pale; glints merge; shell no surface contrast; rune lines too dense.
- sock-skipper: x160,y138 thread hard; small loop thin; pink floor ring weak; arc nearly uniform; no luminous tip.
- spool-ram: x168,y129 ribbons planar; tips square; two arcs similar; purple too pale; floor reflection absent.
- needle-moth: x158,y132 needle thin; cool trails small; no metal shine; cross-lines busy; detached end mark.
- teacup-healer: x335,y130 cup wirelike; handle lost; droplets tiny; yellow cup flat; settling arc weak.
- yarn-giant: x165,y127 large chips flat; no fibre; saturated boss competes; pink trails thin; no distinct centre.
- binding-thread: x166,y136 loop stiff; wide pink slab; crossing arcs dense; small side spark weak; flat material.
- practice-cushion: x165,y132 blanket reads solid fan; dark rim thin; no fold; tiny motif missing; feet overlap pale fan.
For all eight basics, effects near x165,y135 are intentionally smaller: five common limitations are faint contact, thin perimeter, no obvious highlight core, sparse detail, and muted hue on teal. Pending folds/fibre, glass and utensil specular refinements address the material issues; do not inflate basic-attack size to chase scores.

GPU diagnostic identifies the two first-Low links as original_felt_baked (guard surfaces) and MeshStandardMaterial (button-guard utensils), not L4 effect shaders. Warm models used unmodified GLB materials while actual actors received CardSurfaces/utensils. Source now prepares these actual variants during Look loading and holds their resources to scene teardown. Must verify zero new programs plus cancellation disposal on the next artifact.
