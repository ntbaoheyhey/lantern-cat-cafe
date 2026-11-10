# Generated-light pilot — PARTIAL

Latest artifact and validation: [validation.json](validation.json). Latest 1440/1024 captures: [after-impact](after-impact/sheet.webp), [1024](after-impact-1024/sheet.webp). Four x1 gallery actions in [film-impact](film-impact/mochi-vfx-gallery.mp4); this is diagnostic playback, not a natural battle. Earlier film and film3 samples remain retained.

User direction: original generated character image or VFX image/video -> clean up -> build a real animated runtime asset. Keep existing Mochi source/rig. This pilot uses a generated RGBA component atlas, not a temporal flipbook or generated video.

## A/B review (self-review, not independent judging)

- Before vs generated light: the prior floating house/door and cups are opaque objects around an already complex shield. Honey light has softer edge hierarchy, a clear bright core and lower visual weight. The existing shield remains the source of the cast; the enemy side no longer spawns a second sock or cup.
- After3 vs after-impact: same source and palette; after3 hides the effect during the held impact pose. After-impact shows the protection arch on the impact beat, improving cause/effect while retaining the actor hold. The new arch is visibly preferable in the matching frame.
- 1440 and1024: warm light remains distinct from dark hostile objects; faces and numbers retain priority. Scene/camera/other heroes remain the old art and are not accepted as a consistent new roster.

## Five concrete flaws and disposition

Coordinates refer to960x438 canvas crops unless specified.

| Flaw | Region | Action/result |
|---|---|---|
| Duplicate door/roof/cup objects compete with the actual shield | before-beats/mochi-4-impact, x65–470,y90–330 | Replaced by generated light components; no solid duplicate props in pilot |
| Detached emission reads as an extra item beside Mochi | Mochi right shield, x290–430,y210–330 | Charge/release anchored to animated shield socket |
| Ultimate has no light during hit hold, brightens only on recovery | after3/mochi-4-impact, ally half | B-R1-010 attempt1: independent light progress during unchanged impact beat; after-impact fixes it |
| Fused arm/apron/door stretches during high pose | Mochi lower torso/shield x300–410,y210–330 | B-R1-008 stays PARTIAL,3attempt cap; real geometry separation next, no fourth mask tweak |
| Mochi's painted detail mismatches the old Soot/Clover and object enemies | Ally lineup x60–420,y120–350; enemy x540–650 | Full roster still pending; do not call this a finished art pipeline |

Pilot VFX beauty self-score7.7/10: luminous and cleaner but secondary skills remain small; face cutouts interrupt the arch and the ultimate is not yet a bespoke volumetric signature. Animation is still limited by the mesh. No full-roster8.5 claim. R1 comparative decision remains PARTIAL under the user's direct-3D preference.

## Evidence limits

72protected-face samples cover6cues x3beats x4faces with0offenders; simultaneous Burn/Mark/Warm marks are present. Protected masks come from runtime anchors; not human recognition validation.48fixed canvas shots across1440/1024 have0measured UI overlaps/outside labels and sampled minimum text contrast11.4168. These checks do not establish every frame of every skill or enemy/floor separation>=.18.

36first/repeat cast windows across6cues at1280native,1440native and1440CPU4: max16.8ms,85draws,121362tris,0pageerrors. Earlier cost3:88draws/123093tris,56programs stable,2lights,overdraw1.5213high; nonzero sampled allocations18,624,848B and retained366,556B remain a MISS. This cost sample is before the impact-clock fix, not silently substituted for a new heap run.

FiveBseeds exact against retained base acrossOFF/v2/threecandidates;85retained live-plan immutability checks.1818webtests/type/lint and offline buildPASS. New full E2E, cold, OFF-startup equivalence, full contrast/collisions and all-roster score remain NOT VERIFIED. No rules/default flags/shell/A/U edits, merge or deployment.
