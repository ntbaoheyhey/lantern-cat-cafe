import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {poseReceipt,poseLearningReceipt} from './pose-policy.mjs';
import {craftTimeReceipt} from './craft-policy.mjs';

function good(){return {
 unit:'soot',method:'A',basis:'field-scale-aligned-alpha',hasUltimate:true,
 poses:['K0','K1','K2','K4','K5'].map(id=>({id,artifact:id+'.webp',sha256:'test-hash',paletteDeltaE00:8,headRatioRelative:1.08,
  checklistComplete:true,checklist:[{name:'lantern staff',present:true}],anatomyErrors:0,lettering:0,backgroundPixels:0,croppedParts:0,
  inspected2x:'two ears, four limbs, one tail; full canvas',lightMatches:true,outlineMatches:true,footDriftPx:3,opaqueHeightRelative:1.05,
  idleIoU:id==='K1'?.85:.75,frontReachBodyFraction:.12})),
 blindRead:{count:40,correct:36,labelsArtifact:'blind.json',labelsSha256:'test-hash',labelledAt:'2026-11-16T02:00:00Z',comparedAt:'2026-11-16T02:01:00Z'},
 fixtures:['wave1'],video:[{fixture:'wave1',expectedAttacks:1,windows:[{windupFrame:'f1',strikeFrame:'f2',recoveryFrame:'f3',idleOnly:false}],
 expectedDamagingHits:1,hits:[{frame:'f2',pose:'K4',flashFrames:2,knockbackPx:12,holdMs:200}]}],
 masterComparison:'ref/private.jpg',masterCritique:'Master anticipates with a distinct raised weapon.',
 revisions:[{round:1,review:'r1.md',change:'extend staff'},{round:2,review:'r2.md',change:'coil body'}],
 regression:{scheduleExact:true,noOverlap:true,sizeRules:true,facingRules:true,faceRules:true,videoTimingErrorMs:33},
};}
test('P.soot structured fake PASS at all inclusive boundaries',()=>assert.equal(poseReceipt(good(),'soot').pass,true));
const mutations={
 'silhouette':d=>d.poses[1].idleIoU=.851,
 'strike silhouette':d=>d.poses[2].idleIoU=.751,
 'reach':d=>d.poses[2].frontReachBodyFraction=.119,
 'palette':d=>d.poses[1].paletteDeltaE00=8.001,
 'head':d=>d.poses[1].headRatioRelative=1.081,
 'feet':d=>d.poses[1].footDriftPx=3.001,
 'height':d=>d.poses[1].opaqueHeightRelative=1.051,
 'unlogged cast height':d=>d.poses[4].opaqueHeightRelative=1.2,
 'anatomy':d=>d.poses[1].anatomyErrors=1,
 'checklist':d=>d.poses[1].checklist[0].present=false,
 'missing cast':d=>d.poses.pop(),
 'duplicated idle':d=>d.poses[1].artifact=d.poses[0].artifact,
 'missing inspection':d=>d.poses[2].inspected2x='',
 'missing ultimate flag':d=>delete d.hasUltimate,
 'nonfinite metric':d=>d.poses[1].paletteDeltaE00=NaN,
 'bad blind score':d=>d.blindRead.correct=35,
 'schedule leaked before labels':d=>d.blindRead.comparedAt=d.blindRead.labelledAt,
 'missing window':d=>d.video[0].expectedAttacks=2,
 'idle throughout':d=>d.video[0].windows[0].idleOnly=true,
 'mesh target':d=>d.video[0].hits[0].pose='mesh',
 'missing reaction':d=>d.video[0].expectedDamagingHits=2,
 'wrong knockback':d=>d.video[0].hits[0].knockbackPx=13,
 'repeat revision':d=>d.revisions[1].round=1,
 'C method':d=>d.method='C',
 'timing regression':d=>d.regression.videoTimingErrorMs=33.001,
};
for(const [name,mutate] of Object.entries(mutations))test('P.soot structured fake FAIL: '+name,()=>{const d=good();mutate(d);assert.equal(poseReceipt(d,'soot').pass,false);});
test('missing receipt cannot pass',()=>assert.equal(poseReceipt(undefined,'soot').pass,false));
test('V3-POSE requires25 author minutes while preserving historical20-minute floor',()=>{
 const log=(item,minutes)=>({expectedAssets:[{item,id:'poses',kind:'pose'}],steps:[{item,asset:'poses',kind:'pose',category:'author',start:'2026-11-14T00:00:00Z',end:new Date(Date.parse('2026-11-14T00:00:00Z')+minutes*60000).toISOString()}]});
 assert.equal(craftTimeReceipt(log('Q3.B',20),'Q3.B').pass,true);
 assert.equal(craftTimeReceipt(log('P2',24),'P2').pass,false);
 assert.equal(craftTimeReceipt(log('P2',25),'P2').pass,true);
});
test('logged K4/K5 height exception only',()=>{const d=good();d.poses[4].opaqueHeightRelative=1.2;d.poses[4].heightException='raised staff above head';assert.equal(poseReceipt(d,'soot').pass,true);});
test('P.learn fake PASS and FAIL use actual source counts and experiment artifacts',()=>{
 const base=mkdtempSync(join(tmpdir(),'pose-learn-'));
 try{
  mkdirSync(join(base,'reports/v3-feel/LEARN'),{recursive:true});
  const sources=Array.from({length:12},(_,i)=>({id:'pose-'+i,topic:'P1-poses',type:i<2?'formal':i===11?'experiment':'doc',url_or_path:i===11?'experiment.json':'https://example.org/source/'+i}));
  const path='reports/v3-feel/LEARN/P1-poses.md';
  writeFileSync(join(base,path),sources.map(s=>s.id).join('\n'));
  writeFileSync(join(base,'experiment.json'),'{"comparisons":2}');
  assert.equal(poseLearningReceipt(base,sources,path).pass,true);
  assert.equal(poseLearningReceipt(base,sources.slice(1),path).pass,false);
  assert.equal(poseLearningReceipt(base,sources.map(s=>({...s,type:s.type==='formal'?'doc':s.type})),path).pass,false);
  assert.equal(poseLearningReceipt(base,sources,'no citation').pass,false);
 }finally{rmSync(base,{recursive:true});}
});
