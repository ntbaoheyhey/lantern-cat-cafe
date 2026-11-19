# V9 procedural VFX flipbooks

All visuals are original Blender geometry, emission shaders and deterministic particle motion. There are no imported textures or third-party game art. Render in Eevee at 30 fps, 512×512, then pack row-major cells into lossless WebP atlases.

The render script supports Blender 4.5/5.x. Modern Eevee bloom is a compositor Glare node; see [Blender's migration notes](https://developer.blender.org/docs/release_notes/4.2/eevee_migration/). Effects are evaluated from continuous time, with no separately generated drawings. Particle birth, ballistic drift, swirl, expansion and decay remain reproducible for any frame.

```sh
brew install --cask blender
# Python environment is shared with the alpha converter.
work/v9/CXV/.venv/bin/pip install -r tools/v9/alpha/requirements.txt
tools/v9/blender/render-all.sh              # render and pack all eight
tools/v9/blender/render-all.sh tea-clover   # replace one effect
```

For an inexpensive visual draft:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python-exit-code 1 -P tools/v9/blender/render_effects.py -- --effect all --preview
work/v9/CXV/.venv/bin/python tools/v9/blender/pack_effects.py --draft
```

Use `V9_BLENDER` or `V9_PYTHON` to override executable paths. `effects.json` is the frame-count/blending catalog. Work frames, contact sheets and 3-second clips stay under ignored `work/v9/CXV/vfx/<name>/`. `--python-exit-code 1` makes Blender fail the pipeline if a script raises an exception.

The public output is `apps/web/public/vfx/v9/<name>.webp` plus `.json`. Frames are row-major from the upper left, 512×512 cells, four columns, at most 2048×4096 per atlas. Unused cells are black/transparent. Every cell has center anchor `[0.5,0.5]`. Do not include unused cells in playback; use `frames`.

| Effect | Frames | Seconds | Blend | Loop |
| --- | ---: | ---: | --- | --- |
| impact-core | 12 | 0.40 | additive | no |
| shockwave-ring | 16 | 0.53 | additive | no |
| smoke-embers | 24 | 0.80 | normal | no |
| lantern-dome | 24 | 0.80 | additive | no |
| tea-clover | 32 | 1.07 | additive | no |
| comet-loop | 16 | 0.53 | additive | yes |
| fire-dome | 24 | 0.80 | additive | no |
| rune-circle | 32 | 1.07 | additive | yes |

The two loops evaluate periodic motion at `frame / frames`, excluding a duplicate endpoint. One-shots evaluate at `frame / (frames - 1)` and fade to black/clear at both ends. Stop one-shots at the last frame; the three-second review clip repeats them with 12 blank frames between activations. Gameplay can play impact and ring together, then overlap smoke with the fade. Each ultimate-specific atlas is independently timed; the game owns banner, travel, shake and hit-stop timing.

For Three.js, set the color texture to sRGB and disable mipmaps to avoid adjacent atlas-cell bleed. Use linear filtering, clamp UVs half a texel inside the selected cell, and `depthWrite=false`. Additive assets are RGB emission on black (`AdditiveBlending`). Smoke is straight RGBA (`NormalBlending`, transparency enabled); do not apply additive blending to it. Neutral core/ring/runes can be tinted in the shader. Frame rectangle: `x=(frame%cols)*512`, `y=floor(frame/cols)*512`; account for Three.js vertical texture orientation in your UVs.

Run `python3 -m http.server 8390` at the repository root and open `/tools/v9/blender/review.html` for simultaneous 256 px atlas playback, background switching, pause, quarter speed and restart. This viewer uses the delivered WebP/JSON, rather than only the Blender source PNGs.

`work/v9/CXV/.venv/bin/python tools/v9/blender/make-overview.py` builds a two-row overview sheet and a synchronized 3-second clip directly from the delivered atlases. The one-shot previews include a quiet gap so the start/end motion can be judged without a hard replay cut.

## V2 cat variants and screen flash

Run `work/v9/CXV/.venv/bin/python tools/v9/blender/build-variants.py` after rendering the neutral effects. It derives nine lossless atlases from the delivered Blender originals: `{impact-core,shockwave-ring,rune-circle}-{mochi,clover,soot}.webp` and matching JSON. Mochi uses `#ffbd4c`, Clover `#74e69e`, and Soot `#b873ff`. Colouring happens in linear light; the impact peak remains white. These colours are baked in, so use a white material tint. Frames, timing, looping, dimensions and anchors match the neutral parent. JSON additionally records `variantOf`, `cat` and `tintSRGB`.

`flash-gradient.webp` is a single 1024×1024 straight-RGBA white radial veil for a full-screen overlay. Stretch its UVs to the viewport and animate its material opacity in code. Its JSON marks `screenSpace: true`, `frames: 1`, and normal blending; it is not a 512 px world-space effect cell. White RGB is preserved even in its low-alpha corners, avoiding a dark fade.

Reviews: `work/v9/CXV/vfx/variants/overview.jpg`, `preview-3s.mp4`, and `flash-gradient-review.jpg`. The live `/tools/v9/blender/variants.html` page loads all nine delivered pairs, filters by cat, changes background/speed, and previews the flash on demand.
