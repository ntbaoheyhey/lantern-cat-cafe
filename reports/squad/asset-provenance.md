# Squad asset provenance · 2026-11-05

Extends `reports/gameplay/asset-provenance.md` and the Evening Atelier ART-BIBLE.
Original scripted integer geometry only. No copied/traced/reference-game image, image model,
AI concept, remote art, downloaded texture, or third-party sprite was used. Exact prompt: **none**.
The recipe is `python3 -B tools/art/squad.py`, seed 0, upper-left light, locked 32-color
`tools/art/visual-palette.json`, binary alpha. Run `pnpm art:check` for byte identity;
the generator also checks palette membership and a transparent border around every actor frame.

Guardian was generated and reviewed first (`--guardian`), then the matching roster.
The first study and corrective observations are in `art/GUARDIAN-STUDY.md`.
Native actor frames: hero 80×80 with approximately 56px bodies; ordinary foe 72×72;
Yarn Giant 144×144 with approximately 112px body. Arena renders at 1× or 2× integer zoom.
`metadata.json` records foot, launch, impact and contact-frame anchors and animation timing.
The runtime retimes anticipation/travel to the authoritative ability events.
Portraits are cropped from the same rig. Effects are original Phaser vector/pixel geometry in
`apps/web/src/game/squad/SquadScene.ts`; their timing/caps/colors are in squad config.
Screenshots and frame strips are captures of that actual renderer, not generated concepts.

## Reproduction corrections

Guardian's extended blade was clamped to hand x=56; Witch's hat shortened by four pixels;
fallen cat rotation shifted inside padding; routine enemy movement reduced to two pixels;
enemy feet raised one pixel. Every pose now has a transparent boundary. Enemy windup uses
a stepped 3/6/10/6/3/0% crouch; defeat collapses inside its frame instead of clipping below it.

## Exact per-file record

SHA-256 and byte counts: `tools/art/squad-manifest.json`. Parameters below are the complete
per-file invocation data; the versioned script contains the integer drawing coordinates.
All rows: 2026-11-05, Python 3 standard library, no prompt.

| File | Exact parameters | Bytes |
|---|---|---:|
| `apps/web/public/art/squad/guardian.png` | `{"frame":[80,80],"frames":6,"poses":["idle","move","basic","cast1","cast2","ultimate","hit","defeat","victory"],"foot":[40,72],"light":"upper-left"}` | 10801 |
| `reports/squad/art/guardian-real-size.png` | `{"scale":1,"columns":["idle","move","basic","cast1","cast2","ultimate","hit","defeat","victory"],"rows":["contact","anticipation"]}` | 5478 |
| `apps/web/public/art/squad/portrait-guardian.png` | `{"source":"same original rig","frame":0,"crop":[-8,-4,64,64]}` | 683 |
| `apps/web/public/art/squad/witch.png` | `{"frame":[80,80],"frames":6,"poses":["idle","move","basic","cast1","cast2","ultimate","hit","defeat","victory"],"foot":[40,72],"light":"upper-left"}` | 12447 |
| `reports/squad/art/witch-real-size.png` | `{"scale":1,"columns":["idle","move","basic","cast1","cast2","ultimate","hit","defeat","victory"],"rows":["contact","anticipation"]}` | 5679 |
| `apps/web/public/art/squad/portrait-witch.png` | `{"source":"same original rig","frame":0,"crop":[-8,-4,64,64]}` | 747 |
| `apps/web/public/art/squad/alchemist.png` | `{"frame":[80,80],"frames":6,"poses":["idle","move","basic","cast1","cast2","ultimate","hit","defeat","victory"],"foot":[40,72],"light":"upper-left"}` | 10745 |
| `reports/squad/art/alchemist-real-size.png` | `{"scale":1,"columns":["idle","move","basic","cast1","cast2","ultimate","hit","defeat","victory"],"rows":["contact","anticipation"]}` | 4685 |
| `apps/web/public/art/squad/portrait-alchemist.png` | `{"source":"same original rig","frame":0,"crop":[-8,-4,64,64]}` | 677 |
| `apps/web/public/art/squad/guard.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 3375 |
| `reports/squad/art/guard-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1299 |
| `apps/web/public/art/squad/flanker.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 3312 |
| `reports/squad/art/flanker-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1158 |
| `apps/web/public/art/squad/ranger.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 5549 |
| `reports/squad/art/ranger-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1531 |
| `apps/web/public/art/squad/healer.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 3568 |
| `reports/squad/art/healer-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1300 |
| `apps/web/public/art/squad/charger.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 3529 |
| `reports/squad/art/charger-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1367 |
| `apps/web/public/art/squad/elite.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 3472 |
| `reports/squad/art/elite-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1373 |
| `apps/web/public/art/squad/yarn.png` | `{"frame":[144,144],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 22551 |
| `reports/squad/art/yarn-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 4104 |
| `apps/web/public/art/squad/thread.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 2683 |
| `reports/squad/art/thread-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 908 |
| `apps/web/public/art/squad/dummy.png` | `{"frame":[72,72],"frames":6,"poses":["idle","move","attack","windup","hit","defeat","phase2"],"seed":0}` | 3190 |
| `reports/squad/art/dummy-real-size.png` | `{"scale":1,"poses":["idle","move","attack","windup","hit","defeat","phase2"]}` | 1141 |
| `apps/web/public/art/squad/icon-shieldBash.png` | `{"size":[24,24],"shape":"shieldBash"}` | 166 |
| `apps/web/public/art/squad/icon-rally.png` | `{"size":[24,24],"shape":"rally"}` | 184 |
| `apps/web/public/art/squad/icon-hearthwall.png` | `{"size":[24,24],"shape":"hearthwall"}` | 205 |
| `apps/web/public/art/squad/icon-threadSnare.png` | `{"size":[24,24],"shape":"threadSnare"}` | 242 |
| `apps/web/public/art/squad/icon-emberOrb.png` | `{"size":[24,24],"shape":"emberOrb"}` | 206 |
| `apps/web/public/art/squad/icon-lanternstorm.png` | `{"size":[24,24],"shape":"lanternstorm"}` | 185 |
| `apps/web/public/art/squad/icon-milkFlask.png` | `{"size":[24,24],"shape":"milkFlask"}` | 190 |
| `apps/web/public/art/squad/icon-mossFlask.png` | `{"size":[24,24],"shape":"mossFlask"}` | 190 |
| `apps/web/public/art/squad/icon-nineLives.png` | `{"size":[24,24],"shape":"nineLives"}` | 199 |
| `apps/web/public/art/squad/icon-steadfast.png` | `{"size":[24,24],"shape":"steadfast"}` | 166 |
| `apps/web/public/art/squad/icon-warmWick.png` | `{"size":[24,24],"shape":"warmWick"}` | 206 |
| `apps/web/public/art/squad/icon-lastSip.png` | `{"size":[24,24],"shape":"lastSip"}` | 190 |
| `apps/web/public/art/squad/icon-guard.png` | `{"size":[24,24],"shape":"guard"}` | 166 |
| `apps/web/public/art/squad/icon-snare.png` | `{"size":[24,24],"shape":"snare"}` | 242 |
| `apps/web/public/art/squad/icon-restrain.png` | `{"size":[24,24],"shape":"restrain"}` | 242 |
| `apps/web/public/art/squad/icon-taunt.png` | `{"size":[24,24],"shape":"taunt"}` | 242 |
| `apps/web/public/art/squad/icon-burn.png` | `{"size":[24,24],"shape":"burn"}` | 206 |
| `apps/web/public/art/squad/icon-exposed.png` | `{"size":[24,24],"shape":"exposed"}` | 185 |
| `apps/web/public/art/squad/icon-stun.png` | `{"size":[24,24],"shape":"stun"}` | 176 |
| `apps/web/public/art/squad/cafe-room.png` | `{"size":[680,360],"seed":0,"light":"upper-left and two pendants","layers":"quiet wall, open floor"}` | 2095 |

`apps/web/public/art/squad/metadata.json` is generated by the same command; its exact anchor/timing dictionary is committed at the end of `squad.py`.

## Browser evidence and presentation correction

All effect strips and layout/fresh-eyes screenshots are original local browser captures
of this candidate, generated by `tools/squad-effects.mjs`, `tools/squad-audit.mjs`,
`tools/squad-fresh-eyes.mjs`, and `tools/squad-stress.mjs`. No prompt or external image.
Date: 2026-11-05. Native arena 680×330; UI sizes 1280×720, 1440×900, 1920×1080.
`tools/squad-proof-images.py` packs two columns with one-pixel gutter, no scaling, then
`cwebp -lossless -m 6`; per-file parameters, sources, bytes and hashes are in
`reports/squad/proof-images.json`. The renderer residue correction shares four bright
effects between motion/impact, with overflow at alpha0.35; persistent statuses stay visible.
Exact original vector coordinates are versioned in SquadScene.ts, not generated art.
