/** V3-POSE section 4B.6. Receipts describe measured assets and reviewed frames. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {learningReceipt} from './craft-policy.mjs';

export function poseLearningReceipt(base,sources,message) {
 const receipt=learningReceipt(base,'P1-poses',sources,message);
 const path=resolve(base,'reports/v3-feel/LEARN/P1-poses.md');
 const text=existsSync(path)?readFileSync(path,'utf8'):'';
 const cited=[...new Map(sources.filter(s=>(s.topic==='P1-poses'||s.topics?.includes('P1-poses'))&&text.includes(s.id)).map(s=>[s.url_or_path,s])).values()];
 const errors=[...receipt.errors];
 if(cited.length<12)errors.push('fewer than twelve pose sources');
 if(cited.filter(s=>['paper','formal'].includes(s.type)).length<2)errors.push('fewer than two formal pose sources');
 return {...receipt,pass:errors.length===0,errors};
}

export function poseReceipt(data,unit) {
 const errors=[];
 const finite=(v)=>typeof v==='number'&&Number.isFinite(v);
 const between=(v,a,b)=>finite(v)&&v>=a&&v<=b;
 const text=(v)=>typeof v==='string'&&v.trim().length>0;
 const require=(ok,why)=>{if(!ok)errors.push(why);};
 if(!data||data.unit!==unit)return {pass:false,errors:['missing or wrong unit receipt']};
 require(['A','B','designer'].includes(data.method),'Method C remains pose open');
 require(data.basis==='field-scale-aligned-alpha','measure at shared foot anchor and field scale');
 require(data.hasUltimate===true||data.hasUltimate===false,'ultimate capability unspecified');
 const required=['K0','K1','K2','K4',...(data.hasUltimate?['K5']:[])];
 require(Array.isArray(data.poses)&&required.every(id=>data.poses.filter(p=>p.id===id).length===1),'missing or duplicate required pose');
 const poses=data.poses??[];
 require(new Set(poses.filter(p=>required.includes(p.id)).map(p=>p.artifact)).size===required.length,'distinct pose drawings required');
 for(const id of required){
  const p=poses.find(p=>p.id===id);if(!p)continue;
  require(text(p.artifact)&&text(p.sha256),'unsigned pose '+id);
  if(id==='K0')continue;
  require(between(p.paletteDeltaE00,0,8),'palette '+id);
  require(between(p.headRatioRelative,.92,1.08),'head/body ratio '+id);
  require(p.checklistComplete===true&&Array.isArray(p.checklist)&&p.checklist.length>0&&p.checklist.every(c=>text(c.name)&&c.present===true),'costume/prop checklist '+id);
  for(const key of ['anatomyErrors','lettering','backgroundPixels','croppedParts'])require(p[key]===0,key+' '+id);
  require(text(p.inspected2x)&&p.lightMatches===true&&p.outlineMatches===true,'2x/light/outline inspection '+id);
  require(between(p.footDriftPx,0,3),'foot drift '+id);
  require(between(p.opaqueHeightRelative,.95,1.05)||(['K4','K5'].includes(id)&&text(p.heightException)&&finite(p.opaqueHeightRelative)&&p.opaqueHeightRelative>0),'opaque height '+id);
  if(id==='K1')require(between(p.idleIoU,0,.85),'windup silhouette');
  if(id==='K2'){
   require(between(p.idleIoU,0,.75),'strike silhouette');
   require(finite(p.frontReachBodyFraction)&&p.frontReachBodyFraction>=.12,'strike reach');
  }
 }
 const blind=data.blindRead;
 require(blind?.count===40&&Number.isInteger(blind.correct)&&between(blind.correct,36,40),'40-frame blind accuracy >=90%');
 require(text(blind?.labelsArtifact)&&text(blind?.labelsSha256)&&Number.isFinite(Date.parse(blind?.labelledAt))&&Date.parse(blind.labelledAt)<Date.parse(blind.comparedAt),'blind labels precede schedule comparison');
 require(Array.isArray(data.fixtures)&&data.fixtures.length>0&&new Set(data.fixtures).size===data.fixtures.length,'required fixture roster');
 for(const fixture of data.fixtures??[]){
  const review=data.video?.find(v=>v.fixture===fixture);
  require(review&&Number.isInteger(review.expectedAttacks)&&review.expectedAttacks>0&&review.windows?.length===review.expectedAttacks,'all attack windows '+fixture);
  for(const w of review?.windows??[])require(text(w.windupFrame)&&text(w.strikeFrame)&&text(w.recoveryFrame)&&w.idleOnly===false,'drawn poses on film '+fixture);
  require(review&&Number.isInteger(review.expectedDamagingHits)&&review.expectedDamagingHits>0&&review.hits?.length===review.expectedDamagingHits,'all damaged targets '+fixture);
  for(const h of review?.hits??[])require(text(h.frame)&&h.pose==='K4'&&between(h.flashFrames,1,2)&&between(h.knockbackPx,6,12)&&between(h.holdMs,120,200),'hit reaction '+fixture);
 }
 require(text(data.masterComparison)&&text(data.masterCritique),'same-scale master comparison');
 require(Array.isArray(data.revisions)&&new Set(data.revisions.filter(r=>Number.isInteger(r.round)&&text(r.review)&&text(r.change)).map(r=>r.round)).size>=2,'two reviewed revisions');
 for(const key of ['scheduleExact','noOverlap','sizeRules','facingRules','faceRules'])require(data.regression?.[key]===true,'regression '+key);
 require(between(data.regression?.videoTimingErrorMs,0,33),'video timing');
 return {pass:errors.length===0,errors};
}
