# Designer idle conversion

Requires ffmpeg with libvpx and Apple's VideoToolbox, macOS/Swift for HEVC auxiliary-alpha input, and Python dependencies in `requirements.txt`.

```sh
python3 -m venv work/v9/CXV/.venv
work/v9/CXV/.venv/bin/pip install -r tools/v9/alpha/requirements.txt
tools/v9/alpha/convert-idle.sh ~/Downloads/mochi_idle.zip mochi
tools/v9/alpha/convert-idle.sh ~/Downloads/clover_idle.zip clover
tools/v9/alpha/convert-idle.sh ~/Downloads/soot_idle.zip soot --cutin 75
tools/v9/alpha/check-idle.sh mochi
```

Convert final Mochi first, then Clover and Soot. The owner confirmed that final exports share pixels per unit. Mochi's union alpha height becomes 720 px; its `sourceScale` is reused for the others. Source frames must share a stable canvas, with transparent padding. One fixed union crop across the sequence retains motion without per-frame centering or resizing. A four-percent height margin surrounds the crop, with the union bottom at the fixed `feetY`. `heightPx` is the scaled union silhouette height (including ears/held props), not a skeletal measurement. Feet should already be planted in the source animation. All dimensions and `feetY` are pixels; `anchor` is normalized.

Output per cat: VP9-alpha `idle.webm`, HEVC-alpha `idle.mov` with `hvc1`, lossless frame-one `poster.webp`, full-source-resolution `cutin.png`, and `meta.json`. Cut-in frame numbers are one-based. The default chooses the most symmetric head region as a front-facing heuristic; use `--cutin` to override after looking at the animation.

The loop diagnostic compares premultiplied RGBA over the visible union and prints mean difference on a 0–255 scale. If above 1.5, the last six frames blend into frame one with smoothstep weights, in premultiplied space. The sequence length stays fixed. This is a practical repair, not a replacement for looking at the loop. `check-idle.sh` starts halfway through the cycle so the seam is inside the ten-second grey/light comparison, rather than hidden at its end. Force `libvpx-vp9` when decoding WebM with ffmpeg; some default decoders discard auxiliary alpha.

Temporary MP4s require `make-placeholder.py`, which keys exterior black, retains enclosed dark eyes/clothes, and unpremultiplies keyed edges. Pass `--placeholder` to label them. Independently framed stand-ins can use `--height-ratio`; this must not silently calibrate final files. Convert final Mochi before replacing final Clover/Soot. There is no Soot placeholder.

For a live browser review, serve the repository root (`python3 -m http.server 8390`) and open `/tools/v9/alpha/review.html`. The page provides synchronized grey/light videos and a replay-across-seam control. Select HEVC in Safari to inspect the native Apple rendition.

```sh
work/v9/CXV/.venv/bin/python tools/v9/alpha/make-placeholder.py ~/Downloads/Scene1.mp4 work/v9/CXV/mochi/placeholder
tools/v9/alpha/convert-idle.sh work/v9/CXV/mochi/placeholder mochi --placeholder --cutin 1
work/v9/CXV/.venv/bin/python tools/v9/alpha/make-placeholder.py ~/Downloads/clover.mp4 work/v9/CXV/clover/placeholder
tools/v9/alpha/convert-idle.sh work/v9/CXV/clover/placeholder clover --placeholder --height-ratio .95 --cutin 1
```

Black-key material is only a stand-in and cannot recover the designer's original alpha. Final transparent sequences bypass all keying. Source/extracted/normalized frames and review videos stay under ignored `work/v9/CXV/`. ZIP paths are validated before extraction. A MOV that ffmpeg decodes opaque is retried through Apple's native image generator to preserve HEVC auxiliary alpha.
