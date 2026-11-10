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
