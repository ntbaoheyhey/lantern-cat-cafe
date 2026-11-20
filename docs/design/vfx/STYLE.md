# Painted skill effects — C2

Original cafe storybook paintings, then clean named layers, then animation. Effects are props, brush gestures and light; never character art. Judge each pilot on rendered motion at 25% scale.

| Family / owner | Three hue families | Shape language |
|---|---|---|
| Mochi / Panko / Brioche | honey #DEA353, warm cream #FFF0CB, walnut #75513D | round brass knockers, welcoming arches, bread-soft curved smears |
| Soot / Inkcap | dusty violet #877298, cream #F4DEBB, dark plum #53404E | moon crescents, ink curls, broad rounded caps |
| Clover / Marigold | sage #91A476, butter #EAD39B, olive #56634D | full leaves, curling stems, bell petals |
| Mallow / Cinnamon | terracotta #C56F50, cream #F6D6A0, umber #745040 | rolling flame lobes, coffee swirls, warm steam |
| Sorrel | muted teal #80A8A2, cream #F0E1BA, slate #4E6666 | teapot pours, shallow arcs, broad droplets |
| Biscuit / Velvet / Yarn Giant | dusty rose #AF5469, cream #EED0A8, plum #603B4F | woven thread loops, ribbons, knots and soft dust |

Maximum three hue families per skill; shade within them. Warm dark rim only where silhouettes need separation. Uneven gouache edges and subtle dry-brush texture stay inside the alpha silhouette. A bright opaque core carries the action; restrained soft glow cannot replace it. No neon, photorealism, lens flares, geometric sci-fi rings, random particle storms, letters, logos or watermarks.

## Source and layer contract

Paint a 2048px transparent impact key frame. Retain the original source. Derive eight complete independent RGBA pieces: charge-glow, core-shape, trail-smear, impact-burst, sparks, ground-decal, screen-flash, residue. At least 8% transparent gutter around each piece; no edge truncation. Export named PNG layers plus a layered PSD, keeping source/PSD files under `/Users/bao/art/vfx-2026-11-12/`. Runtime receives a compact WebP atlas and timeline JSON only. Every image prompt and source path goes into ASSET-LOG.md.

The Mochi basic core is a rounded brass door-knock crescent. The ult is a luminous welcoming cafe arch, without a cat. Yarn Giant's core is a weighty wine-rose yarn shockwave, with a few broad thread ribbons. Paints must remain distinct in silhouette when seen without color.

## Motion

Four phases: anticipation → release → impact → dissipate. Basic/skill 0.6–1.2s; player ult 1.4–2.2s with existing portrait. Anchor the caster and recipients to the shared four-slot contract, resolving live Spine sockets as units move. Hit lands at the rules' existing impact boundary; numbers, 40–80ms hit-stop and a small shake land together. Retiming must never change combat results.

Use normal blending for opaque paint, screen for glow, additive only for a restrained spark accent. Keep heads and HP bars readable. At most one large core per recipient. Ground paint stays under the recipient. Reduced motion removes shake and flash and compresses the decorative tail. No words inside effects; the cut-in may show a two-word ult name.

## Pilot gate

Only Mochi Door knock, Mochi Last light shelter, and Yarn Giant heavy attack may receive final painting before approval. Review key frame, exploded layers, scrub timeline, and before/after battle video together. Readability, beauty, style and timing each require an honest score of 8/10 or better; repair below-8 work once before showing. User approval remains mandatory before other final skill art.
