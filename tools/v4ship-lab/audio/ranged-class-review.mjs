/** Recompute source/phase checks from signed raw events, independent of cached pass flags. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-class-review-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),read=path=>JSON.parse(readFileSync(resolve(root,path))),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const verify=s=>{assert.equal(hash(readFileSync(resolve(root,s.path))),s.sha256);return s;};
const inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath),inputs=[signed(inventoryPath)],experiments=[];
const expectedCases=new Set(inventory.rows.flatMap(c=>[1280,1440].flatMap(w=>[1,2,3].flatMap(s=>['authored','clear-terminal-slot'].map(v=>[c.id,w,s,v].join('|'))))));
for(const name of ['ranged-class-playback-1','ranged-class-speed-playback-1']){
 const path=`reports/v4-ship/S11/${name}.json`,report=read(path);inputs.push(signed(path),verify(report.events));
 report.harness.forEach(verify);report.inputs.forEach(verify);verify(report.candidate);report.captures.forEach(verify);
 const manifest=read('apps/web/public/audio/manifest.json'),patch=read(report.candidate.path),designs={...manifest.designs,...patch.designs};
 const rows=JSON.parse(gunzipSync(readFileSync(resolve(root,report.events.path)))),cases=new Set(),review=[];
 for(const row of rows){
  const c=inventory.rows.find(c=>c.id===row.id),key=[row.id,row.viewport.width,row.speed,row.speech].join('|');assert(c&&!cases.has(key)&&expectedCases.has(key));cases.add(key);
  const data=row.data,expectedRoles=c.originalTrack.filter(k=>(!c.hasFlight||k.role!=='movement')&&(row.speech==='authored'||k.role!=='voice')).map(k=>k.role).concat(c.hasFlight?['release','travel']:[],['terminal']).sort();
  const roleCoverage=JSON.stringify(row.operations.map(o=>o.role).sort())===JSON.stringify(expectedRoles);
  const operations=row.operations.map(op=>{
   const starts=data.starts.filter(s=>s.request===op.request),results=data.results.filter(r=>r.request===op.request),request=data.requests.find(r=>r.sequence===op.request);
   const designKey=op.cue.startsWith('ult.')?`kit.${op.element}.${op.cue.split('.').at(-1)}`:manifest.bindings?.[op.cue]??op.cue,design=designs[designKey];
   const expected=op.cue.startsWith('voice.')?1:design?.baked?1:design?.layers.length;
   const required=op.role!=='terminal'||row.speech==='clear-terminal-slot';
   return {role:op.role,cue:op.cue,submittedMs:op.submittedMs,expected,starts:starts.length,results:results.map(r=>r.result),requestMatched:request?.id===op.cue,pass:request?.id===op.cue&&expected!==undefined&&(!required||starts.length===expected&&results.some(r=>r.result==='played'))};
  });
  const groups=new Set(data.starts.map(s=>`${s.group}|${s.id}`));
  const natural=data.activeAtEnd===0&&data.starts.length===data.ended.length&&data.ended.every(e=>!e.stopped&&groups.has(`${e.group}|${e.id}`))&&[...groups].every(g=>data.starts.filter(s=>`${s.group}|${s.id}`===g).length===data.ended.filter(e=>`${e.group}|${e.id}`===g).length);
  const times=data.starts.map(s=>s.callPerformanceMs).sort((a,b)=>a-b),peak=times.reduce((max,t)=>Math.max(max,times.filter(x=>x>=t&&x<t+100).length),0);
  const voiceRequests=data.requests.filter(r=>r.id.startsWith('voice.')),terminal=operations.find(o=>o.role==='terminal'),clear=row.speech!=='clear-terminal-slot'||voiceRequests.length===1&&voiceRequests[0].id==='voice.yarn-giant.death'&&terminal.starts===1;
  const impact=operations.filter(o=>o.role==='impact'),flight=operations.filter(o=>o.role==='release'||o.role==='travel');
  const fixedContact=impact.length===1&&row.operations.find(o=>o.role==='impact').t===c.impactMs&&impact[0].submittedMs>=c.impactMs;
  const beforeContact=c.hasFlight?flight.length===2&&flight.every(o=>o.submittedMs<c.impactMs):flight.length===0;
  const sourcePass=roleCoverage&&operations.every(o=>o.pass)&&natural&&peak<=6&&clear&&fixedContact;
  review.push({key,roleCoverage,operations,natural,peak,clear,fixedContact,beforeContact,sourcePass,pass:sourcePass&&beforeContact});
 }
 experiments.push({name,cases:cases.size,allExpectedCases:cases.size===expectedCases.size,sourcePassed:review.filter(r=>r.sourcePass).length,preContactPassed:review.filter(r=>r.beforeContact).length,peak:Math.max(...review.map(r=>r.peak)),suppressedAuthoredTerminals:review.filter(r=>r.key.endsWith('|authored')&&r.operations.find(o=>o.role==='terminal').starts===0).length,pass:cases.size===expectedCases.size&&review.every(r=>r.pass),rows:review});
}
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',harness:signed(relative(root,import.meta.filename)),inputs,experiments,candidatePass:experiments.at(-1).pass,
 scope:'Recompute each source role, exact request, admission count, clear terminal isolation, natural completion, rolling actual-start budget and fixed contact from signed raw logs. Compare original and speed-aware runs without relying on their cached pass flags.',
 limits:['Constant speeds only; changing speed during an action still needs production scheduler coverage.','Isolated predecoded scenes cannot establish production preloading, full-mix loudness or recognition.','Physical audiovisual onset and human listening remain unverified.'],overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),experiments:experiments.map(({rows,...r})=>r),candidatePass:report.candidatePass}));if(!report.candidatePass)process.exitCode=1;
