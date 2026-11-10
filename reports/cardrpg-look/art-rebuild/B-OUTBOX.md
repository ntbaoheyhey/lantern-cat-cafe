# Lane B → A6: illustrated puppet integration

2026-11-10: native roster generation retired by user direction. P1 pipeline published; Mochi is the first illustrated puppet. P2 pilots and full roster remain in progress.

- Runtime source: `apps/web/src/game/squad/turn3d/look-puppet.ts` and `look-puppet-rig.ts`; assets `assets/cardrpg-look/v3-puppets/`. One atlas + JSON rig per unit.
- Enable with existing `window.__LOOK_V2__=true` and `window.__LOOK_ART__='v3'`. v3 defaults to `puppet`. The main application remains default OFF. Existing explicit `generated`, `painted`, `sculpt` modes remain diagnostic history.
- Scene consumes the current action identity, ultimate flag, full action progress and boss phase state; no rule/model/DOM changes. No new event required. Camera unchanged in P1; P3 will notify here.
- A6 keeps all DOM HUD/cut-in/boss bars. Canvas VFX/damage-number pass is P6, still pending; avoid adding a second canvas number layer.
- Existing portrait delivery: `assets/cardrpg-look/v3-portraits/manifest.json`, including `portraits[id].uiPortrait` 56/72/144px. Final puppet-linked unified manifest is P8.
- P1 share: Mochi atlas223130B + small JSON. Current B lean offline diagnostic27602316B; combined A6 size not yet measured. Original/native assets remain on disk and in historical provenance.
- Validation: typecheck/lint20focusedtests; real Mochi battle and8poses0pageerrors/0UIoverlaps in `reports/cardrpg-look/art-rebuild/p1/`. Not final pilot acceptance.
- Known issues: eyelid closure sampled fur needs repair; roster mixed until P4/P5. P1 capture uses legacy diagnostic shell; P2 will use disposable merged A6 preview.

## P2 pilot handoff

Mochi, Soot and Yarn Giant now have illustrated rigs/atlases under the same existing v3 opt-in. P2 screenshots and motion sheets are captured in the disposable A6 shell. Three pilots pass visual review at 7.8/7.6/8.0 (self-assessed); Binding Thread adds remain legacy until P5. Replay median/p95 16.7/16.8 ms, zero errors/label overlap; no first-session or cast-specific performance claim. The old native files remain preserved, not the default roster.
P3 camera/composition is next. No DOM/rule changes or A6 merge on B branch. Full pilot evidence: reports/cardrpg-look/art-rebuild/p2/REVIEW.md.

## P3 camera/composition (latest)

Puppet mode now uses a lower/closer camera, a 4.25-world-unit minimum canvas height, simple party fan (front/rear distinguished by depth), and normalized cat/enemy/boss height 2.08/2.10/3.70. No gallery-only placement override for puppets. Boss pilot cats now fill 40–44% of canvas and normal pilots 44–48% at 1440×900 and 1280×720; boss ratio about 1.7–1.9×. Existing 5.4% ultimate push-in and bounded impact shake remain, both suppressed for reduced motion. All final face/HP and DOM overlap checks pass. No DOM changes required.
Evidence: p3/final and p3/comparison.webp. Combined local A6 lean preview 26.71 MB at three pilots; roster budget will be remeasured per batch. P4 cats next.

## P4 batch1 — six cats
Mochi/Soot/Clover/Panko/Mallow/Cinnamon accepted; new four atlases/rigs in existing v3-puppets path. Shared closed eyelid fix samples cheek instead of hat/forehead. No integration API or DOM changes. Six cat atlas bytes 1223816; combined A6 lean artifact 27,766,291 bytes. Review p4/REVIEW.md; final six comparisons/8pose sheets and five-seed parity PASS. Remaining six cats then enemies continue; R-9 memory files now active.

## P4 complete — all12cats
All12 exact cat ids now have puppet atlases/rigs. Cat atlas share 2368142 bytes; combined disposable A6 lean29,291,511bytes. No new event/DOM/rules change. Every playable cat covered by automated delivery check; two batches96poses0page/faceHPerrors. Evidence p4/REVIEW.md. P5 enemies/bosses begins next. Known: restrained shared gestures; Inkcap decoy status cue is still the existing canvas knot pending P6.

## P5 batch1 — six enemies
Button Guard/Sock Skipper/Spool Ram/Needle Moth/Teacup Healer/Kettle Knight have original puppet atlases+rigs. Needle Moth has wing joints; solo Kettle uses boss silhouette scale and eye emission. No rules/DOM change. Main default OFF; same v3 flag. Combined A6 lean31,103,505B; batch evidence p5/REVIEW.md. Batch2/boss ambient+phase checks remain underway. A6 Q13e envelopes82px/148px and single canvas damage-number ownership acknowledged.

## P5 complete — all13enemies/bosses
Every rules enemy id now has an original illustrated atlas/rig; no native or legacy roster fallback in puppet mode. Four boss showcases have breathing, eye emission,7ambient motes and phase flash; reduced motion freezes/suppresses extra motion. Kettle uses boss scale only in boss framing, normal elite size in mixed fights. Full roster atlas+rig paths unchanged. Combined A6 lean32,956,195B (<40MB); P6 canvas numbers/signature VFX now active. Review p5/REVIEW.md;0page/faceHPerrors at both sizes;19tests/five-seed parityPASS.

## P6 complete — single-source canvas numbers and real sockets
All25rigs publish authored mainHand sockets; no new event API. Canvas owns visible damage/crit/heal/shield/KO totals. Existing DOM number labels remain accessible and are hidden visually by one puppet-only battle-layout.css selector; do not add a second visible number layer. Inkcap decoy is now a small floor paper-cat cue. Hurt tint decays quickly, retaining source colours. Saved49+6cast audit/33tests plus new5seed parityPASS, zero socket/faceHP/number/UIerrors; warmed castp95/max16.8ms. Original VFX audit8.1self-review. Combined A6 lean32,957,799B. P7 stage/P8 unified portrait manifest remain underway; no rules/HUD markup changes.

## P8 complete — unified portrait/puppet manifest
`assets/cardrpg-look/v3-portraits/manifest.json` version4 covers25units and60skill icons. Existing `uiPortrait.compact/1x/2x` keeps the accepted56/72/144px square crops for formation/tower. New `headPortrait.1x/2x` is160×176/320×352; `faceIcon.1x/2x` is72/144with circular alpha; `cardArt.1x/2x` is256×320/512×640and preserves complete original silhouettes. Four corrected full-body cards: Clover, Cinnamon, Sock Skipper, Binding Thread. Legacy `portrait` and skill icon keys remain unchanged. `puppet.rig/atlas` links the matching battle art. No new event or DOM change; A6 adopts selected formats. Saved review p8/REVIEW.md and formats.webp. All assets original, no new generation. All-format conservative offline reserve38,245,363B before P7 code delta; P9 will publish the updated combined budget. P7 still queued behind A6 timing lease.

## P7 complete — cafe light and original stage accents
Puppet-only warm cream fill, cool rear rim, night crescent and enemy-side thread/crumbs ship in `look-puppet-stage.ts`, `look-stage.ts`, `card-lighting.ts`. Current A6 HUD at fetched67963ca8d was used in the disposable preview; no A6-owned published source changed. Six screens/two viewports and5casts have0page/faceHP/HUD failures; warmedp95/max16.8ms, up to99draws.19tests and five-seed rules parityPASS. Same flags/events/socket contract, defaultOFF. Evidence p7/REVIEW.md. P9 will document actual38,140,486B combined size; old portrait all-format estimate is superseded by that actual shell.

## P9 actual combined budget — replaces estimates
Current A6 shell50illustrations plus B P7: **38,140,486B**,40,000,000B limit,1,859,514B headroom. Bembedded assets23,545,868B: current25atlases7,385,800B + cafe1,998,112B + VFX2,046,876B + retained classic/diagnostic12,115,080B. A6embedded5,146,352B; shared7,947,504B; HTML/code1,500,762B. Raw catalog variants are optional and overlap assets already included; import only needed formats and rerun the guard for a changed shell. Evidence p9/budget.json and REVIEW.md; command tool delivery-budget.mjs validates the actual artifact against its receipt and40MB cap. Flags/manifest/number ownership unchanged. P7 pushedc922b783ad1529fc716a677ad96e0e2856f236a1; P10replay correction underway, no user action needed.

## P12 — Soot motion pilot
Soot alone gains authored lantern/head/tail follow-through in look-puppet-rig.ts; other profiles and all atlases unchanged. Reduced motion remains static. Saved21tests/12x1casts/five-seed parityPASS, warm p95 16.8ms. P13 still in progress: boss films exposed one Binding Thread behind another, so do not infer enemy-face visibility from the existing HP-label audit.

## P13 — broad boss and live add composition
Rain Spool moves0.85world units right only in illustrated boss framing. Both Binding Threads occupy distinct foreground lanes, so the rear add no longer disappears behind the boss/other add. Boss/cat scales, camera, rule slots and targeting stay unchanged; model sockets/shadows move together.20before/after views cover Rain idle/impact plus Rain/Yarn/Pantry live adds at two actual canvas sizes,0bounds/HP/UIerrors; both add faces manually verified. Type/lint25tests and5seed/six-mode parityPASS. CurrentA6 b9a266c86f70c9cbf4bc75b80c39917fbc9835f7+B actual38,152,962B,headroom1,847,038B. Basset share unchanged23,545,868B. P10 full boss-result film uses this current preview; existing85s normal film is retained.

## P15 — three/four live phase3 helpers (current)
Stable actor-ID lanes replace slot modulo2 in illustrated boss fights. Both original lanes stay unchanged; two summoned lanes(.40,1.15)/(1.60,1.35) keep all four faces visible. Surviving helpers do not jump when another dies. Render-only look-puppet-formation.ts + scene.ts; no rules, DOM, camera or scale change.12actual phase3 views cover3bosses×3/4helpers×2sizes,0page/bounds/HPerrors; type/lint6tests and5seed/six-mode parityPASS. The A6 three-add report is covered. Source A615f5653d plus B actual38,175,926B (<40MB), asset share unchanged. Evidence p15/REVIEW.md; final boss film is now being corrected.

## Shared timing request — 2026-11-10T19:37:20.315913+00:00
B full boss film has waited since19:23UTC across A6 first-session1 and immediate first-session2. Please leave a5second acquisition gap after the current segment so the existing B waiter can run. B has combined the corrected film and prepared Spool Ram checks into one expected4–6minute lease (hard cap19minutes), then yields6.5seconds as usual. No A6 process was touched. P15 code is already published4815b7f3b.

## P10 films accepted
Complete boss x1 film136.933333s/13catultimates now reaches an actual visible Victory panel held1.8s; all four phase3helpers are distinct. Normal85.4911s/9ult excerpt, two R0posters and12speed checks retained. Zero page/faceHPerrors; films are not timing benchmarks. Capture-only result-panel wait, no A6source change. Compact films/receipts: p10/delivery/manifest.json and p10/REVIEW.md. Full masters outside Git. P11 report follows.

## P11 core report
ART-REPORT.md now records shipped25-unit coverage, accepted P10films, R0comparison limitations, original provenance, tests and actual38,175,926B combinedbudget. Weighted self-score8.225 remains below8.5target; shared motion/spectacle are explicit limits. Further bounded motion work continues; no new integration flag/event/asset contract.

## P14 — Spool Ram planted horn dip
Spool Ram alone gains an authored horn dip and delayed tail recovery. Counter-transforms keep four local hoof contacts stable as its body leans/breathes. Reduced motion remains still; other profiles, atlases/rigs, sockets, gameplay and HUD remain unchanged. Saved16views/8casts/19tests/type/lint/parityPASS;0socket/HP/boundsfailures; warm p95<=16.8ms. Actual combined A6+B38,176,310B/headroom1,823,690B; Bassetshare unchanged. Evidence p14/REVIEW.md and compact evidence/.

## P16 — Inkcap authored lantern and per-actor tail
Inkcap raises its right-hand lantern during casting and opens the offhand. A subtle tail bend uses independent per-actor material uniforms; cached geometry/atlases/rigs stay unchanged, no extra draw call. Attempt1 loweringgesture was rejected; attempt2 actualsocket lift0.06946 accepted at both sizes.16pairedviews/12casts/22tests/type/lint/parityPASS;0shader/page/socket/HP/boundsfailures, warm p95<=16.8ms. Actual combined38,176,938B/headroom1,823,062B; Bassetshare unchanged. No new HUD/event/flag contract. Evidence p16/REVIEW.md.

## P17 — Sock Skipper anticipation and small hop
Sock Skipper compresses, hops up to0.11local units, reaches the front mitten and settles with loose-thread follow-through. Existing atlas/rig/geometry/floor shadow retained; reduced motion stays still. Saved16views/8casts/23tests/type/lint/parityPASS;0page/socket/HP/boundsfailures, warm p95<=16.8ms. Actual combined38,177,170B/headroom1,822,830B; Bassetshare unchanged. No new HUD/event/flag contract. Evidence p17/REVIEW.md.

## P18 — Cinnamon serving tray/cup
Left servingtray lifts with a restrained rightcup countergesture and delayed head/tail. Original atlas/rig/geometry retained; no new draw/event/HUD/flag.16pairedviews/12casts/24tests/type/lint/parityPASS;0page/socket/HP/boundsfailures, p95<=16.8ms. Pinned A6e94713b8e+B combined38,185,046B/headroom1,814,954B; Bassetshare23,545,868B unchanged. Evidence p18/REVIEW.md; motion7.7, overall7.7.

## P20 — A6 boss disposal regression resolved
Reproduced expected3/received5. `CardBossAtmosphere.dispose()` now has a lifetime guard; every owned geometry/material/InstancedMesh releases once, including motes. Existingtest checks each resource after first AND second calls plus rootdetachment;4focusedboss/materialtests and type/lintPASS. No live render/rules/HUD/art change; previousvisuals/parity retained. Next P19 combined build includes the fix.

## P19 — Sorrel floor-contact staff
Sorrel pivots the rigid crook around its actual painted floor tip, with an open palm and delayed tail; clean shoulder/hand joins at both sizes. Saved16pairedviews/12casts/25tests/type/lint/parityPASS; tipdrift<1e-15,0socket/faceHP/bounds/page errors. Reduced motion remains still. A6e94713b8e+B38185390B/headroom1814610B; Bassets unchanged. No event/HUD/flag/rig/atlas changes. Evidence p19/REVIEW.md.

## P21 — Binding Thread snare reach and overlap repair
Knotted hands reach toward cats with delayed counterarm and planted feet. Repaired authored arm partition and opt-in opaque-alpha overlap remove old floating arm fragments; only BindingThread atlas/rig rebuilt.26web+2pipeline tests,16pairedviews/8casts/type/lint/parityPASS;0socket/faceHP/page/bounds errors, p95<=16.8ms. CombinedA6e94713b8e+B38189058B/headroom1810942B; Bembedded23549548B. Existing portraits/source art unchanged; no new draw/HUD/event/flag; P15 helper positions retained. Evidence p21/REVIEW.md.
