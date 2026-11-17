/** Bind real forge actions, immutable audio measurements and the installed implementation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {runtimeSignature} from '../../../scripts/audio/runtime-signature.mjs';
import {decodedDuration} from './duration.mjs';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-ship/S11/forge-install-review-1.json');assert(!existsSync(out)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(resolve(root,p))),signed=p=>({path:p,sha256:hash(readFileSync(resolve(root,p)))});
const verify=r=>{const b=readFileSync(resolve(root,r.path));assert.equal(hash(b),r.sha256);if(r.bytes!==undefined)assert.equal(b.length,r.bytes);return b;};
const base='reports/v4-ship/S5/forge-native-install-1/',check=read(base+'check.json'),validation=read(base+'validation.json'),row=check.rows[0];assert.equal(check.rows.length,1);assert.equal(row.name,'forge');
verify(check.harness);const signature=runtimeSignature(root);assert.deepEqual(check.signature,signature);
const studyPath='reports/v4-ship/S11/forge-install-study-1.json',study=read(studyPath);verify(study.harness);verify(study.raw);assert(study.pass);assert.deepEqual(study.signature,signature);
const tapPath='reports/v4-ship/S11/forge-capture-tap-1.json',tap=read(tapPath);verify(tap.harness);tap.rows.forEach(r=>verify(r.capture));
assert.equal(hash(readFileSync(resolve(root,tap.original.path))),tap.guardedSha256);
assert.equal(hash(execFileSync('git',['show','52aaaba39:'+tap.original.path],{cwd:root})),tap.original.sha256);
assert(tap.originalFailurePreserved&&tap.offlineExactWithGuard&&tap.liveRecordingBoth);
verify(row.capture);const events=JSON.parse(gunzipSync(verify(row.events)));
const oldPath='reports/v4-ship/S5/palette-coverage-1/check.json',old=read(oldPath),oldRow=old.rows.find(r=>r.name==='forge');verify(oldRow.capture);const oldEvents=JSON.parse(gunzipSync(verify(oldRow.events)));
assert.deepEqual(old.harness,check.harness);assert.deepEqual(oldRow.settings,row.settings);
const runtimeChanges=signature.filter(r=>old.signature.find(p=>p.path===r.path)?.sha256!==r.sha256).map(r=>r.path);assert.deepEqual(runtimeChanges,['apps/web/src/audio/engine.ts']);
const cues=data=>['ui.forge.hammer','ui.forge.success','voice.mochi.forge'].map(id=>{
 const requests=data.requests.filter(r=>r.id===id),played=requests.filter(r=>data.starts.some(s=>s.id===id&&s.request?.performanceMs===r.performanceMs));
 return {id,requests:requests.length,played:played.length,actualStarts:data.starts.filter(s=>s.id===id).length};
});
const before=cues(oldEvents),after=cues(events);assert.deepEqual(after.map(r=>[r.requests,r.played,r.actualStarts]),[[6,6,6],[6,6,6],[3,3,3]]);
assert(events.starts.filter(s=>s.id==='ui.forge.hammer'||s.id==='ui.forge.success').every(s=>s.pack==='native-forge'&&s.offset===0));
const nativeHits=events.hits.filter(h=>['ui.forge.hammer','ui.forge.success'].includes(h.id)&&h.result==='played');assert.equal(nativeHits.length,12);assert(nativeHits.every(h=>h.layers.length===2));
const audioResources=data=>data.resources.map(r=>r.path).sort();assert.deepEqual(audioResources(events),audioResources(oldEvents));
const duration=decodedDuration(resolve(root,row.capture.path));
const result=spawnSync('ffmpeg',['-hide_banner','-i',resolve(root,row.capture.path),'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8'});assert.equal(result.status,0);
const tail=result.stderr.slice(result.stderr.lastIndexOf('Summary:')),integrated=Number(tail.match(/I:\s*([-\d.]+) LUFS/)[1]),lra=Number(tail.match(/LRA:\s*([-\d.]+) LU/)[1]),peak=Number(tail.match(/Peak:\s*([-\d.]+) dBFS/)[1]);
const durationPass=row.actualSeconds>=90&&duration.encodedSeconds>=90&&duration.timestampSpanSeconds>=90;
const acousticPass=[row.integratedLufs,integrated].every(v=>v>=-20&&v<=-16)&&[row.lra,lra].every(v=>v>=5)&&[row.truePeakDbTP,peak].every(v=>v<=-1);
const regPath='reports/v4-ship/S11/forge-native-install-regression-1/check.json',reg=read(regPath);verify(reg.log);assert(reg.complete);
assert.deepEqual(Object.fromEntries(reg.rows.map(r=>[r.name,r.exitCode])),{server:0,rules:0,web:1,typecheck:0,'parity-probe':0,build:0});
const log=p=>gunzipSync(readFileSync(resolve(root,p))).toString().trim().split('\n').map(JSON.parse),lines=(rs,name)=>rs.filter(r=>r.name===name).map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n');
const failures=rs=>lines(rs,'web').filter(l=>l.includes(' FAIL ')).map(l=>l.trim()),current=log(reg.log.path),previous=log('reports/v4-ship/S11/qa-prerequisites-regression-1/log.jsonl.gz');assert.equal(failures(current).length,7);assert.deepEqual(failures(current),failures(previous));
const parityPath='reports/v4-ship/S11/forge-native-install-regression-1/parity-probe.json';assert.deepEqual(read(parityPath).rows,read('reports/v4-ship/S11/qa-prerequisites-regression-1/parity-probe.json').rows);
const testSummaries=['server','rules','web'].map(name=>({name,lines:lines(current,name).filter(l=>/\bTests\s/.test(l)).map(l=>l.trim())}));
const scopedPass=durationPass&&acousticPass&&row.rollingAll.max<=6&&row.maxUiDurationMs<=300&&validation.rows[0].duckDepthPass&&validation.rows[0].recoveryPass&&validation.rows[0].pageErrors.length===0&&validation.rows[0].voiceInterruptions===0;
const report={at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),inputs:[studyPath,tapPath,base+'check.json',base+'validation.json',oldPath,regPath,parityPath,'scripts/audio/capture-page.mjs','tools/v4ship-lab/audio/validate.mjs','apps/web/src/audio/engine.test.ts','reports/v4-ship/S11/forge-native-focused-1.json','reports/v4-ship/S11/forge-native-focused-2.log.gz'].map(signed),
 runtimeChanges,before,after,all12ForgeHitsRetainBothLayerIdentities:true,audioResourcePathsUnchanged:true,scenesCaptured:['forge'],duration:{wallSeconds:row.actualSeconds,...duration,pass:durationPass},
 acoustic:{before:{lufs:oldRow.integratedLufs,lra:oldRow.lra,peak:oldRow.truePeakDbTP},loudnorm:{lufs:row.integratedLufs,lra:row.lra,peak:row.truePeakDbTP},ebur128:{lufs:integrated,lra,peak},pass:acousticPass},
 observation:validation.rows[0],maxUiDurationMs:row.maxUiDurationMs,requestToScheduleMs:row.requestToScheduleMs,
 regression:{sameSevenArtFailures:true,threeParityRowsIdentical:true,testSummaries,focusedPass:45,gRegPass:false,officialClassParityPass:false},
 originalEncodedAndRepeatRenderFailuresRetained:true,independentRepeatRenderFailures:study.summary.reduce((n,r)=>n+r.nominalIndependentRenderFailures,0),
 scopedForgePass:!!scopedPass,allScenesRevalidated:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,out),before,after,duration:report.duration,acoustic:report.acoustic,observation:report.observation,testSummaries,scopedForgePass:report.scopedForgePass}));if(!scopedPass)process.exitCode=1;
