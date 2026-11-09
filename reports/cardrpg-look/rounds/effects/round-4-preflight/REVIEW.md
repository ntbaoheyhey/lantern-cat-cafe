# Shader preflight — source 763ef7bd, R2 atlases

Personally viewed the actual1280×720 GPU captures soot-3-low, mochi-4-high and clover-4-high. This is a focused diagnostic, not the complete67-effect round or acceptance of R3 artwork.

Observed five flaws: (1) Clover's greenhouse panel at x430–535/y300–393 is too opaque and reads as a mint cutout; (2) its protected-face boundary at x442–507/y338–380 has a conspicuous hard circular edge in the air above the ears; (3) the lower greenhouse spans x475–610/y450–550 and obscures too much of Mochi's costume; (4) Mochi's roofs at x321–649/y322–460 are still broad, flat yellow bands; (5) Soot's Low flame at x827–965/y374–443 is faint and polygonal. The last image still uses R2 atlases, so it cannot assess the new orange flame frames.

Corrections before material4: preserve the exact existing zero-contribution face core but smoothly taper alpha outside it (squared radius1.0→1.6). Reduce glass body alpha0.36→0.16 and body colour0.78 while retaining Fresnel edges. This addresses the first three flaws without changing recipes, geometry or the face metric. Paper remains under review; flame must be judged after R3 integration. No threshold is relaxed.

Runtime preflight completed: six tier/light actions have no new programs, stable89textures/574geometries/49programs within every tier,181–508changed floor pixels, maximum8/9088 inner-face pixels changed above8. All369observed resources disposed exactly once, zero duplicates/errors. Six cancellation boundaries release158/162/216/297/297/148resources once, context/canvas/effect root/lights cleaned. Source changes made after these receipts require fresh focused/browser checks.
