# Evening Atelier — visual art bible
2026-11-04 · Original Cat Café Quest candidate. Keep the approved left rail and top HUD.

**Promise:** a small brave cat, a warm pool of light, and a home worth returning to. One focal element per view: Mochi / selected gear / household boss / forge hearth / Relic.

**Locked palette (32 colors):** `tools/art/visual-palette.json` is the source of truth. `python3 -B tools/art/visual.py` generates `apps/web/src/visual/tokens.{css,ts}` and all new bitmaps. Fur ramp: rust → amber → fur → cream → paper. Wood: coffee → walnut → wood → woodLight → copper. Dusk: ink → night → dusk → slate → mist. Accents: gold, rose, aqua. Danger: wine → coral → danger. Rarity: common, sage, rare, epic, gold, rose (Mythic design token only; no new economy tier). Shadows shift cool; light shifts warm. Existing untouched art keeps its recorded palettes.

**Pixels / outline:** native integer coordinates, binary alpha, one native pixel per scene pixel; render with nearest-neighbor at whole-number zoom. Room 256×96, portrait 48×48, hearth 160×120. Ink outside contour, selective copper or cream on upper-left edges. No smooth resizing of character sheets. Light may be a continuous CSS/SVG gradient, never baked as off-palette pixels.

**Light / depth:** upper-left window key + one warm practical lamp. Dark foreground, quieter cool back wall, brighter actor and item silhouette. A soft pool on the floor replaces concentric ellipses. Far layer drift ≤1 native pixel, foreground ≤2; never move the HUD. Five keys: living room plum/amber window; kitchen teal/oven; bath blue/aqua reflected window; basement wine/lantern; rooftop indigo/moon.

**Rarity ladder:** Common: neutral single inset, no glow. Uncommon: sage corners. Rare: blue double edge, soft backing light. Epic: violet frame and one slow shimmer. Legendary: gold frame, two sparse sparks, warm halo. Mythic: rose/gold dual rim in the design demo only. Every rarity retains a text label; effects never encode eligibility.

**Motion:** portrait 28 s stepped blink/breathe/tail/occasional nap; actor idle 2.2 s; steam 4–6 s; ambience 12–20 s. Hover 140 ms, press 80 ms, reward anticipation 180 ms → impact 70 ms → settle 480 ms. Crit hit-stop 60 ms affects presentation only; shake ≤2 rendered px. At most 12 number labels and 16 impact particles. Reduced motion: static lit scene and fully visible result; no shimmer, drift, flash or shake. Hidden tab: pause CSS and stop cosmetic clocks. No audio.

**Typography / surfaces:** existing bundled Pixelify Sans for short headings, DM Sans for explanation, JetBrains Mono for values. Minimum body 12 px, ordinary text ≥4.5:1. Three surfaces: dark dusk recess, warm wood panel with top bevel, illuminated item plinth. Preserve readable text and focus outline before decorative chrome.

**Do:** large readable silhouette, quiet resting space, icon with number, tooltips for secondary detail, finite feedback tied to real acknowledged events. **Don't:** copy art, sample third-party palettes, invent rewards, flicker the whole screen, animate every card, put glow behind body text, change rules or default-OFF Sample previews.
