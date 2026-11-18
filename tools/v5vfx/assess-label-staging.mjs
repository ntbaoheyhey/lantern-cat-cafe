/** Frozen full-progression experiment. No browser or application edit. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const preregPath=resolve(root,'reports/v5/CXV/M-label-staging-R1-preregistration.json');
const prereg=JSON.parse(await readFile(preregPath));
const sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=await readFile(resolve(root,sourcePath),'utf8');
assert.equal(source,execFileSync('git',['show',prereg.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'}));
const {layoutWorldLabels}=loadLabelSearch(source);
const expand=b=>({...b,x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12});
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const rows=[],inputs=[];
for(const spec of prereg.inputs){
 const path=resolve(root,spec.path),bytes=await readFile(path),raw=JSON.parse(bytes);
 assert.equal(raw.sourceCommit,prereg.sourceCommit);assert.equal(raw.indexSha256,prereg.indexSha256);
 const analysisPath=resolve(path,'../analysis.json'),analysis=JSON.parse(await readFile(analysisPath));
 inputs.push({path,sha256:sha(bytes),analysis:{path:analysisPath,sha256:sha(await readFile(analysisPath))}});
 const samples=[...(spec.states?raw.rows.map((r,i)=>({key:`state-${i}`,mode:r.mode,cat:r.cat,skill:r.skill,ms:r.ms,s:r.snapshot})):[]),
  ...raw.cases.map((c,i)=>({key:c.key??`${c.mode}-${c.frame}-${i}`,mode:c.mode,cat:c.cat,skill:c.skill,ms:c.ms,frame:c.frame,s:c.before,pixelCase:i,valid:analysis.cases[i].valid}))];
 for(const c of samples){
  if(c.valid===false)continue;
  const s=c.s,actors=JSON.parse(s.battle).actors,extents=new Map();
  for(const label of s.labels){
   const node=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world');
   const transform=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
   assert.deepEqual(transform.slice(0,4),[1,0,0,1]);
   extents.set(label.id,{x:label.rect.x-node.rect.x+transform[4],y:label.rect.y-node.rect.y+transform[5],width:label.rect.width,height:label.rect.height});
  }
  const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
  const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
  const native=s.anchors.filter(a=>a.visible&&a.body&&!['mochi','clover'].includes(a.id)).map(a=>({...expand(project(a.body)),id:a.id}));
  const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
   const e=extents.get(a.id),t=a.labelTarget;
   return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},
    ...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};
  });
  const hud=s.hud.map(x=>x.rect),baseline=layoutWorldLabels(labels,1280,720,hud,faces);
  const baselineError=Math.max(...baseline.flatMap(x=>{const observed=s.labels.find(y=>y.id===x.id).rect;return['x','y','width','height'].map(k=>Math.abs(x.rect[k]-observed[k]));}));
  const mochi=s.anchors.find(a=>a.id==='mochi'),label=labels.find(a=>a.id==='mochi');
  const target={...label.anchorPlacement.rect,y:s.host.y+Math.max(mochi.footY,mochi.body.y+mochi.body.height)+6};
  const fixed=baseline.filter(a=>a.id!=='mochi');
  const [candidate]=layoutWorldLabels([{id:'mochi',side:label.side,rect:target}],1280,720,[...hud,...faces,...fixed.map(a=>a.rect),label.anchorPlacement.avoid,...native],[]);
  const drift=Math.hypot(candidate.rect.x-target.x,candidate.rect.y-target.y);
  const authoredAxis=mochi.labelTarget.x+s.host.x;
  const association=drift<=12&&candidate.rect.x<=authoredAxis&&candidate.rect.x+candidate.rect.width>=authoredAxis&&candidate.rect.y>=target.y&&candidate.rect.y<=target.y+12;
  const {s:_,...meta}=c;
  rows.push({...meta,input:inputs.length-1,baselineError,baseline:baseline.find(a=>a.id==='mochi').rect,target,candidate:candidate.rect,feasible:candidate.feasible,drift,association,
   nativeIntersections:native.filter(a=>overlap(candidate.rect,a)).map(a=>a.id),
   geometryClear:![...hud,...faces,...fixed.map(a=>a.rect),label.anchorPlacement.avoid,...native].some(a=>overlap(candidate.rect,a)),
   bodyBottom:mochi.body.y+mochi.body.height+s.host.y,footY:mochi.footY+s.host.y,authoredAxis,
   otherLabels:fixed.map(a=>({id:a.id,rect:a.rect})),otherLabelsUnchanged:true});
 }
}
const out=resolve(root,'work/v5/CXV/batch-m/label-staging-r1');await mkdir(out,{recursive:false});
const rowsPath=resolve(out,'rows.json');await writeFile(rowsPath,JSON.stringify(rows,null,2)+'\n');
const result={utc:new Date().toISOString(),sourceCommit:prereg.sourceCommit,indexSha256:prereg.indexSha256,url:prereg.url,
 preregistration:{path:preregPath,sha256:sha(await readFile(preregPath))},harness:{path:import.meta.filename,sha256:sha(await readFile(import.meta.filename))},
 layoutSource:{path:sourcePath,sha256:sha(source)},inputs,rows:{path:rowsPath,sha256:sha(await readFile(rowsPath))},
 count:rows.length,maxBaselineError:Math.max(...rows.map(r=>r.baselineError)),baselineReproduced:rows.every(r=>r.baselineError<=1/64),
 geometryClear:rows.every(r=>r.feasible&&r.geometryClear),associationBounded:rows.every(r=>r.association),maxDrift:Math.max(...rows.map(r=>r.drift)),
 rejected:rows.filter(r=>!r.association||!r.geometryClear||!r.feasible).map(({otherLabels,...r})=>r),
 productionAcceptance:false,limits:['Existing frozen samples are development evidence, not holdouts or all-frame proof.','No rendered candidate or painted clearance claim.','Native six-pixel guard remains conservative. Commissioned neighbor paint is not replaced with its full rectangle.','Association constraints are authored design bounds, not a user-study result.','All non-Mochi labels remain their existing baseline placement; Clover retains its previously measured (-12,+19) diagnostic.']};
await writeFile(resolve(root,'reports/v5/CXV/M-label-staging-R1.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({count:result.count,maxBaselineError:result.maxBaselineError,baselineReproduced:result.baselineReproduced,geometryClear:result.geometryClear,associationBounded:result.associationBounded,maxDrift:result.maxDrift,rejected:result.rejected.length}));
