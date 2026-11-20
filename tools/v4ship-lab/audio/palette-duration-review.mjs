/** Review the two duration retries while retaining all seven original observations. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {spawnSync,execFileSync} from 'node:child_process';
import {assertUnchanged,runtimeSignature} from '../../../scripts/audio/runtime-signature.mjs';
import {decodedDuration} from './duration.mjs';
const root=resolve(import.meta.dirname,'../../..'),output=resolve(root,'reports/v4-ship/S11/palette-coverage-duration-review-1.json');
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(resolve(root,p)));
const reference=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const verify=r=>{const b=readFileSync(resolve(root,r.path));assert.equal(hash(b),r.sha256);if(r.bytes!==undefined)assert.equal(b.length,r.bytes);return b;};
const prePath='reports/v4-ship/S11/palette-coverage-duration-prespec-1.json',pre=read(prePath),original=JSON.parse(verify(pre.originalReview));
verify(original.harness);assert(original.integrityPass&&!original.coverage.allFiveDurationsPass&&!original.overallAudioGatePass);
for(const input of original.inputs)verify(input);
const base='reports/v4-ship/S5/'+pre.trial,check=read(base+'/check.json'),validation=read(base+'/validation.json');
assert.equal(check.trial,pre.trial);assert(check.preload);assert.deepEqual(check.rows.map(r=>r.name),pre.scenes);assert.deepEqual(check.signature,pre.signature);
assert.deepEqual(runtimeSignature(root),pre.signature);verify(check.harness);for(const input of pre.dependencies)verify(input);
for(const file of pre.signature)assert.equal(hash(execFileSync('git',['show',pre.sourceCommit+':'+file.path],{cwd:root,maxBuffer:32*1024*1024})),file.sha256);
const finish=s=>s.endedAudioTime??s.when+s.bufferDuration/s.rate;
function atTime(intervals){
 const points=intervals.flatMap(([start,end])=>[[start,1],[end,-1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let cursor=0,count=0,lastEnd=null;
 return time=>{while(cursor<points.length&&points[cursor][0]<=time){const [t,change]=points[cursor++];count+=change;if(change<0)lastEnd=t;}return {count,lastEnd};};
}
function ebur(path){
 const result=spawnSync('ffmpeg',['-hide_banner','-nostats','-i',resolve(root,path),'-af','ebur128=peak=true:framelog=verbose','-f','null','-'],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.status,0);
 const m=[...result.stderr.matchAll(/Integrated loudness:\s*I:\s*(-?[\d.]+)\s*LUFS[\s\S]*?Loudness range:\s*LRA:\s*([\d.]+)\s*LU[\s\S]*?True peak:\s*Peak:\s*(-?[\d.]+)\s*dBFS/g)].at(-1);assert(m);
 return {lufs:+m[1],lra:+m[2],truePeakDbTP:+m[3]};
}
const gates=m=>({loudness:m.lufs>=-20&&m.lufs<=-16,range:m.lra>=5,peak:m.truePeakDbTP<=-1}),rows=[];
for(const [index,row] of check.rows.entries()){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));verify(row.capture);const data=JSON.parse(gunzipSync(verify(row.events))),v=validation.rows[index];
 assert.equal(data.name,row.name);assert.equal(data.seconds,pre.captureSeconds);assert.equal(row.seconds,pre.captureSeconds);assert.equal(row.actualSeconds,data.ended-data.started);
 assert.equal(data.starts.length,row.sourceStarts);assert.deepEqual(data.errors,row.errors);assert.deepEqual(data.errors,v.pageErrors);
 const decoded=decodedDuration(resolve(root,row.capture.path)),minimum=pre.targetMinimumSeconds;
 const duration={wallSeconds:row.actualSeconds,...decoded,minimumSeconds:minimum,pass:row.actualSeconds>=minimum&&decoded.encodedSeconds>=minimum&&decoded.timestampSpanSeconds>=minimum};assert(duration.pass);
 let max=0;for(const s of data.starts)max=Math.max(max,data.starts.filter(t=>t.when>=s.when&&t.when-s.when<.1-1e-9).length);
 assert.equal(max,row.rollingAll.max);assert.equal(max,v.maxStartsPer100ms);assert.equal(max<=6,v.sourceBudget);
 const voice=data.starts.filter(s=>s.bus==='voice'),duckers=data.starts.filter(s=>s.ducking??(s.bus==='voice'||s.id.startsWith('ult.')));
 const heldAt=atTime(voice.map(s=>[s.when+.1,finish(s)]).filter(i=>i[1]>i[0])),duckAt=atTime(duckers.map(s=>[s.when,finish(s)]));
 const held=[],recovered=[];let previous=-Infinity;
 for(const s of data.samples){assert(s.audioTime>=previous);previous=s.audioTime;if(heldAt(s.audioTime).count>0)held.push(20*Math.log10(s.duck));const d=duckAt(s.audioTime);if(d.count===0&&d.lastEnd!==null&&s.audioTime-d.lastEnd>=.45)recovered.push(s.duck);}
 const duckPass=held.length?held.every(x=>x>=-8.0001&&x<=-3.9999):null,recoveryPass=recovered.length?recovered.every(x=>x>=.995):null;
 assert.equal(held.length,v.heldDuckDb?.samples??0);assert.equal(recovered.length,v.recoverySamples);assert.equal(duckPass,v.duckDepthPass);assert.equal(recoveryPass,v.recoveryPass);
 if(held.length){assert.equal(Math.min(...held),v.heldDuckDb.min);assert.equal(Math.max(...held),v.heldDuckDb.max);}
 const interruptions=voice.filter(s=>finish(s)<s.when+s.bufferDuration/s.rate-.05).length;assert.equal(interruptions,v.voiceInterruptions);
 const groups=new Set(),onsets=[];
 for(const s of data.starts){if(s.loop||!s.request||groups.has(s.group))continue;groups.add(s.group);const stamp=s.outputTimestamp;if(stamp?.contextTime>0)onsets.push(stamp.performanceTime+(s.when-stamp.contextTime)*1000-s.request.performanceMs);}
 onsets.sort((a,b)=>a-b);const onset=onsets.length?{count:onsets.length,min:onsets[0],p95:onsets[Math.floor(onsets.length*.95)],max:onsets.at(-1),outside33ms:onsets.filter(x=>Math.abs(x)>33).length}:null;
 assert.deepEqual(onset?{min:onset.min,p95:onset.p95,max:onset.max}:null,v.estimatedOutputLatencyMs);assert.equal(onset?onset.outside33ms===0:null,v.estimatedOnsetPass);
 const loudnorm={lufs:row.integratedLufs,lra:row.lra,truePeakDbTP:row.truePeakDbTP},independent=ebur(row.capture.path),lg=gates(loudnorm),eg=gates(independent);
 const agreement={lufs:Math.abs(loudnorm.lufs-independent.lufs)<=.11,lra:Math.abs(loudnorm.lra-independent.lra)<=.11,peak:Math.abs(loudnorm.truePeakDbTP-independent.truePeakDbTP)<=.2};
 rows.push({name:row.name,capture:row.capture,events:row.events,duration,sourceStarts:data.starts.length,maxStartsPer100ms:max,sourceBudgetPass:max<=6,
  mix:{loudnorm,ebur128:independent,loudnormGates:lg,ebur128Gates:eg,methodsAgree:agreement,bothMetersPass:Object.values(lg).every(Boolean)&&Object.values(eg).every(Boolean)},
  duck:{heldSamples:held.length,recoverySamples:recovered.length,duckPass,recoveryPass},estimatedOnset:onset,voiceInterruptions:interruptions,pageErrors:data.errors});
}
assert.equal(validation.coverageSeconds,rows.reduce((n,r)=>n+r.duration.wallSeconds,0));assert(!validation.continuousSingleSession&&!validation.overallAudioGatePass&&!validation.physicalAudibleOnsetVerified);
const selected=original.rows.map(row=>{
 const retry=rows.find(r=>r.name===row.name),r=retry??row;return {name:r.name,evidence:retry?base: 'reports/v4-ship/S5/palette-coverage-1',capture:r.capture,events:r.events,duration:r.duration,mix:r.mix,maxStartsPer100ms:r.maxStartsPer100ms,estimatedOnset:r.estimatedOnset,voiceInterruptions:r.voiceInterruptions,pageErrors:r.pageErrors};
});assert(selected.every(r=>r.duration.pass));
const regression=read(pre.fullRegression+'/check.json');verify(regression.log);assert(regression.complete);assert.deepEqual(Object.fromEntries(regression.rows.map(r=>[r.name,r.exitCode])),{server:0,rules:0,web:1,typecheck:0,'parity-probe':0,build:0});
assertUnchanged(root,pre.signature);for(const input of pre.dependencies)verify(input);
const report={at:new Date().toISOString(),harness:reference(relative(root,import.meta.filename)),inputs:[prePath,pre.originalReview.path,base+'/check.json',base+'/validation.json',pre.fullRegression+'/check.json'].map(reference),
 runtime:{sourceCommit:pre.sourceCommit,files:pre.signature.length,allCurrentAndCommittedHashesMatch:true},originalDurationFailuresRetained:original.rows.filter(r=>!r.duration.pass).map(r=>({name:r.name,duration:r.duration})),retryRows:rows,selected,
 coverage:{definedScenes:selected.map(r=>r.name),allFiveMinimumDurationsPass:true,minimumSeconds:pre.targetMinimumSeconds,wallSeconds:selected.reduce((n,r)=>n+r.duration.wallSeconds,0),decodedSeconds:selected.reduce((n,r)=>n+r.duration.encodedSeconds,0),continuous30Minutes:false},
 failedSceneAcoustics:selected.filter(r=>!r.mix.bothMetersPass).map(r=>r.name),retryPacketConcatAggregate:validation.aggregate,
 regression:{existingCompletedItemRegression:pre.fullRegression,sourceAndCaptureDependenciesUnchangedThroughRetry:true,sameSevenArtFailures:original.regression.sameSevenArtFailures,gRegPass:false},
 integrityPass:true,physicalAudibleOnsetVerified:false,humanListeningVerified:false,completeRosterCoverageVerified:false,overallAudioGatePass:false,
 limits:['Only the two scenes that missed the original timestamp-span threshold were retried; all original observations and failures remain preserved.',
 'Selected five-scene evidence is a collection of separate recordings. No new combined acoustic recording or continuous endurance is claimed.',
 'Original packet-concat peak failure and method-dependent PCM diagnostic remain preserved; per-scene range, onset, admission and listening gates stay independent.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),coverage:report.coverage,retries:rows.map(r=>({name:r.name,duration:r.duration,mix:r.mix,estimatedOnset:r.estimatedOnset})),failedSceneAcoustics:report.failedSceneAcoustics,overallAudioGatePass:false}));
