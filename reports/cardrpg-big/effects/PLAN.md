# Starter effect grammar
REFERENCE: ../memory/PROMPT.md lines101–108, ../motion/README.md, apps/web/src/game/squad/turn3d/vfx.ts, packages/game-rules/src/cardrpg/depth/catalog.ts

F3 timing continues against the immutable F3 HTML. The following is F4 preparation. F4 source and evidence will have a separate commit and draft.

## Scope and composition
REFERENCE: packages/game-rules/src/cardrpg/depth/catalog.ts, apps/web/src/game/cardrpg/depth/model.ts

The catalogue has four slots per cat including an ultimate. Author the12 existing Mochi/Soot/Clover skills, eight chapter-one enemy appearances, and their existing passive/equipment cues first. Preserve the existing combat catalogue. Later expand to the remaining nine cats and five models after the slice checkpoint.

The library will contain at least30 original reusable geometry primitives. Each effect combines several primitives with distinct placement and time curves. Shapes convey the cafe action. Door knock uses an opening door frame and two knocking rings. Warm welcome uses a hanging lantern and a spreading pool of light. Apron crossing uses crossed fabric panels and a tied bow. Last light shelter lifts a roof around the group. Cocoa spark uses an ember bead and branching sparks. Black cup uses a tilted cup and a falling ink stain. Lantern wick uses a coiled wick and a rising flame. Midnight service uses a tray of stars and three descending lanterns. Leaf tap uses a stem and two leaves. Patient steep pours droplets into a cup with slow steam. Clearleaf rinse rolls a wave through a leaf wreath. Greenhouse morning raises an arched greenhouse with shoots.

Each recipe declares colour, accent, shot, beat durations, bounded layers, and primitive/motion composition. Mochi uses honey/hearth light, Soot uses cocoa/violet embers, Clover uses jade/cream. Chapter-one enemies follow their visible buttons, socks, spools, needles, cups, yarn and cushion forms. Motion and shapes remain recognizable in grayscale.

## Rendering and readability
REFERENCE: apps/web/src/game/squad/turn3d/scene.ts, post.ts, vfx.ts

Reuse the existing five-beat plan, mixer, post stack and quality tiers. Pool instanced primitive meshes and upload them during loading. Target at most96 effect instances and eight active primitive draw calls per recipe. Face protection uses projected head regions, with effect pixels excluded throughout each action. Plates remain above the canvas. Reduced motion uses slower spatial changes and the existing calm camera/post behaviour. Lower tiers reduce decorative instances while retaining the named shape.

The cold trace already identifies synchronous constructor work and repeated warmup draws. F4 preparation will split those measured offenders into bounded loading tasks, then repeat page-open and real-click timing. Loading work stays inside measurement.

## Predeclared uniqueness measurement
REFERENCE: tools/cardrpg-big/effect-measure.mjs (planned), ../memory/STATE.md

Capture six frames per effect at normalized progress0.14,0.30,0.46,0.60,0.76,0.90. Use a fixed camera, canonical caster/target positions and effect-only black background. Save raw images and grayscale luminance, edge maps and temporal differences. Compare every pair using a weighted distance,50% normalized silhouette difference,30% edge difference,20% temporal difference. Minimum combined distance0.16. Primitive/motion/anchor signatures must also differ. Parameters and palette are excluded from the structural signature. Retain failed pilot captures, fix every offender and rerun. A recolour alone earns zero silhouette credit.

Readability capture uses the actual game layout separately. Record masks for faces and HP plates, visible instances, triangles and draw calls. Validate all quality tiers, reduced motion, first-use and repeated-use. Publish six-frame sheets in the Feel lab and the slice checkpoint, with every missed gate disclosed.

The predeclared face-readability tolerance allows at most1% of pixels in each protected inner face ellipse to differ by more than8 RGB levels between effect-on and effect-off post renders. Retain every failing face/frame. Uniqueness failures and completely invisible compositions make the capture command fail. Readability failures are retained separately and make the report command fail.

## Preparation audit
REFERENCE: apps/web/src/game/squad/turn3d/card-effects.ts, surfaces.ts, apps/web/src/game/cardrpg/depth/FeelLab.tsx

The working library has40 geometry primitives and31 compositions, covering12 starter skills, eight enemy signature intents, eight basic variants and three passives. Six existing statuses receive foot-level cues. Primary compositions have priority when the96-instance/eight-primitive-call cap is reached. Measurements will disclose any discarded decorative instances. Effect timing maps onto the existing five beats, putting the impact at composition progress0.52–0.60 independently of anticipation duration.

The texture baker now yields every16 rows for the automatic scene and retains the synchronous entry for older callers. Model/effect uploads yield between resources. F3 timing uses its earlier immutable artifact. F4 tests, runtime captures, quality checks and profiles remain pending.

The Feel lab preserves an interrupted battle plan and exact playback time. Preview speed/effect-only state stay outside the save. Three ultimate portrait panels use existing original portraits and may be skipped while retaining the already resolved rules outcome.

## First rendered probe
REFERENCE: pilot-face-bloom/uniqueness.json, pilot-face-bloom/captures.json

31 compositions pass all465 pairs, minimum distance0.542308. All are visible, with zero page errors. Fifteen face/frame samples exceed the predeclared1% tolerance because bloom spreads across the direct effect mask. Add face-aware bloom suppression, keep the original ellipses and tolerance, and rerun. Pilot image paths were relocated beneath pilot-face-bloom and updated in its receipts.

## Overdraw measurement
REFERENCE: tools/cardrpg-big/effect-measure.mjs, card-effects.ts

Before measuring overdraw, set the gate at24 effect fragments per pixel. The diagnostic pass retains the actual scene camera, transforms and face mask, renders the effect into a black frame with additive1/255 RGB contributions, then reads raw pixels. Every layer contributes full diagnostic alpha, giving a conservative bound for faded layers. Save every diagnostic image and peak alongside the six-frame captures. Geometry behind opaque actors also contributes in this upper-bound pass.
