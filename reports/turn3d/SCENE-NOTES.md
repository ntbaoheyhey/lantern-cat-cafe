# 3D scene · T4

1. Read event-projected actor snapshots and data effect frames; never import the rules engine.
2. Original cafe tabletop/rug, cups, books, candle and plant; warm key/cool rim and blob shadows.
3. Fixed orthographic camera, scripted focus, impact shake, model-view angles; no free-look.
4. Pooled 96 glows, eight impact rings and reusable ribbon/signature geometry; persistent guard/snare.
5. ResizeObserver, DPR≤2, hidden-tab cancellation, explicit disposal and a failure callback to playable turn UI.

The actual stage-only screenshot is `shots/stage-only.png`. Chromium reports WebGL2
through **SwiftShader**, a software renderer, on this execution surface. This is not a
hardware GPU benchmark. Initial stage render: 64 calls / 4950 triangles (before the
subsequently added pooled signature geometry is visible); no page errors.
Synthetic hidden pause and canvas resize 1024×480→640×320 passed; raw receipt in
scene-lifecycle.json. Character, ultimate and fallback integration proof follows T5/T6.
Source code and procedural 64px radial glow are original, primary-session work.
