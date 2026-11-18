/** Independent served-source replay of the frozen lower-body label proposal. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),[input,output]=process.argv.slice(2).map(p=>resolve(p));
assert(input&&output&&!existsSync(output));
const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
const read=async ref=>{const b=await readFile(ref.path);assert.equal(sha(b),ref.sha256,ref.path);hashes[ref.path]=ref.sha256;return JSON.parse(b);};
const bytes=await readFile(input),d=JSON.parse(bytes),prereg=await read(d.preregistration),claims=await read(d.rows);
assert.equal(sha(await readFile(d.harness.path)),d.harness.sha256);
const source=execFileSync('git',['show',`${d.sourceCommit}:${d.layoutSource.path}`],{cwd:root});assert.equal(sha(source),d.layoutSource.sha256);
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const js=ts.transpileModule(source.toString(),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {layoutWorldLabels}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
assert.equal(d.inputs.length,4);assert.equal(claims.length,76);const results=[];
for(let index=0;index<d.inputs.length;index++){
 const ref=d.inputs[index],raw=await read(ref),analysis=await read(ref.analysis),spec=prereg.inputs[index];
 assert.equal(raw.sourceCommit,d.sourceCommit);assert.equal(raw.indexSha256,d.indexSha256);assert.equal(raw.url,d.url);
 const samples=[...(spec.states?raw.rows.map((r,i)=>({...r,key:`state-${i}`,s:r.snapshot})):[]),
  ...raw.cases.map((c,i)=>({...c,key:c.key??`${c.mode}-${c.frame}-${i}`,s:c.before,pixelCase:i,valid:analysis.cases[i].valid}))].filter(c=>c.valid!==false);
 assert.equal(samples.length,[14,46,11,5][index]);
 for(const sample of samples){
  const s=sample.s,claim=claims[results.length];assert.equal(claim.input,index);assert.equal(claim.key,sample.key);
  const actors=JSON.parse(s.battle).actors,extents=new Map();
  for(const label of s.labels){const node=s.labelPaintState.find(p=>p.actor===label.id&&p.class==='b3-world');const m=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);assert.deepEqual(m.slice(0,4),[1,0,0,1]);extents.set(label.id,{x:label.rect.x-node.rect.x+m[4],y:label.rect.y-node.rect.y+m[5],width:label.rect.width,height:label.rect.height});}
  const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
  const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
  const native=s.anchors.filter(a=>a.visible&&a.body&&!['mochi','clover'].includes(a.id)).map(a=>{const b=project(a.body);return{...b,x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12,id:a.id};});
  const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{const e=extents.get(a.id),t=a.labelTarget;return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};});
  const hud=s.hud.map(h=>h.rect),baseline=layoutWorldLabels(labels,1280,720,hud,faces);
  const error=Math.max(...baseline.flatMap(b=>['x','y','width','height'].map(k=>Math.abs(b.rect[k]-s.labels.find(l=>l.id===b.id).rect[k]))));assert.equal(error,claim.baselineError);
  const anchor=s.anchors.find(a=>a.id==='mochi'),label=labels.find(a=>a.id==='mochi'),old=baseline.find(a=>a.id==='mochi');
  const target={...label.anchorPlacement.rect,y:s.host.y+Math.max(anchor.footY,anchor.body.y+anchor.body.height)+6};
  const fixed=baseline.filter(l=>l.id!=='mochi'),blockers=[...hud,...faces,...fixed.map(l=>l.rect),label.anchorPlacement.avoid,...native];
  const [candidate]=layoutWorldLabels([{id:'mochi',side:label.side,rect:target}],1280,720,blockers,[]);
  const drift=Math.hypot(candidate.rect.x-target.x,candidate.rect.y-target.y),axis=anchor.labelTarget.x+s.host.x;
  const associated=drift<=12&&candidate.rect.x<=axis&&candidate.rect.x+candidate.rect.width>=axis&&candidate.rect.y>=target.y&&candidate.rect.y<=target.y+12;
  const clear=!blockers.some(b=>overlap(candidate.rect,b));
  assert.deepEqual(target,claim.target);assert.deepEqual(candidate.rect,claim.candidate);assert.deepEqual(old.rect,claim.baseline);
  assert.equal(candidate.feasible,claim.feasible);assert.equal(drift,claim.drift);assert.equal(associated,claim.association);assert.equal(clear,claim.geometryClear);
  assert.deepEqual(fixed.map(l=>({id:l.id,rect:l.rect})),claim.otherLabels);assert(claim.otherLabelsUnchanged);
  assert.deepEqual(native.filter(b=>overlap(candidate.rect,b)).map(b=>b.id),claim.nativeIntersections);
  results.push({input:index,key:sample.key,pixelCase:sample.pixelCase,baselineError:error,target,candidate:candidate.rect,drift,associationDesignBounds:associated,geometryClear:clear&&candidate.feasible,otherLabelsUnchanged:true});
 }
}
const result={utc:new Date().toISOString(),delivery:{path:input,sha256:sha(bytes)},toolSha256:sha(await readFile(import.meta.filename)),sourceCommit:d.sourceCommit,indexSha256:d.indexSha256,url:d.url,layoutSource:d.layoutSource,verifiedHashes:Object.keys(hashes).length,samples:results.length,maxBaselineError:Math.max(...results.map(r=>r.baselineError)),maxDrift:Math.max(...results.map(r=>r.drift)),geometryClear:results.every(r=>r.geometryClear),associationDesignBounds:results.every(r=>r.associationDesignBounds),otherLabelsUnchanged:true,results,productionAcceptance:false,limits:['Frozen development inputs; neither fresh holdouts nor a native rendering.','Observed DOM extents are inputs; CSS measurement is not independently reproduced.','Association limits are declared design bounds, not proof of perceived ownership.','Native guard rectangles are conservative; commissioned neighbor paint requires separate audit.']};
assert.equal(result.maxBaselineError,d.maxBaselineError);assert.equal(result.maxDrift,d.maxDrift);assert.equal(result.geometryClear,d.geometryClear);assert.equal(result.associationDesignBounds,d.associationBounded);
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({samples:result.samples,maxBaselineError:result.maxBaselineError,maxDrift:result.maxDrift,geometryClear:result.geometryClear,associationDesignBounds:result.associationDesignBounds}));
