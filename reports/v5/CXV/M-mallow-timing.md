# Mallow — Batch M native pilot
Captured at 1280×720 on http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1; experimental, not integrated judge acceptance.
Idle source4ec917401; actual cast sourcec7d3cf13a; exact hashes/UTC in M-V2-mallow-native-R1.json and M-V3-mallow-cast-R2.json. R1 cast failed and is superseded only by R2.

| Channel | Designer Mochi L1 | Mallow authored/measured |
|---|---|---|
| Loop | full10s, 1× |10s, 1×; root/mesh seam0 |
| Head peak-to-peak |1.84/2.11%H X/Y |1.637/1.905%H; reduced0/.438%H |
| Breath |3.333s dominant component |3 cycles/10s; torso2.4px, neck1.8px and100ms lag |
| Face depth |head/nose differ; not recovered Cubism parameters |eye1.2px/mouth2.4px lateral parallax; head1.6° slow tilt |
| Blink |near-closed600–800ms, about3.33s spacing |180ms close,400ms hold,320ms reopen; R eye45ms lag; independently smooth |
| Ear follow |3.333s; tracking imperfect |45/70ms lag; asymmetric1.6°/1.2° plus slow component |
| Tail |unreliable tracking; no fabricated measured lag |7/−3.5/7° S curve;120/240/360ms authored lag |
| Prop |more expressive than native; lantern is separate |whisk1.5° breath+1°slow,180ms lag; modest native range |
| Cloth |shape follows motion; no validated physical lag |1.8px band-limited sway,160ms authored lag |
| Feet |source registration imperfect |actual world vertices0 displacement normal/reduced |
| Cast |no designer cast supplied |1s additive skill;250ms cast/550ms hit cues; exact zero at endpoints |
| Rules contact |unchanged game rules |800ms action,350ms impact maps exactly to clip.55, both modes |
| Handoff |smooth return is target |actual scene meshdelta≤.000031 over.0001ms boundary; root≤1.4e−14 |

31 focused tests passed; TSC0. Soot301samples/11mesh snapshots exactly match prior baseline in both modes. Immutable original rig/weights. Same-height228px 1× side-by-side film, four comparison stills and blink sheet were reviewed once in R1; the R2 cast sheet was reviewed once. Reused idle image hashes were not reopened.
Scoped READY for CXI integration; final current-judge capture, overlap and performance remain integration gates.
