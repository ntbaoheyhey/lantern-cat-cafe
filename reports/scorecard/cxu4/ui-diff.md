# CXU4 UI comparison — living draft

Compared Character, Help and States from reports/ui-redesign/index.html with actual Hero, Help and class confirmation at 1280×720 and1600×900. Reference PNG capture preserves original CSS, fonts and SVG definitions at actual viewport size; all 12 files were visually inspected. Reference placeholder art is not imported.

| Area | Reference → implementation | Reason / status |
| --- | --- | --- |
| Rail | Home, Bag, Map, Forge, Market, Hero, Help → same order and seven destinations | Existing original icons retained. Shell control styling is unchanged. |
| HUD | Sample Gold/Shards/wallet and single progress row → real Fish/Yarn, chapter progress and guest wallet state | Existing shell retained; the Next chip clips at1280 (observed in hero-1280.png), outside CXU4 and pending baseline/shell correction. |
| Hero grid | Three columns; right320px → three proportional columns with minimum widths | Same structure; extra power explanation fits without clipping at both sizes. |
| Hero content | Four placeholder slots and200px mock cat → nine real slots and160px original CatPortrait | Required real state/art; rarity, locks, equipped items and callbacks preserved. |
| Hero stats | Sample Hunter stats → seven rule-derived Warrior stats and real level | No imported sample balance. Power breakdown sums exactly, including nonlinear contributions. |
| Hero progress | Green sample XP bar → existing shard-blue XP token and exact current/next XP | Preserve existing state presentation; explained visual difference. |
| Hero tabs | No inner tabs → Character tab strip above sheet | Required extension host for Pets; adds vertical header space. |
| Help grid |260px topic list + answer → same260px split, with accessible label, result count and existing guide header | Required searchable content; existing heading/description retained. |
| Help text | Seven sample topics and invented Forge diagram → six existing topics, unchanged answers/config branches, Start Exploring action | Mission requires preserving actual help and no new claims. All baseline strings independently matched against HEAD. |
| Help tabs | No inner tabs → Guide strip | Required extension host for Compendium/Odds/proof. |
| Modal | Dark460px frame, accent border, scrim → same width/tokens, class select, accessible close control, Cancel initial focus | Different operation; actual wallet/Relic confirmation remains outside CXU4. |
| Toast/banner | Static demo examples → controlled accessible hosts with durable errors and existing connectivity notices | Timers/pause tested; network semantics remain owned by existing loop. No fake retry action introduced. |
| Focus/reduced motion | Static mockup → visible focus outline and disabled transition/animation for shared UI under reduce | Keyboard flow runs in browser;12 contrast pairs pass. |

New shared and screen colours use theme tokens. Existing CSS fallbacks predate this work. Audit results: demo and local signed-in each18/18 desktop screens have no document scrolling, overlap, horizontal overflow, missing required elements or console errors. Those algorithmic findings do not negate the visually observed HUD chip clipping above.
