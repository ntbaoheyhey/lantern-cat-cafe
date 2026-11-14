"""Author the QR quality contract. New thresholds implement F13; no Q0-Q9 limit is relaxed."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2];craft=root/'reports/v3-feel/CRAFT'
rows=[]
def add(group,number,metric,op,limit,check,reference,method):
 rows.append(dict(id=group+str(number).zfill(2),group={'B':'basic','U':'ultimate','C':'character'}[group],metric=metric,op=op,limit=limit,check=check,reference=reference,method=method))
bref='B01–B08: preparation 2–3 reference samples, contact 2–3, recovery 1–4 where visible; 100 ms uncertainty, x2/x3 playback.'
uref='U01–U08: focus 1–7 reference samples, preparation 2–5, contact 2–5, recovery 1–4 where visible; 100 ms uncertainty, x2/x3.'
cref='B02 n6–10, B03 n7/n11/n14, B08 n7–9; reference bodies partly occluded, exact motion amplitudes not recoverable.'
def b(n,m,op,l,c,method='pixels+clock'):add('B',n,m,op,l,c,bref,method)
def u(n,m,op,l,c,method='pixels+clock'):add('U',n,m,op,l,c,uref,method)
def c(n,m,op,l,ch,method='manual frames'):add('C',n,m,op,l,ch,cref,method)
b(1,'durationMs','near',[800,33],'Basic ends at 800 ms +/- one captured frame; no extra lead-in.')
b(2,'impactMs','near',[350,33],'First actual contact at 350 ms +/-33 ms, not only a scheduled marker.')
b(3,'anticipationFrames','gte',4,'At least four 30 fps frames show a silhouette-changing wind-up before release.')
b(4,'anticipationVisible','eq',True,'Hand/weapon and torso visibly separate wind-up from rest; frame pair named.','manual frames')
b(5,'visibleLayers','gte',3,'At least three separately visible layers: preparation, travelling strike, impact/decal.','isolated layer masks + manual')
b(6,'distinctShapes','gte',3,'At least three distinct contours; duplicated circles/glows count as one.','manual frames')
b(7,'radialSymmetry','lt',.8,'Peak union effect mask rotational-symmetry IoU <0.8; shape also reads directionally.','isolated masks')
b(8,'targetLatencyMs','lte',33,'Target recoil or support response begins within one 30 fps frame of actual contact.')
b(9,'hitstopMs','between',[60,90],'Attacker and recipient poses hold 60–90 ms at impact inside the fixed duration.')
b(10,'flashFrames','between',[1,2],'A local target/contact flash or authored smear lasts 1–2 frames, without a viewport whiteout.')
b(11,'soundOffsetMs','lte',33,'Absolute weapon transient-to-observed-contact error <=33 ms; inspect waveform, not just cue schedule.','waveform+frames')
b(12,'soundHeardAndMatched','eq',True,'Listening confirms the heard weapon sound belongs to this action.','listen + frame reference')
b(13,'actorDisplacementWidth','lte',.05,'Any melee lunge stays <=5% viewport width; ranged root stays planted.','rendered body mask')
b(14,'slotReturnErrorPx','lte',1,'Actor returns to its original slot within one pixel by 800 ms.')
b(15,'faceOcclusion','eq',0,'No effect, number, name or neighbouring body hides a face.','face masks + manual')
b(16,'unintendedPops','eq',0,'No unintended one-frame layer pop; entry/exit ease over >=2 frames except the labelled contact transient.','adjacent frame review')
b(17,'directionReadable','eq',True,'Source-to-target travel reads at 1280x720 and in the scaled contact strip.','manual frames')
b(18,'cameraChange','eq',0,'Background registration and stage-root transform remain constant; no basic shake.')
u(1,'durationMs','near',[2200,33],'Ultimate ends at 2200 ms +/-33 ms; its total is the same for every unit.')
u(2,'focusEndMs','near',[600,33],'In-field focus ends at 600 ms +/-33 ms.')
u(3,'impactMs','near',[1100,33],'Observed contact at 1100 ms +/-33 ms; cast begins at 600 ms.')
u(4,'focusBrightness','near',[.45,.001],'Non-caster brightness is 45%; caster and nearby name remain visible.','render buffer + scene state')
u(5,'focusComponents','eq',True,'Dim field, caster outline/rim and local name banner all visible.','manual frames')
u(6,'castPoseChange','eq',True,'Wind-up and release are distinct weapon/torso poses; no walk-up.','manual frames')
u(7,'visibleLayers','gte',5,'Five visible roles: focus aura, cast shape, travel/area body, impact, residue.','isolated layer masks + manual')
u(8,'distinctShapes','gte',3,'At least three non-radial contour families are visible in the composition.','manual frames')
u(9,'peakArea','between',[.25,.60],'Peak effect-alpha union covers 25–60% of viewport; exclude dim/HUD/banner/grade.','isolated masks')
u(10,'radialSymmetry','lt',.8,'Peak mask symmetry score <0.8; no radial-only composition.','isolated masks')
u(11,'signatureReadable','eq',True,'Main silhouette reads as a strong, distinctive themed ultimate; identify it in words.','manual frames')
u(12,'directionReadable','eq',True,'Energy originates at caster and reaches the affected group; no unrelated ambient flash.','manual frames')
u(13,'targetLatencyMs','lte',33,'Damage target recoils, or support recipient responds, within one frame of contact.')
u(14,'hitstopMs','between',[60,90],'Contact pose hold is 60–90 ms inside the 2200 ms envelope.')
u(15,'flashFrames','between',[1,2],'Local contact highlight lasts 1–2 frames; no full-frame whiteout.')
u(16,'faceOcclusion','eq',0,'Caster and recipient faces remain readable through the effect.','face masks + manual')
u(17,'soundOffsetMs','lte',33,'Measured impact transient is within 33 ms of observed impact.','waveform+frames')
u(18,'soundHeardAndMatched','eq',True,'Callout/cast/contact/tail heard and mapped to their displayed causes.','listen + frame reference')
u(19,'saturationVsReference','gte',.8,'Mean effect saturation >=80% of estimated reference median; retain estimation caveat.','isolated masks')
u(20,'luminanceVsReference','gte',.8,'p95 linear luminance >=80% of estimated reference median; retain estimation caveat.','isolated masks')
u(21,'unintendedPops','eq',0,'Layers ease in/out over >=2 frames except the explicit 1–2 frame contact accent.','adjacent frame review')
u(22,'fieldReplacementFrames','eq',0,'No cinematic plate, scene cut, camera scale/pan or off-slot approach.')
u(23,'bannerOverflow','eq',0,'Name fits its box and avoids faces at 1280, 1440 and 390 widths.','DOM + frames')
u(24,'overlapMs','eq',0,'No next action begins before this ultimate ends; no overlapping ultimates.')
c(1,'contactShadowFraction','eq',1,'Soft contact shadow visibly anchors every shown unit, without detaching at idle.','rendered shadow mask + manual')
c(2,'idleAmplitudeFraction','gte',.015,'Idle body/attachment motion amplitude >=1.5% body height, measured on rendered pixels.','rendered body mask')
c(3,'idlePhaseDistinct','eq',True,'Separate actors have phase offsets; the squad does not breathe in lockstep.')
c(4,'secondaryMotion','eq',True,'Weapon/tail/ears lag the torso and settle; not just whole-PNG translation.')
c(5,'plantedFeet','eq',True,'Idle/anticipation keeps feet at the floor; any approved lunge returns to that anchor.')
c(6,'hitResponse','eq',True,'Hit shows directional recoil + squash + local flash, with a clear settle.')
c(7,'deathDissolve','eq',True,'Death fades with visible separated dissolve particles; no single-frame disappearance.')
c(8,'sceneGrade','eq',True,'Painted body lighting belongs to the field; contours retain their original hue/value structure.')
c(9,'actionRim','eq',True,'Local effect-coloured rim affects the caster/recipient at the action, not an unbounded unit glow.')
c(10,'facingFraction','eq',1,'Cats face right and enemies left in idle/attack/hit/death; face/weapon-side table verified.')
c(11,'jointGaps','eq',0,'No detached joint, seam hole, inverted limb or double-eye artefact in any key pose.')
c(12,'faceOcclusion','eq',0,'No other unit, HUD element or number covers any face during the sampled states.')
(craft/'quality-bar.json').write_text(json.dumps({'version':1,'authority':'User F13; new quality criteria supplement, never weaken Q1-Q3. Changes require INBOX user line.','referenceTimingPrecisionMs':100,'captureFps':30,'criteria':rows},indent=2)+'\n')
text=['# Quality bar: observable acceptance contract','','Version 1. No row is optional. A missing measurement/listening/frame observation remains OPEN. A failed manual row defeats numeric PASS. Every verdict must name a real clip and frame index/time, and state what was observed. Criteria are also machine-readable in `quality-bar.json`; automated rows are installed in `check-feel.mjs` for QR and subsequent animation items.','','Reference timing ranges below are wall-clock observations at x2/x3 with 100 ms uncertainty. Our precise targets come from F2/F3/F11 and Q1–Q3. The reference cannot prove sub-frame timing, exact hit-stop or uncontaminated alpha. New craft choices (minimum four anticipation frames, three distinct contours, two-frame fades, one-pixel slot return) are conservative pilot design requirements, not claims measured from the videos.','','Measure timing and masks from the same captured rendering. A telemetry promise alone cannot pass a pixel/visible criterion. Sound waveform alignment cannot pass a listening row. Intentional one/two-frame contact accents are labelled; all other layers have visible eased entry/exit. No silhouette metric replaces manual judgement.','']
for group,title in [('basic','Basic attack — 18 checks'),('ultimate','Ultimate — 24 checks'),('character','Character idle / hit / death — 12 checks')]:
 text += ['## '+title,'','Reference: '+{'basic':bref,'ultimate':uref,'character':cref}[group],'','| ID | Pass requirement | Evidence method |','|---|---|---|']
 for row in rows:
  if row['group']==group:text += [f"| {row['id']} | {row['check']} | {row['method']} |"]
 text += ['']
text += ['## Per-row review record','','`id`, `state: PASS/FAIL/OPEN`, measured value (if available), artifact path/hash, frame/time, observed reason. Include all 54 rows in each animation review. Multi-unit acceptance additionally checks the unchanged Q1–Q3 all-unit timing/scale/78-pair IoU/FPS gates. The one-cat pilot proves the method, not those roster-wide facts.','','The production section-3 review still requires all three fixtures, all action sheets, private side-by-side reference comparisons, a 60 s audio mix and an honest critique. The pilot uses the same capture and inspection method, plus an isolated sequence for idle/hit/death. Healing response rows must describe the visible support response, rather than inventing a damage recoil.']
(craft/'QUALITY-BAR.md').write_text('\n'.join(text)+'\n')
print(json.dumps({'basicChecks':18,'ultimateChecks':24,'characterChecks':12,'total':len(rows)}))
