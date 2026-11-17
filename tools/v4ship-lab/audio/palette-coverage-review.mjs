/** Independently reduce current scene evidence; measurement failures remain failures. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
import {decodedDuration} from './duration.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/palette-coverage-review-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=path=>JSON.parse(readFileSync(resolve(root,path)));
const reference=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const verify=item=>{const b=readFileSync(resolve(root,item.path));assert.equal(hash(b),item.sha256);if(item.bytes!==undefined)assert.equal(b.length,item.bytes);return b;};
const prePath='reports/v4-ship/S11/palette-coverage-prespec-1.json',pre=read(prePath);
const base='reports/v4-ship/S5/palette-coverage-1',check=read(base+'/check.json'),validation=read(base+'/validation.json');
assert.equal(check.trial,pre.trial);assert.equal(check.preload,pre.preload);
assert.deepEqual(check.rows.map(r=>r.name),pre.scenes);assert.deepEqual(validation.rows.map(r=>r.name),pre.scenes);
assert.deepEqual(check.signature,pre.signature);assert.deepEqual(check.signature,runtimeSignature(root));assertUnchanged(root,check.signature);
verify(check.harness);for(const dependency of pre.dependencies)verify(dependency);
for(const file of check.signature)assert.equal(hash(execFileSync('git',['show',pre.sourceCommit+':'+file.path],{cwd:root,maxBuffer:32*1024*1024})),file.sha256);
const study=JSON.parse(verify(pre.study));assert(study.complete&&!study.pass&&study.historicalOnly);
assert.equal(study.rows.length,5);assert(study.rows.every(r=>r.originalReproduced));assert(study.rows.some(r=>!r.methodsAgree));
const failedStudy=read('reports/v4-ship/S11/palette-coverage-study-failure-1.json');
assert.equal(hash(gunzipSync(readFileSync(resolve(root,failedStudy.snapshot.path)))),failedStudy.snapshot.decodedSha256);
assert.equal(failedStudy.analysesExecuted,0);assert.equal(failedStudy.pass,false);

function intervalSweep(intervals){
 const starts=intervals.map(i=>i[0]).sort((a,b)=>a-b),ends=intervals.map(i=>i[1]).sort((a,b)=>a-b);
 let a=0,b=0,previous=-Infinity;
 return t=>{assert(t>=previous);previous=t;while(a<starts.length&&starts[a]<=t)a++;while(b<ends.length&&ends[b]<=t)b++;return {active:a-b,lastEnd:b?ends[b-1]:null};};
}
function measureEbur(input){
 const started=performance.now(),result=spawnSync('ffmpeg',['-hide_banner','-nostats',...input,'-af','ebur128=peak=true:framelog=verbose','-f','null','-'],{encoding:'utf8',maxBuffer:4*1024*1024});
 assert.equal(result.status,0);
 const matches=[...result.stderr.matchAll(/Integrated loudness:\s*I:\s*(-?[\d.]+)\s*LUFS[\s\S]*?Loudness range:\s*LRA:\s*([\d.]+)\s*LU[\s\S]*?True peak:\s*Peak:\s*(-?[\d.]+)\s*dBFS/g)];
 assert(matches.length);const m=matches.at(-1);
 return {lufs:+m[1],lra:+m[2],truePeakDbTP:+m[3],seconds:(performance.now()-started)/1000};
}
const acoustic=m=>({loudness:m.lufs>=pre.thresholds.lufs[0]&&m.lufs<=pre.thresholds.lufs[1],range:m.lra>=pre.thresholds.lra,peak:m.truePeakDbTP<=pre.thresholds.truePeakDbTP});
const agreement=(a,b)=>({lufs:Math.abs(a.lufs-b.lufs)<=pre.thresholds.methodDifferenceLufs,lra:Math.abs(a.lra-b.lra)<=pre.thresholds.methodDifferenceLra,truePeak:Math.abs(a.truePeakDbTP-b.truePeakDbTP)<=pre.thresholds.methodDifferencePeak});
const rows=[],manifest=read('apps/web/public/audio/manifest.json');
for(const [index,row] of check.rows.entries()){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));verify(row.capture);
 const data=JSON.parse(gunzipSync(verify(row.events))),measured=validation.rows[index];
 assert.equal(data.name,row.name);assert.equal(data.seconds,pre.secondsPerScene);assert.equal(row.seconds,pre.secondsPerScene);
 assert.equal(data.ended-data.started,row.actualSeconds);assert.equal(row.actualSeconds,measured.seconds);
 assert.equal(data.starts.length,row.sourceStarts);assert.equal(data.restarts,row.restarts);assert.deepEqual(data.errors,row.errors);assert.deepEqual(data.errors,measured.pageErrors);
 const duration=decodedDuration(resolve(root,row.capture.path));
 const durationPass=row.actualSeconds>=pre.secondsPerScene&&duration.encodedSeconds>=pre.secondsPerScene&&duration.timestampSpanSeconds>=pre.secondsPerScene;
 const starts=data.starts;assert(starts.every(s=>Number.isFinite(s.when)));
 // Count every half-open window directly instead of reusing the capture's sliding pointers.
 const maximum=items=>items.length?Math.max(...items.map(a=>items.filter(b=>b.when>=a.when&&b.when-a.when<.1-1e-9).length)):0;
 const maxStarts=maximum(starts),maxTransientStarts=maximum(starts.filter(s=>!s.loop));
 assert.equal(maxStarts,row.rollingAll.max);assert.equal(maxStarts,measured.maxStartsPer100ms);assert.equal(maxTransientStarts,row.rollingTransients.max);
 assert.equal(maxStarts<=6,measured.sourceBudget);
 const finish=s=>s.endedAudioTime??s.when+s.bufferDuration/s.rate;
 const voice=starts.filter(s=>s.bus==='voice'),duckers=starts.filter(s=>s.ducking??(s.bus==='voice'||s.id.startsWith('ult.')));
 const interruptions=voice.filter(s=>finish(s)<s.when+s.bufferDuration/s.rate-.05).length;
 assert.equal(interruptions,measured.voiceInterruptions);
 const voiceLines=[...new Set(voice.filter(s=>!s.loop).map(s=>s.id))];assert.deepEqual(voiceLines,row.voiceLines);
 const heldAt=intervalSweep(voice.map(s=>[s.when+.1,finish(s)]).filter(i=>i[1]>i[0]));
 const duckAt=intervalSweep(duckers.map(s=>[s.when,finish(s)]));
 let held=0,recovery=0,minDb=Infinity,maxDb=-Infinity,minRecovery=Infinity,maxSampleGapMs=0;
 for(let i=0;i<data.samples.length;i++){
  const sample=data.samples[i];assert(Number.isFinite(sample.audioTime)&&Number.isFinite(sample.duck)&&sample.duck>0);
  if(i)maxSampleGapMs=Math.max(maxSampleGapMs,sample.wallMs-data.samples[i-1].wallMs);
  if(heldAt(sample.audioTime).active>0){held++;const db=20*Math.log10(sample.duck);minDb=Math.min(minDb,db);maxDb=Math.max(maxDb,db);}
  const state=duckAt(sample.audioTime);if(state.active===0&&state.lastEnd!==null&&sample.audioTime-state.lastEnd>=.45){recovery++;minRecovery=Math.min(minRecovery,sample.duck);}
 }
 assert.equal(held,measured.heldDuckDb?.samples??0);assert.equal(recovery,measured.recoverySamples);
 if(held){assert(Math.abs(minDb-measured.heldDuckDb.min)<1e-9);assert(Math.abs(maxDb-measured.heldDuckDb.max)<1e-9);}else assert.equal(measured.heldDuckDb,null);
 const duckPass=held?minDb>=-8.0001&&maxDb<=-3.9999:null,recoveryPass=recovery?minRecovery>=.995:null;
 assert.equal(duckPass,measured.duckDepthPass);assert.equal(recoveryPass,measured.recoveryPass);
 const groups=new Set(),onsets=[];let invalidTimestampGroups=0;
 for(const start of starts){
  if(start.loop||!start.request||groups.has(start.group))continue;groups.add(start.group);
  const stamp=start.outputTimestamp;if(stamp?.contextTime>0)onsets.push(stamp.performanceTime+(start.when-stamp.contextTime)*1000-start.request.performanceMs);else invalidTimestampGroups++;
 }
 onsets.sort((a,b)=>a-b);
 const onset=onsets.length?{count:onsets.length,min:onsets[0],p95:onsets[Math.floor(onsets.length*.95)],max:onsets.at(-1),outside33ms:onsets.filter(x=>Math.abs(x)>33).length}:null;
 assert.deepEqual(onset?{min:onset.min,p95:onset.p95,max:onset.max}:null,measured.estimatedOutputLatencyMs);
 assert.equal(onset?onset.outside33ms===0:null,measured.estimatedOnsetPass);
 const ui=starts.filter(s=>!s.loop&&/^(ui|tx)\./.test(s.id));
 const maxUiDurationMs=ui.length?Math.max(...ui.map(s=>(s.delay+s.bufferDuration/s.rate)*1000)):null;
 assert.equal(maxUiDurationMs,row.maxUiDurationMs);
 const rateLimitedRequests=data.hits.filter(h=>h.result==='rate-limit').length;assert.equal(rateLimitedRequests,measured.rateLimitedRequests);
 const rejectedByCue={};for(const h of data.hits)if(['rate-limit','limit','priority','cadence','superseded','unavailable'].includes(h.result)){
  rejectedByCue[h.id]??={};rejectedByCue[h.id][h.result]=(rejectedByCue[h.id][h.result]??0)+1;
 }
 const requestedVoices={};for(const r of data.requests)if(r.id.startsWith('voice.'))requestedVoices[r.id]=(requestedVoices[r.id]??0)+1;
 const rangedCounts={};for(const s of starts)if(s.pack?.includes('ranged')&&s.pack!=='ranged')rangedCounts[s.pack]=(rangedCounts[s.pack]??0)+1;
 for(const pack of Object.keys(rangedCounts))assert(data.resources.some(r=>r.path===manifest.packs[pack].webm||r.path===manifest.packs[pack].mp3));
 const loudnorm={lufs:row.integratedLufs,lra:row.lra,truePeakDbTP:row.truePeakDbTP};
 assert.equal(loudnorm.lufs,measured.lufs);assert.equal(loudnorm.lra,measured.lra);assert.equal(loudnorm.truePeakDbTP,measured.peak);
 const ebur128=measureEbur(['-i',resolve(root,row.capture.path)]),loudnormGates=acoustic(loudnorm),ebur128Gates=acoustic(ebur128),methodsAgree=agreement(loudnorm,ebur128);
 rows.push({name:row.name,capture:row.capture,events:row.events,duration:{wallSeconds:row.actualSeconds,...duration,pass:durationPass},
  sourceStarts:starts.length,maxStartsPer100ms:maxStarts,maxTransientStartsPer100ms:maxTransientStarts,sourceBudgetPass:maxStarts<=6,restarts:data.restarts,
  mix:{loudnorm,ebur128,loudnormGates,ebur128Gates,methodsAgree,bothMetersPass:Object.values(loudnormGates).every(Boolean)&&Object.values(ebur128Gates).every(Boolean)},
  duck:{heldSamples:held,minDb:held?minDb:null,maxDb:held?maxDb:null,recoverySamples:recovery,minRecovery:recovery?minRecovery:null,duckPass,recoveryPass},
  estimatedOnset:onset,invalidTimestampGroups,estimatedOnsetPass:measured.estimatedOnsetPass,voiceLines,voiceInterruptions:interruptions,
  maxObservedUiDurationMs:maxUiDurationMs,observedUiDurationPass:maxUiDurationMs===null?null:maxUiDurationMs<=300,
  actionLoopRecords:data.actions.length,rateLimitedRequests,admission:{requestedVoices,rejectedByCue,scope:'Requests and starts follow instrumentation; hits also retain earlier fixture setup.'},rangedPaletteStarts:rangedCounts,pageErrors:data.errors,maxSampleGapMs});
}
const concatPath=resolve(root,'work/v4ship-audio/palette-coverage-1/concat.txt');
assert.equal(readFileSync(concatPath,'utf8'),check.rows.map(r=>`file '${resolve(root,r.capture.path)}'`).join('\n')+'\n');
const aggregateLoudnorm={lufs:validation.aggregate.lufs,lra:validation.aggregate.lra,truePeakDbTP:validation.aggregate.peak};
const aggregateEbur=measureEbur(['-f','concat','-safe','0','-i',concatPath]);
const coverageSeconds=rows.reduce((s,r)=>s+r.duration.wallSeconds,0);assert.equal(coverageSeconds,validation.coverageSeconds);
assert.equal(validation.continuousSingleSession,false);assert.equal(validation.gates.coverage30Minutes,coverageSeconds>=1800);
const aggregateGates=acoustic(aggregateLoudnorm);
assert.deepEqual(validation.gates,{coverage30Minutes:coverageSeconds>=1800,loudness:aggregateGates.loudness,truePeak:aggregateGates.peak,loudnessRange:aggregateGates.range,
 sourceBudget:rows.every(r=>r.sourceBudgetPass),duckDepth:rows.filter(r=>r.duck.heldSamples).every(r=>r.duck.duckPass),
 duckRecovery:rows.filter(r=>r.duck.recoverySamples).every(r=>r.duck.recoveryPass),zeroErrors:rows.every(r=>r.pageErrors.length===0)});
assert.equal(validation.physicalAudibleOnsetVerified,false);assert.equal(validation.overallAudioGatePass,false);

const aggregatePath='reports/v4-ship/S11/palette-coverage-aggregate-1.json',aggregateStudy=read(aggregatePath);
assert(aggregateStudy.pass&&!aggregateStudy.runtimeChanged&&!aggregateStudy.overallAudioGatePass);verify(aggregateStudy.harness);
assert.deepEqual(aggregateStudy.inputs.map(r=>r.path),[base+'/check.json',base+'/validation.json']);for(const input of aggregateStudy.inputs)verify(input);
assert.equal(aggregateStudy.sampleRate,48000);assert.equal(aggregateStudy.channels,2);assert.equal(aggregateStudy.rows.length,5);
const joinedPcm=verify(aggregateStudy.independentPcm.file),packetPcm=verify(aggregateStudy.packetConcat.file);let pcmCursor=0;
for(const [index,row] of aggregateStudy.rows.entries()){
 assert.equal(row.name,rows[index].name);assert.deepEqual(row.capture,rows[index].capture);const pcm=verify(row.decoded);
 assert.equal(row.offsetBytes,pcmCursor);assert(joinedPcm.subarray(pcmCursor,pcmCursor+pcm.length).equals(pcm));
 assert.equal(pcm.length/8,Math.round(rows[index].duration.encodedSeconds*48000));pcmCursor+=pcm.length;
}
assert.equal(pcmCursor,joinedPcm.length);assert.equal(packetPcm.length,joinedPcm.length);assert(!packetPcm.equals(joinedPcm));
const firstDifferentByte=aggregateStudy.comparison.firstDifferentFrame*8;
assert(joinedPcm.subarray(0,firstDifferentByte).equals(packetPcm.subarray(0,firstDifferentByte)));
assert(!joinedPcm.subarray(firstDifferentByte,firstDifferentByte+8).equals(packetPcm.subarray(firstDifferentByte,firstDifferentByte+8)));
assert.deepEqual(aggregateStudy.originalValidation.aggregate,validation.aggregate);assert.equal(aggregateStudy.originalValidation.truePeakPass,false);
assert.equal(aggregateStudy.packetConcat.meters.loudnorm.truePeakDbTP,validation.aggregate.peak);
assert(Math.abs(aggregateStudy.packetConcat.meters.ebur128.truePeakDbTP-aggregateEbur.truePeakDbTP)<=.1);

const folder='reports/v4-ship/S11/palette-coverage-regression-1',baseline='reports/v4-ship/S11/history-jpeg-regression-1';
const regression=read(folder+'/check.json');verify(regression.log);assert(regression.complete);
assert.deepEqual(Object.fromEntries(regression.rows.map(r=>[r.name,r.exitCode])),{server:0,rules:0,web:1,typecheck:0,'parity-probe':0,build:0});
function testSummary(path,name){return gunzipSync(readFileSync(resolve(root,path))).toString().trim().split('\n').map(l=>JSON.parse(l)).filter(r=>r.name===name).map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n').filter(l=>/^\s*(FAIL|Tests\s|Test Files\s)/.test(l)).map(l=>l.trim());}
const summaries={};for(const name of ['server','rules','web']){summaries[name]=testSummary(folder+'/log.jsonl.gz',name);assert.deepEqual(summaries[name],testSummary(baseline+'/log.jsonl.gz',name));}
assert.equal(summaries.web.filter(l=>l.startsWith('FAIL ')).length,7);assert(summaries.web.includes('Tests  7 failed | 2697 passed (2704)'));
const parity=read(folder+'/parity-probe.json');assert.deepEqual(parity.rows,read(baseline+'/parity-probe.json').rows);assert(parity.probePass&&!parity.newBaseline&&!parity.officialClassBaselineApproved);
assertUnchanged(root,pre.signature);for(const dependency of pre.dependencies)verify(dependency);
const report={at:new Date().toISOString(),learn:pre.learn,integrityPass:true,
 harness:reference(relative(root,import.meta.filename)),helpers:pre.dependencies,
 inputs:[prePath,pre.study.path,aggregatePath,base+'/check.json',base+'/validation.json',folder+'/check.json',folder+'/log.jsonl.gz',folder+'/parity-probe.json',baseline+'/log.jsonl.gz',baseline+'/parity-probe.json','reports/v4-ship/S11/palette-coverage-study-failure-1.json',failedStudy.snapshot.path].map(reference),
 runtime:{sourceCommit:pre.sourceCommit,files:pre.signature.length,allCurrentAndCommittedHashesMatch:true},rows,
 coverage:{scenes:pre.scenes,wallSeconds:coverageSeconds,decodedSeconds:rows.reduce((s,r)=>s+r.duration.encodedSeconds,0),allFiveDurationsPass:rows.every(r=>r.duration.pass),continuous30Minutes:false},
 aggregate:{loudnorm:aggregateLoudnorm,ebur128:aggregateEbur,loudnormGates:acoustic(aggregateLoudnorm),ebur128Gates:acoustic(aggregateEbur),methodsAgree:agreement(aggregateLoudnorm,aggregateEbur)},
 aggregateDiagnostic:{evidence:reference(aggregatePath),separatePcm:aggregateStudy.independentPcm.meters,packetConcat:aggregateStudy.packetConcat.meters,
  sampleExactSeparateJoinVerified:true,firstDifferentFrame:aggregateStudy.comparison.firstDifferentFrame,originalPeakFailurePreserved:true,specificDecoderCauseProven:false},
 failedSceneAcoustics:rows.filter(r=>!r.mix.bothMetersPass).map(r=>r.name),sceneMeterDisagreements:rows.filter(r=>!Object.values(r.mix.methodsAgree).every(Boolean)).map(r=>r.name),
 regression:{sameSevenArtFailures:true,summaries,parityRowsUnchanged:true,gRegPass:false},
 physicalAudibleOnsetVerified:false,humanListeningVerified:false,completeRosterCoverageVerified:false,overallAudioGatePass:false,
 limits:['Observed five seeded/menu scenes only; separate current production journeys and endurance remain necessary.',
 'Telemetry starts include setup before the recorded window; action-loop records do not prove every requested UI action occurred.',
 'No-evidence duck, recovery, UI duration or onset observations remain null rather than passing.',
 'Meter agreement tolerances do not relax acoustic gates; both meters must meet each original threshold.',
 'No physical onset, listening, causal palette effect or global acceptance follows from this review.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:relative(root,output),integrityPass:true,coverage:report.coverage,scenes:rows.map(r=>({name:r.name,mix:r.mix,sourceStarts:r.sourceStarts,maxStartsPer100ms:r.maxStartsPer100ms,estimatedOnset:r.estimatedOnset})),failedSceneAcoustics:report.failedSceneAcoustics,sceneMeterDisagreements:report.sceneMeterDisagreements,overallAudioGatePass:false}));
