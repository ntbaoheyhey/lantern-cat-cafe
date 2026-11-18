/** Reproduce frozen native layout before evaluating authored media HP targets. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadLabelSearch,root} from './label-search-prototype.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const input=resolve(root,'work/v5/CXV/batch-m/label-target-pair-r1-134447/dy0/report.json');
const gpuPath='/Users/bao/taskbar-hero-chain/work/v5/CXI/batch-m/gpu-phase-r3-134125/report.json';
const raw=JSON.parse(await readFile(input)),gpu=JSON.parse(await readFile(gpuPath));
assert.equal(raw.sourceCommit,gpu.sourceCommit);assert.equal(raw.indexSha256,gpu.indexSha256);
const sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=execFileSync('git',['show',raw.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'});
assert.equal(await readFile(resolve(root,sourcePath),'utf8'),source);
const {layoutWorldLabels}=loadLabelSearch(source);
const multiply=(m,p)=>Array.from({length:4},(_,r)=>p.reduce((sum,n,c)=>sum+m[r+4*c]*n,0));
const project=(row,name)=>{const local=[...row.sockets[name].world.slice(12,15),1],clip=multiply(row.cameraProjection,multiply(row.cameraView,local));return{x:row.canvas.x+(clip[0]/clip[3]+1)*row.canvas.width/2,y:row.canvas.y+(1-clip[1]/clip[3])*row.canvas.height/2};};
const control=gpu.controls.find(x=>x.cat==='mochi'),hp=project(control,'hpAnchor'),head=project(control,'head');
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const rows=[];
for(const c of raw.cases){
 const s=c.before,actors=JSON.parse(s.battle).actors,extents=new Map();
 for(const label of s.labels){
  const node=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world');
  const matrix=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(matrix.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-node.rect.x+matrix[4],y:label.rect.y-node.rect.y+matrix[5],width:label.rect.width,height:label.rect.height});
 }
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...a.face,id:a.id,x:a.face.x+s.host.x,y:a.face.y+s.host.y}));
 const inputs=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
  const e=extents.get(a.id),target=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},
   ...(target?{anchorPlacement:{rect:{...e,x:target.x+s.host.x+e.x,y:target.y+s.host.y+e.y},avoid:target.avoid}}:{})};
 });
 const hud=s.hud.map(x=>x.rect),baseline=layoutWorldLabels(inputs,1280,720,hud,faces);
 const baselineError=Math.max(...baseline.flatMap(x=>{const observed=s.labels.find(y=>y.id===x.id).rect;return['x','y','width','height'].map(k=>Math.abs(x.rect[k]-observed[k]));}));
 assert(baselineError<=1/64,'Frozen layout does not reproduce');
 const anchor=s.anchors.find(a=>a.id==='mochi');assert(Math.abs(anchor.x-head.x)<1e-9&&Math.abs(anchor.y-hp.y)<1e-9);
 const candidate=inputs.map(label=>{
  if(label.id==='clover')return{...label,anchorPlacement:{...label.anchorPlacement,rect:{...label.anchorPlacement.rect,y:label.anchorPlacement.rect.y+5}}};
  if(label.id==='mochi'){const e=extents.get(label.id);return{...label,anchorPlacement:{rect:{...e,x:hp.x+e.x,y:hp.y+e.y},avoid:anchor.body}};}
  return label;
 });
 const placed=layoutWorldLabels(candidate,1280,720,hud,faces),mochi=placed.find(x=>x.id==='mochi'),clover=placed.find(x=>x.id==='clover');
 const ordinaryUnchanged=placed.filter(x=>!['mochi','clover'].includes(x.id)).every(x=>JSON.stringify(x)===JSON.stringify(baseline.find(y=>x.id===y.id)));
 const mediaBodies=s.anchors.filter(a=>['mochi','clover'].includes(a.id)).map(a=>a.body);
 rows.push({mode:c.mode,cloverFrame:c.frame,mochiFrame:c.expectedFrames.mochi,baselineError,mochi:mochi.rect,clover:clover.rect,
  ordinaryUnchanged,feasible:placed.every(x=>x.feasible),mochiClearBothMediaRectangles:!mediaBodies.some(r=>overlaps(mochi.rect,r)),
  facesHudOtherLabelsClear:!faces.concat(hud,placed.filter(x=>x.id!=='mochi').map(x=>x.rect)).some(r=>overlaps(mochi.rect,r))});
}
const result={utc:new Date().toISOString(),input:{path:input,sha256:sha(await readFile(input))},gpuInput:{path:gpuPath,sha256:sha(await readFile(gpuPath))},
 sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,source:{path:sourcePath,sha256:sha(source)},harnessSha256:sha(await readFile(import.meta.filename)),hp,head,rows,
 geometryPass:rows.every(r=>r.ordinaryUnchanged&&r.feasible&&r.mochiClearBothMediaRectangles&&r.facesHudOtherLabelsClear),
 productionAcceptance:false,limits:'Ten frozen idle/reduced snapshots only; no new native draw, cast, expanded statuses, all-frame or art acceptance.'};
await writeFile(resolve(root,'reports/v5/CXV/M-authored-media-label-geometry-R1.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({geometryPass:result.geometryPass,rows:rows.length,maxBaselineError:Math.max(...rows.map(r=>r.baselineError)),mochi:rows[0].mochi,clover:rows[0].clover}));
