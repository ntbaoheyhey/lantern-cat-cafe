# A4 Mochi — checkpoint review

Production: four distinct drawn keys, original gold crescent basic and angular gold/teal shield crest;200ms curved approach,90ms held contact, return by800ms. Defensive ultimate stays planted and sends the crest behind actual allied shield recipients. Incidental damage retains its own outcome. SHIP07:25:18 clarified that class governs damaging attack delivery; allied support casts stay with allies. G-ROLE therefore evaluates the basic close-contact motion and the ultimate allied recipient/timing contract; no rules change or class-baseline merge.

Current evidence: three30s720films with audio; fourteen scoped windows,11 own actions and3 received-hit windows. Wave1A27 ends beyond the movie boundary, with7of9 requested samples available; no claim of full recovery from that partial window. Four pose sheets and three full-field sheets were inspected once. Each own action shows K1→K2 or K5; each real hit shows K4. Blind read11/12, recorded before private-key access; dark-focus sample12 was visually read as cast but expected windup. No relabeling.

G-POSE at225px opaque height: K1/K2/K4/K5 IoU .49646/.32902/.50131/.50428; maskedmeanLab .39042/.37486/2.72817/3.81035; K2 changed52.57% of unionbbox. Raw headratios .98848/1.01901/1.01948/.99017; normalizedfoot0–1px, fixed-model runtime~0px. K2 reach+41.03% original bodywidth. Original creamfur,tealapron,woodshield,goldlantern preserved.

G-FRAME live1800samples,all6cases no numeric failure; maxactualalpha12.23% at1440wave3. Layout v8 reserves a higher six-foe attack corridor and moves lower party units left. No nonacting unit moves to make room during an attack. Basiccontact sourceerror0, signedfrontgap andfullpath in live-probe.json; support ultimate planted per SHIP07:25:18 contract. Live root envelope returns within800/2200 but film-confirmed clock evidence still being reduced.

G-FX crest peak27.995%720 /31.109%900. Foregroundfacealpha0%; fullcompositechangedfacepixelsmax11.42%. Mainshape is painted five-facet fan, with cream/gold edge and teal interior, grown behind party. Basic is a short painted cut anchored to shieldtip with eroding splinters; no main rings/orbs/fog. Faces remain readable. Crosshero3of5 distinctness remains A9. Pink enemy waves/floods belong A7/A9; current Teacup damage belongs pending SHIP class merge.

G-REG fullweb2646tests/315filesPASS175.69s; typecheck0;3baselineF6hashesmatch. Source-tree.json binds current production sources; no production edit during capture. Boss60.24fpsmedian in720capture after locallongjobs completed; A5remote generation is not a localGPUjob. Newbattleassets620936bytes (<6MiB).

900boss:900frames,29registered actions (28available, lastimpact30.4s outside30s), framingfailures0, parityPASS. All available scoped strips inspected once; eight selectedJPGs retained. Fixed-clock900film is silent, audio evidenced in720films.

Film role:11ownactions,8basic/3supportultimate;10complete envelopes, finalwave1return beyond30s excluded. Maximum encodedimpact offset33.2ms (one30fpsframe). Basic signedfrontgap-7.61..30.97px, allwithin51.2px; livealphaocclusion<=12.23%. Supportultimate displacement~0. Lastcomplete sample home residual<=2.942px before exact800msdeadline. See film-role.json and live-probe.json.

Context-hygiene process failure: one tool call opened5images (1Cloverpreview+4Mochisheets), exceeding4/look. This is explicitly retained; subsequent looks split. No visual threshold changed.

## Action ledger

|Fixture/action|Impact seconds|Scope|Anticipation/contact/recovery|Effect and response|
|---|---:|---|---|---|
|wave1 A0|0.426|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|
|wave1 A9|7.809|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|
|wave1 A18|18.775|support ultimate|K5 / K5 / K5→K0|allied painted crest; actual shield/cleanse|
|wave1 A27|29.641|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage; final recovery outside video|
|wave3 A0|0.429|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|
|wave3 A9|8.429|received hit|K0 / K4 / K0|enemy legacy FX; real damage K4/flash, A7/A9|
|wave3 A11|9.629|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|
|wave3 A22|21.012|support ultimate|K5 / K5 / K5→K0|allied painted crest; actual shield/cleanse|
|boss A0|0.435|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|
|boss A6|5.751|received hit|K0 / K4 / K0|enemy legacy FX; real damage K4/flash, A7/A9|
|boss A8|6.951|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|
|boss A12|12.651|received hit|K0 / K4 / K0|enemy legacy FX; real damage K4/flash, A7/A9|
|boss A16|17.001|support ultimate|K5 / K5 / K5→K0|allied painted crest; actual shield/cleanse|
|boss A24|26.984|basic|K1 / K2 / K0|socket crescent; hostile recoil and actual damage|

## Defect checklist

|Defect|wave1|wave3|boss|Owner/evidence|
|---|---|---|---|---|
|Camera moved|no|no|no|static camera; bounded ultimate shake unchanged|
|Wrong facing|no|no|no|0 wrong in1800samples|
|Uneven unit heights|no|no|no|all6frame cases pass|
|Mochi idle-only action|no|no|no|11ownwindows drawn; lastpartial labelled|
|Own main blob/ring/fog|no|no|no|painted cut/crest, selectedfield sheets|
|Own ultimate >45%field|no|no|no|27.995%720/31.109%900|
|Pasted-pose seam|no visible|no visible|no visible|hard swaps on gesture/held contact|
|Own effect face wash|no|no|no|foreground0%, compositechangedmax11.42%|
|Other hero/enemy floods|yes|yes|yes|A5/A6/A7/A9: green/gold/pink legacy FX|
|Number clutter|minor|minor|minor|A9 ensemble pass; actual recipient shield numbers|

## Critique against the private same-scale reference

1. The crouch and extended shield communicate direction better than the old idle lean.
2. The reserved corridor stops the dash disappearing behind Kettle.
3. The dense-field hop is more arced than the reference's ground dash, a clearance compromise.
4. The short crescent reads at the shield edge; the drawn body carries most of the force.
5. The angular crest and teal interior differ from Soot's purple flame.
6. Its main paint stays behind faces, with growth timed to the shield event.
7. Allied shields read without inventing an offensive support cast.
8. K4 is distinct, but later-item pink/green effects compete with its face.
9. The reference has more secondary limb separation; our held keys retain a limited-animation look.
10. A9 still needs to evaluate ensemble distinctness and number clutter.

G-LEARN:7sources including formal paper,3webdocs and measured own variants; LEARN/A4.md. G-POSE/READ/ROLE/REG/PERF and the layout regression are supported by the cited art, live and film evidence. Complete G-FX pairwise distinctness remains OPEN forA9; production craft activation remains A9/A11.
Self-score8/10: readable shield action and support cast, with ensemble acceptance still open.
Estimated time split, excluding A5 prep:50%authoring/10%study/40%measurement,capture,logging. These are coarse timestamp estimates, not activity telemetry. Measurement<=25%FAILED; one5image-look alsoFAILED. Historical process failures remain explicit.
