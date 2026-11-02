# Cafe night art style

ART1 decision dated 2026-11-01. This living guide extends the existing art direction without recolouring existing assets. Machine palette: [palette.json](../../tools/art/palette.json), ID **cafe-night-v1**. Read the [inventory](INVENTORY.md), [manifest](MANIFEST.md) and [provenance.md](PROVENANCE.md) before making new art.

## Existing evidence and palette choice

The current icon maps use warm cream, apricot, lilac and saturated small semantic accents; the monster pilots use plum contours and 2–3 colour ramps; the 160x96 backdrops use darker chapter-specific ramps. The rig uses a 56x48 composed frame, and the standalone pilot cat is 32x32. These are source dimensions, not a promise that every UI consumer currently uses integer scaling. The original social card was visually inspected: flat dusk bands, a tabby cat and hard pixel lettering. Its mixed pixel scales and embedded title are legacy exceptions, not a template for new sprites.

Lock these **48 opaque RGB colours** plus transparent RGBA (0,0,0,0). Every hex occurs in the checked-in art or theme; catalog tests enforce that. The order is significant: equal RGB-distance ties choose the first colour. This compact union keeps the established tabby, brass, lilac and nighttime ramps and offers readable semantic hues without inventing interpolated shades. The previous proposal allowed calculated extra shades; this lock does not. New palette changes need a new version and an amended decision.

| Ramp / role | Exact allowed hex values |
|---|---|
| Contours and plum surfaces | #100c18, #140a12, #120b19, #1a1220, #2a1f36, #3a2c4a, #4a3a5e, #72578d |
| Cream, semantic and rarity lights | #fff3e0, #c3aed0, #ffb86b, #6be08a, #ff6b6b, #8fd8ff, #ff8fb1, #b9b6c9, #4aa8ff, #bb74ff, #ff9a3c, #ffd34e, #ffd75e |
| Tabby fur and icon ramps | #f0a040, #c66a1a, #fff0d8, #3f9e5a, #5a556d, #c9701a, #734120, #3d200e, #1d437a, #1f6937, #af2e52, #e5ccff, #5c2b8c, #a61c36 |
| Lilac, brass, wood and rooftop ramps | #dad6e5, #a29cb0, #675f78, #f0de96, #d0b064, #261e2e, #322016, #261610, #0c0818, #282032, #48342a, #f4e29e, #626c7c |

Use at most 16 opaque colours per sprite/frame and 48 per background. Prefer 2–3 values per material. New outlines use #100c18 (objects) or #140a12 (cats), one native art pixel thick. Existing black/white outlines, other chapter colours and variable SVG fallbacks remain untouched; this palette is a production contract for new raster art, not a retroactive validation claim for all historical art. UI text and controls continue to use theme.css tokens. Accent is for the primary action/active tab; cream panels remain modal/loot exceptions.

## Geometry, light and delivery

- Draw on the native grid. One art pixel is one PNG pixel; display at integer 1x, 2x or 3x with nearest-neighbour sampling. Downsample large originals to their explicit native grid before palette-lock. No blur, gradients, anti-aliasing, fractional alpha or embedded labels. Pixel snapping cannot recover details smaller than the target grid: author silhouettes for the small size.
- Use a one-pixel external contour, clean diagonals, 2px safe padding for new icons/portraits. Leave gaps between limbs and props. Top-left light; highlights on upper/left edges, shadows on lower/right edges, 1–2px glints. Cat faces right in battle, monsters left; preserve ground contact on existing combat frames.
- Rarity and state need shape/text cues as well as colour. Rune types keep distinct silhouettes (circle, triangle, diamond, hexagon, star, square), tiers use 1–4 pips. Locked pets have a readable opaque silhouette, not an indistinguishable blank square. Accessible labels stay in UI text.
- New icons: 32x32; detailed badges, rune sockets and map nodes: 48x48; portraits and locked portraits: 96x96; cards: 128x128. New pet idle frames: 48x48, 4 frames. Keep existing 6–16px icon maps at native resolution; pad or integer-scale into the slot without editing source pixels.
- Existing combat budgets remain regular 24x24, elite 28x28, boss 40x40, hero pilot 32x32; existing classic variants have their own recorded sizes. Rig canvas stays 56x48. Chapter backgrounds stay 160x96 tiled layers; new banners 320x96, map decor 128x96. Do not stretch a 96px scene vertically to fill a UI panel.
- Skill previews: eight 128x128 frames at 12fps; one-shot UI bursts: six 64x64 frames at 12fps; idle/tier-four rune loops: four frames. Number filenames with zero padding so lexical and playback order agree. The atlas records fps, explicit frameOrder and reducedMotionFrame. Consumers stop on that first readable frame for reduced motion. This tool does not wire playback into the app.
- Default sheets are untrimmed so equal-size animation frames keep their anchors. Trim only with sourceSize/spriteSourceSize metadata, preserving original pivots; do not re-centre each animation frame. One transparent pixel gutter on all sides prevents neighbour bleed with nearest sampling. No rotations. For isolated icons, trim then centre-pad; odd spare pixels go to bottom/right.

## Review and provenance

Inspect each silhouette at 1x on #2a1f36 and #fff3e0, then at 2x/3x; confirm the shape reads without its colour. Inspect sibling shapes together. Measure icon foreground contrast (3:1 target), using UI text labels when an artistic ramp cannot carry meaning alone. The pipeline validates numeric colour membership, alpha and size; it does not claim to judge silhouettes, light direction, contrast or aesthetic quality.

Run snap → lock → trim/pad if appropriate → sheet → optimize → check using the [tool contracts](../../tools/art/README.md). All exported new art must pass this chain and get a provenance row with exact commands. Original fixtures intentionally contain off-palette samples to prove rejection, live only in temporary test directories and are not production assets. No generator, external asset, new font or library is required by ART1. New original production art belongs to ART2/ART3, using these paths and recorded methods.

The chapter order comes from the live source registry: ch1 Living Room, ch2 Kitchen, ch3 Bathroom, ch4 Basement, ch5 Night Rooftops. Older prose that reverses ch2/ch4 is not authoritative. Demo names, glyphs and numbers remain proposals; twelve pet art reservations await CXP1 ID binding before ART2 wiring.
