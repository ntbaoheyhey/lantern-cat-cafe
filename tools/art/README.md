# Offline art tools

Python 3.9+ and its standard library only. No image service, asset download, package installation or runtime app import. Run from the repository root. Inputs are read only. Every image output uses exclusive creation: an existing file, symlink or sheet directory causes exit 1. Use a new output directory for each revision; review before moving new assets into production. Catalog regeneration only writes its five named docs/art files.

## Commands

The following names are examples in a disposable working directory, not delivered assets. Supply your own original PNG as input. Each generated production asset must be snapped and palette-locked before packing. Keep input and output names distinct.

```sh
python3 tools/art/pipeline.py snap input.png snapped.png --width 32 --height 32
python3 tools/art/pipeline.py lock snapped.png locked.png
python3 tools/art/pipeline.py trim locked.png trimmed.png --metadata trim.json
python3 tools/art/pipeline.py pad trimmed.png padded.png --width 32 --height 32
python3 tools/art/pipeline.py sheet sheet-dir frame-00.png frame-01.png --columns 2 --fps 12
python3 tools/art/pipeline.py optimize padded.png optimized.png
python3 tools/art/pipeline.py check optimized.png --width 32 --height 32
python3 tools/art/catalog.py
python3 tools/art/catalog.py --check
python3 -B -m unittest discover -s tools/art -v
python3 -B tools/art/mutation_check.py --logs reports/scorecard/art1/logs/mutations
python3 -B tools/art/verify.py
node tools/art/reference_review.mjs
node tools/art/source_audit.mjs
```

For sheets, each input is one frame; basename without extension is the unique lowercase frame ID. Allowed characters are a–z, 0–9, dot, underscore and hyphen, starting with a letter/digit. Use zero-padded suffixes. Input order does not affect packing. `--columns 1` produces a vertical strip; columns equal frame count produce a horizontal strip. `--trim` is opt-in; preserve metadata when reconstructing animation frames. `--gutter` defaults to 1 and must stay positive. Run `check` on each frame before packing, using `--max-colors 48` only for backgrounds. An atlas can exceed a single frame's 16-colour budget. Its JSON and pixels must agree; do not run trim/pad on a completed sheet.

## Exact image and operation contracts

- Internal image: positive integer width/height, immutable row-major RGBA bytes, four bytes per pixel, at most 16,777,216 pixels. Origin top-left, x right, y down. RGB values are treated as sRGB byte values; no ICC conversion occurs.
- Input PNG: static, noninterlaced, 8-bit grayscale, grayscale+alpha, RGB, RGBA or indexed. All five PNG row filters supported. Indexed PLTE/tRNS and RGB/grayscale tRNS decode to RGBA. 1/2/4/16-bit PNG, APNG and interlaced PNG are rejected explicitly; export an 8-bit noninterlaced original first. CRC, dimensions, critical chunks, stream lengths, palette indices and end markers are checked. No SVG rasterizer is bundled; existing SVG and TypeScript art remains in its existing form.
- Snap: nearest pixel centre, input coordinate floor((2*out+1)*inSize/(2*outSize)) per axis. Downscale or identity only. No averaging, dithering, hidden implicit grid, or invented colours. Upscale in the consuming UI at integer scale.
- Palette lock: squared Euclidean RGB distance to the ordered [48-colour palette](palette.json). Equal distances select its first entry. Alpha below 128 becomes (0,0,0,0); alpha 128–255 becomes 255. No generated shade may escape the lock. The default is cafe-night-v1; `--palette` is an explicit authoring/testing override, not permission to ship another palette.
- Trim: alpha > 0 defines occupancy. Inclusive occupied edges become an exclusive rectangle; JSON contains x/y/w/h and empty. Empty input yields a transparent 1x1 and origin (0,0), empty=true. `--metadata` is required and must be a different new path. Standalone trim metadata has original offsets; the atlas also includes original source dimensions.
- Pad: never crops or rescales. Transparent border, centered with floor((target-source)/2) at top/left; odd spare pixels go to bottom/right. Trimming every animation frame and then centering it would move its pivot: use untrimmed packing or atlas reconstruction instead.
- PNG encoding: deterministic selection of 8-bit RGBA, opaque RGB or sorted indexed encoding (at most 256 unique RGBA colours); tries no-filter and Sub, zlib level 9, stable candidate tie order. No timestamps, prompts or metadata embedded. Determinism means identical inputs and Python/zlib runtime produce identical bytes; cross-zlib compressed bytes are not promised. Numeric RGBA pixels are preserved exactly, including transparent RGB and partial alpha, except in the explicit palette-lock step.
- Optimize: validate/decode, strip ancillary metadata including colour profiles, and choose the smallest of the encoder candidates and the stripped original encoding. Never larger than input; decoded RGBA unchanged. Inputs should already be authored/exported in sRGB. This is a bounded lossless optimizer, not a claim of globally minimal PNG size.
- Check: exact native width/height, locked RGB, canonical transparent black, binary alpha, at most 16 opaque colours unless explicitly changed. Exit 0 with a verification line; exit 1 for bad art or I/O. Argument parsing errors exit 2. It checks numeric data, not lighting, silhouette, visual contrast, playback or UI integration.

## Atlas JSON v1

`sheet` creates a new directory with `sheet.png` and `atlas.json`. Each frame has integer `frame: {x,y,w,h}` in the sheet; `sourceSize: {w,h}` before trim; `spriteSourceSize: {x,y,w,h}` in that source; `rotated: false`; `trimmed: boolean`; `empty: boolean`; `pivot: {x:0.5,y:0.5}` relative to the **original source**. Restore the source rectangle before applying the pivot. Empty trimmed frames still reserve 1x1 transparent pixels.

Top-level `schemaVersion: 1`, `frames` object keyed by frame ID, and `meta` with image basename, `format: RGBA8888` (decoded format; PNG may be indexed), `size: {w,h}`, `scale: 1`, integer fps/gutter, explicit frameOrder and reducedMotionFrame. Fields are emitted as sorted JSON keys with two-space indentation and a trailing newline. Grid cells use maximum trimmed dimensions plus twice the gutter. Frame order sorts ASCII IDs; cells fill left-to-right then top-to-bottom. No rotations, extrusion, lossy resizing, absolute paths or generation timestamps.

## Manifest and provenance contracts

[manifest.json](../../docs/art/manifest.json) is generated alongside [MANIFEST.md](../../docs/art/MANIFEST.md). `schemaVersion: 1`, palette ID, proposalPetAliases and slots. A slot has id, category, width, height, frames, status, path, nullable selector, source and note. Existing means reusable code/SVG exists, not a generated PNG; path plus selector identifies it. Placeholder paths do not exist yet. New is reserved for ART2-delivered files. Shared existing sources are intentional; missing output paths and IDs must be unique even on a case-insensitive filesystem.

Catalog extraction is intentionally limited to the current literal registry structures. It fails closed if the 163-row proposal or 35/60/60 item families change. It is not a general TypeScript parser. Update the adapters and their independent category assertions when game content grows. Inventory records bytes, SHA-256, literal source palettes, dimensions, pixel-scale evidence and first/latest git commits. Palette literals in source can include comments and CSS fallbacks; they are not rendered samples. Existing historical provenance is unknown beyond recorded git/source evidence. [PROVENANCE.md](../../docs/art/PROVENANCE.md) is canonical; a lowercase link label provides brief compatibility without a second file.

## Tests and evidence

The original fixture is a three-pixel asymmetric pennant in `test_pipeline.py`; numeric PNG samples are hand-authored independently of the production encoder. All image writes occur in auto-removed temporary subdirectories of tools/art. CLI tests run the full chain twice and compare all eight resulting files byte-for-byte. Catalog tests only read existing assets. Mutation checks copy the tool and tests before changing code; a killed mutant requires an assertion failure, not an import error or crash.

`verify.py` records command/exit/raw output, checks original-source hashes before/after, runs ten pipeline repeats, and compares link failures to the tracked-doc baseline on this checkout. It does not run the coordinator's workspace, browser, bundle, full e2e, scoring or merge gates. Do not interpret targeted evidence as those gates passing.

The optional reference-review script uses the existing workspace Playwright dependency (install from the unchanged lockfile if absent). It reads only the two original local HTML demos, blocks network resources, captures every screen at both logical desktop sizes, and saves eight contact sheets under reports/scorecard/art1/references. It is reference inspection, not the app e2e suite or a design-match verdict. No dependency is added for it.

The optional source-audit script uses the existing workspace TypeScript package to evaluate the five pure monster data modules in an isolated VM, then compares all 51 classic/pilot/hero exports with the Python-generated sprite records. It independently verifies native sizes and nonuniform animation counts without drawing or changing any source art. The core pipeline and catalog do not require it or any package installation.
