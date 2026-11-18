/** Explain fixed-target solver displacement; no target search or source adoption. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const preregPath=resolve(root,'reports/v5/CXV/M-clover-fixed-regression-R1-preregistration.json'),prereg=JSON.parse(await readFile(preregPath));
const bytes=await readFile(prereg.raw.path);assert.equal(sha(bytes),prereg.raw.sha256);const raw=JSON.parse(bytes);
assert.equal(raw.sourceCommit,prereg.sourceCommit);assert.equal(raw.indexSha256,prereg.indexSha256);
const source=execFileSync('git',['show',raw.sourceCommit+':apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts'],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'});
const traced='export const trace:any[]=[];\n'+source.replace('  const [replacement]=layoutWorldLabels(', '  trace.push({id:label.id,target:target.rect,avoid:target.avoid,fixed:result.filter(r=>r.id!==label.id),faces,obstacles});\n  const [replacement]=layoutWorldLabels(');
const {layoutWorldLabels,trace}=loadLabelSearch(traced),eps=1/64,[dx,dy]=prereg.deltaFromCapturedCandidate;
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const explain=t=>({target:t.target,avoid:t.avoid,blockers:[...(overlap(t.target,t.avoid)?['own-avoid']:[]),...t.faces.filter(v=>overlap(t.target,v)).map(v=>'face:'+v.id),...t.obstacles.flatMap((v,i)=>overlap(t.target,v)?['HUD:'+i]:[]),...t.fixed.filter(v=>overlap(t.target,v.rect)).map(v=>'placed-label:'+v.id)]});
assert.deepEqual([dx,dy],[-16,-5]);
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
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{const e=extents.get(a.id),t=a.labelTarget;return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};});
 trace.length=0;
 const baseline=layoutWorldLabels(labels,1280,720,hud,faces),baselineError=Math.max(...baseline.map(l=>diff(l.rect,s.labels.find(v=>v.id===l.id).rect)));
 const originalTrace=explain(trace.find(t=>t.id==='clover'));trace.length=0;
 const candidate=labels.map(l=>l.id!=='clover'?l:{...l,anchorPlacement:{...l.anchorPlacement,rect:{...l.anchorPlacement.rect,x:l.anchorPlacement.rect.x+dx,y:l.anchorPlacement.rect.y+dy}}});
 const placed=layoutWorldLabels(candidate,1280,720,hud,faces),clover=placed.find(l=>l.id==='clover').rect,target=candidate.find(l=>l.id==='clover').anchorPlacement.rect;
 const unchanged=Math.max(...placed.filter(l=>l.id!=='clover').map(l=>diff(l.rect,s.labels.find(v=>v.id===l.id).rect))),fallback=diff(clover,target);
 const captured=s.labels.find(l=>l.id==='clover').rect,rigidError=diff(clover,{...captured,x:captured.x+dx,y:captured.y+dy});
 return{...meta,originalTrace,candidateTrace:explain(trace.find(t=>t.id==='clover')),baselineError,unchanged,fallback,rigidError,clover,pass:baselineError<=eps&&unchanged<=eps&&fallback<=eps&&rigidError<=eps};
});
const result={utc:new Date().toISOString(),sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,raw:prereg.raw,preregistration:{path:preregPath,sha256:sha(await readFile(preregPath))},harnessSha256:sha(await readFile(import.meta.filename)),layoutSourceSha256:sha(source),samples:results.length,maxBaselineError:Math.max(...results.map(r=>r.baselineError)),maxUnchangedError:Math.max(...results.map(r=>r.unchanged)),maxFallback:Math.max(...results.map(r=>r.fallback)),maxRigidError:Math.max(...results.map(r=>r.rigidError)),failures:results.filter(r=>!r.pass).map(r=>r.key),results,productionAcceptance:false,limits:prereg.limits};
await writeFile(resolve(root,'work/v5/CXV/batch-m/clover-fixed-regression-r1/solver-trace.json'),JSON.stringify(result,null,2)+'\n');
const bad=results.filter(r=>!r.pass),counts={};for(const r of bad)for(const b of r.candidateTrace.blockers)counts[b]=(counts[b]??0)+1;
console.log(JSON.stringify({samples:results.length,failures:bad.length,blockers:counts,examples:[bad[0],bad.reduce((a,b)=>a.fallback>b.fallback?a:b),bad.at(-1)]}));
