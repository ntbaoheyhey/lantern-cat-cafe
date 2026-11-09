# Runtime round 1 — hero effects

Personally viewed three hero contact sheets (Mochi 1280×960 pilot and saved 1200×952 sheets for Soot/Clover). Artifact and source binding: build.json. This is the first runtime pilot with Blender round1, not phase acceptance.

Five flaws per hero, using saved sheet coordinates (rows: skills1–4; columns: anticipation/impact/settle):

- Mochi: skill4 shields at x875–952,y815–882 become opaque white cutouts covering bodies; roof panels are flat at x885–968,y794–836; apron lacks cloth at x906–932,y588–622; sparkle/filament additions are barely visible at x908–958,y358–393; all tube icons have almost uniform brightness and weak depth. Fixes: translucent glass finish on shields, quieter directional material shading, fine antialiased fibre variation on paper/cloth. Atlas round2 disperses the ring-like glints/fibres.
- Soot: flame at x1022–1090,y571–601 remains a flat peach flame glyph; steam around x1050–1080,y342–370 too faint; ink puddle x1039–1080,y352–372 is too solid; stars in bottom-left anticipation are white and equal in size; late lanterns have no material weight. Fixes: enlarge the authored volume layer and reduce flat volume glyph opacity, alpha remap for sparse soft volumes, cooler/lower-luminance sculpted shading. Source round2 changes white-smoke flame to emission.
- Clover: waves at x880–960,y591–636 read like thick cyan pipes; greenhouse x873–955,y785–866 crowds body outlines; pale leaves x580–625,y95–122 lack value variation; foliage underfoot forms hard planar wedges; wave ribbons are hidden behind the primitive. Fixes: lower directional shading and translucent greenhouse, fine leaf fibre variation, improved warm/cool separation and tapered ribbon material. Floor contact remains depth-faded; no rule/timing changes.

All three have clear faces at these reviewed times, but numeric face/overdraw/uniqueness results are still pending. No first-cast acceptance from these stills. Thirteen focused unit tests pass after fixing permanent effect-pass ownership; that change is for round2, not this artifact.
