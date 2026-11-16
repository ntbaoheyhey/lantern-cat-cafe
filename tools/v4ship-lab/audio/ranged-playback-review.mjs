/** Review every source role and natural completion without changing signed experiments. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-playback-review-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const manifest=read('apps/web/public/audio/manifest.json'),inputs=[],experiments=[];
for(const name of ['ranged-playback-probe-1','ranged-playback-clear-probe-1']){
 const path=`reports/v4-ship/S11/${name}.json`,report=read(path),bytes=readFileSync(resolve(root,report.events.path));assert.equal(hash(bytes),report.events.sha256);
 for(const file of [...report.harness,report.candidate])assert.equal(hash(readFileSync(resolve(root,file.path))),file.sha256,file.path);
 const rows=JSON.parse(gunzipSync(bytes));assert.equal(rows.length,48);inputs.push(signed(path),report.events);
 const reviewed=rows.map(row=>{
  const element=row.owner==='soot'?'ember':'heavy';
  const roles=row.events.map(event=>{
   const expected=['voice','terminal','release','travel'].includes(event.role)?1:event.role==='impact'?(row.impact==='baked-single'?1:4):manifest.designs[`kit.${element}.${event.role}`].layers.length;
   return {role:event.role,cue:event.cue,expected,starts:event.starts.length,results:event.results,pass:event.starts.length===expected&&event.results.includes('played')};
  });
  const starts=row.data.starts,ended=row.data.ended,groups=[...new Set(starts.map(s=>s.group))];
  const naturalCompletion=groups.every(group=>{const s=starts.filter(s=>s.group===group),e=ended.filter(e=>e.group===group);return e.length===s.length&&e.every(e=>!e.stopped);})&&row.data.activeAtEnd===0;
  const voiceRequests=row.data.requests.filter(r=>r.id.startsWith('voice.'));
  const clearTerminalSlot=row.speech!=='clear-terminal-slot'||voiceRequests.length===1&&voiceRequests[0].id==='voice.yarn-giant.death';
  const allSfx=roles.filter(e=>!['voice','terminal'].includes(e.role)).every(e=>e.pass);
  const authoredVoice=roles.filter(e=>e.role==='voice').every(e=>e.pass);
  const terminal=roles.find(e=>e.role==='terminal');
  return {owner:row.owner,ultimate:row.ultimate,speed:row.speed,speech:row.speech,impact:row.impact,peak:row.peak,roles,allSfx,authoredVoice,clearTerminalSlot,naturalCompletion,terminalPlayed:terminal.pass,terminalSuppression:terminal.pass?[]:terminal.results,
   pass:allSfx&&authoredVoice&&naturalCompletion&&row.peak<=6&&clearTerminalSlot&&(row.speech!=='clear-terminal-slot'||terminal.pass)};
 });
 const selected=reviewed.filter(r=>r.impact==='baked-single');
 experiments.push({name,harnessPass:report.pass,selectedCases:selected.length,selectedPass:selected.filter(r=>r.pass).length,allSfxPass:selected.filter(r=>r.allSfx).length,naturalCompletionPass:selected.filter(r=>r.naturalCompletion).length,clearSlotVerified:selected.filter(r=>r.speech==='clear-terminal-slot'&&r.clearTerminalSlot).length,clearTerminalPlayed:selected.filter(r=>r.speech==='clear-terminal-slot'&&r.terminalPlayed).length,authoredTerminalSuppression:selected.filter(r=>r.speech==='authored'&&!r.terminalPlayed).map(r=>({owner:r.owner,ultimate:r.ultimate,speed:r.speed,reasons:r.terminalSuppression})),rows:reviewed,pass:selected.every(r=>r.pass)});
}
const pass=experiments[1].pass;
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',harness:signed(relative(root,import.meta.filename)),inputs,experiments,pass,
 scope:'Post-run role-complete review: charge, release, travel, impact and tail have the expected source counts; every started source ends naturally; authored voice requests and genuine terminal-slot isolation are checked separately. Existing priority/cadence suppression stays explicit.',
 limits:['Only Soot and Binding Thread isolated actions; no neighbouring scene/UI/status starts.','Authored terminal suppression is reported, not overridden or counted as terminal success.','No output capture, complete class coverage, physical onset or human listening proof.'],runtimeChanged:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),pass,experiments:experiments.map(({rows,...e})=>e)}));if(!pass)process.exitCode=1;
