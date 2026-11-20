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

Use `--key-border-black` when a designer RGBA export still has neutral-black residue at its exterior. This optional pass floods only from the frame border through transparent/near-black background, clears that connected black, and preserves the supplied subject and soft-edge alpha. Enclosed dark eyes and clothing are untouched. It does not use the temporary MP4 matte's coverage reconstruction. Cleaned source-resolution frames stay under `work/v9/CXV/<cat>/border-keyed/`; original designer files remain unchanged.

Output per cat: VP9-alpha `idle.webm`, HEVC-alpha `idle.mov` with `hvc1`, lossless frame-one `poster.webp`, full-source-resolution `cutin.png`, and `meta.json`. Cut-in frame numbers are one-based. The default chooses the most symmetric head region as a front-facing heuristic; use `--cutin` to override after looking at the animation.

The loop diagnostic compares premultiplied RGBA over the visible union and prints mean difference on a 0–255 scale. If above 1.5, the last six frames blend into frame one with smoothstep weights, in premultiplied space. The sequence length stays fixed. This is a practical repair, not a replacement for looking at the loop. `check-idle.sh` starts halfway through the cycle so the seam is inside the ten-second grey/light comparison, rather than hidden at its end. Force `libvpx-vp9` when decoding WebM with ffmpeg; some default decoders discard auxiliary alpha.

Temporary MP4s require `make-placeholder.py`. It floods near-neutral black from the frame border, then carries only overlapping black background between adjacent frames in both directions. This keeps a tail/body gap transparent when the tail closes around previously exterior background. It does not fill every enclosed dark region. Dark clothing/eyes inside the silhouette remain opaque; coverage and black decontamination use a three-source-pixel exterior edge. Border-connected dim yellow lantern/tea glow gets soft emission coverage so it does not become an opaque dark rim. Pass `--placeholder` to label stand-ins. Independently framed stand-ins can use `--height-ratio`; this must not silently calibrate final files. Convert final Mochi before replacing final Clover/Soot. There is no Soot placeholder.

For a live browser review, serve the repository root (`python3 -m http.server 8390`) and open `/tools/v9/alpha/review.html`. The page draws one decoded video into both grey/light panels, with a replay-across-seam control and an exact frame field. It loads a complete video Blob so scrubbing also works on a simple server without HTTP byte ranges. Select HEVC in Safari to inspect the native Apple rendition.

For a source comparison without browser control, run `work/v9/CXV/.venv/bin/python tools/v9/alpha/matte-review.py <cat> --source-dir <PNG-directory>`. It aligns source and decoded VP9 on grey/light at frames 1/75/125/175 and saves `work/v9/CXV/<cat>/designer-matte-review.jpg`. The original placeholder comparison remains the default when `--source-dir` is omitted.

```sh
work/v9/CXV/.venv/bin/python tools/v9/alpha/make-placeholder.py ~/Downloads/Scene1.mp4 work/v9/CXV/mochi/placeholder
tools/v9/alpha/convert-idle.sh work/v9/CXV/mochi/placeholder mochi --placeholder --cutin 1
work/v9/CXV/.venv/bin/python tools/v9/alpha/make-placeholder.py ~/Downloads/clover.mp4 work/v9/CXV/clover/placeholder
tools/v9/alpha/convert-idle.sh work/v9/CXV/clover/placeholder clover --placeholder --height-ratio .95 --cutin 1
```

Black-key material is only a stand-in and cannot recover the designer's original alpha. Final transparent sequences bypass all keying. Source/extracted/normalized frames and review videos stay under ignored `work/v9/CXV/`. ZIP paths are validated before extraction. A MOV that ffmpeg decodes opaque is retried through Apple's native image generator to preserve HEVC auxiliary alpha.
