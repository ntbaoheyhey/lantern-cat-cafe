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
