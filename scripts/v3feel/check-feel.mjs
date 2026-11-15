/** V3-CRAFT acceptance contract; see REQUEST-CRAFT.txt and LEARN/C0.md.
 * Missing measurements/artifacts never pass. Owned gates retain their thresholds. */
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {scheduleKeys,craftOwner,completedItems,selectedItems,learningReceipt,craftTimeReceipt} from './craft-policy.mjs';
export const root=resolve(import.meta.dirname,'../..');
export const fixtures=Object.freeze(['wave1','wave3','boss']);
const definitions=[];
function add(item,key,op,limit,requirement,scope='all'){
 definitions.push(Object.freeze({id:`${item}.${key}`,item,key,op,limit,requirement,scope}));
}
function rows(item,entries,scope='all'){for(const [key,op,limit,requirement,applicable=scope] of entries)add(item,key,op,limit,requirement,applicable);}
rows('C0',[
 ['policyTests','eq',true,'each changed policy has a fake PASS and fake FAIL test'],
 ['recorderTrialResolved','eq',true,'one isolated recorder trial succeeds, or draft helpers are reverted and logged'],
 ['evidenceBudget','eq',true,'<=300 MB tracked FEEL evidence; <=12 sheets and <=3 fixture films per item; raw/WAV local only'],
 ['adoptionRecorded','eq',true,'CRAFT PROMPT ADOPTED; L1-L5 and explicit superseded policies recorded'],
]);
rows('Q0',[
 ['branchPushed','eq',true,'branch pushed'],
 ['checkerTestsPass','eq',true,'checker runs and its unit tests pass'],
 ['baselineDefects','gte',8,'REVIEW/Q0/REVIEW.md lists at least one frame-referenced defect for each of F1-F7 and F10'],
 ['baselineFeedbackCoverage','eq',true,'quote F1-F12 against frames'],
]);
rows('QR',[
 ['principlesDocument','eq',true,'CRAFT/PRINCIPLES.md present and non-empty; the 12 principles applied to 2D game combat'],
 ['referenceDocument','eq',true,'CRAFT/REFERENCE-BREAKDOWN.md present and non-empty'],
 ['referenceBasics','eq',8,'8 basics + 8 ultimates at 10 fps from the two OMG3Q videos'],
 ['referenceUltimates','eq',8,'8 basics + 8 ultimates at 10 fps from the two OMG3Q videos'],
 ['referenceVideos','eq',2,'from the two OMG3Q videos'],
 ['referenceFps','eq',10,'8 basics + 8 ultimates at 10 fps'],
 ['frameTimingCharts','eq',16,'16 actions with frame timing charts: anticipation / contact / follow-through / recovery in frames'],
 ['referenceLayersMeasured','eq',true,'layers per action, peak effect area % of viewport, effect duration, directional streak count in REF-EFFECTS.json'],
 ['pipelineDocument','eq',true,'CRAFT/PIPELINE.md present and non-empty: inputs, tools, output format, size budget, time per step'],
 ['toolsDocument','eq',true,'CRAFT/TOOLS.md present and non-empty; recommendation per step'],
 ['toolsAssessed','gte',8,'>= 8 tools assessed; licence, install size, Apple Silicon, setup time, risk'],
 ['sourcesCited','gte',12,'>= 12 cited sources'],
 ['qualityDocument','eq',true,'CRAFT/QUALITY-BAR.md present and non-empty'],
 ['basicChecks','gte',15,'>= 15 basic-attack checks'],
 ['ultimateChecks','gte',20,'>= 20 ultimate checks'],
 ['characterChecks','gte',10,'>= 10 character checks'],
 ['pilotQualityFraction','eq',1,'pilot REVIEW passes every QUALITY-BAR row with frame references'],
 ['pilotFrameReferences','eq',true,'pilot REVIEW passes every QUALITY-BAR row with frame references'],
 ['pilotStepTimes','eq',true,'time spent per step logged; measured time per step sets plan for other 12 ultimates'],
 ['pilotsAttempted','between',[1,3],'max 3 pilots, then write blocker and best result in STATUS-VI.md and continue with best method'],
 ['vietnameseSummaryLines','eq',10,'STATUS-VI.md has a 10-line Vietnamese summary of method and any tool/model proposals'],
]);
rows('Q1',[
 ['staticCameraFraction','eq',1,'camera transform (scale + translation of the battle stage root) constant for 100% of frames in the 3 fixtures except ultimate-impact shake <= 4 px / <= 120 ms'],
 ['shakePx','lte',4,'screen shake <= 4 px'],['shakeMs','lte',120,'<= 120 ms on ultimate impact only'],
 ['shakeOutsideUltimate','eq',0,'on ultimate impact only'],['reducedMotionShake','eq',0,'off in reduced-motion'],
 ['basicDurationMs','near',[800,33],'basic attack: total 0.80 s'],['basicAnticipationEndMs','near',[250,33],'anticipation 0.00-0.25 s'],
 ['basicImpactMs','near',[350,33],'impact frame at 0.35 s; recovery to 0.80 s'],
 ['basicDurationSpreadMs','lte',33,'basic durations: max-min across all units <= 1 frame (33 ms)'],
 ['basicImpactSpreadMs','lte',33,'impact offset identical +/- 1 frame'],
 ['ultimateDurationMs','near',[2200,33],'ultimate: total 2.20 s'],
 ['focusEndMs','near',[600,33],'focus (dim + spotlight + name banner) 0.00-0.60 s'],
 ['ultimateImpactMs','near',[1100,33],'cast 0.60-1.10 s; impact frame at 1.10 s; aftermath to 2.20 s'],
 ['ultimateDurationSpreadMs','lte',33,'ultimate durations same rule'],['ultimateImpactSpreadMs','lte',33,'ultimate durations same rule'],
 ['actionOverlapMs','eq',0,'next action starts no earlier than the previous action\'s end; no overlaps of two ultimates'],
 ['videoTimingErrorMs','lte',33,'scheduled events appear in the video within +/-33 ms'],
 ['videoTimingConfirmedFraction','eq',1,'every in-range scheduled event confirmed against a video frame'],
 ['activeEvents','eq',0,'0 active-skill events in the presentation log'],
 ['activeUiEntries','eq',0,'remove active-skill buttons/icons/cooldown rings from the battle HUD and from team/hero screens'],
 ['actorDisplacementWidth','lte',.05,'0 actor displacement > 5% width'],
 ['rangedDisplacementWidth','eq',0,'ranged/caster basics stay in place'],
 ['lungeReturnsInBasic','eq',true,'out and back inside the basic attack duration'],
 ['plateFrames','eq',0,'ultimate plates shown in battle = 0'],
 ['focusBrightness','near',[.45,.001],'dim others to 45% brightness'],
 ['focusComponents','eq',true,'caster outline + rim light, banner'],
 ['speedScaling','eq',true,'x2/x3 scale them uniformly'],
 ['parity','eq',true,'parity PASS on new baseline'],
 ['fixtureWon','eq',true,'3 fixtures still won'],
 ['durationRatio','between',[.8,1.2],'battle length within +/- 20% of Q0'],
 ['economyE3E5','eq',true,'re-run the B economy checker E3-E5 afterwards, they must still PASS'],
], 'fixtures');
rows('Q2',[
 ['catHeightRatio','lte',1.05,'cat opaque heights max/min <= 1.05'],
 ['enemyHeightRatio','lte',1.05,'ordinary enemy max/min <= 1.05'],
 ['catEnemyHeightRatio','between',[.95,1.10],'cat vs ordinary-enemy height ratio 0.95-1.10'],
 ['bossHeightRatio','between',[1.5,1.7],'boss 1.5-1.7x',Object.freeze(['boss'])],
 ['eliteHeightRatio','lte',1.15,'elites <= 1.15x',Object.freeze(['wave3'])],
 ['facingFraction','eq',1,'facing correct 100% of sampled frames (all units, all states)'],
 ['facingTableComplete','eq',true,'test that renders each unit and checks the face/weapon side (manual-verified table in REVIEW)'],
 ['stageAreaFraction','gte',.86,'stage area >= 86% of viewport'],
 ['hudHeightFraction','lte',.14,'HUD bottom band <= 14% of viewport height'],
 ['formationWidthFraction','gte',.8,'unit bounding boxes span >= 80% of width'],
 ['catHeightFraction','gte',.26,'cat height >= 0.26 vh'],
 ['faceOcclusion','eq',0,'face occlusion 0'],
 ['unitHudOverlap','eq',0,'units never overlap HUD or each other\'s faces'],
 ['numbersPerHit','eq',1,'one number per hit'],['numbersPerTarget','lte',3,'stacked max 3 per target'],
 ['numberLifetimeMs','lte',700,'fade within 0.7 s'],['numberFaceOverlap','eq',0,'no number covers a face'],
 ['numbersOlderThan700Ms','eq',0,'0 visible numbers older than 0.7 s'],
 ['previousNumbersAtImpact','eq',0,'numbers from the previous action gone before next impact'],
 ['numberEdgeColumns','eq',0,'numbers never form columns at the screen edge'],
], 'fixtures');
rows('Q3',[
 ['referenceBasics','gte',8,'pick 8 basic attacks and 8 ultimates'],['referenceUltimates','gte',8,'pick 8 basic attacks and 8 ultimates'],
 ['referenceStudyFields','eq',true,'anticipation pose, number of effect layers, shapes, colour/brightness curve over time, hit-stop, target reaction, how long, how the sound lines up'],
 ['referenceMeasuredFields','eq',true,'Measure: layers per action, peak effect area (% of viewport), effect duration, directional streak count'],
 ['basicLayers','gte',3,'every basic has >= 3 visible effect layers'],['ultimateLayers','gte',5,'every ultimate >= 5 (from the presentation log + mask analysis)'],
 ['radialOnlyEffects','eq',0,'0 effects classified "radial-only"'],['radialSymmetry','lt',.8,'symmetry score < 0.8 for every action\'s peak frame'],
 ['ultimateArea','between',[.25,.60],'ultimate peak area 25-60%'],
 ['ultimateSilhouettes','eq',13,'13/13 ultimates pairwise silhouette IoU <= 0.6 at peak'],
 ['silhouettePairCount','eq',78,'13/13 ultimates pairwise silhouette IoU <= 0.6 at peak'],
 ['silhouetteIoU','lte',.6,'13/13 ultimates pairwise silhouette IoU <= 0.6 at peak'],
 ['hitstopMs','between',[60,90],'hit-stop 60-90 ms on impact'],['hitstopFraction','eq',1,'hit-stop present on 100% of impacts'],
 ['targetFlashFrames','between',[1,2],'target flinch/knockback + white-flash tint 1-2 frames'],
 ['contactShadowFraction','eq',1,'contact shadows on 100% of units'],
 ['idleAmplitudeFraction','gte',.015,'idle motion amplitude >= 1.5% of unit height on 100% of units'],
 ['saturationVsReference','gte',.8,'mean effect saturation and peak luminance >= 80% of the reference median (REF-EFFECTS.json)'],
 ['luminanceVsReference','gte',.8,'mean effect saturation and peak luminance >= 80% of the reference median (REF-EFFECTS.json)'],
 ['fpsHigh','gte',50,'FPS >= 50 on High with 10 units'],['fpsUnits','eq',10,'FPS >= 50 on High with 10 units'],
 ['parity','eq',true,'parity PASS'],['ultimateVerdicts','eq',13,'13 rows, each "reads as a strong, distinct ultimate: yes" with frame refs'],
 ['ultimateFilmstrips','eq',13,'Commit 13 per-ultimate film strips + 8 basic film strips'],['basicFilmstrips','eq',8,'Commit 13 per-ultimate film strips + 8 basic film strips'],
 ['sceneIntegration','eq',true,'soft contact shadow, scene-matched colour grade, rim light from the effect colour, secondary motion'],
 ['reactionAndDeath','eq',true,'Hit reactions: recoil + squash + flash; death: fade with dissolve particles, not a pop'],
 ['rungOne','eq',0,'no Canvas2D rings/orbs/fog or static fade-in pictures as main effect shapes; code scan + log'],
 ['bodyContrastRetention','gte',.6,'every face/body keeps >=60% pre-effect luminance contrast at each ultimate peak'],
 ['outsideBodyFogArea','lte',.15,'full-field tint/fog area outside effect body <=15%'],
 ['poseSilhouetteChange','gte',.08,'rest-to-wind-up body-box silhouette change >=8%'],
 ['craftTime','eq',true,'real timed authoring >=60%; measurement <=20%; per-asset floors and two revise rounds'],
]);
rows('Q3.A',[
 ['toolkitTopics','eq',8,'TOOLKIT.md covers topics a-h'],['newSources','gte',12,'>=12 new toolkit sources'],
 ['drillsPassed','eq',8,'D1-D8 each pass their frame-referenced QUALITY-BAR rows'],
 ['reviseRounds','gte',2,'at least two review-revise rounds per drill'],
 ['drillSeconds','eq',2,'each drill recorded for 2 s'],['drillFps','eq',30,'30 fps drill video'],
 ['craftTime','eq',true,'actual authoring and measurement time shares'],
]);
rows('Q3.B',[
 ['pilotQualityFraction','eq',1,'Soot basic and ultimate pass every QUALITY-BAR row with frame references'],
 ['deadCastFrames','eq',0,'visible build throughout cast; no uncurved one-frame layer pop'],
 ['sameScaleComparison','eq',true,'same-scale private master comparison'],
 ['craftTime','eq',true,'actual authoring floors and two revise rounds'],
]);
rows('Q4',[
 ['changedNames','eq',14,'14/14 names changed and <= 3 words'],['nameWordCount','between',[2,3],'evocative, 2-3 words, fitting the cat\'s theme and element'],
 ['candidatesPerName','eq',3,'Write 3 candidates each'],['bannerOverflow','eq',0,'banner text fits at 1280x720 and 1440x900'],
 ['calloutsRegenerated','eq',14,'cat/boss callouts regenerated'],['calloutAtFocus','eq',true,'callout plays at focus start'],
 ['enemyNamesCoverage','eq',1,'all fixture enemy ultimates also renamed and callouts regenerated'],
 ['bannersReviewed','eq',14,'video review lists every banner'],['voiceLoudnessGates','eq',true,'keep loudness/true-peak gates'],
]);
rows('Q5',[
 ['sfxSyncErrorMs','lte',33,'every SFX start within +/- 33 ms of its visual event'],['sfxSyncFraction','eq',1,'for 100% of events in 3 fixtures'],
 ['optionalBarks','eq',0,'0 battle barks besides ultimate callouts and capped hurt/KO'],['battleUiTicks','eq',0,'Remove optional battle chatter/barks and battle UI ticks'],
 ['hurtKoIntervalMs','gte',10000,'a short hurt/KO vocal at most once per unit per 10 s'],
 ['ultimateCalloutLines','eq',1,'only the ultimate callout (one line, at focus start)'],
 ['weaponVariants','gte',4,'4+ variants each'],['pitchVariation','lte',.03,'pitch +/- 3%'],
 ['ultimateSoundParts','eq',3,'one cast riser + one impact + one tail per ultimate'],
 ['integratedLufs','between',[-21,-19],'battle integrated loudness -20 LUFS +/- 1'],['truePeakDbTP','lte',-1,'true peak <= -1 dBTP'],
 ['duckDb','between',[4,6],'music ducks 4-6 dB under ultimates only'],['nonUltimateDucks','eq',0,'under ultimates only'],
 ['simultaneousVoices','lte',4,'max 4 simultaneous sound voices at any 100 ms window'],
 ['unmappedSounds','eq',0,'no sound without an on-screen cause'],['menuHomeForgeGates','eq',true,'menu/home/forge audio gates from B still PASS'],
 ['onsetErrorMs','lte',33,'detected waveform onsets within +/-33 ms of logged visual events'],
 ['onsetCoverage','eq',1,'all required event onsets verified on the rendered mix'],
 ['unmappedOnsets','eq',0,'0 detected onsets without an on-screen event'],
 ['spectralLabelFraction','eq',1,'each cue spectral label matches intended whoosh/impact/riser/voice type'],
 ['audioMixSeconds','gte',60,'60 s unmodified battle mix'],
 ['audioMetricsComplete','eq',true,'LUFS, true peak and cue-log simultaneous voices per 100 ms'],
 ['audioMappingComplete','eq',true,'objective onset/cue/frame mapping complete; human listening is not a machine gate'],
 ['reviewMp3Seconds','gte',60,'new 60 s BATTLE-SOUND.mp3'],['desktopAudioCopy','eq',true,'to reports/v3-feel/ and the Desktop review folder'],
], 'fixtures');
rows('Q6',[
 ['screenWidthCases','eq',108,'all 54 screens x 2 desktop widths (1280, 1440)'],
 ['textOverflow','eq',0,'0 elements whose text scrollWidth/scrollHeight exceeds its box or that overlap another text box'],
 ['textOverlap','eq',0,'0 elements whose text scrollWidth/scrollHeight exceeds its box or that overlap another text box'],
 ['missingButtonLabels','eq',0,'0 icon-only buttons without accessible name AND visible/hover label'],
 ['labelLatencyMs','lte',300,'label that appears on hover/focus within 300 ms and on first visit'],
 ['unlabelledSecondaryIcons','lte',2,'<= 2 secondary icon buttons without labels per screen'],
 ['primaryActionsPerScreen','eq',1,'one clear primary action per screen'],
 ['screensReviewed','eq',54,'a "where do I click" review per screen in REVIEW/Q6/REVIEW.md (screenshot + the one primary action named)'],
 ['knownDefectsRemaining','eq',0,'Fuji/wallet panel "Retry" overlaps the title text; empty decorative speech bubbles; unlabelled 0-value tiles; battle-prep empty bar'],
 ['bU3Gates','eq',true,'B U3 desktop gates still PASS'],
]);
rows('Q7',[
 ['screensMeasured','eq',8,'Home, team, battle prep, forge, bag, gacha, season, wallet'],
 ['contentArea','gte',.85,'content bounding area >= 85% of viewport'],['emptyBandHeight','lte',.1,'no empty band taller than 10% of height'],
 ['overflow','eq',0,'0 overflow (Q6 test)'],['beforeAfterSheets','eq',8,'before/after sheets'],
]);
rows('Q8',[
 ['smokeCases','eq',4,'smoke flow passes live and static at 1280 and 1440'],['consoleErrors','eq',0,'0 console errors'],
 ['desktopFiles','eq',true,'files on the Desktop'],['referenceLine','eq',true,'REFERENCE: demo built <UTC> from codex/v3-feel-2026-11-14 @ <commit>; live http://localhost:5994 ; static docs/cardrpg-v3-demo/index.html'],
 ['reviewVideoSeconds','gte',90,'Record a 90 s review video (1280x720, 30 fps, real mix: >= 55 s battle incl. >= 3 ultimates and the boss)'],
 ['battleSeconds','gte',55,'>= 55 s battle'],['ultimates','gte',3,'>= 3 ultimates and the boss'],['bossIncluded','eq',true,'and the boss'],
 ['feedbackStatusLines','gte',14,'one line with numbers per F1-F14, plus F15 learning status'],
]);
rows('Q9',[
 ['openHigherItems','eq',0,'any item above left "open", with a new method'],['inboxHandled','eq',true,'user notes in reports/v3-feel/INBOX.md'],
 ['posesPerUnit','gte',2,'per-unit unique idle and attack poses (2+ key poses per unit through the rig)'],
 ['audioMemoryMB','lt',60,'audio memory < 60 MB'],['oldPolishNoBattleNoise','eq',true,'only where they do not add battle noise'],['economyE3','eq',true,'E6 only if E3 still passes'],
]);
// Shared review gates apply to every visual/audio item; Q0 intentionally documents defects.
for(const item of ['Q0','Q1','Q2','Q3','Q4','Q5','Q9']){
 rows(item,[
  ['reviewFixtures','eq',3,'Record the 3 fixtures (wave1, wave3, boss) at x1, 1280x720, 30 fps, WITH audio, 30 s each'],
  ['videoSeconds','near',[30,1/30],'30 s each'],['videoFps','eq',30,'30 fps'],['videoWidth','eq',1280,'1280x720'],['videoHeight','eq',720,'1280x720'],
  ['videoBytes','lte',8000000,'<= 8 MB each'],['videoHasAudio','eq',true,'WITH audio'],
  ['actionWindowFps','eq',10,'extract every action window at 10 fps'],['actionWindowBeforeMs','gte',300,'0.3 s before to 0.5 s after each impact'],['actionWindowAfterMs','gte',500,'0.3 s before to 0.5 s after each impact'],
  ['sheetWidth','lte',1280,'contact sheets (max 1280 px wide)'],['sheetsViewedFraction','eq',1,'look at every sheet (not a sample)'],
  ['actionReviewFraction','eq',1,'for each fixture, a table of every action'],['frameReferences','eq',true,'A review without frame references scores 0'],
  ['critiqueLines','gte',10,'Then a 10-line honest critique vs the reference'],
 ]);
 if(['Q3','Q9'].includes(item))add(item,'referenceComparison','eq',true,'effect/pose same-scale private reference comparison');
 if(item!=='Q0')add(item,'videoDefects','eq',0,'any current-item or completed-item defect fails; future-item defects stay in the queue');
}
for(const item of ['C0','Q0','Q1','Q2','Q3.A','Q3.B','Q3','Q4','Q5','Q6','Q7','Q8','Q9','R1','R2','R3']){
 if(!['Q0','R3'].includes(item))add(item,'learn','eq',true,'nonempty LEARN file; >=6 sources, >=1 formal/paper, >=3 internet docs, recorded own experiment; build commit cites LEARN');
 for(const key of ['typecheck','unitTests','parityRegression'])add(item,key,'eq',true,'per-item typecheck, touched-package unit tests, combat parity');
 if(['Q2','Q3','Q5','R2','R3'].includes(item))for(const key of ['browserSuite','aLaneGates','bLaneGates'])add(item,key,'eq',true,'full 435-case browser/A/B regression at Q2, Q3, Q5, R2 and FREEZE');
}
rows('GLOBAL',[
 ['browserCases','gte',435,'browser suite (the 435-case suite; any case that tested removed actives/zoom/plates is UPDATED ... never deleted silently)'],
 ['changedCasesLogged','eq',true,'list each changed case in DECISIONS-FEEL.md'],['supersededGatesLogged','eq',true,'marked "SUPERSEDED by user decision F2/F6" in DECISIONS-FEEL.md'],
 ['seasonLengthWeeks','eq',13,'SEASON_LENGTH 13 weeks'],['baseRoutineCap','eq',12,'BASE_ROUTINE_CAP 12 immutable'],
 ['newAssetProvenance','eq',true,'provenance for every new asset (tool + prompt + date)'],['referenceAssetsShipped','eq',0,'Reference frames/audio: decode only to measure ... never ship them'],
 ['handoffLines','lte',40,'HANDOFF-FEEL.md (max 40 lines)'],['statusViLines','lte',30,'STATUS-VI.md in Vietnamese (max 30 lines)'],
 ['backgroundPausedForPerf','eq',true,'pause background jobs ... during FPS/audio-CPU measurements'],
]);
rows('R1',[['checkpointDone','eq',true,'at/after 16 Nov 12:00 UTC run R1 once']]);
rows('R2',[['finalDemoDone','eq',true,'at/after 18 Nov 12:00 UTC run R2 once'],['deployGuideUpdated','eq',true,'update reports/v3-shell/USER-DEPLOY-VI.md for this branch']]);
rows('R3',[['freezeDone','eq',true,'at/after 19 Nov 12:00 UTC run FREEZE'],['draftPrCount','eq',1,'Open ONE draft PR codex/v3-feel-2026-11-14 -> main (do not merge)'],['finalReport','eq',true,'Final REPORT-FEEL.md (English) and STATUS-VI.md']]);
// Keep all 54 researched rows, owned by the item that can actually fix them.
export const craftCriteria=Object.freeze(JSON.parse(readFileSync(resolve(root,'reports/v3-feel/CRAFT/quality-bar.json'),'utf8')).criteria);
for(const criterion of craftCriteria){
 for(const item of ['QR',craftOwner(criterion.id)])add(item,`craft.${criterion.id}`,criterion.op,criterion.limit,`${criterion.check} Evidence: ${criterion.method}.`);
}
export const gates=Object.freeze(definitions);
export function numeric(value,op,limit){
 if(op==='eq')return value===limit;
 if(typeof value!=='number'||!Number.isFinite(value))return false;
 if(op==='gte')return value>=limit;if(op==='lte')return value<=limit;if(op==='lt')return value<limit;
 if(op==='between')return value>=limit[0]&&value<=limit[1];
 if(op==='near')return Math.abs(value-limit[0])<=limit[1]+1e-9;
 throw Error('Unknown gate operator '+op);
}
export function evaluateGate(gate,measurement){
 if(!measurement||!Array.isArray(measurement.samples)||!measurement.samples.length)return {state:'OPEN',reason:'No samples'};
 if(gate.item==='Q1'&&scheduleKeys.has(gate.key)&&measurement.basis!=='presentation-schedule')return {state:'OPEN',reason:'Requires presentation schedule; post-draw inference is not timing truth'};
 const required=Array.isArray(gate.scope)?gate.scope:gate.scope==='fixtures'?fixtures:[];
 if(!required.every(id=>measurement.samples.some(s=>s.fixture===id)))return {state:'OPEN',reason:'Incomplete required fixture matrix: '+required.join(', ')};
 const failures=measurement.samples.filter(s=>!numeric(s.value,gate.op,gate.limit));
 return {state:failures.length?'FAIL':'PASS',reason:failures.length?JSON.stringify(failures):`${measurement.samples.length} samples`};
}
export function validateEvidence(measurement,base=root){
 if(!measurement?.evidence?.length)return 'No evidence artifacts';
 for(const artifact of measurement.evidence){
  if(!artifact.path||!artifact.sha256)return 'Unsigned artifact';
  const path=resolve(base,artifact.path);if(!path.startsWith(base+'/')||!existsSync(path))return 'Missing/locality error: '+artifact.path;
  if(createHash('sha256').update(readFileSync(path)).digest('hex')!==artifact.sha256)return 'Artifact changed: '+artifact.path;
 }
 return null;
}
export function checkFeel(data,base=root,options={}){const selected=selectedItems(options.item,options.done);return gates.filter(g=>!selected||selected.has(g.item)).map(gate=>{
 let measurement=data?.measurements?.[gate.id];
 const derived=(value,paths)=>({samples:[{fixture:'all',value}],evidence:paths.filter(p=>existsSync(resolve(base,p))).map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(base,path))).digest('hex')}))});
 if(gate.key==='learn'){
  const path=resolve(base,'reports/v3-feel/LEARN/sources.json');
  const receipt=learningReceipt(base,gate.item,existsSync(path)?JSON.parse(readFileSync(path,'utf8')):[],options.commitMessage??data?.buildCommits?.[gate.item]?.message);
  measurement=derived(receipt.pass,receipt.paths);
 }
 if(gate.key==='craftTime'){
  const path='reports/v3-feel/CRAFT/craft-times.json';
  measurement=existsSync(resolve(base,path))?derived(craftTimeReceipt(JSON.parse(readFileSync(resolve(base,path),'utf8')),gate.item).pass,[path]):undefined;
 }
 const check=evaluateGate(gate,measurement);
 const error=check.state==='PASS'?validateEvidence(measurement,base):null;
 return {...gate,...check,...(error?{state:'OPEN',reason:error}:{})};
});}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const i=process.argv.indexOf('--item'),item=i<0?null:process.argv[i+1];
 const path=resolve(root,'reports/v3-feel/measurements.json');const data=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{};
 const queue=resolve(root,'reports/v3-feel/QUEUE-FEEL.md');
 const done=existsSync(queue)?completedItems(readFileSync(queue,'utf8')):[];
 const messageIndex=process.argv.indexOf('--commit-message-file');
 const commitMessage=messageIndex>=0?readFileSync(resolve(process.argv[messageIndex+1]),'utf8'):undefined;
 // Saved citations must correspond to actual commits, not an unchecked claim in JSON.
 for(const [key,receipt] of Object.entries(data.buildCommits??{})){
  try{receipt.message=execFileSync('git',['show','-s','--format=%B',receipt.commit],{cwd:root,encoding:'utf8'});}catch{receipt.message='';}
 }
 const results=checkFeel(data,root,{item,done,commitMessage});
 for(const row of results)console.log(`${row.state} ${row.id}: ${row.reason} | ${row.requirement}`);
 if(process.argv.includes('--write'))writeFileSync(resolve(root,'reports/v3-feel/checker.json'),JSON.stringify({at:new Date().toISOString(),source:relative(root,path),results},null,2)+'\n');
 const counts=Object.fromEntries(['PASS','FAIL','OPEN'].map(s=>[s,results.filter(r=>r.state===s).length]));console.log(JSON.stringify(counts));
 process.exitCode=results.every(g=>g.state==='PASS')?0:1;
}
