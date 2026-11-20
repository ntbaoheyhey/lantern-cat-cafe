/** Verify the rejected fixed-target/body-obstacle experiment from retained states. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
const [path,out]=process.argv.slice(2),sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile(path),claim=JSON.parse(bytes);
const load=async ref=>{const b=await readFile(ref.path);assert.equal(sha(b),ref.sha256);return JSON.parse(b);};
const pre=await load(claim.preregistration),raw=await load(claim.input),result=await load(claim.raw);
assert.equal(sha(await readFile(pre.harness.path)),pre.harness.sha256);
assert.deepEqual(raw.fixture.mediaCats,['mochi']);
assert.deepEqual(pre.bounds,{bodyPadding:6,maxDisplacement:12,epsilon:1/64,axis:'owner authored x must remain inside label'});
for(const key of ['sourceCommit','indexSha256','url'])assert.equal(raw[key],claim[key]);
const source=execFileSync('git',['show',`${raw.sourceCommit}:${claim.source.path}`],{encoding:'utf8'});
assert.equal(sha(source),claim.source.sha256);
const {layoutWorldLabels}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const overlap=(a,b)=>Math.max(a.x,b.x)<Math.min(a.x+a.width,b.x+b.width)&&Math.max(a.y,b.y)<Math.min(a.y+a.height,b.y+b.height);
const error=(a,b)=>Math.max(...['x','y','width','height'].map(k=>Math.abs(a[k]-b[k])));
const same=(a,b)=>assert.ok(Math.abs(a-b)<1e-10);
const rows=[...raw.rows.map((r,i)=>({...r,key:`row-${i}`,s:r.snapshot})),...raw.cases.map(c=>({...c,s:c.before}))].filter(r=>r.placement==='baseline');
const verified=[];
for(const {s,key} of rows){
 const wanted=result.results.find(x=>x.key===key);assert.ok(wanted);
 const actors=JSON.parse(s.battle).actors,extents=new Map();
 for(const label of s.labels){
  const node=s.labelPaintState.find(x=>x.actor===label.id&&x.class==='b3-world');
  const t=node.transform.slice(7,-1).split(',').map(Number);assert.deepEqual(t.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-node.rect.x+t[4],y:label.rect.y-node.rect.y+t[5],width:label.rect.width,height:label.rect.height});
 }
 const world=r=>({...r,x:r.x+s.host.x,y:r.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...world(a.face),id:a.id}));
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
  const e=extents.get(a.id),t=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:world(t.avoid)}}:{})};
 });
 const baseline=layoutWorldLabels(labels,1280,720,s.hud.map(x=>x.rect),faces);
 const replayError=Math.max(...baseline.map(x=>error(x.rect,s.labels.find(l=>l.id===x.id).rect)));
 const target=labels.find(x=>x.id==='mochi').anchorPlacement,owner=s.anchors.find(x=>x.id==='mochi'),fixed=baseline.filter(x=>x.id!=='mochi');
 assert.equal(sha(JSON.stringify(fixed)),wanted.otherLabelsSha256);
 const native=s.anchors.filter(x=>x.visible&&x.body&&x.id!=='mochi').map(x=>{const r=world(x.body);return {...r,x:r.x-6,y:r.y-6,width:r.width+12,height:r.height+12,id:x.id};});
 assert.deepEqual(native,wanted.native);
 const obstacles=[...s.hud.map(x=>x.rect),...faces,...fixed.map(x=>x.rect),target.avoid,...native];
 const [candidate]=layoutWorldLabels([{id:'mochi',side:'party',rect:target.rect}],1280,720,obstacles,[]);
 assert.deepEqual(candidate,wanted.candidate);
 const displacement=Math.hypot(candidate.rect.x-target.rect.x,candidate.rect.y-target.rect.y),axis=owner.labelTarget.x+s.host.x;
 const original=baseline.find(x=>x.id==='mochi'),fallback=Math.hypot(original.rect.x-target.rect.x,original.rect.y-target.rect.y);
 same(replayError,wanted.replayError);same(displacement,wanted.displacement);same(fallback,wanted.baselineFallback);same(axis,wanted.axis);
 const failures=[];
 if(replayError>1/64)failures.push('reconstruction');
 if(!candidate.feasible||obstacles.some(o=>overlap(candidate.rect,o)))failures.push('geometry');
 if(displacement>12+1/64)failures.push('displacement');
 if(axis<candidate.rect.x||axis>candidate.rect.x+candidate.rect.width)failures.push('axis');
 assert.deepEqual(failures,wanted.failures);verified.push({key,replayError,displacement,fallback,failures});
}
const failureCounts={};for(const r of verified)for(const k of r.failures)failureCounts[k]=(failureCounts[k]??0)+1;
const summary={samples:verified.length,failures:verified.filter(x=>x.failures.length).length,failureCounts,maxReplayError:Math.max(...verified.map(x=>x.replayError)),maxDisplacement:Math.max(...verified.map(x=>x.displacement)),maxBaselineFallback:Math.max(...verified.map(x=>x.fallback))};
assert.deepEqual(summary,claim.summary);assert.deepEqual(summary,result.summary);
const receipt={utc:new Date().toISOString(),claim:{path,sha256:sha(bytes)},preregistration:claim.preregistration,raw:claim.raw,sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,auditor:{path:import.meta.filename,sha256:sha(await readFile(import.meta.filename))},summary,numericAudit:'PASS',disposition:'REJECT fixed original target with other-body boxes; association fails despite88 clear geometries.',productionAcceptance:false,imagesViewed:0,limits:['Retained development states and repeated methods are not88 independent observations.','No source change or threshold relaxation; no proof that a different presentation design cannot work.','Geometry does not establish full-paint or perceptual ownership acceptance.']};
await writeFile(out,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));
