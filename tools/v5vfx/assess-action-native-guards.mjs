/** Frozen legal-action geometry study; no application edits or browser. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const base=resolve(root,'work/v5/CXV/batch-m/action-label-full-r2-143611');
const input=resolve(base,'report.json'),bytes=await readFile(input),raw=JSON.parse(bytes);
const analysisPath=resolve(base,'analysis.json'),analysis=JSON.parse(await readFile(analysisPath));
const prereg=resolve(root,'reports/v5/CXV/M-action-native-guards-R1-preregistration.json');
const sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=await readFile(resolve(root,sourcePath),'utf8');
assert.equal(source,execFileSync('git',['show',raw.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'}));
const {layoutWorldLabels}=loadLabelSearch(source),authored=new Set(['mochi','clover']);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const expand=b=>({...b,x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const samples=[...raw.rows.map((r,i)=>({key:`state-${i}`,mode:r.mode,cat:r.cat,skill:r.skill,ms:r.ms,s:r.snapshot})),
 ...raw.cases.map(c=>({key:c.key,mode:c.mode,cat:c.cat,skill:c.skill,ms:c.ms,s:c.before,pixelCase:true,attributionValid:analysis.cases.find(a=>a.key===c.key).valid}))];
const rows=[];
for(const c of samples){
 const s=c.s,actors=JSON.parse(s.battle).actors,extents=new Map();
 for(const label of s.labels){
  const node=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world');
  const transform=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(transform.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-node.rect.x+transform[4],y:label.rect.y-node.rect.y+transform[5],width:label.rect.width,height:label.rect.height});
 }
 const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
 const native=s.anchors.filter(a=>a.visible&&a.body&&!authored.has(a.id)).map(a=>({...expand(project(a.body)),id:a.id}));
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
  const e=extents.get(a.id),t=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},
   ...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};
 });
 const hud=s.hud.map(x=>x.rect),baseline=layoutWorldLabels(labels,1280,720,hud,faces);
 const baselineError=Math.max(...baseline.flatMap(x=>{const observed=s.labels.find(y=>y.id===x.id).rect;return['x','y','width','height'].map(k=>Math.abs(x.rect[k]-observed[k]));}));
 const placed=layoutWorldLabels(labels.map(({anchorPlacement,...ordinary})=>ordinary),1280,720,hud,faces);
 for(const label of labels.filter(l=>l.anchorPlacement).sort((a,b)=>a.id.localeCompare(b.id))){
  const fixed=placed.filter(x=>x.id!==label.id).map(x=>x.rect),target=label.anchorPlacement;
  const [replacement]=layoutWorldLabels([{id:label.id,side:label.side,rect:target.rect}],1280,720,[...hud,...faces,...fixed,target.avoid,...native],[]);
  placed[placed.findIndex(x=>x.id===label.id)]=replacement;
 }
 const ordinaryUnchanged=placed.filter(x=>!authored.has(x.id)).every(x=>JSON.stringify(x)===JSON.stringify(baseline.find(y=>y.id===x.id)));
 const {s:_,...meta}=c;
 rows.push({...meta,baselineError,ordinaryUnchanged,nativeGuards:native,labels:placed.filter(x=>authored.has(x.id)).map(x=>{
  const original=baseline.find(y=>y.id===x.id),target=labels.find(y=>y.id===x.id).anchorPlacement;
  return{id:x.id,baseline:original.rect,candidate:x.rect,target:target.rect,feasible:x.feasible,fromBaselineCSSpx:distance(x.rect,original.rect),fromTargetCSSpx:distance(x.rect,target.rect),
   nativeIntersections:native.filter(b=>overlap(b,x.rect)).map(b=>b.id),ownBodyClear:!overlap(x.rect,target.avoid),
   facesHudOtherLabelsClear:!faces.concat(hud,placed.filter(y=>y.id!==x.id).map(y=>y.rect)).some(b=>overlap(x.rect,b)),associationRisk:distance(x.rect,target.rect)>x.rect.width};
 })});
}
const out=resolve(root,'work/v5/CXV/batch-m/action-native-guards-r1');await mkdir(out,{recursive:false});
const rowsPath=resolve(out,'rows.json');await writeFile(rowsPath,JSON.stringify(rows,null,2)+'\n');
const allLabels=rows.flatMap(x=>x.labels);
const result={utc:new Date().toISOString(),sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,
 input:{path:input,sha256:sha(bytes)},analysis:{path:analysisPath,sha256:sha(await readFile(analysisPath))},preregistration:{path:prereg,sha256:sha(await readFile(prereg))},
 harness:{path:import.meta.filename,sha256:sha(await readFile(import.meta.filename))},layoutSource:{path:sourcePath,sha256:sha(source)},rows:{path:rowsPath,sha256:sha(await readFile(rowsPath))},
 stateSamples:raw.rows.length,pixelSnapshots:raw.cases.length,validPixelSnapshots:analysis.cases.filter(c=>c.valid).length,
 maxBaselineErrorCSSpx:Math.max(...rows.map(x=>x.baselineError)),baselineReproduced:rows.every(x=>x.baselineError<=1/64),ordinaryUnchanged:rows.every(x=>x.ordinaryUnchanged),
 candidateGeometryClear:allLabels.every(x=>x.feasible&&!x.nativeIntersections.length&&x.ownBodyClear&&x.facesHudOtherLabelsClear),
 maxDisplacementCSSpx:Math.max(...allLabels.map(x=>x.fromBaselineCSSpx)),associationRiskCount:allLabels.filter(x=>x.associationRisk).length,
 changed:rows.filter(x=>x.labels.some(l=>l.fromBaselineCSSpx>1/64)).map(({nativeGuards,...x})=>x),productionAcceptance:false,
 limits:['Frozen geometry only; no rendered candidate or new action evidence.','Existing six-CSS-pixel label-lane gap reused as native guard margin; no all-frame support proof.','Ordinary labels fixed; commissioned neighbors not added as full-body rectangles.','Two Mallow ultimate pixel controls remain invalid; geometry alone cannot clear them.']};
await writeFile(resolve(root,'reports/v5/CXV/M-action-native-guards-R1.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({stateSamples:result.stateSamples,pixelSnapshots:result.pixelSnapshots,baselineReproduced:result.baselineReproduced,maxBaselineErrorCSSpx:result.maxBaselineErrorCSSpx,ordinaryUnchanged:result.ordinaryUnchanged,candidateGeometryClear:result.candidateGeometryClear,maxDisplacementCSSpx:result.maxDisplacementCSSpx,associationRiskCount:result.associationRiskCount,changed:result.changed.length}));
