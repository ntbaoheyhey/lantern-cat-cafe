# Mochi visual rounds
REFERENCE: tools/cardrpg-look/blender/author.py; original baseline/1280x720-unit-mochi.png

## Round 1 — Blender studio, 640×800, actual game-poly mesh
Viewed the PNG directly. Self-grade silhouette6.5, material5.5, light6, face6, outline not implemented. This studio portrait is not a matched-camera comparison with the baseline game capture.

Five concrete flaws: (1) pinched/flared ear tips at x180–235/y210–275 and x422–459/y190–265; (2) protruding white eye disks at x165–370/y320–420; (3) faceted medallion x107–144/y546–589 and torn pink paw pad x397–437/y587–631; (4) detached-looking cheek tufts x436–478/y415–451; (5) gray ceramic ladle against fur x422–488/y456–532, with weak material separation.

Round2 fixes the worst three: volume-loft ears replace nearly degenerate cloth tips; eyes recess35mm and slightly shrink sclera; mesh budgeting preserves tiny shapes and limits bevels to structural edges. Key/fill ratio strengthened. No claim of in-game acceptance or texture baking in round1 (baked=[]).

## Round 2 — baked atlas rejected
Viewed640×800PNG directly. Silhouette6.5, material2, light6, face4. Five defects: (1) teal cloth islands stain forehead x185–424/y251–373; (2) atlas seams cut muzzle/cheeks x132–443/y386–455; (3) paw pads/feet have disconnected colour wedges x220–418/y675–768; (4) shield emblem becomes a flat faceted blot x103–141/y543–590; (5) tiny stitches cross vest as gold scratches x218–338/y571–680. Worst three share a UV overlap cause: multi-object Smart Project packed independent atlases. Round3 creates and unwraps one combined deterministic bake mesh and transfers corner UVs back to every animated part. Round2 is explicitly rejected, not a quality gain.

## Round 3 — clean atlas, further shape fixes
Viewed640×800PNG directly. Colour bleed is gone. Self-grade silhouette7, material6, light6.5, face7. Five remaining defects: (1) tail angular joints x451–506/y504–637; (2) cheek tufts look like stacked pebbles x441–472/y390–442; (3) brass emblem/ladle still show reduced polygon edges x104–143/y544–588 and x424–473/y450–531; (4) hem stitches float off the vest onto belly x216–359/y654–680; (5) shield looks like cloth rather than glazed ceramic x56–199/y488–657. Round4 aligns tail endpoint tangents/radii and covers joints, tucks tufts into cheeks, preserves small medallion/ladle meshes and adds an original lantern detail; stitches moved to cloth hem. Material separation still needs a metallic/ceramic atlas pass.

## Round 4 — ceramic/metal atlas and continuous tail
Viewed640×800PNG directly. Self-grade silhouette7.5, material7, light7, face7.5, texture6.5. The ceramic shield now has a broad glaze reflection; brass trim catches distinct highlights. Five remaining issues: (1) small tail-joint bumps x494–514/y562–586; (2) shield lantern badge outline angular x104–140/y550–590; (3) whiskers nearly parallel x100–190/y390–430; (4) lower vest stitches small/uneven x216–360/y650–673; (5) ladder-like light stripes from cloth weave visible on right panel x327–384/y579–638. First three are queued for subsequent hero polish after in-game visibility check. This is a substantial improvement over rejected round2; not final acceptance.

## Round 5 — lowered micro-normal and fanned whiskers
Viewed 640×800 PNG after handoff. Silhouette7.5, material7, face7.5, light7, texture6.5 (self-grades). Five visible limitations: (1) ear-side fluff is still a spherical bead at x154–184/y286–314 and x442–470/y283–317; (2) broad cheek lobes x137–200/y385–447 read plush rather than fur; (3) under-muzzle x234–378/y438–476 is gray in this studio setup; (4) shield emblem x105–139/y546–587 remains angular at close range; (5) vest hem stitches x215–256/y650–672 are discontinuous. Compared with round4, fanned whiskers and weaker weave remove two distractions. Stage shader/lighting needs separate matched-camera review; studio render does not establish motion clearance.

## Rounds 6–7 — profile correction

Viewed the latest portrait and previous source-bound turntable. The backcoat submerged at 180°; replaced the shrinking 3×3 patch with a 9×13 ellipsoid grid. Brows move inward 75 mm and each eye rotates 20° into the head.

Five close-up limitations remain: spherical ear fluff (x150–185/y285–320); cheek lobes (x135–205/y380–450); angular small accessory trim; plush rather than combed fur; subtle cloth weave. These are visual limitations. Provisional self-grades: silhouette 7.5, face 7.5, material 7, lighting 7. New turntables and motion clearance still require review.
