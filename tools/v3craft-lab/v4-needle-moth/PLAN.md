# Needle Moth authoring plan
LEARN/A7 applies: original held poses and shaped ranged flight. K0 head fixed254..298 before generation, uncertainty2px.
K1 coils narrow wings and winds needle toward screen-right. K2 extends needle/forearm toward screen-left with wings swept back; target reach adds>=15%of original408pxbody width. K4 folds wings/arms protectively and bends away. Feet planted.
Use1152normalization canvas with original640sprite centered at256,256; preserve410pxopaque height and44pxhead. K5 aliasesK2 for this enemy.
Two original FX drills: separated gold/rose needle flight with stitched wake; ultimate fan of sparse needle stitches behind targets, preserving faces. No source reference frames in generation.
Authoring started after the A10 receipt; no production change was made during its normal-renderer capture.
K1-A1 retained as failed: IoU .347831, mean Lab dE 1.166445, feet 0px, head ratio .799373 outside +/-5%. Fixed source head landmarks489..589 preceded measurement.
K1-A2 retained as failed: fixed head518..607; IoU .366825, dE3.544436, feet1px, head ratio .849046. Wing height improved but head shrank; no threshold relaxed.
K1-A3 retained as failed: fixed head493..612, IoU .372294,dE5.849026,feet0,head ratio1.132910. The requested18% enlargement overshot; K1-A4 targets a12% reduction around the chin. Measurement uses actual alpha>=128 K0 height, not the nominal410px description.
