# Q2 review — owned visual checks pass; overall OPEN

Three 30-second x1 films from 47b161aa2, recorded with production audio. All 83 action sheets were watched (wave1 28, wave3 27, boss 28). Film frames are zero-based at 30 fps. Window grids include 10 fps sampling and extra contact frames. Wave1 A28, wave3 A27 and boss A28 end at the film boundary; missing recovery or impact is explicitly excluded. The later null-canvas guard does not change a browser with working pixels.

Q2 is not declared complete: Q1 video confirmation is still OPEN. Q2-RECHECK: typecheck: PASS; unit: PASS; parity: PASS; browser: PASS; aLane: FAIL; bLane: FAIL. Tests include the then-uncommitted null-canvas repair; films remain from 47b161aa2. Browser 435/435 and web unit 2,634 pass. A lane retains 97 failures (historical freshness plus future checkpoints); B retains 14 (old cadence/active coverage, E6 and future checkpoints). Detailed historical/superseded classification remains Q9; no lane is granted a blanket PASS. Self-score **7/10** for this item; no >=8 claim without all checker passes. Earlier pre-correction measurements remain in LEARN/Q2.md and their lab receipts.

## Measurements

| Fixture | Frames | Cat/enemy max:min | Minimum cat vh | Span | Boss:cat range | Numbers/target | Lifetime upper bound | Face/number/HUD overlap |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| wave1 | 1800 | 1.03046 / 1.03046 | 0.26595 | 86.19% | n/a | 2 | 682.60 ms | 0 / 0 / 0 |
| wave3 | 1799 | 1.03046 / 1.03046 | 0.26595 | 86.62% | n/a | 2 | 651.00 ms | 0 / 0 / 0 |
| boss | 1799 | 1.03046 / 1.03046 | 0.26595 | 87.91% | 1.5527–1.6487 | 2 | 650.00 ms | 0 / 0 / 0 |

154/154 positive damage/heal/shield events visible within the filmed window have exactly one matching numeric burst, with no extras. Badges are counted toward the maximum of two simultaneous labels. Number identity is (key,born); 0 old-action labels survive to a new impact, 0 edge placements, 0 labels older than 700 ms. The maximum 682.61 ms is a conservative disappearance bound including initial event age and the next sample; measured visible spans are <=633.90 ms. The product expires at 640 ms. No epoch/monotonic clock subtraction was used.

Boss contains 29 conservative body-box/face intersections and 12 boundary crossings of at most 0.294 px. All 41 pixel checks show 0 opaque pixels outside the viewport or in the protected face. The 12 boundary poses reproduce within 0.000001 px. Six ultimate collision replays differ by up to 2.182 px; all 29 collision samples still contain 0 opaque pixels within the face enlarged by 8 px. This qualification is retained; a conservative box is not an observed occlusion.

| Desktop | Fixture | Pixel cat max:min | Pixel enemy max:min | Min cat height | HUD | Stage |
|---|---|---:|---:|---:|---:|---:|
| 1280×720 | wave1 | 1.03665 | 1.04211 | 191 px (26.53%) | 12.00% | 100% |
| 1280×720 | wave3 | 1.03665 | 1.03665 | 191 px (26.53%) | 12.00% | 100% |
| 1280×720 | boss | 1.03665 | 1.02083 | 191 px (26.53%) | 12.00% | 100% |
| 1440×900 | wave1 | 1.03347 | 1.03782 | 239 px (26.56%) | 10.67% | 100% |
| 1440×900 | wave3 | 1.03347 | 1.03782 | 239 px (26.56%) | 10.67% | 100% |
| 1440×900 | boss | 1.03347 | 1.02510 | 239 px (26.56%) | 10.67% | 100% |

The 66 independent pixel samples (11 phases × 6 cases) confirm the contour reducer without using asset-space height. Both desktop HUDs are transparent overlays; no units cross their bounding bands. The full-film gate uses 5,398 720p rendered samples; 900p is independently checked in the six-case pose/DOM experiment, not claimed as a second set of films.

## Facing, all required states

All 25 sprites / 100 idle, attack, hurt and KO samples were visually inspected again after the repair. Each source matches the corresponding live fixture asset where present; no placeholder/template substitution is inferred away. Several armoured designs face mostly forward; the table describes the visible asymmetric landmark, not merely the root scale sign. No state reverses it.

| Sprite | Source | Visible orientation cue | Idle / attack / hurt / KO |
|---|---|---|---|
| mochi | placeholder | Muzzle and shield point right | pass / pass / pass / pass |
| soot | placeholder | Muzzle and lantern extend right | pass / pass / pass / pass |
| clover | placeholder | Tea hand and muzzle right | pass / pass / pass / pass |
| panko | template | Muzzle and shield hand right | pass / pass / pass / pass |
| mallow | template | Muzzle and spoon right | pass / pass / pass / pass |
| sorrel | template | Muzzle and staff right | pass / pass / pass / pass |
| biscuit | template | Muzzle and round shield right | pass / pass / pass / pass |
| inkcap | template | Muzzle and lantern right | pass / pass / pass / pass |
| cinnamon | template | Muzzle and cup right | pass / pass / pass / pass |
| brioche | template | Muzzle and open palm right | pass / pass / pass / pass |
| velvet | template | Muzzle and flag right | pass / pass / pass / pass |
| marigold | template | Muzzle and pot right | pass / pass / pass / pass |
| button-guard | template | Front-left helmet eye plane; shield on left | pass / pass / pass / pass |
| sock-skipper | template | One visible eye/face plane to left | pass / pass / pass / pass |
| spool-ram | template | Muzzle and horns project left | pass / pass / pass / pass |
| needle-moth | template | Front-left eye plane between wings | pass / pass / pass / pass |
| teacup-healer | template | Cup face/eye plane front-left; spoon left | pass / pass / pass / pass |
| kettle-knight | template | Spout and visor plane left | pass / pass / pass / pass |
| yarn-giant | template | Front-left eyes, brow and near fist | pass / pass / pass / pass |
| binding-thread | template | Eye under top cap faces left | pass / pass / pass / pass |
| practice-cushion | template | Near-front eyes; leftward body bias | pass / pass / pass / pass |
| pollen-scout | template | Eye/muzzle under leaf hood left | pass / pass / pass / pass |
| rain-spool | template | Muzzle and horns left | pass / pass / pass / pass |
| crumb-sentinel | template | Front-left visor plane and forward left fist | pass / pass / pass / pass |
| pantry-crown | template | Front-left narrow visor and near fist | pass / pass / pass / pass |

## wave1: every action

| Action | Time / frames | Actor / type | What is visible |
|---|---|---|---|
| A1 | 0.107 s; f2–28 | mochi / basic | Mochi holds then leans; three gold threads reach moth/cup and shield self. Circular gold wraps; moth tilts. −54/−22/◇18 stay low, clear before Soot. Faces and HUD remain separate. |
| A2 | 0.979 s; f29–54 | soot / basic | Soot stays planted, pink bolt bends toward moth; purple ring and small rock-back. One −72 below wings; clears before Clover; scale and inward facing hold. |
| A3 | 1.866 s; f55–81 | clover / basic | Clover shifts slightly, sends green bead; leaf curls wrap Clover and moth. One −38 below moth, no column or face crossing; old labels absent. |
| A4 | 2.747 s; f82–108 | panko / basic | Panko tilts with gold bead, moth flinches, gold curl fans settle. −58 below target; portrait strip separate; no visible size jump. |
| A5 | 3.649 s; f109–134 | foe-0-button-guard / basic | Guard leans left and lofts gold bead at Panko. Circular impact and Panko rock-back; two small values share Panko foot line, guard −16 below shield. No face or HUD overlap. |
| A6 | 4.531 s; f135–161 | foe-3-needle-moth / basic | Moth sends pale-blue arc left at Panko; both recoil inside thin shards. −19/−16 stay near feet and clear; moth wings remain inside frame. |
| A7 | 5.414 s; f162–187 | foe-1-sock-skipper / basic | Sock skipper bends left, pink bead crosses field; petal curls wrap Panko and skipper. −25/−16 local and brief; equal-size grouping stable. |
| A8 | 6.298 s; f188–214 | foe-2-teacup-healer / basic | Teacup tilts with cyan bead toward Panko; watery curls, slight recoil, −17/−16 near feet. A separate +18 status appears at end; no edge column. |
| A9 | 7.096 s; f204–228 | round status / basic | Round-status tick replaces teacup damage with local +18; cyan remnants clear, then one heal label fades. No new anticipation or contact, all units idle. |
| A10 | 7.499 s; f224–250 | mochi / basic | Mochi gold split bead repeats; moth/cup recoil and self shield. −61/−22/◇18 below bodies, prior heal cleared; no face/HUD intersection. |
| A11 | 8.382 s; f251–276 | soot / basic | Soot launches pink arc, moth rocks within purple halo. Single −108 remains below target; no reversal or visible scale jump. |
| A12 | 9.265 s; f277–303 | clover / basic | Clover green branch reaches moth and Panko. Green leaf curl and shallow recoil; +19/−38 stay local and clear before following impact. |
| A13 | 10.170 s; f304–370 | panko / ultimate | Panko focus banner sits below caster; near-static cast then a bright tilted shield/fan grows. ◇180 appears at foot line, fades before guard. Gold body wash and weak anticipation are Q3; unit silhouette stays in its seat. |
| A14 | 12.465 s; f373–399 | foe-0-button-guard / basic | Guard gold lob hits Panko shield; small rock-back and two local labels, shield 20 at Panko and −32 at guard. No old ultimate number remains. |
| A15 | 13.351 s; f400–466 | foe-3-needle-moth / ultimate | Moth outlined in focus, then broad pale blade/fan and yellow columns cover several units. −9/−32 and shield labels stay local; bodies washed out by Q3 effect, no unit physically crosses another face. |
| A16 | 15.647 s; f469–494 | foe-1-sock-skipper / basic | Sock launches pink curved bead, Panko rocks behind a petal loop. Shield 24 and −32 appear below respective bodies and clear; framing/facing stable. |
| A17 | 16.531 s; f495–521 | foe-2-teacup-healer / basic | Teacup cyan arc hits Panko; watery loop and slight recoil. Shield 17/−32 low beside targets; next +18 replaces damage at status transition. |
| A18 | 17.311 s; f510–534 | round status / basic | Status heal +18 appears beneath teacup after prior cyan curls fade. No attack pose; label gone before Mochi ultimate impact. |
| A19 | 17.736 s; f531–597 | mochi / ultimate | Mochi focus/banner, static cast then bright golden lattice/curls engulf left and centre. Two shield values per cat stay below faces, −44 local to moth. Extreme effect wash is Q3; bodies return to original positions. |
| A20 | 20.038 s; f600–666 | soot / ultimate | Soot focus at upper left; pink bead becomes large curling white/pink field covering enemies. Several distinct hit labels remain under targets, max two visibly at moth, no edge column. Q3 wash makes paint unreadable at peak. |
| A21 | 22.337 s; f669–735 | clover / ultimate | Clover outlined in focus; green leaf field expands over party with white hot rings. +9/+55 local at Clover/Panko; no persistent values after recovery. Q3 body wash, fixed seat spacing and inward facing. |
| A22 | 24.633 s; f738–764 | panko / basic | Panko gold bead and shallow forward tilt, moth rocks; −57 beneath moth. Green ultimate gone; no edge or face label. |
| A23 | 25.518 s; f765–790 | foe-0-button-guard / basic | Guard gold lob and reciprocal ring on Panko. Shield 9/−32 are low and separated, disappear before moth impact; stable scale. |
| A24 | 26.399 s; f791–817 | foe-3-needle-moth / basic | Moth pale-blue arc left, Panko shield absorbs; sparse shards and small flinch. Shield 8/−32 stay beneath bodies; no prior values. |
| A25 | 27.281 s; f818–844 | foe-1-sock-skipper / basic | Sock pink bead and petals on Panko; shield 10/−32 near feet. Shallow recoil, no body/face overlap or edge clipping. |
| A26 | 28.184 s; f845–871 | foe-2-teacup-healer / basic | Teacup cyan bead and watery wrap, Panko shield 6 and cup −32. +18 status replaces prior value; unchanged inward facing and size. |
| A27 | 28.977 s; f860–884 | round status / basic | Teacup +18 status tick below rim; old attack curl disappears and heal clears before new impact. No movement beyond idle. |
| A28 | 29.383 s; f881–899 (truncated) | mochi / basic | Mochi split gold bead reaches moth/cup; −61/−22 and self shield local. Impact is visible; final recovery beyond f899 is outside film and not reviewed. |

## wave3: every action

| Action | Time / frames | Actor / type | What is visible |
|---|---|---|---|
| A1 | 0.114 s; f3–29 | mochi / basic | Mochi gold fan targets moth/sentinel/cup, self shield. Three enemy labels below bodies, recoil stays in frame after inward seats; ram points left and no adjacent face is covered. |
| A2 | 1.009 s; f30–55 | soot / basic | Soot sends pink bolt across rear row to moth; purple loop, −59 below wings. Cup directly below remains visible; no right-edge clipping. |
| A3 | 1.899 s; f56–82 | clover / basic | Clover green bead reaches moth; green curls and shallow recoil. −35 below moth, faces separated through this crowded formation. |
| A4 | 2.799 s; f83–109 | panko / basic | Panko leans and lobs gold bead upward to moth. −52 below target; ram muzzle and cup face remain clear, gold curls are Q3. |
| A5 | 3.705 s; f110–136 | foe-0-kettle-knight / basic | Kettle knight leans left, pale/orange orb hits Panko; two shield/damage labels at each involved unit stay beneath faces. Ram immediately below knight remains readable. |
| A6 | 4.599 s; f137–163 | foe-3-crumb-sentinel / basic | Sentinel gold straight bolt hits Panko; wedge-shaped gold curls and recoil. −25/−16 low and separated; ram and teacup not covered by another unit. |
| A7 | 5.484 s; f164–189 | foe-1-spool-ram / basic | Ram faces left throughout a pink wavy pulse into Panko, both rock back. −35/−16 local; broad ram body never turns away or reaches HUD. |
| A8 | 6.365 s; f190–216 | foe-4-needle-moth / basic | Moth sends pale arc at Mochi; blue shards, modest Mochi flinch. Single shield 20 below Mochi face; rightmost moth stays within frame. |
| A9 | 7.251 s; f217–242 | foe-2-pollen-scout / basic | Pollen scout green beam descends toward Panko, leaf curl after contact. −23/−16 remain below actors; upper scout silhouette stays clear of knight face. |
| A10 | 8.132 s; f243–269 | foe-5-teacup-healer / basic | Teacup cyan lob arcs upward into Mochi; cup recoils toward right but stays inside frame. Mochi shield 6 plus −11 side by side under body, no face crossing. |
| A11 | 8.910 s; f258–282 | round status / basic | Teacup +18 status after cyan remnants; a single short label, ram and cup remain separated. No new contact beat. |
| A12 | 9.331 s; f279–305 | mochi / basic | Mochi repeats split gold attack on three rear/right targets. −55/−21/−23 below targets and self shield; dense formation holds without unit face cover. |
| A13 | 10.231 s; f306–332 | soot / basic | Soot pink bolt reaches moth across knight/scout row; purple target ring and −58 below wings. No adjacent face blocked by actor or number. |
| A14 | 11.131 s; f333–359 | clover / basic | Clover green branching bead heals Panko and strikes moth; +19/−39 below bodies. Stable sizes and both teams face inward. |
| A15 | 12.020 s; f360–426 | panko / ultimate | Panko focus and planted cast lead to bright gold shield/fan. ◇180 below caster, fades in recovery; effect crosses ram silhouette but actor bodies stay apart (Q3 wash). |
| A16 | 14.314 s; f429–455 | foe-0-kettle-knight / basic | Knight pale/orange bead into Panko, shield 24 and −32 near feet. Recoil remains local; ram face visible below knight. |
| A17 | 15.196 s; f455–481 | foe-3-crumb-sentinel / basic | Sentinel gold beam to Panko, rising wedge curls and shallow recoil; shield 24/−32 local. No units reach HUD or turn away. |
| A18 | 16.080 s; f482–507 | foe-1-spool-ram / basic | Ram stays left-facing while pink pulse connects to Panko; both rock. Shield 36/−32 near feet; silhouette scale stable through recoil. |
| A19 | 16.980 s; f509–534 | foe-4-needle-moth / basic | Moth pale diagonal arc to Panko, blue sparks and modest reaction; shield 21/−32 below actors. Cup beneath moth remains separate. |
| A20 | 17.882 s; f536–561 | foe-2-pollen-scout / basic | Pollen scout green diagonal bead and leaf curl, Panko rocks. Shield 25/−32 under actors and clear; top/right margins maintained. |
| A21 | 18.764 s; f562–588 | foe-5-teacup-healer / basic | Teacup sends cyan bead across ram to Panko; shield 17/−32 local and cup body stays in bounds through recoil. +18 status follows without stacking old damage. |
| A22 | 19.541 s; f577–601 | round status / basic | Teacup +18 status beneath feet; prior watery curls disappear. Faces and ram left-facing muzzle remain clear as next focus begins. |
| A23 | 19.954 s; f598–664 | mochi / ultimate | Mochi focus then gold lattice/ring field spreads across both groups. Two shield labels per cat and −42 near moth; no edge column, severe white/yellow body wash belongs to Q3. |
| A24 | 22.254 s; f667–733 | soot / ultimate | Soot focus then pink curl field engulfs dense enemies. Several target values spread below bodies, some targets have two. No actor crowding shift, but Q3 white body wash remains extreme. |
| A25 | 24.563 s; f736–802 | clover / ultimate | Clover focus then green leaf field over party; +12/+83 local and brief. White cores wash bodies (Q3), no character changes formation or overlaps a neighbour face. |
| A26 | 26.872 s; f805–871 | panko / ultimate | Second Panko ultimate repeats planted shield/fan; ◇180 appears low and clears before knight. No scale/facing jump; overbright effect remains Q3. |
| A27 | 29.149 s; f874–898 (truncated) | foe-0-kettle-knight / basic | Knight pale/orange bead hits Panko; shield 10/−32 under actors. Impact and most recovery visible, final post-30s segment excluded explicitly. |

## boss: every action

| Action | Time / frames | Actor / type | What is visible |
|---|---|---|---|
| A1 | 0.106 s; f2–28 | mochi / basic | Mochi gold split beads hit giant and lower helper; large boss rocks, −50/−38 below bodies with self shield. Helpers remain inside right margin; boss visibly larger without face/HUD overlap. |
| A2 | 0.986 s; f29–55 | soot / basic | Soot pink arc strikes giant, purple curl wraps belly and slight recoil. Single −58 low on boss; helper faces unobstructed. |
| A3 | 1.893 s; f56–82 | clover / basic | Clover green bead into giant; leaf curls and small boss rock. −33 near boss feet and clears; cat sizes and left-facing enemies stable. |
| A4 | 2.771 s; f82–108 | panko / basic | Panko gold bead crosses to giant, gold curls and shallow recoil; −46 below boss. No labels near screen edge or HUD. |
| A5 | 3.672 s; f109–135 | foe-0-yarn-giant / basic | Giant stays left-facing, pink arc reaches Panko; both recoil within seats. Panko shield 8/−32 and boss −16 below bodies; boss remains larger than helpers. |
| A6 | 4.555 s; f136–162 | foe-1-binding-thread / basic | Lower helper sends pink arc over boss to Mochi; one shield 6 under Mochi, helper rocks without clipping right edge. No face overlap. |
| A7 | 5.439 s; f162–189 | foe-2-binding-thread / basic | Upper helper extends pink line left to Mochi; shield 5/−1 below Mochi face, subtle recoil. Helpers distinct and inside frame. |
| A8 | 6.235 s; f178–202 | round status / basic | Round status interval clears helper attack labels and pink curls; no new number or impact. Neutral unit shapes remain separated and readable. |
| A9 | 6.655 s; f199–225 | mochi / basic | Mochi split gold beads, −53/−27 beneath boss/helper, self shield. Giant recoil and helper lean remain framed with faces clear. |
| A10 | 7.555 s; f226–252 | soot / basic | Soot pink bolt and purple belly loop, −59 low on giant. Shallow recoil; no target labels survive into following impact. |
| A11 | 8.439 s; f252–278 | clover / basic | Clover green split bead heals Panko and strikes giant; +19/−33 local below bodies. No movement across another face. |
| A12 | 9.325 s; f279–345 | panko / ultimate | Panko focus/banner then gold shield/fan; ◇180 below caster. Boss and helpers stay planted; bright effect obscures Panko body (Q3) but no unit/HUD overlap. |
| A13 | 11.608 s; f347–413 | foe-0-yarn-giant / ultimate | Giant focus and planted cast, then huge pink twisted arcs engulf the middle. Severe Q3 body wash; local labels remain below Mochi, Panko and boss. f347–413, at 11.608 s. |
| A14 | 13.914 s; f416–442 | foe-1-binding-thread / basic | Lower helper sends pink line to Panko; shield 6 and helper −32 remain low. Small recoil stays inside right margin; no body/face or HUD overlap. |
| A15 | 14.806 s; f443–469 | foe-2-binding-thread / basic | Upper helper sends pink line left; local recoil and low labels, no clipping or face crossing. |
| A16 | 15.585 s; f459–483 | round status / basic | Status interval clears previous pink curls and labels. No new impact; the next focus begins near f483. |
| A17 | 15.993 s; f479–545 | mochi / ultimate | Mochi planted focus and gold lattice/curl field; two shield values per cat and −43 below boss. f479–545; labels stay beneath faces and clear during recovery. Severe Q3 gold body wash, no actor/HUD intersection. |
| A18 | 18.277 s; f547–613 | soot / ultimate | Soot pink bolt becomes broad bright curling field over boss/helpers. f547–613; −30/−54 below boss, −62/−67 by helpers; no edge column, all values clear. Q3 white/pink wash obscures body paint. |
| A19 | 20.560 s; f616–682 | clover / ultimate | Clover planted focus, green curls surround party; +13 below Panko. f616–682; bodies return to stable seats, faces stay separated; weak pose and full-height white-green wash belong to Q3. |
| A20 | 22.855 s; f685–711 | panko / basic | Panko shallow tilt sends gold bead at boss; gold loop and small giant recoil, −46 low below body. f685–711; previous heal absent, no edge clipping or reversed facing. |
| A21 | 23.739 s; f711–738 | foe-0-yarn-giant / basic | Giant launches pink curved bead at Panko; shield 30 below Panko and −32 below boss, both recoil locally. f711–738; oversized boss remains framed and left-facing, previous −46 is gone. |
| A22 | 24.640 s; f738–764 | foe-1-binding-thread / basic | Lower helper sends pale-pink line past boss at Panko. Shield 5/helper −32 appear at feet with small pink curls. f738–764; helper recoil stays inside right edge. |
| A23 | 25.522 s; f765–791 | foe-2-binding-thread / basic | Upper helper sends diagonal pink line to Panko; shield 5/helper −32 low and distinct. f765–791; no face/HUD overlap or outward facing, labels disappear in following status window. |
| A24 | 26.318 s; f781–805 | round status / basic | Status interval shows prior helper curls/labels fading by f791, then idle only through f805. No new hit or number; stable scale and inward orientation. |
| A25 | 26.722 s; f801–827 | mochi / basic | Mochi gold split bead hits boss and lower helper, with local self shield. −52/−24 below targets; small recoil stays framed. f801–827; no previous value survives and faces remain clear. |
| A26 | 27.621 s; f828–854 | soot / basic | Soot pink arc reaches giant; purple belly ring and shallow boss recoil. −58 remains low and clears; f828–854, no size/facing shift or edge column. |
| A27 | 28.507 s; f854–881 | clover / basic | Clover green bead at giant; leaf curls, small rock-back, −31 under boss. f854–881; old −58 gone, no face/HUD intersection. |
| A28 | 29.411 s; f881–899 (truncated) | panko / ultimate | Panko focus begins near f881; outline and short name banner remain below caster, others dim. Only focus through f899 is filmed; cast, impact and recovery lie after 30 s and were not reviewed. |

## Defect checklist by owner

| Question | Defect? | Owner | Frame/evidence |
|---|---|---|---|
| Camera moved beyond allowed impact shake? | No observed new defect | Q1 | All films; static root and earlier Q1 schedule; Q1 video gate remains OPEN. |
| Unit faces away? | No | Q2 | wave3 A7 ram; all 100 facing states. |
| Unit sizes unequal beyond gate? | No | Q2 | All 5,398 samples; independent 66 pixel samples, table above. |
| Unit covers another face / HUD? | No observed opaque pixels | Q2 | Boss candidate frames qualified above; whole-film HUD check zero. |
| Field/HUD wastes excessive height? | No | Q2 | Full viewport; transparent HUD 12.00% / 10.67%. |
| Numbers clutter, persist or cover faces? | No | Q2 | 154/154 numeric events; wave1 A19, wave3 A23, boss A17–19; max 2, <=682.61 ms conservative bound. |
| Effect is still rings/blobs/fog? | Yes | Q3 | wave1 A19–21; wave3 A23–25; boss A13, A17–19. |
| Bodies/faces washed out? | Yes | Q3 | Boss A17 f511–530 and A18 f581–599; gold and pink white cores hide paint. |
| Pasted cut-out motion / weak key poses? | Yes | Q3 | Boss A20–27 shallow tilts; Soot focus/cast mostly planted. |
| Name/banner text overflow? | No visible overflow; names still weak | Q4 | Boss A17–19 banners fit, naming pass still pending. |
| Other text/UI clarity defects? | Pending wider UI review | Q6/Q7 | Battle overlays fit sampled frames; this is not an all-screen UI pass. |
| Sound without an on-screen cause? | Not yet classified per cue | Q5 | Captured objective mix -15.03 to -14.79 LUFS, 9–10 simultaneous voices; no listening claim. |

## Ten-line critique against the recorded reference study

1. The enlarged party now reads at the frame scale requested; final cat minima are 191/239 px (Q2-alpha and the independent pixel experiment).
2. The ram's muzzle now points into combat through all four required states; that removes the visible F4 defect.
3. Local number groups remain attached to their targets; the earlier edge-column problem is absent in all three films (Q2-paper, number identity experiment).
4. The transparent HUD leaves the floor visible and keeps every body separate from controls; the full-stage composition is stronger.
5. Reference B01 separates a red-white crescent, contact wedge and directional sparks; our basics still collapse into a bead plus a circular wrap (CRAFT/REFERENCE-BREAKDOWN.md, B01).
6. Reference B02 uses a diagonal blade and recoil direction; our guard and helper attacks retain only shallow tilts, visible in wave1 A5 and boss A21–23 (same study, B02).
7. Mochi's giant gold field still obscures the party and centre; scale correction has not solved action readability (boss A17, Q3 washout requirement).
8. Soot's pink field remains visually similar to the other circular effects; its distinct silhouette and authored cast need the Q3 drills (boss A18, CRAFT/PIPELINE.md).
9. The reference study's useful lesson is pose/travel/contact/fallout separation; its walk-ups, replacement scenes and whiteouts remain rejected by the current work order (reference study conclusion).
10. Larger bodies expose the weak secondary motion more clearly; Q3 must author visible wind-up/contact/settle poses and restrained light, not claim this Q2 size repair makes the animation finished (LEARN/Q2.md scope; Q3 D6–D8).
