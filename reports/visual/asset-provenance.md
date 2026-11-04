# Original visual asset provenance

Date: 2026-11-04. All artwork is newly authored integer coordinate drawing. No external images, no traced game art, no image generator, no tbhindex/REA art, no audio.

**Exact generator:** `python3 -B tools/art/visual.py`; verify with `pnpm art:check`. Seed = 0 (no random operation). Palette = `tools/art/visual-palette.json` (32 colors). PNG encoding = repository standard-library `tools/art/pipeline.py`, indexed lossless, binary alpha. The generator is the complete exact set of coordinate/shape/color parameters.

**Authoring brief:** “An original evening cat café atelier: arched dusk window, moon and tiny rooftops, plum curtains, walnut wainscot, books and paw portrait, tea cup, leafy planters, a rug for a brave tabby. Five household moods: living room, kitchen, bath, basement, rooftop. Mochi has a generous orange head, cream muzzle, bright eyes, a blue scarf and golden bell. An original cat-sized forge hearth stages the selected item. Light arrives from upper left. No reference image.”

| File | Tool / parameters | Date | Bytes | SHA-256 |
|---|---|---|---:|---|
| `apps/web/public/art/visual/room-1.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1085 | `6c3264e100cfd39b7928e719cfbe88139a437cc0e1fb7fe2ae0d405decf27fd4` |
| `apps/web/public/art/visual/foreground-1.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/room-2.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1197 | `5c46c62ca2a42aa8f0a442059bb7d2a8d7ef9f21b12d17bcbf5b5701a2b487e4` |
| `apps/web/public/art/visual/foreground-2.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/room-3.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1293 | `00f694948293306af894a1661e20c2eab5435aa5311a5453010b073a84fc02da` |
| `apps/web/public/art/visual/foreground-3.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/room-4.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1381 | `53a161732baf14a2a371fed9554218cb379e6ff81f603b3a32d581e36120e080` |
| `apps/web/public/art/visual/foreground-4.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/room-5.png` | visual.py, 256×96, native 1px | 2026-11-04 | 906 | `9c3366f526c30b7f22e6df022cf238542cd619159338717b1ab386dc9a7d2f87` |
| `apps/web/public/art/visual/foreground-5.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/mochi-idle.png` | visual.py, 384×48, native 1px | 2026-11-04 | 803 | `eee2ba1fb7bc8ea054d5541a03780d7e92256a82f1f9118292251d86ee58f5d5` |
| `apps/web/public/art/visual/mochi.png` | visual.py, 48×48, native 1px | 2026-11-04 | 442 | `ef46db6827bdc1081d6a7c124ecd3cb0f9978c9b0bc5120087c9982683f4ca0d` |
| `apps/web/public/art/visual/forge-hearth.png` | visual.py, 160×120, native 1px | 2026-11-04 | 501 | `a4e97fd0a2a72ffa5388af481c10ddde17bf4d016e65e3cd967307959d93da0b` |

Generated token assets: `apps/web/src/visual/tokens.css` and `tokens.ts`; exact values are derived from the same palette JSON. CSS/SVG lighting and decorative particle geometry are authored directly in `SceneBackdrop.tsx` and `visual.css`; parameters and timing are literal source values, with no outside input.

Before/after screenshots and frame strips are derivative evidence of this repository only, captured by `tools/visual-shots.mjs` with its fixed fixture, time and seed. They are documentation assets, not shipped game image payload. Their hashes are recorded in the gallery manifest at delivery. Existing art shown in these screenshots retains `reports/asset-provenance.md` provenance.
