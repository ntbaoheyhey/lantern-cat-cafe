# Runtime round2, material refinement

Personally viewed all three 1200×952 hero sheets on artifactcd9279fa. Uses Blender round1 atlases plus directional paper/glass/volume shading, permanent pass ownership and foot-level light falloff. This is explicitly a material pilot; source round2 atlas is not yet packed.

- Mochi: shields no longer white blocks, but roof x887–932,y800–832 still flat; handle x137–152,y335–353 thin; apron x944–972,y580–604 lacks visible fold; door x1051–1103,y90–134 looks like rigid tube; small glints disappear. Next: round2 dispersed glints; soften roof/paper shading and add vertex folds; thinner glow at edges.
- Soot: flame x1038–1080,y574–600 is softer but bean-shaped, smoky orange rather than hot; black cup x611–644,y326–354 remains tube silhouette; steam x1065–1080,y342–360 faint; anticipation ember is tiny; late glints mostly invisible. Next: revised source density/emission, clearer warm core, slight emissive rim rather than broad opacity.
- Clover: water x881–952,y584–635 still thick; leaves x587–620,y96–112 are flat pale chips; greenhouse x877–951,y787–865 now translucent but has a wireframe cage read; fine drops disappear; face-ablation fails2samples around greenhouse. Next: taper/glow water ribbon instead of whitening it, add subtle leaf curve, limit the effect light range further to floor.

Measured12skills/66pairs:0threshold offenders,0overdraw/errors,4face offenders. Numeric pair regressions46/worst-.0560 relative to matching before12. Material review is not a completed acceptance; all original thresholds retained.

Diagnostic: same artifact,3offending skills with pointlights disabled ->0faceoffenders,0errors. This isolates the remaining contamination to dynamic illumination rather than atlas blending. Reduce the local light radius from.85to.42and height.08to.06for the next runtime round; intensity remains nonzero and actual floor contribution will be checked. Original diagnostic receipt kept separately.
