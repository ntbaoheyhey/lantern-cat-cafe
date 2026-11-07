# LOOK meta materials
REFERENCE: tools/cardrpg-big/look-surfaces.py; reports/cardrpg-big/look-ui/materials.json; docs/design/cardrpg/LOOK-BIBLE.md

Original procedural overlays authored for Lane A's card and panel surfaces. No imported images, textures, models or generative services. Colour-neutral black/white RGBA tiles let the published LOOK palette determine the material colour. These files are not used by the runtime yet.

Toolchain: Python 3.9.6, NumPy 2.0.2, Pillow 11.3.0. Run `python tools/cardrpg-big/look-surfaces.py` with these packages. Source and output SHA-256 values are in the generation receipt. Seed 20261107; 256×256 pixels; exact indexed PNG compression. Three tiles total 105,652 bytes. A PNG decode preserves all RGBA pixels.

| Tile | Original construction | Maximum alpha | Intended use |
| --- | --- | --- | --- |
| Paper | Periodic Gaussian fields, radii 1.4/8 pixels; 350 wrapped pulp fibres, lengths 5–23 pixels, slopes −0.5…0.5 | 18/255 | Paper card captions and inset help plates |
| Felt | 8-pixel woven wave, 64-pixel warp, periodic 0.62-pixel Gaussian microfibre field | 16/255 | Deep teal formation trays and panel backgrounds |
| Grain | Periodic 0.35-pixel Gaussian grain | 10/255 | Restrained surface finish; no animated noise |

Wrapping is part of the construction. The generator records horizontal/vertical seam variation against ordinary adjacent pixels, verifies PNG round-trip identity, and creates a preview over deep teal and paper. Its assertions measure construction only; the final UI still needs real screenshots and text-contrast checks. Texture layers sit behind content, never over portraits, icons or text. Rarity foil follows published token strengths and will remain behind art; no claim of finished UI quality is made by this asset receipt.
