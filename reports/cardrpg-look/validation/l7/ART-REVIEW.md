# L7 personal visual review — viewer acceptance with limits

Artifact `39645d319c264bac0c1011d0e5370de335281ebf6e1df64de67978e34bcb4133`. Reviewed at 2026-11-07T21:40:32.059387+00:00. Native screenshot files are hash-checked by the review-sheet tool. Unit sheets crop the measured model bounds plus12% padding for visibility; originals preserve the full viewport. The receipt records angles in radians; labels convert to0/90/180/270degrees. Initial review status was pending; the completed acceptance is recorded in the final section below.

First attempt rejected: the renderer reported ready before React removed its lighting-loading overlay. The original HTML, logs and12captures are retained in attempts/overlay-1. Corrected harness waits for visible overlay removal. The runtime HTML is unchanged39645d31; new source receipt4aed4c7e includes the corrected harness. A full native Mochi front screenshot was personally viewed: no loading overlay, face/shield/spoon readable, full body inside frame.

## Unit samples personally viewed

| Unit | Four-view observation / retained limitation |
|---|---|
|Mochi|All four views present, no clipping/overlay. Front eye highlights, teal coat, shield and spoon readable. Side tail is angular; rear skull/coat have large smooth surfaces.|
|Soot|Four complete silhouettes; hat/fork/eyes distinguish caster. Dark arms and torso have weak value separation; rear cloth is simple and face has pale raised eye rims.|
|Clover|Four complete silhouettes; green flask/eyes/gloves readable. Rounded belly and cream head clear; side forearm/hip junction and angular tail remain toy-like.|
|Panko|Four complete silhouettes; hat, apron and skillet clearly differentiate chef. Hat crown remains angular and sleeve/hand forms are rigid; rear costume has little fabric variation.|
|Mallow|Four complete silhouettes; curled purple cap and whisk clear. Shawl stays close to body in these samples; raised eye rims and plain rear cloth remain.|

Reviewed first sheet SHA256 `d1b4dd0a5ff9bf63fa4ab20608147e1f22fca1a190092d1bc2cc843643e3b493`. These are static preview poses, not proof of collision-free continuous animation. Historical L5 motion/authoring reviews remain separately scoped.

## Second five-unit sheet

Personally viewed Cinnamon, Biscuit, Inkcap, Sorrel and Brioche at all four angles. All keep their heads, tails and held props within the native frame; no loading overlay is present. Cinnamon's orange/teal palette and flask read clearly; cheek rim and stiff scarf remain. Biscuit's cream cap/apron and glazed skillet read, with a simple rear tunic and angular ankle forms. Inkcap's cap and bright eyes distinguish it, but dark arms merge with dark torso and the side whisk tool is visually thin. Sorrel's apron/green flask read, while the olive coat is muted and tail faceted. Brioche's cream apron, purple coat, copper shield and spoon stay separate in these static views; long unbroken back surfaces and rigid sleeves remain.

These are presentation/static framing observations, not new animation-clearance evidence. Sheet SHA256 `44a7c84c5b6c31f056be9e8c5ca704cc90d04bb5298351e647d7fc03116c087b`.

## Third five-unit sheet and card gallery

Personally viewed Velvet, Marigold, Button Guard, Sock Skipper and Spool Ram at four angles. Velvet's purple cap/bell and cheek silhouette stay readable; elbow/torso junctions remain rounded rigid toys. Marigold's flower and green flask distinguish it from Cinnamon, though the small flower and collar are subordinate at this scale. Button Guard shows its cross-stitch, shield and red needle clearly; the thin side silhouette and plain glossy back still read as a toy. Sock Skipper keeps toe, cuff, yellow eyes and patches readable; the cuff looks solid rather than knitted, and its cream arms are simple capsules. Spool Ram has a distinct broad horned silhouette and furrowed brow; the flat spool flanges and evenly repeated strands remain mechanically regular. No sampled model clips or loading overlay.

Unit sheet SHA256 `7c8faa0faf7efee0fd2a190278f0cd576da60720414a1809fcecfc5a4de64ddf`.

Also personally viewed the full separate portrait gallery at1024/light and1440/dark. All12portraits,48icons and repeating rarity plates are present with readable names and rows. The corrected footer explicitly says all12 portraits come from selected original Blender models. Small icons lose fine engraving, and pale icons have lower visual weight on the light backdrop; neither image shows broken assets or horizontal clipping. The automated gallery receipt covers three widths; this paragraph claims personal review of these two images only.

## Fourth five-unit sheet

Personally viewed Needle Moth, Teacup Healer, Crumb Sentinel, Pollen Scout and Rain Spool at four angles. All have complete silhouettes and no overlay. Needle Moth's pink wings and needle separate from its grey torso; thin side wings and blank rear wing surfaces remain. Teacup's rim/handle/eyes read as glazed ceramic, but the pale steam is a rigid strip and its eyes remain small on the dark cup. Crumb has a tall biscuit shape, red stitching, shield and needle; its flat back and broad capsule limbs remain simple. Pollen Scout's basket/balls and olive wings identify it, with thin wings edge-on and regular rear seams. Rain Spool's cyan rim/face clearly contrast the brown flanges; the strands and smooth back disks remain mechanically regular. These are sampled preview poses only.

Sheet SHA256 `a4059bc0ef253079e4e26af11e6ee1a3d2aa87337faa7e6360edd90e6e11a8bd`.

## Fifth five-unit sheet

Personally viewed Binding Thread, Practice Cushion, Yarn Giant, Kettle Knight and Pantry Crown at all four angles; this completes100static unit views. Binding Thread has an open braided body that reads distinctly front/back, though it becomes very thin edge-on and the horizontal cords are regular. Practice Cushion's piping/buttons and rectangular padding read, but the back is plain and feet are capsule-like. Yarn Giant is broad and rounded with large strand overlaps; strand thickness is coarse and the expression remains friendly for a boss. Kettle Knight's handle/spout, glaze and goggle-like eyes give a distinct silhouette; the oversized handle and broad highlights remain toy-like. Pantry Crown's tiered plates, crown and utensils separate its silhouette; smooth shoulder balls, projecting face disk and tall thin legs remain stylized and friendly. No screenshot clips these models or retains the loading overlay.

Sheet SHA256 `a65ab0204e2411c73ee174bf289a1696f61b2335a526b4581f7437251139f700`. All25models retain the historically accepted3look-slice/22improved tiers. These samples accept viewer framing/readiness only; no continuous motion or premium-finish claim.

## Stage gallery and selector continuation

Personally viewed the3×3chapter/camera sheet, plus the native Chapter1/wide screenshot. All nine show distinct camera distances, unobstructed formation rugs, foreground plants/ceramics, backdrop curtains/window, shelf jars and cat tree; the sidebar/top HUD remain visible. Chapter1 is warmer, chapter2 olive/green, chapter3 violet/cool. These share cafe geometry with palette changes, not three independently built environments. Far camera makes figures smaller; the back shelf/jar spacing is regular, rugs retain large empty areas, and the close camera crops hanging lights. The caption below the viewport requires vertical scrolling on720px height. No loading overlay, broken canvas or horizontal clipping is visible. Sheet SHA256 `689b40d8376f02ba533aee06ec5eeb7927c16c04323974c49b7084837c2177d2`.

After all100unit/9stage captures, the first1024/DPR1 UI check stopped on an ambiguous Before / after button (sidebar and atelier navigation). This is a harness selector error, not an application exception. Original receipt, screenshot, source manifest and log are preserved in attempts/selector-1. Commitc9ad0c23 scopes the tab to Atelier views. The explicit continuation rehashes the identical runtimeHTML39645d31 and verifies the only changed source input is atelier-check.mjs, then retains28successful capture/account/disposal windows and runs the six UI configurations. Prior explicit TypeScript and art-gallery checks remain applicable because their inputs and runtime artifact are unchanged. No completed visual captures were remeasured.

## Six desktop configurations and below-fold review

Personally viewed all18first-fold screenshots through the models/comparison/notes sheets:1024×600,1280×720,1440×900 atDPR1and2. Also viewed native1024/DPR1model and comparison images, native1280/DPR1notes, and nine supplementalDPR2screenshots showing the slider, round sheets and metrics at allthree widths. The supplement uses the same runtimeHTML39645d31 and is not timing evidence.

All six show the sidebar/topHUD, working tab content and controls without horizontal clipping. Text is crisp in native samples. The25model selector and liveA/B restore/dispose evidence passed; allsix actual skill galleries report86actions/25owners,quarter speed andeffect-only. The figure, slider, round cards andsix-row table are reachable by scrolling the panel. The full model is within its canvas, though at600px viewport height the first fold reaches its feet and the caption is below the fold.

Retained presentation flaws: (1) the broad empty viewer margin makes the miniature feel small; (2) the historical comparison is taller than the visible panel, so its slider requires scrolling even at900px height; (3) the inactive/active tab contrast is weak in the inherited chrome; (4) historical comparison thumbnails are softer than native model rendering and their baked tiny captions are illegible at small sizes; (5) round-card wording and source links are review-oriented rather than a polished player flow. These are disclosed layout/presentation limits, not broken asset or reachability failures. The panel does not claim the historical comparison uses current lighting.

## Fresh-eyes assessment

First-time player: the miniature selector, rotation range andReturn to cafe are understandable; the taller comparison and notes require obvious scrolling. Art director: warmgold/teal chrome is coherent and characters have distinct accessories, but the broad viewport, pale eye rims and simple backs remain below premium-finish expectations. VFX director: gallery entry,effect-only andquarter speed work at each tested configuration; these stills alone do not grade continuous motion orglow, and historical L4non-regression misses remain. Skeptical three-minute judge: the panel provides honest inspectable evidence and explicit measurement limits; it does not establish an across-the-board beauty orperformance pass.

## Review acceptance

Accept the L7 viewer's framing, readiness, offline navigation and reachable content on this unchanged artifact, retaining the above limits and historical3look-slice/22improved tiers. All100unit angles,9stage views and6desktop configurations have been personally viewed. Source gates and final performance/video/lifecycle/matrix work are separate acceptance steps; none is inferred from these images.


Review completed 2026-11-07T22:01:09.954192+00:00. The second selector failure (exact speed-label match) is preserved under attempts/selector-2; commitc754dbba corrected only the harness.
