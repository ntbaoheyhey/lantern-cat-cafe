# Material6 targeted inspection — 945b6d52

Personally inspected all seven runtime sheets: Mochi, Soot, Clover (four rows
each), Biscuit2, Brioche4, Velvet4 and Marigold4, at the three displayed times.
This is a development review, not phase or timing acceptance.

The subdivided paper now bends across its surface instead of merely changing
its normal. Marigold's cans have a rounded body and lip; their broad pale front
still reads rather flat at this scale. Soot's orange flame is distinct from the
cream stage, and the hard outer shell is less opaque. Faces stay readable.

Remaining flaws observed: Mochi's roofs are still angular and too broad; Soot3
retains a pale shell at the late impact; Clover3 has crossing white trails;
Brioche4's blankets remain large lilac slabs; Marigold4 cans are pale and their
spouts/handles remain planar. Biscuit's paper apron is curved but thick. Velvet4
still combines sparse smoke with a hard blanket silhouette. These remain art
limitations; this review does not claim the desired finished-game quality.

The three changes prompted by material4/5 are present: subdivided curved paper,
rounded watering-can geometry, and reduced flame-shell alpha. Further changes
must preserve the clear silhouettes, fixed recipe timing and protected faces.

16 recipes /120 pairs: minimum distance0.730769, zero threshold, face, overdraw,
empty-effect or browser-error offenders. Strict numeric regressions77,
worst−0.064193707, remain a MISS; this subset cannot replace the full67 review.
Six GPU actions use no new programs and stable within-tier counts; all observed
resources dispose exactly once. Six loading cancellations pass. Web typecheck,
lint and17 focused tests passed on the captured source. Full phase gates follow
the accepted-A rebase. No new cast/cold performance claim is made here.

Follow-up full-resolution inspection on the rebased phase artifactfb56cd44:
Mochi4 and Soot3 actual rendered scene images were viewed. Source attribution
corrects the earlier late-Soot3 criticism: the large pale shell to the target's
right is the expanding lantern layer (start.47/end.78, size1.2, offset+.7), not
the flame mesh. The actual small rising flames are orange. At its fade-out the
closed lantern's transparent faces show stacked facets. Keep this as a lantern
transparency limitation; reducing flame-shell alpha cannot correct that object.
Mochi's curved roof panels and filled ribbed lanterns are clearly visible at
full size; the panels still feel oversized beside the faces.
