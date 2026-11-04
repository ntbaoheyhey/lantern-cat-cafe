# Original visual asset provenance

Date: 2026-11-04. All artwork is newly authored integer coordinate drawing. No external images, no traced game art, no image generator, no tbhindex/REA art, no audio.

**Exact generator:** `python3 -B tools/art/visual.py`; verify with `pnpm art:check`. Seed = 0 (no random operation). Palette = `tools/art/visual-palette.json` (32 colors). PNG encoding = repository standard-library `tools/art/pipeline.py`, lossless PNG, binary alpha for solid art; lighting masks use palette RGB and alpha in increments of 4/255. The generator is the complete exact set of coordinate/shape/color parameters.

**Authoring brief:** “An original evening cat café atelier: arched dusk window, moon and tiny rooftops, plum curtains, walnut wainscot, books and paw portrait, tea cup, leafy planters, a rug for a brave tabby. Five household moods: living room, kitchen, bath, basement, rooftop. Mochi has a generous orange head, cream muzzle, bright eyes, a blue scarf and golden bell. An original cat-sized forge hearth stages the selected item. Light arrives from upper left. No reference image.”

| File | Tool / parameters | Date | Bytes | SHA-256 |
|---|---|---|---:|---|
| `apps/web/public/art/visual/room-1.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1085 | `6c3264e100cfd39b7928e719cfbe88139a437cc0e1fb7fe2ae0d405decf27fd4` |
| `apps/web/public/art/visual/foreground-1.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/light-1.png` | visual.py, 256×96, native 1px | 2026-11-04 | 663 | `4deda4ebdc85927c393a6b5c32f2946d5e559cb7acc1ca020b83035beab751a9` |
| `apps/web/public/art/visual/room-2.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1197 | `5c46c62ca2a42aa8f0a442059bb7d2a8d7ef9f21b12d17bcbf5b5701a2b487e4` |
| `apps/web/public/art/visual/foreground-2.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/light-2.png` | visual.py, 256×96, native 1px | 2026-11-04 | 663 | `4deda4ebdc85927c393a6b5c32f2946d5e559cb7acc1ca020b83035beab751a9` |
| `apps/web/public/art/visual/room-3.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1293 | `00f694948293306af894a1661e20c2eab5435aa5311a5453010b073a84fc02da` |
| `apps/web/public/art/visual/foreground-3.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/light-3.png` | visual.py, 256×96, native 1px | 2026-11-04 | 663 | `58102f5db24ca81f4df8c6178f1dbac04e2a26a97a62669b4d965c59a6bfb67e` |
| `apps/web/public/art/visual/room-4.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1381 | `53a161732baf14a2a371fed9554218cb379e6ff81f603b3a32d581e36120e080` |
| `apps/web/public/art/visual/foreground-4.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/light-4.png` | visual.py, 256×96, native 1px | 2026-11-04 | 663 | `17de5bd5d3d70ecebc4bb5fbacf81383b0b790c78e3b41b9c398115e00940f3f` |
| `apps/web/public/art/visual/room-5.png` | visual.py, 256×96, native 1px | 2026-11-04 | 906 | `9c3366f526c30b7f22e6df022cf238542cd619159338717b1ab386dc9a7d2f87` |
| `apps/web/public/art/visual/foreground-5.png` | visual.py, 256×96, native 1px | 2026-11-04 | 393 | `3fa5fa5640d7ed8f5cf34c1dea5d092eb1ce5931b3bd96a84ae8b692048efefd` |
| `apps/web/public/art/visual/light-5.png` | visual.py, 256×96, native 1px | 2026-11-04 | 663 | `4deda4ebdc85927c393a6b5c32f2946d5e559cb7acc1ca020b83035beab751a9` |
| `apps/web/public/art/visual/shade.png` | visual.py, 256×96, native 1px | 2026-11-04 | 1134 | `b7340884b476d2288e0f903805165d9a8d1d6ebc90aa32fc7963c9b96c152a35` |
| `apps/web/public/art/visual/mochi-idle.png` | visual.py, 480×48, native 1px | 2026-11-04 | 1294 | `ce7c7b582344fc5aeb64d7388d9209030cb5149e896612712bcb6675f1611ee7` |
| `apps/web/public/art/visual/mochi.png` | visual.py, 48×48, native 1px | 2026-11-04 | 442 | `ef46db6827bdc1081d6a7c124ecd3cb0f9978c9b0bc5120087c9982683f4ca0d` |
| `apps/web/public/art/visual/forge-hearth.png` | visual.py, 160×120, native 1px | 2026-11-04 | 501 | `a4e97fd0a2a72ffa5388af481c10ddde17bf4d016e65e3cd967307959d93da0b` |

Generated token assets: `apps/web/src/visual/tokens.css` and `tokens.ts`; exact values are derived from the same palette JSON. CSS/SVG lighting and decorative particle geometry are authored directly in `SceneBackdrop.tsx` and `visual.css`; parameters and timing are literal source values, with no outside input.

Before/after screenshots and frame strips are derivative evidence of this repository only, captured by `tools/visual-shots.mjs` with its fixed fixture, time and seed. They are documentation assets, not shipped game image payload. Their hashes are recorded in the gallery manifest at delivery. Existing art shown in these screenshots retains `reports/asset-provenance.md` provenance.

## Runtime drawing changes
- `apps/web/src/visual/SceneBackdrop.tsx`: original coordinate geometry and baked native-resolution lighting masks; ray opacity .07, lamp .19, floor pool .15, edge vignette capped .58; 7 deterministic dust motes; no source images except this generator.
- `apps/web/src/visual/impact.ts`: 16-particle fixed pool; deterministic radial angles; gold/cream/mist tokens; 480 ms settle.
- `apps/web/src/game/rig/poses.ts`: original shared idle changed to slow blink; same four pose frames, durations [900,180,120,1000] ms; third face = blink. All combat timing remains unchanged.
- `apps/web/src/visual/visual.css` and `scene.css`: original surface, rarity, light and motion styling; all literal parameters are committed source. Date 2026-11-04.

- Portrait refinement: 10 original frames (480×48), integer tail flick and ear twitch, two curled nap poses. Literal coordinate parameters are in `visual.py:mochi`; seed stays 0.
- Mouse cameo: original SVG ellipse/rect/path geometry in `SceneBackdrop.tsx`; one cameo per 28 seconds, hidden under reduced motion. No new image dependency.
- `ResourceGain.tsx`, `useMotionCue.ts`: gain arc 900 ms, expanding level outline 180 ms; only acknowledged changes, no initial replay, cancel on hidden tabs.
