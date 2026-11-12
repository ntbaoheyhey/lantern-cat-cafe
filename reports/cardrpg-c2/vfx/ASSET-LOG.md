# VFX asset log

Original painted effects only. No external-game art or generated character art was used. Built-in imagegen was used throughout; no CLI/API fallback. Inherited originals are retained even where rejected.

## mochi-1/key-original.png

- Method: Inherited key painting.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-1/key-original.png`
- SHA-256: `6f0b6eb7069326c7dd93dbcf1110f0b0e7fc6a233d6350c820bc6a521b517965`
- Prompt record: Original honey/cream gouache door-knock crescent. Exact generation prompt was not included in the prior handoff.

## mochi-1/layers-original.png

- Method: Inherited layer sheet.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-1/layers-original.png`
- SHA-256: `7012e81b2a94c9236feaab52fd0e285b6a0e76e0fc262c21d171bc576dc879f7`
- Prompt record: Eight parts in a 4×2 grid, derived from the Mochi key painting. Exact prior prompt unavailable; source preserved.

## mochi-4/key-original.png

- Method: Inherited key painting.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-4/key-original.png`
- SHA-256: `bff9cba6d30427c9c03a2b4e812e9508e1653c99439448dc24c9bd527eea8dfa`
- Prompt record: Original honey/cream welcoming arch and lantern, no character. Exact prior prompt unavailable.

## mochi-4/layers-original.png

- Method: Inherited layer sheet.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-4/layers-original.png`
- SHA-256: `e83dfe1ebf762c1238e4384bdd1ce6b0e8112be3fff17926910b79914e0d304c`
- Prompt record: Eight independent shelter parts. Original contains background tint; replaced by the clean edit without deleting this source.

## enemy-yarn-giant/key-original.png

- Method: Inherited key painting.
- Source: `/Users/bao/art/vfx-2026-11-12/enemy-yarn-giant/key-original.png`
- SHA-256: `968393b0f2e93070400c89d90a2a225b2c76618170b8681b720cb88227355f7d`
- Prompt record: Original wine-rose braided yarn strike with cream dust. Exact prior prompt unavailable.

## mochi-1/layers-clean.png

- Method: Built-in imagegen edit.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-1/layers-clean.png`
- SHA-256: `a43dab439e898506cf1a73606714351ea87d59eda9d22f3a155ea6f91e882c8a`
- Prompt record: Background extraction: remove all white/ivory paper and rectangular tint; preserve all eight painted pieces, 4×2 arrangement, cream interiors and soft alpha edges; true transparent corners, gutters and crescent opening; no text, frames, extra shapes or characters.

## mochi-4/layers-clean.png

- Method: Built-in imagegen edit.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-4/layers-clean.png`
- SHA-256: `dba7dfc0b2991b143ae3d71b1040f8072dd2a68d0753681d2d069e9f83eb93ef`
- Prompt record: Background extraction: remove paper, ivory wash and gray matte; preserve eight shelter components, golden arch/lantern, painted light, ribbons and petals in 4×2 arrangement; genuine RGBA holes/gutters; no new shapes, text or characters.

## enemy-yarn-giant/layers-clean.png

- Method: Built-in imagegen generation with original key reference.
- Source: `/Users/bao/art/vfx-2026-11-12/enemy-yarn-giant/layers-clean.png`
- SHA-256: `978a9d6dc37d85501ebb1717b70ac3f4257b67f12978b27b074d426eb3db6828`
- Prompt record: Paint eight complete gouache components, 4×2 grid: rose charge glow, braided crescent, sweeping yarn ribbons, cream impact puff, tuft sparks, open ground ellipse, cream flash stroke, pink residue curls. Wine-rose, cream and plum only; 10% transparent gutters; no paper, words or character art.

## mochi-1/key-clean.png

- Method: Built-in imagegen edit.
- Source: `/Users/bao/art/vfx-2026-11-12/mochi-1/key-clean.png`
- SHA-256: `8e8f0ebc535081ae7e95ae295184fc82eea188db4bf07d78596d7ae07b45f4e9`
- Prompt record: Preserve the original golden crescent, cream petals, ground stroke and sparks; finish the cut-off left trail with a tapered brush tip, reframe the whole effect with transparent margins; no extra objects or characters; request a square 2048px key painting if available.

## Reproducible exports

`node tools/vfx/export-pilots.mjs` splits the clean sheets into eight named PNGs, adds transparent gutters, exports editable PSDs and round-trips their nine image records (flattened preview + eight named layers), packs 256px cells into WebP atlases, and writes timelines. No cleanup was performed by chroma-keying away cream paint. Alpha gutter pixels are checked exactly zero.

Native key paintings returned at 1254×1254 and layer sheets at 1774×887. The archival key exports are 2048×2048 with transparent margins; they are resampled exports, not claimed native 2048 generations. PNG pieces are 512×512; runtime atlas cells are 256×256. Detailed export audit and large sources/PSDs remain at `/Users/bao/art/vfx-2026-11-12/export-audit.json`.
