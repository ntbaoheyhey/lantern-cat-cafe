// Existing immutable capture reduction; conventions learned in LEARN/Q2.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const base='reports/v3-feel/REVIEW/Q2/';
const overlap=(a,b)=>Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y);
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const out=[];
for(const fixture of ['wave1','wave3','boss']){
 const path=base+fixture+'/capture.json.gz',raw=readFileSync(path),d=JSON.parse(gunzipSync(raw));
 const frames=d.frames.filter(f=>f.t<=d.videoSeconds),m={},worst={},faceCandidates=[],defects=[],numbers=new Map(),sources={};
 const extremum=(name,value,f,lower=false)=>{if(!Number.isFinite(value))throw Error('Nonfinite '+name);if(m[name]===undefined||(lower?value<m[name]:value>m[name])){m[name]=value;worst[name]={ordinal:f.ordinal,time:f.t};}};
 let maxCount=0,numberFaceOverlap=0,previous=0,edge=0,clipped=0;
 for(let i=0;i<frames.length;i++){
  const f=frames[i],cats=f.units.filter(u=>u.side==='party'),enemies=f.units.filter(u=>u.side==='enemy'&&u.kind!=='boss'),bosses=f.units.filter(u=>u.kind==='boss');
  const hs=list=>list.map(u=>u.box.height),ch=hs(cats),eh=hs(enemies);
  extremum('catHeightRatio',Math.max(...ch)/Math.min(...ch),f);
  extremum('enemyHeightRatio',Math.max(...eh)/Math.min(...eh),f);
  extremum('catEnemyHeightRatioMin',Math.min(...ch)/Math.max(...eh),f,true);
  extremum('catEnemyHeightRatioMax',Math.max(...ch)/Math.min(...eh),f);
  extremum('catHeightFraction',Math.min(...ch)/d.height,f,true);
  if(bosses.length){extremum('bossHeightRatioMin',Math.min(...hs(bosses))/Math.max(...ch),f,true);extremum('bossHeightRatioMax',Math.max(...hs(bosses))/Math.min(...ch),f);}
  const elites=f.units.filter(u=>u.kind==='elite');if(elites.length)extremum('eliteHeightRatio',Math.max(...hs(elites))/Math.min(...ch),f);
  extremum('formationWidthFraction',(Math.max(...f.units.map(u=>u.box.x+u.box.width))-Math.min(...f.units.map(u=>u.box.x)))/d.width,f,true);
  extremum('stageAreaFraction',f.field.width*f.field.height/(d.width*d.height),f,true);
  for(const u of f.units){
   sources[u.asset]=u.source;
   if(u.box.x<0||u.box.y<0||u.box.x+u.box.width>d.width||u.box.y+u.box.height>d.height){clipped++;if(defects.length<12)defects.push({type:'clip',ordinal:f.ordinal,unit:u.id,box:u.box});}
   for(const v of f.units)if(v.id!==u.id&&v.drawOrder>=u.drawOrder&&overlap(u.faceBox,v.box))faceCandidates.push({ordinal:f.ordinal,time:f.t,face:u.id,occluder:v.id,actionKey:f.action?.key});
  }
  const counts={};
  for(const n of f.numbers){
   const id=JSON.stringify([n.key,n.born]);let row=numbers.get(id);
   if(!row){const p=d.plans.find(p=>p.key===f.action?.key);row={key:n.key,born:n.born,target:n.id,text:n.text,kind:n.kind,actionKey:f.action?.key,first:f.t,firstAgeMs:Math.max(0,(f.action?.elapsed??0)-(p?.impact??0)),last:f.t,endUpper:f.t};numbers.set(id,row);}
   row.last=f.t;row.endUpper=d.frames[f.ordinal+1]?.t??f.t;
   counts[n.id]=(counts[n.id]??0)+1;
   if(n.x<=1||n.x+n.width>=d.width-1)edge++;
   const p=d.plans.find(p=>p.key===f.action?.key);
   if(p&&f.action.elapsed>=p.impact&&row.actionKey!==p.key)previous++;
   for(const u of f.units)if(overlap(n,u.faceBox)){numberFaceOverlap++;if(defects.length<12)defects.push({type:'number-face',ordinal:f.ordinal,number:n.key,face:u.id});}
  }
  maxCount=Math.max(maxCount,0,...Object.values(counts));
 }
 const lifetimes=[...numbers.values()].map(n=>({...n,visibleSpanMs:(n.last-n.first)*1000,ageUpperMs:(n.endUpper-n.first)*1000+n.firstAgeMs}));
 const expected=[],missing=[],extra=[];
 for(const plan of d.plans){
  const contact=frames.find(f=>f.action?.key===plan.key&&f.action.elapsed>=plan.impact);
  if(!contact)continue;
  for(const event of plan.events.filter(e=>['damage','heal','shield'].includes(e.type)&&e.amount>0))for(const target of event.targetIds){
   const text=(event.type==='heal'?'+':event.type==='shield'?'◇':'−')+event.amount;
   expected.push({actionKey:plan.key,target,text,seq:event.seq});
  }
 }
 const actual=lifetimes.filter(n=>['damage','heal','shield','dot'].includes(n.kind)&&n.text);
 const claimed=new Set();for(const e of expected){const index=actual.findIndex((n,i)=>!claimed.has(i)&&n.actionKey===e.actionKey&&n.target===e.target&&n.text===e.text);if(index<0)missing.push(e);else claimed.add(index);}
 actual.forEach((n,i)=>{if(!claimed.has(i))extra.push(n);});
 const row={fixture,sourceCommit:d.sourceCommit,videoSha256:d.videoSha256,captureSha256:createHash('sha256').update(raw).digest('hex'),frames:frames.length,metrics:{...m,numbersPerTarget:maxCount,numberLifetimeUpperMs:Math.max(...lifetimes.map(n=>n.ageUpperMs)),numberVisibleSpanMs:Math.max(...lifetimes.map(n=>n.visibleSpanMs)),numbersOlderThan700Ms:lifetimes.filter(n=>n.ageUpperMs>700).length,numberFaceOverlap,previousNumbersAtImpact:previous,numberEdgePlacements:edge,clippedBoxSamples:clipped,numericEventsExpected:expected.length,numericBurstsShown:actual.length},worst,sources,faceCandidates,numberMismatch:{missing,extra},defects,lifetimes};
 out.push(row);console.log(JSON.stringify({fixture,frames:row.frames,...row.metrics,faceCandidates:faceCandidates.length,missing:missing.length,extra:extra.length}));
}
writeFileSync('tools/v3craft-lab/q2/film-measurements.json',JSON.stringify({at:new Date().toISOString(),method:'Every immutable rendered frame within 0–30 s; posed alpha hulls; number identity key+birth; conservative lifetime upper bound includes initial age and next absent sample.',fixtures:out},null,2)+'\n');
