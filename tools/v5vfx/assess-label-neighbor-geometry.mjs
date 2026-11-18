/** Frozen R7 geometry experiment. No browser, application change, or image view. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const capture=resolve(root,'work/v5/CXV/batch-m/authored-label-native-r1-140808');
const prereg=resolve(root,'reports/v5/CXV/M-label-neighbor-geometry-R1-preregistration.json');
const sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=await readFile(resolve(root,sourcePath),'utf8');
const {layoutWorldLabels}=loadLabelSearch(source);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const area=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const authoredIds=new Set(['mochi','clover']);
const rows=[],inputs=[];

// Analytic controls cover strict intersections, contact, containment and translation.
const unit={x:10,y:10,width:10,height:10};
const controls=[
 [{x:20,y:10,width:10,height:10},false,0],
 [{x:19,y:10,width:10,height:10},true,10],
 [{x:10,y:20,width:10,height:10},false,0],
 [{x:12,y:12,width:2,height:3},true,6],
 [{x:-2,y:-2,width:1,height:1},false,0],
 [{x:5,y:5,width:10,height:10},true,25],
];
for(const [box,intersects,expectedArea] of controls){assert.equal(overlap(unit,box),intersects);assert.equal(area(unit,box),expectedArea);}

function withBodies(labels,width,height,hud,faces,bodies){
 const result=layoutWorldLabels(labels.map(({anchorPlacement,...ordinary})=>ordinary),width,height,hud,faces);
 for(const label of labels.filter(x=>x.anchorPlacement).sort((a,b)=>a.id.localeCompare(b.id))){
  const fixed=result.filter(x=>x.id!==label.id).map(x=>x.rect);
  const [replacement]=layoutWorldLabels([{id:label.id,side:label.side,rect:label.anchorPlacement.rect}],width,height,[...hud,...faces,...fixed,...bodies],[]);
  result[result.findIndex(x=>x.id===label.id)]=replacement;
 }
 return result;
}

for(const suite of ['regression-heldouts','expanded-status']){
 const path=resolve(capture,suite,'report.json'),bytes=await readFile(path),raw=JSON.parse(bytes);
 inputs.push({path,sha256:sha(bytes)});
 assert.equal(source,execFileSync('git',['show',raw.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'}));
 for(const c of raw.cases){
  const s=c.captures.find(x=>x.variant==='baseline').before;
  const actors=JSON.parse(s.battle).actors,extents=new Map();
  for(const label of s.labels){
   const node=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world');
   const transform=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
   assert.deepEqual(transform.slice(0,4),[1,0,0,1]);
   extents.set(label.id,{x:label.rect.x-node.rect.x+transform[4],y:label.rect.y-node.rect.y+transform[5],width:label.rect.width,height:label.rect.height});
  }
  const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
  const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
  const bodies=s.anchors.filter(a=>a.visible&&a.body).map(a=>({...project(a.body),id:a.id}));
  const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
   const e=extents.get(a.id),t=a.labelTarget;
   return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},
    ...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};
  });
  assert.deepEqual(labels.filter(x=>x.anchorPlacement).map(x=>x.id).sort(),['clover','mochi']);
  const hud=s.hud.map(x=>x.rect),baseline=layoutWorldLabels(labels,1280,720,hud,faces);
  const baselineError=Math.max(...baseline.flatMap(x=>{const observed=s.labels.find(y=>y.id===x.id).rect;return['x','y','width','height'].map(k=>Math.abs(x.rect[k]-observed[k]));}));
  assert(baselineError<=1/64,'Frozen source layout does not reproduce');
  const placed=withBodies(labels,1280,720,hud,faces,bodies);
  const ordinaryUnchanged=placed.filter(x=>!authoredIds.has(x.id)).every(x=>JSON.stringify(x)===JSON.stringify(baseline.find(y=>y.id===x.id)));
  assert(ordinaryUnchanged);
  rows.push({suite,mode:c.mode,cloverFrame:c.frame,mochiFrame:c.expectedFrames.mochi,syntheticStatus:suite==='expanded-status',baselineError,ordinaryUnchanged,
   labels:placed.filter(x=>authoredIds.has(x.id)).map(x=>{
    const input=labels.find(y=>y.id===x.id),prior=baseline.find(y=>y.id===x.id);
    const bodyIntersections=bodies.filter(b=>overlap(x.rect,b)).map(b=>({id:b.id,area:area(x.rect,b)}));
    return{id:x.id,baseline:prior.rect,target:input.anchorPlacement.rect,candidate:x.rect,feasible:x.feasible,bodyIntersections,
     baselineBodyIntersections:bodies.filter(b=>overlap(prior.rect,b)).map(b=>({id:b.id,area:area(prior.rect,b)})),
     fromTargetCSSpx:distance(x.rect,input.anchorPlacement.rect),fromBaselineCSSpx:distance(x.rect,prior.rect),
     associationRisk:distance(x.rect,input.anchorPlacement.rect)>x.rect.width,
     facesHudOtherLabelsClear:!faces.concat(hud,placed.filter(y=>y.id!==x.id).map(y=>y.rect)).some(b=>overlap(x.rect,b))};
   })});
 }
}
const out=resolve(root,'work/v5/CXV/batch-m/label-neighbor-geometry-r1');await mkdir(out,{recursive:false});
const allRows=resolve(out,'rows.json');await writeFile(allRows,JSON.stringify(rows,null,2)+'\n');
const labels=rows.flatMap(x=>x.labels);
const result={utc:new Date().toISOString(),sourceCommit:'bf01d462ac32233ab11475605d571aea691f96bf',indexSha256:'eb93ee0dbdfb500c3f9aed80acdb134f027d8093240c86b545807a87dc79ce67',
 inputs,preregistration:{path:prereg,sha256:sha(await readFile(prereg))},harness:{path:import.meta.filename,sha256:sha(await readFile(import.meta.filename))},source:{path:sourcePath,sha256:sha(source)},
 raw:{path:allRows,sha256:sha(await readFile(allRows))},analyticControls:controls.length,cases:rows.length,maxBaselineErrorCSSpx:Math.max(...rows.map(x=>x.baselineError)),
 ordinaryUnchanged:rows.every(x=>x.ordinaryUnchanged),candidateClear:labels.every(x=>x.feasible&&!x.bodyIntersections.length&&x.facesHudOtherLabelsClear),
 associationRiskCount:labels.filter(x=>x.associationRisk).length,maxDisplacementCSSpx:Math.max(...labels.map(x=>x.fromTargetCSSpx)),
 representative:rows.filter(x=>x.mode==='reduced'||[0,297].includes(x.cloverFrame)),productionAcceptance:false,
 limits:['Frozen paused geometry fit only;14regression/heldouts plus4synthetic status cases.','Body bounds include transparent space;moving by a full label width is an association-risk flag,not an empirically accepted visual threshold.','No fresh native paint,legal action,loop,matte or performance acceptance. No application source or images changed.']};
await writeFile(resolve(root,'reports/v5/CXV/M-label-neighbor-geometry-R1.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({cases:result.cases,maxBaselineErrorCSSpx:result.maxBaselineErrorCSSpx,candidateClear:result.candidateClear,associationRiskCount:result.associationRiskCount,maxDisplacementCSSpx:result.maxDisplacementCSSpx,representative:result.representative.map(x=>({suite:x.suite,mode:x.mode,frame:x.cloverFrame,labels:x.labels.map(l=>({id:l.id,rect:l.candidate,distance:l.fromTargetCSSpx}))}))}));
