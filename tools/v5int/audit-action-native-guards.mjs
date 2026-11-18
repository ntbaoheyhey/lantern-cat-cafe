/** Reproduce a frozen native-body guard proposal using the served layout source. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..'),[deliveryPath,output]=process.argv.slice(2).map(p=>resolve(p));
assert(deliveryPath&&output&&!existsSync(output));
const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
async function read(item){
 const b=await readFile(item.path);assert.equal(sha(b),item.sha256,item.path);hashes[item.path]=item.sha256;return JSON.parse(b);
}
const deliveryBytes=await readFile(deliveryPath),d=JSON.parse(deliveryBytes);
const raw=await read(d.input),analysis=await read(d.analysis),declared=await read(d.rows);
await read(d.preregistration);
assert.equal(sha(await readFile(d.harness.path)),d.harness.sha256);
assert.equal(raw.sourceCommit,d.sourceCommit);assert.equal(raw.indexSha256,d.indexSha256);assert.equal(raw.url,d.url);
const source=execFileSync('git',['show',`${d.sourceCommit}:${d.layoutSource.path}`],{cwd:root,encoding:'utf8'});
assert.equal(sha(source),d.layoutSource.sha256);
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {layoutWorldLabels}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const commissioned=new Set(['mochi','clover']);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const samples=[...raw.rows.map((row,i)=>({key:`state-${i}`,snapshot:row.snapshot,mode:row.mode,cat:row.cat,skill:row.skill,ms:row.ms,pixel:false})),
 ...raw.cases.map(c=>({key:c.key,snapshot:c.before,mode:c.mode,cat:c.cat,skill:c.skill,ms:c.ms,pixel:true}))];
assert.equal(samples.length,136);assert.equal(declared.length,samples.length);
const results=[];
for(let i=0;i<samples.length;i++){
 const sample=samples[i],s=sample.snapshot,claim=declared[i];assert.equal(sample.key,claim.key);
 const actors=JSON.parse(s.battle).actors,offsets=new Map();
 for(const label of s.labels){
  const node=s.labelPaintState.find(p=>p.actor===label.id&&p.class==='b3-world');
  const matrix=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);assert.deepEqual(matrix.slice(0,4),[1,0,0,1]);
  offsets.set(label.id,{x:label.rect.x-node.rect.x+matrix[4],y:label.rect.y-node.rect.y+matrix[5],width:label.rect.width,height:label.rect.height});
 }
 const project=box=>({...box,x:box.x+s.host.x,y:box.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
 const native=s.anchors.filter(a=>a.visible&&a.body&&!commissioned.has(a.id)).map(a=>{const b=project(a.body);return{...b,x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12,id:a.id};});
 assert.deepEqual(native,claim.nativeGuards);
 const labels=s.anchors.filter(a=>a.visible&&offsets.has(a.id)).map(a=>{
  const e=offsets.get(a.id),target=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},
   ...(target?{anchorPlacement:{rect:{...e,x:target.x+s.host.x+e.x,y:target.y+s.host.y+e.y},avoid:project(target.avoid)}}:{})};
 });
 const hud=s.hud.map(h=>h.rect),baseline=layoutWorldLabels(labels,1280,720,hud,faces);
 const error=Math.max(...baseline.flatMap(b=>Object.keys(b.rect).map(k=>Math.abs(b.rect[k]-s.labels.find(l=>l.id===b.id).rect[k]))));
 assert.equal(error,claim.baselineError);
 const candidate=layoutWorldLabels(labels.map(({anchorPlacement,...ordinary})=>ordinary),1280,720,hud,faces);
 for(const label of labels.filter(l=>l.anchorPlacement).sort((a,b)=>a.id.localeCompare(b.id))){
  const target=label.anchorPlacement;
  const [replacement]=layoutWorldLabels([{id:label.id,side:label.side,rect:target.rect}],1280,720,
   [...hud,...faces,...candidate.filter(x=>x.id!==label.id).map(x=>x.rect),target.avoid,...native],[]);
  candidate[candidate.findIndex(c=>c.id===label.id)]=replacement;
 }
 const ordinaryUnchanged=candidate.filter(c=>!commissioned.has(c.id)).every(c=>JSON.stringify(c)===JSON.stringify(baseline.find(b=>b.id===c.id)));
 assert.equal(ordinaryUnchanged,claim.ordinaryUnchanged);
 const metrics=[];
 for(const id of ['clover','mochi']){
  const got=candidate.find(c=>c.id===id),old=baseline.find(c=>c.id===id),target=labels.find(l=>l.id===id).anchorPlacement;
  const expected=claim.labels.find(c=>c.id===id);assert.deepEqual(got.rect,expected.candidate);assert.deepEqual(old.rect,expected.baseline);assert.deepEqual(target.rect,expected.target);
  const moved=Math.hypot(got.rect.x-old.rect.x,got.rect.y-old.rect.y),targetDistance=Math.hypot(got.rect.x-target.rect.x,got.rect.y-target.rect.y);
  assert.equal(moved,expected.fromBaselineCSSpx);assert.equal(targetDistance,expected.fromTargetCSSpx);assert.equal(got.feasible,expected.feasible);
  const nativeHits=native.filter(b=>overlap(b,got.rect)).map(b=>b.id);assert.deepEqual(nativeHits,expected.nativeIntersections);
  const ownClear=!overlap(got.rect,target.avoid),restClear=!faces.concat(hud,candidate.filter(c=>c.id!==id).map(c=>c.rect)).some(b=>overlap(got.rect,b));
  assert.equal(ownClear,expected.ownBodyClear);assert.equal(restClear,expected.facesHudOtherLabelsClear);assert.equal(targetDistance>got.rect.width,expected.associationRisk);
  metrics.push({id,moved,targetDistance,associationRisk:expected.associationRisk,geometryClear:got.feasible&&!nativeHits.length&&ownClear&&restClear});
 }
 const {snapshot,...meta}=sample;results.push({...meta,baselineError:error,ordinaryUnchanged,labels:metrics});
}
const labels=results.flatMap(r=>r.labels),bad=results.filter(r=>r.baselineError>1/64);
assert.equal(Math.max(...results.map(r=>r.baselineError)),d.maxBaselineErrorCSSpx);
assert.equal(Math.max(...labels.map(l=>l.moved)),d.maxDisplacementCSSpx);
assert.equal(labels.filter(l=>l.associationRisk).length,d.associationRiskCount);
assert.equal(bad.length===0,d.baselineReproduced);assert.equal(labels.every(l=>l.geometryClear),d.candidateGeometryClear);
assert.equal(analysis.cases.filter(c=>c.valid).length,d.validPixelSnapshots);
const result={utc:new Date().toISOString(),delivery:{path:deliveryPath,sha256:sha(deliveryBytes)},sourceCommit:d.sourceCommit,indexSha256:d.indexSha256,url:d.url,
 toolSha256:sha(await readFile(import.meta.filename)),layoutSource:d.layoutSource,verifiedInputs:hashes,samples:results.length,
 labelComparisons:labels.length,baselineFailedRows:bad.map(({labels,...row})=>row),pixelBaselinesReproduced:results.filter(r=>r.pixel).every(r=>r.baselineError<=1/64),
 maxBaselineErrorCSSpx:d.maxBaselineErrorCSSpx,maxDisplacementCSSpx:d.maxDisplacementCSSpx,associationRiskCount:d.associationRiskCount,
 ordinaryUnchanged:results.every(r=>r.ordinaryUnchanged),candidateGeometryClear:d.candidateGeometryClear,
 decision:'REJECT source adoption: motion rectangle guard can detach labels substantially;20 noncontact baseline rows are not reproduced.',
 productionAcceptance:false,imagesViewed:0,limits:['Independent reuse of exact served layout implementation verifies the reported offline proposal, not a new application candidate.',
 'Six-pixel native guard expansion is fixed; body rectangles and frozen layouts do not establish actual painted or all-frame clearance.',
 'Fourteen contact attributions are valid; two Mallow ultimate controls remain invalid. No screenshot was viewed.']};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({samples:result.samples,labelComparisons:result.labelComparisons,baselineFailures:bad.length,pixelBaselinesReproduced:result.pixelBaselinesReproduced,maxDisplacement:result.maxDisplacementCSSpx,associationRiskCount:result.associationRiskCount}));
