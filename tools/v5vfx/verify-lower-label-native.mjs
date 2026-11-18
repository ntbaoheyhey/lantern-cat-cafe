/** Verify actual lower-label layout, constraints and preserved other labels. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const path=resolve(process.argv[2]),out=resolve(process.argv[3]);
assert(path.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));
const bytes=await readFile(path),raw=JSON.parse(bytes),sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=execFileSync('git',['show',raw.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'});
const {layoutWorldLabels}=loadLabelSearch(source),eps=1/64;
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const expand=b=>({...b,x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12});
const difference=(a,b)=>Math.max(...['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])));
const samples=[...(raw.rows??[]).map((r,i)=>({key:`state-${i}`,mode:r.mode,cat:r.cat,skill:r.skill,ms:r.ms,s:r.snapshot})),
 ...raw.cases.map((c,i)=>({key:c.key??`${c.mode}-${c.frame}-${i}`,mode:c.mode,cat:c.cat,skill:c.skill,ms:c.ms,s:c.before}))];
const results=samples.map(({s,...meta})=>{
 const actors=JSON.parse(s.battle).actors,extents=new Map();
 for(const label of s.labels){
  const n=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world'),t=n.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(t.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-n.rect.x+t[4],y:label.rect.y-n.rect.y+t[5],width:label.rect.width,height:label.rect.height});
 }
 const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{const e=extents.get(a.id),t=a.labelTarget;return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};});
 const hud=s.hud.map(x=>x.rect),replayed=layoutWorldLabels(labels,1280,720,hud,faces);
 const replayError=Math.max(...replayed.map(x=>difference(x.rect,s.labels.find(a=>a.id===x.id).rect)));
 const owner=s.anchors.find(a=>a.id==='mochi'),label=s.labels.find(a=>a.id==='mochi').rect,e=extents.get('mochi');
 const preferred={...label,x:owner.labelTarget.x+s.host.x+e.x,y:Math.max(owner.footY,owner.body.y+owner.body.height)+s.host.y+6};
 const native=s.anchors.filter(a=>a.visible&&a.body&&!['mochi','clover'].includes(a.id)).map(a=>({...expand(project(a.body)),id:a.id}));
 const blocked=[...hud,...faces,...s.labels.filter(a=>a.id!=='mochi').map(a=>a.rect),project(owner.body),...native];
 const original=labels.map(l=>l.id==='mochi'?{...l,anchorPlacement:{...l.anchorPlacement,rect:{...l.anchorPlacement.rect,y:owner.y+s.host.y+e.y}}}:l);
 const baseline=layoutWorldLabels(original,1280,720,hud,faces);
 const otherError=Math.max(...baseline.filter(a=>a.id!=='mochi').map(a=>difference(a.rect,s.labels.find(l=>l.id===a.id).rect)));
 const drift=Math.hypot(preferred.x-label.x,preferred.y-label.y),axis=owner.labelTarget.x+s.host.x;
 return{...meta,replayError,otherError,preferred,label,drift,gap:label.y-(preferred.y-6),axis,geometryClear:!blocked.some(b=>overlap(label,b)),nativeIntersections:native.filter(b=>overlap(label,b)).map(a=>a.id),association:drift<=12+eps&&label.y>=preferred.y-eps&&label.y<=preferred.y+12+eps&&label.x<=axis&&label.x+label.width>=axis};
});
const result={utc:new Date().toISOString(),sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,input:{path,sha256:sha(bytes)},layoutSourceSha256:sha(source),harnessSha256:sha(await readFile(import.meta.filename)),samples:results.length,maxReplayError:Math.max(...results.map(r=>r.replayError)),maxOtherLabelError:Math.max(...results.map(r=>r.otherError)),maxDrift:Math.max(...results.map(r=>r.drift)),association:results.every(r=>r.association),geometryClear:results.every(r=>r.geometryClear),results};
result.pass=result.maxReplayError<=eps&&result.maxOtherLabelError<=eps&&result.association&&result.geometryClear;
await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,results:undefined}));
process.exitCode=result.pass?0:1;
