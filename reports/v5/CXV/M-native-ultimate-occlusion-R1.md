# Native ultimate field attribution R1

50 fixed-clock samples: Mallow, Sorrel, Biscuit, Cinnamon, Brioche; normal/reduced at1100/1280/1550/1760/2199ms, 1280x720 on experimental6310. All actors exclude Soot. Source9a0a4ec26, application diff empty; field and paint source files match CXI production source. No production acceptance inferred.

At1280ms, mean effect-canvas alpha spans0.223–0.506; suppressing only FieldVfx drops it to0.003–0.067. At1760ms it spans0.130–0.396; without FieldVfx,0–0.001. Core rectangles are bounds, not exact actor silhouettes. These are alpha/attribution measurements, not FPS measurements.

Four fresh Mallow/Cinnamon normal/reduced images measured and viewed once: large flame/cup paint hides enemy and allied torso/feet/props while numbers remain visible. This corroborates the production full-battle readability blocker. No source correction adopted.

Next isolated prototype: native8 ultimates only, radius0.62× and release660ms after1100ms contact; final body/face/label masks, old4/enemy/basic timing and Soot remain unchanged. Require own fresh comparison before adoption, then independent production validation.
