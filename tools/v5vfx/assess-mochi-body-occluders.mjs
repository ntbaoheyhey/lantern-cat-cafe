/** Fixed offline question: original authored target plus other-body obstacles. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {loadLabelSearch,root} from './label-search-prototype.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const prePath=resolve(process.argv[2]),out=resolve(process.argv[3]),preBytes=await readFile(prePath),pre=JSON.parse(preBytes);
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/')&&!existsSync(out));
assert.equal(sha(await readFile(import.meta.filename)),pre.harness.sha256);
const rawBytes=await readFile(pre.input.path);assert.equal(sha(rawBytes),pre.input.sha256);
const raw=JSON.parse(rawBytes);assert.equal(raw.sourceCommit,pre.sourceCommit);assert.equal(raw.indexSha256,pre.indexSha256);assert.deepEqual(raw.fixture.mediaCats,['mochi']);
const sourcePath='apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts';
const source=execFileSync('git',['show',pre.sourceCommit+':'+sourcePath],{cwd:'/Users/bao/taskbar-hero-chain',encoding:'utf8'}),{layoutWorldLabels}=loadLabelSearch(source);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const expand=(r,p)=>({...r,x:r.x-p,y:r.y-p,width:r.width+2*p,height:r.height+2*p});
const diff=(a,b)=>Math.max(...['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])));
const samples=[...raw.rows.map((r,i)=>({...r,key:'row-'+i,s:r.snapshot})),...raw.cases.map(c=>({...c,s:c.before}))].filter(r=>r.placement==='baseline');
assert.equal(samples.length,pre.samples);
const results=samples.map(({s,key,method,mode,cat,skill,probeMs,ms})=>{
 const extents=new Map(),actors=JSON.parse(s.battle).actors;
 for(const label of s.labels){
  const node=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world'),t=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(t.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-node.rect.x+t[4],y:label.rect.y-node.rect.y+t[5],width:label.rect.width,height:label.rect.height});
 }
 const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
  const e=extents.get(a.id),t=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};
 });
 const hud=s.hud.map(x=>x.rect),original=layoutWorldLabels(labels,1280,720,hud,faces);
 const replayError=Math.max(...original.map(x=>diff(x.rect,s.labels.find(l=>l.id===x.id).rect)));
 const owner=s.anchors.find(a=>a.id==='mochi'),target=labels.find(l=>l.id==='mochi').anchorPlacement;
 const fixed=original.filter(x=>x.id!=='mochi'),native=s.anchors.filter(a=>a.visible&&a.body&&a.id!=='mochi').map(a=>({...expand(project(a.body),pre.bounds.bodyPadding),id:a.id}));
 const blocked=[...hud,...faces,...fixed.map(x=>x.rect),target.avoid,...native];
 const [candidate]=layoutWorldLabels([{id:'mochi',side:'party',rect:target.rect}],1280,720,blocked,[]);
 const baseline=original.find(x=>x.id==='mochi'),displacement=Math.hypot(candidate.rect.x-target.rect.x,candidate.rect.y-target.rect.y),axis=owner.labelTarget.x+s.host.x;
 const failures=[];
 if(replayError>pre.bounds.epsilon)failures.push('reconstruction');
 if(!candidate.feasible||blocked.some(b=>overlap(candidate.rect,b)))failures.push('geometry');
 if(displacement>pre.bounds.maxDisplacement+pre.bounds.epsilon)failures.push('displacement');
 if(axis<candidate.rect.x||axis>candidate.rect.x+candidate.rect.width)failures.push('axis');
 return{key,method,mode,cat,skill,probeMs,ms,replayError,target:target.rect,baseline,candidate,displacement,axis,baselineFallback:Math.hypot(baseline.rect.x-target.rect.x,baseline.rect.y-target.rect.y),native,otherLabelsSha256:sha(JSON.stringify(fixed)),failures};
});
const failureCounts={};for(const r of results)for(const f of r.failures)failureCounts[f]=(failureCounts[f]??0)+1;
const summary={samples:results.length,failures:results.filter(r=>r.failures.length).length,failureCounts,maxReplayError:Math.max(...results.map(r=>r.replayError)),maxDisplacement:Math.max(...results.map(r=>r.displacement)),maxBaselineFallback:Math.max(...results.map(r=>r.baselineFallback))};
const report={utc:new Date().toISOString(),preregistration:{path:prePath,sha256:sha(preBytes)},input:pre.input,sourceCommit:pre.sourceCommit,indexSha256:pre.indexSha256,url:raw.url,source:{path:sourcePath,sha256:sha(source)},harnessSha256:pre.harness.sha256,summary,results,productionAcceptance:false,imagesViewed:0,limits:pre.limits};
await mkdir(out);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary));
