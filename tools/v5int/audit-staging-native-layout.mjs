/** Replay the exact served layout and original Mochi target for staging samples. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const [rawPath,rulesPath,output]=process.argv.slice(2).map(p=>resolve(p));
assert(rawPath&&rulesPath&&output&&!existsSync(output));
const sha=b=>createHash('sha256').update(b).digest('hex');
const rawBytes=await readFile(rawPath),raw=JSON.parse(rawBytes);
const rulesBytes=await readFile(rulesPath),rules=JSON.parse(rulesBytes);
assert.deepEqual(rules.raw,{path:rawPath,sha256:sha(rawBytes)});
assert(rules.fullBattleExact&&raw.pass);
assert.equal(rules.suite,'full');
assert.equal(rules.actions,rules.pilot?1:16);
if(!rules.pilot)assert(rules.normalReducedParity);
assert(raw.runtimeDiagnostic.lowerBodyLabel);
assert.deepEqual(raw.viewport,[1280,720]);
const preregBytes=await readFile(raw.preregistration.path);
assert.equal(sha(preregBytes),raw.preregistration.sha256);
const prereg=JSON.parse(preregBytes);
assert(prereg.lowerBodyLabel&&prereg.displayedFrameGate);
assert.equal(prereg.geometryHz,60);
assert.deepEqual(prereg.pixelTimes,{'panko-1':[0,125,225,250,325,350,475,625,775,800]});
for(const k of ['sourceCommit','indexSha256','url'])assert.equal(raw[k],rules[k]);
const sourceFiles=['apps/web/src/game/cardrpg/battle-v3/world-label-layout.ts','apps/web/src/game/cardrpg/spine/scene.ts'];
const sources=sourceFiles.map(p=>execFileSync('git',['show',raw.sourceCommit+':'+p],{cwd:root}));
// projectAnchors preserves the original hp socket in anchor.y before label layout.
assert(sources[1].toString().includes('x:face.x,y:hp.y,labelX:hp.x,labelY:hp.y'));
assert(sources[1].toString().includes("anchor.labelTarget={x:hp.x,y:hp.y+(entry.asset==='clover'?5:0),avoid:body}"));
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const js=ts.transpileModule(sources[0].toString(),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {layoutWorldLabels}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const key=a=>[a.mode,a.cat,a.skill,a.ms].join('-');
const expectedRows=[],expectedPixels=[];
for(const action of raw.actions){
 const duration=action.plan.duration;
 const pixels=action.cat==='panko'&&action.skill===1?[0,125,225,250,325,350,475,625,775,800]:[action.skill===4?1100:350];
 const dense=Array.from({length:Math.floor(duration*60/1000)+1},(_,i)=>Number((i*1000/60).toFixed(6)));
 const times=[...new Set([...dense,...pixels,0,175,250,350,600,1100,duration-.0001,duration].filter(t=>t<=duration))].sort((a,b)=>a-b);
 expectedRows.push(...times.map(ms=>key({...action,ms})));
 expectedPixels.push(...pixels.map(ms=>key({...action,ms})));
}
assert.deepEqual(raw.rows.map(key),expectedRows);
assert.deepEqual(raw.cases.map(key),expectedPixels);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const tol=1/64,results=[];
for(const sample of [...raw.rows.map(r=>({...r,kind:'geometry'})),...raw.cases.map(r=>({...r,snapshot:r.before,kind:'pixel'}))]){
 const s=sample.snapshot,actors=JSON.parse(s.battle).actors,extents=new Map();
 for(const label of s.labels){
  const node=s.labelPaintState.find(p=>p.actor===label.id&&p.class==='b3-world');
  const m=node.transform.match(/^matrix\(([^)]+)\)$/)[1].split(',').map(Number);
  assert.deepEqual(m.slice(0,4),[1,0,0,1]);
  extents.set(label.id,{x:label.rect.x-node.rect.x+m[4],y:label.rect.y-node.rect.y+m[5],width:label.rect.width,height:label.rect.height});
 }
 const project=b=>({...b,x:b.x+s.host.x,y:b.y+s.host.y});
 const faces=s.anchors.filter(a=>a.visible&&a.face).map(a=>({...project(a.face),id:a.id}));
 const labels=s.anchors.filter(a=>a.visible&&extents.has(a.id)).map(a=>{
  const e=extents.get(a.id),t=a.labelTarget;
  return{id:a.id,side:actors.find(x=>x.id===a.id).side,rect:{...e,x:a.labelX+s.host.x+e.x,y:a.labelY+s.host.y+e.y},
   ...(t?{anchorPlacement:{rect:{...e,x:t.x+s.host.x+e.x,y:t.y+s.host.y+e.y},avoid:project(t.avoid)}}:{})};
 });
 const hud=s.hud.map(h=>h.rect),replay=layoutWorldLabels(labels,1280,720,hud,faces);
 assert.equal(replay.length,s.labels.length);
 const errors=replay.map(l=>Math.max(...['x','y','width','height'].map(k=>Math.abs(l.rect[k]-s.labels.find(x=>x.id===l.id).rect[k]))));
 const anchor=s.anchors.find(a=>a.id==='mochi'),target=labels.find(l=>l.id==='mochi').anchorPlacement.rect;
 const bodyBottom=s.host.y+Math.max(anchor.body.y+anchor.body.height,anchor.footY);
 assert(Math.abs(target.y-bodyBottom-6)<1e-9);
 const original=structuredClone(labels);
 original.find(l=>l.id==='mochi').anchorPlacement.rect.y=anchor.y+s.host.y+extents.get('mochi').y;
 const baseline=layoutWorldLabels(original,1280,720,hud,faces);
 const changedOther=replay.filter(l=>l.id!=='mochi'&&JSON.stringify(l.rect)!==JSON.stringify(baseline.find(x=>x.id===l.id).rect)).map(l=>l.id);
 const mochi=replay.find(l=>l.id==='mochi'),axis=anchor.labelTarget.x+s.host.x;
 const drift=Math.hypot(mochi.rect.x-target.x,mochi.rect.y-target.y),gap=mochi.rect.y-bodyBottom;
 const association=drift<=12&&gap>=6-1e-9&&gap<=18&&mochi.rect.x<=axis&&mochi.rect.x+mochi.rect.width>=axis;
 const native=s.anchors.filter(a=>a.visible&&a.body&&!['mochi','clover'].includes(a.id)).map(a=>{
  const b=project(a.body);return{...b,x:b.x-6,y:b.y-6,width:b.width+12,height:b.height+12,id:a.id};
 });
 const blockers=[...hud.map((r,i)=>({...r,id:'hud'+i})),...faces.map(r=>({...r,id:'face:'+r.id})),...native.map(r=>({...r,id:'native:'+r.id})),...replay.filter(l=>l.id!=='mochi').map(l=>({...l.rect,id:'label:'+l.id}))];
 const hits=blockers.filter(b=>overlap(mochi.rect,b)).map(b=>b.id);
 results.push({key:key(sample),kind:sample.kind,labels:replay.length,maxErrorCSSpx:Math.max(...errors),drift,gap,associationDesignBounds:association,otherLabelsChanged:changedOther,blockers:hits,feasible:mochi.feasible});
}
const failures=results.filter(r=>r.maxErrorCSSpx>tol||r.otherLabelsChanged.length||r.blockers.length||!r.feasible||!r.associationDesignBounds);
const result={utc:new Date().toISOString(),raw:rules.raw,rulesAudit:{path:rulesPath,sha256:sha(rulesBytes)},toolSha256:sha(await readFile(import.meta.filename)),
 sourceCommit:raw.sourceCommit,indexSha256:raw.indexSha256,url:raw.url,sourceFiles:sourceFiles.map((path,i)=>({path,sha256:sha(sources[i])})),
 geometryRows:expectedRows.length,pixelCases:expectedPixels.length,samples:results.length,labels:results.reduce((n,r)=>n+r.labels,0),
 maxErrorCSSpx:Math.max(...results.map(r=>r.maxErrorCSSpx)),maxDrift:Math.max(...results.map(r=>r.drift)),gapRange:[Math.min(...results.map(r=>r.gap)),Math.max(...results.map(r=>r.gap))],
 otherLabelsUnchanged:results.every(r=>r.otherLabelsChanged.length===0),failedSamples:failures.length,failures,geometryAccepted:failures.length===0,productionAcceptance:false,imagesViewed:0,
 limits:['Exact explicit staging schedule; seeded states are not natural reachability.','Observed DOM extents are inputs; CSS measurement is not independently reproduced.','Original Mochi hp target reconstructed from source anchor.y; Clover diagnostic retained in both layouts.','Association design bounds do not prove perceived ownership.','Native body margin checks are rejection gates, not live solver constraints.','No painted-body, fringe/halo, seam, performance or release acceptance.']};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({samples:result.samples,labels:result.labels,maxErrorCSSpx:result.maxErrorCSSpx,otherLabelsUnchanged:result.otherLabelsUnchanged,failedSamples:result.failedSamples}));
