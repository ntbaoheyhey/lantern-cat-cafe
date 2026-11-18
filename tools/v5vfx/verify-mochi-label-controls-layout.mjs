/** Reconstruct pinned layout and compare fresh Mochi-only method-study arms. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';
const input=resolve(process.argv[2]),output=resolve(process.argv[3]);
assert(input.startsWith(resolve(root,'work/v5/CXV')+'/'));
assert(output.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(output));
const hash=b=>createHash('sha256').update(b).digest('hex'),bytes=await readFile(input),raw=JSON.parse(bytes);
assert.deepEqual(raw.fixture.mediaCats,['mochi']);
const sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=execFileSync('git',['show',raw.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'});
const {layoutWorldLabels}=loadLabelSearch(source),epsilon=1/64;
const difference=(a,b)=>Math.max(...['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])));
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const expand=(r,p)=>({...r,x:r.x-p,y:r.y-p,width:r.width+2*p,height:r.height+2*p});
const samples=[...raw.rows.map((r,i)=>({...r,key:'row-'+i,s:r.snapshot})),...raw.cases.map(c=>({...c,s:c.before}))];
const results=samples.map(({s,key,arm,placement,method,mode,cat,skill,probeMs,ms})=>{
 const extents=new Map(),actors=JSON.parse(s.battle).actors;
 for(const label of s.labels){
  const n=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world');
  const t=n.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(t.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-n.rect.x+t[4],y:label.rect.y-n.rect.y+t[5],width:label.rect.width,height:label.rect.height});
 }
 const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
  const e=extents.get(a.id),t=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};
 });
 const hud=s.hud.map(x=>x.rect),replayed=layoutWorldLabels(labels,1280,720,hud,faces);
 const replayError=Math.max(...replayed.map(x=>difference(x.rect,s.labels.find(a=>a.id===x.id).rect)));
 const owner=s.anchors.find(a=>a.id==='mochi'),label=s.labels.find(a=>a.id==='mochi').rect,e=extents.get('mochi');
 const preferred={...label,x:owner.labelTarget.x+s.host.x+e.x,y:Math.max(owner.footY,owner.body.y+owner.body.height)+s.host.y+6};
 const native=s.anchors.filter(a=>a.visible&&a.body&&a.id!=='mochi').map(a=>({...expand(project(a.body),6),id:a.id}));
 const blocked=[...hud.map(r=>({...r,id:'hud'})),...faces,...s.labels.filter(a=>a.id!=='mochi').map(a=>({...a.rect,id:a.id+':label'})),{...project(owner.body),id:'mochi:body'},...native];
 const drift=Math.hypot(preferred.x-label.x,preferred.y-label.y),axis=owner.labelTarget.x+s.host.x;
 return{key,arm,placement,method,mode,cat,skill,probeMs,ms,replayError,label,preferred,drift,gap:label.y-(preferred.y-6),axis,intersections:blocked.filter(b=>overlap(label,b)).map(b=>b.id),associationDesignBound:drift<=12+epsilon&&label.y>=preferred.y-epsilon&&label.y<=preferred.y+12+epsilon&&label.x<=axis&&label.x+label.width>=axis};
});
const paired=[];
for(const c of raw.cases.filter(c=>c.placement==='candidate')){
 const b=raw.cases.find(b=>b.placement==='baseline'&&b.method===c.method&&b.mode===c.mode&&b.cat===c.cat&&b.skill===c.skill&&b.ms===c.ms);assert(b);
 const base=b.before,next=c.before;
 paired.push({key:c.key,baseline:b.key,rulesExact:base.battle===next.battle,planExact:JSON.stringify(base.plan)===JSON.stringify(next.plan),bodiesExact:JSON.stringify(base.anchors.map(a=>({id:a.id,body:a.body,face:a.face,footY:a.footY})))===JSON.stringify(next.anchors.map(a=>({id:a.id,body:a.body,face:a.face,footY:a.footY}))),otherLabelsError:Math.max(...base.labels.filter(l=>l.id!=='mochi').map(l=>difference(l.rect,next.labels.find(n=>n.id===l.id).rect)))});
}
const candidate=results.filter(r=>r.placement==='candidate');
const result={utc:new Date().toISOString(),input:{path:input,sha256:hash(bytes)},sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,source:{path:sourcePath,sha256:hash(source)},harnessSha256:hash(await readFile(import.meta.filename)),designBounds:{nativeBodyPadding:6,fallback:12,gap:6,epsilon},results,paired,summary:{samples:results.length,candidateSamples:candidate.length,maxReplayError:Math.max(...results.map(r=>r.replayError)),candidateGeometryFailures:candidate.filter(r=>r.intersections.length).length,candidateAssociationFailures:candidate.filter(r=>!r.associationDesignBound).length,pairedFailures:paired.filter(p=>!p.rulesExact||!p.planExact||!p.bodiesExact||p.otherLabelsError>epsilon).length},productionAcceptance:false,imagesViewed:0,limits:['Fresh development traces, not heldout evidence.','DOM bounds do not include full shadow paint; no paint acceptance.','Clover existing placeholder is included among native body obstacles.','Design bounds are not confidence intervals or perceptual association proof.']};
await writeFile(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.summary));
