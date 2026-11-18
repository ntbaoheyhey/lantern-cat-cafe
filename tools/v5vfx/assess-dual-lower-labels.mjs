/** One frozen structural target, evaluated as regression, never a fitted offset. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const prepath=resolve(root,'reports/v5/CXV/M-dual-lower-label-regression-R1-preregistration.json');
const pre=JSON.parse(await readFile(prepath)),bytes=await readFile(pre.raw.path);
assert.equal(sha(bytes),pre.raw.sha256);
const raw=JSON.parse(bytes);assert.equal(raw.sourceCommit,pre.sourceCommit);assert.equal(raw.indexSha256,pre.indexSha256);
const source=execFileSync('git',['show',raw.sourceCommit+':apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts'],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'});
const {layoutWorldLabels}=loadLabelSearch(source),eps=pre.criteria.baselineReconstructionToleranceCSSpx;
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const padded=(b,n)=>({x:b.x-n,y:b.y-n,width:b.width+n*2,height:b.height+n*2});
const diff=(a,b)=>Math.max(...['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])));
const samples=[...raw.rows.map((r,i)=>({key:`state-${i}`,mode:r.mode,cat:r.cat,skill:r.skill,ms:r.ms,s:r.snapshot})),...raw.cases.map(c=>({key:c.key,mode:c.mode,cat:c.cat,skill:c.skill,ms:c.ms,s:c.before}))];
const results=samples.map(({s,...meta})=>{
 const actors=JSON.parse(s.battle).actors,extents=new Map();
 for(const label of s.labels){
  const n=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world'),t=n.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(t.slice(0,4),[1,0,0,1]);extents.set(label.id,{x:label.rect.x-n.rect.x+t[4],y:label.rect.y-n.rect.y+t[5],width:label.rect.width,height:label.rect.height});
 }
 const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id})),hud=s.hud.map(x=>x.rect);
 const inputs=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{const e=extents.get(a.id),t=a.labelTarget;return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};});
 const baseline=layoutWorldLabels(inputs,1280,720,hud,faces),baselineError=Math.max(...baseline.map(l=>diff(l.rect,s.labels.find(v=>v.id===l.id).rect)));
 const candidate=inputs.map(l=>{
  if(!pre.candidate.cats.includes(l.id))return l;
  const a=s.anchors.find(a=>a.id===l.id),e=extents.get(l.id);
  return{...l,anchorPlacement:{rect:{...e,x:s.host.x+a.labelX+e.x,y:s.host.y+Math.max(a.body.y+a.body.height,a.footY)+6},avoid:project(a.body)}};
 });
 const placed=layoutWorldLabels(candidate,1280,720,hud,faces),otherError=Math.max(...placed.filter(l=>!pre.candidate.cats.includes(l.id)).map(l=>diff(l.rect,s.labels.find(v=>v.id===l.id).rect)));
 const targets=pre.candidate.cats.map(cat=>{
  const a=s.anchors.find(a=>a.id===cat),l=placed.find(l=>l.id===cat),target=candidate.find(l=>l.id===cat).anchorPlacement.rect;
  const bottom=s.host.y+Math.max(a.body.y+a.body.height,a.footY),axis=s.host.x+a.labelX;
  const checks={feasible:l.feasible,baseline:baselineError<=eps,others:otherError<=eps,fallback:diff(l.rect,target)<=12,axis:axis>=l.rect.x&&axis<=l.rect.x+l.rect.width,gap:l.rect.y-bottom>=6-eps&&l.rect.y-bottom<=18+eps,viewport:l.rect.x>=4&&l.rect.y>=4&&l.rect.x+l.rect.width<=1276&&l.rect.y+l.rect.height<=716,hud:!hud.some(b=>overlaps(l.rect,b)),faces:!faces.some(b=>overlaps(l.rect,b)),nativeBodies:!s.anchors.filter(b=>b.visible&&['panko','mallow'].includes(b.id)).some(b=>overlaps(l.rect,padded(project(b.body),6))),otherLabels:!placed.filter(v=>v.id!==cat).some(v=>overlaps(l.rect,padded(v.rect,10)))};
  return{cat,target,rect:l.rect,fallback:diff(l.rect,target),gap:l.rect.y-bottom,checks,pass:Object.values(checks).every(Boolean)};
 });
 return{...meta,baselineError,otherError,targets,pass:targets.every(t=>t.pass)};
});
const out=resolve(root,'work/v5/CXV/batch-m/dual-lower-label-regression-r1');await mkdir(out,{recursive:false});
const result={utc:new Date().toISOString(),url:raw.url,sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,raw:pre.raw,preregistration:{path:prepath,sha256:sha(await readFile(prepath))},harnessSha256:sha(await readFile(import.meta.filename)),sourceSha256:sha(source),samples:results.length,maxBaselineError:Math.max(...results.map(r=>r.baselineError)),maxOtherError:Math.max(...results.map(r=>r.otherError)),failures:results.filter(r=>!r.pass).map(r=>r.key),results,productionAcceptance:false,imagesViewed:0,limits:pre.limits};
await writeFile(resolve(out,'report.json'),JSON.stringify(result,null,2)+'\n');
const failures={};for(const row of results)for(const target of row.targets)for(const [key,value] of Object.entries(target.checks))if(!value)failures[target.cat+':'+key]=(failures[target.cat+':'+key]??0)+1;
console.log(JSON.stringify({samples:results.length,failedRows:result.failures.length,maxBaselineError:result.maxBaselineError,maxOtherError:result.maxOtherError,failures}));
