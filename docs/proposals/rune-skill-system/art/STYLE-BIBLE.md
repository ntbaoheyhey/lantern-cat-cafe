# Style bible (notes only; art prompts are written later, when the user asks)

World: a cozy cat cafe at night. Warm lamp light against deep purple shadows. Pixel art with hard edges, chunky and readable at 1x on a desktop strip.

## Palette (locked; from `apps/web/src/theme.css` and the redesign draft)
| Role | Hex |
|---|---|
| Page / panel | #120b19, #1a1220, #2a1f36, #3a2c4a, #4a3a5e |
| Border / line | #72578d, #4b3862 |
| Text / muted | #fff3e0, #c3aed0 |
| Accent (lamp) | #ffb86b |
| Good / bad / shard / key | #6be08a, #ff6b6b, #8fd8ff, #ff8fb1 |
| Rarity | common #b9b6c9, uncommon #6be08a, rare #4aa8ff, epic #bb74ff, legendary #ff9a3c |
| Element colours | claw #ffb86b, ember #ff6b4a, frost #8fd8ff, spark #ffd75e, cozy #6be08a, arcane #bb74ff, luck #ff8fb1 |
| Outline | #0d0812 (never pure black) |
Rule: max 16 colours per sprite, taken from the table plus 1 shade and 1 highlight per hue (shade = 35% darker, highlight = 55% lighter, as in the demo glyph renderer).

## Grid and size
- Native grids: icons 32x32 (or 8x8 / 16x16 art upscaled by integer factors), frames 48x48, boss 64x64, banners 320x96. Always integer scaling, `image-rendering: pixelated`.
- 1px outline on every shape, light from top-left, one shadow tone along the bottom-right edge. No anti-aliasing, no gradients, no blur, no text inside images.
- Safe padding: 2px inside the canvas. Transparent background PNG, one asset per file, lower-case kebab-case names exactly as in `MANIFEST.md`.

## Meaning must not rely on colour alone
- Rarity: frame colour + shape marker (circle, diamond, triangle, star, spark) + text pill in the UI.
- Rune tier: pip count (1-4) + glow at tier 3-4 + sparkle at tier 4; rune type: a distinct silhouette (circle, triangle, diamond, hexagon, star, square) as well as colour.
- Contrast: check with `scripts/check-contrast.mjs`; icon main colour vs panel >= 3:1.

## Animation
- Skill effects: 8 frames, 12 fps, loop, 128x128, effect only (the cat is drawn by the game). One-shots (flash, burst): 6 frames. Idle companions and chests: 4 frames. Respect `prefers-reduced-motion`: frame 1 is a readable still.
- Sprite sheets: horizontal strip, equal frames, JSON with frame size and fps.

## Consistency checklist (run before merge)
1. Palette only; no stray colours (script check). 2. Outline #0d0812, 1px. 3. Reads at 1x on #2a1f36. 4. Silhouette distinct from siblings. 5. Rarity/tier markers present. 6. File name and size match the manifest. 7. No text, no signature, no watermark. 8. Cat-cafe theme: yarn, fish, paws, buttons, teacups, moon; no weapons that look like real brands or characters.

## Originality and provenance
- Never use the reference game's art as input, reference image or style target for any generator, and never trace it.
- No copied names, flavour text or layouts. Names come from `demo/index.html` data (our own).
- Record per asset in `provenance.csv`: tool, prompt id, date, who checked. Keep prompts in the repo.
- Existing repo art stays unchanged; new art is additive.
- Pipeline: Antigravity generates images in batches by category; Codex palette-locks, pixel-snaps, packs sprite sheets, optimises, and wires files in. Prompts will be written when the user asks.
