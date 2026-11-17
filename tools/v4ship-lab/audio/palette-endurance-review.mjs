/** Independent current-palette endurance review; global acoustic gates stay explicit. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
import {decodedDuration} from './duration.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/palette-endurance-review-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const reference=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const verify=item=>{const b=readFileSync(resolve(root,item.path));assert.equal(hash(b),item.sha256);if(item.bytes!==undefined)assert.equal(b.length,item.bytes);return b;};
const base='reports/v4-ship/S5/palette-endurance-1',check=read(base+'/check.json'),validation=read(base+'/validation.json');
assert.equal(check.trial,'palette-endurance-1');assert.equal(check.rows.length,1);assert.equal(check.rows[0].name,'boss');assert(check.preload);verify(check.harness);
assertUnchanged(root,check.signature);assert.deepEqual(check.signature,runtimeSignature(root));
const installed='208805af81dc6ae507fbb3f82945e4993f2d8739';
for(const file of check.signature)assert.equal(hash(execFileSync('git',['show',installed+':'+file.path],{cwd:root,maxBuffer:32*1024*1024})),file.sha256);
const row=check.rows[0];verify(row.capture);const data=JSON.parse(gunzipSync(verify(row.events)));assert.equal(data.starts.length,row.sourceStarts);assert.equal(data.restarts,row.restarts);assert.deepEqual(data.errors,[]);
assert.equal(data.seconds,1800);assert.equal(data.ended-data.started,row.actualSeconds);
const decoded=decodedDuration(resolve(root,row.capture.path));assert(decoded.encodedSeconds>=1800&&decoded.timestampSpanSeconds>=1800&&row.actualSeconds>=1800&&row.restarts>0);
const duration={wallSeconds:row.actualSeconds,...decoded,restarts:row.restarts};
const starts=data.starts.toSorted((a,b)=>a.when-b.when);let maxStarts=0,left=0;
for(let right=0;right<starts.length;right++){assert(Number.isFinite(starts[right].when));while(starts[right].when-starts[left].when>=.1-1e-9)left++;maxStarts=Math.max(maxStarts,right-left+1);}
assert.equal(maxStarts,row.rollingAll.max);assert(maxStarts<=6);
const finish=s=>s.endedAudioTime??s.when+s.bufferDuration/s.rate;
const voice=data.starts.filter(s=>s.bus==='voice'),duckers=data.starts.filter(s=>s.ducking??(s.bus==='voice'||s.id.startsWith('ult.')));
const interruptions=voice.filter(s=>finish(s)<s.when+s.bufferDuration/s.rate-.05).length;
function intervalSweep(intervals){
 const starts=intervals.map(i=>i[0]).sort((a,b)=>a-b),ends=intervals.map(i=>i[1]).sort((a,b)=>a-b);let a=0,b=0,previous=-Infinity;
 return t=>{assert(t>=previous);previous=t;while(a<starts.length&&starts[a]<=t)a++;while(b<ends.length&&ends[b]<=t)b++;return {active:a-b,lastEnd:b?ends[b-1]:null};};
}
const heldAt=intervalSweep(voice.map(s=>[s.when+.1,finish(s)]).filter(i=>i[1]>i[0]));
const duckAt=intervalSweep(duckers.map(s=>[s.when,finish(s)]));let held=0,recovery=0,minDb=Infinity,maxDb=-Infinity,minRecovery=Infinity,maxSampleGapMs=0;
for(let i=0;i<data.samples.length;i++){
 const sample=data.samples[i];assert(Number.isFinite(sample.audioTime)&&Number.isFinite(sample.duck)&&sample.duck>0);
 if(i)maxSampleGapMs=Math.max(maxSampleGapMs,sample.wallMs-data.samples[i-1].wallMs);
 if(heldAt(sample.audioTime).active>0){held++;const db=20*Math.log10(sample.duck);minDb=Math.min(minDb,db);maxDb=Math.max(maxDb,db);}
 const state=duckAt(sample.audioTime);if(state.active===0&&state.lastEnd!==null&&sample.audioTime-state.lastEnd>=.45){recovery++;minRecovery=Math.min(minRecovery,sample.duck);}
}
assert(held>0&&recovery>0);const measured=validation.rows[0];assert.equal(held,measured.heldDuckDb.samples);assert.equal(recovery,measured.recoverySamples);assert.equal(interruptions,measured.voiceInterruptions);
assert(Math.abs(minDb-measured.heldDuckDb.min)<1e-9&&Math.abs(maxDb-measured.heldDuckDb.max)<1e-9);
const duckPass=minDb>=-8.0001&&maxDb<=-3.9999,recoveryPass=minRecovery>=.995;assert(duckPass&&recoveryPass&&interruptions===0);
const groups=new Set(),onsets=[];
for(const start of data.starts){if(start.loop||!start.request||groups.has(start.group))continue;groups.add(start.group);const stamp=start.outputTimestamp;if(stamp?.contextTime>0)onsets.push(stamp.performanceTime+(start.when-stamp.contextTime)*1000-start.request.performanceMs);}
onsets.sort((a,b)=>a-b);assert(onsets.length>0);
const onset={count:onsets.length,min:onsets[0],p95:onsets[Math.floor(onsets.length*.95)],max:onsets.at(-1),outside33ms:onsets.filter(x=>Math.abs(x)>33).length,physicalMeasurement:false};
assert.equal(onset.max,measured.estimatedOutputLatencyMs.max);assert.equal(onset.outside33ms===0,measured.estimatedOnsetPass);
const eburStarted=performance.now();const ebur=spawnSync('ffmpeg',['-hide_banner','-nostats','-i',resolve(root,row.capture.path),'-af','ebur128=peak=true:framelog=verbose','-f','null','-'],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(ebur.status,0);const eburSeconds=(performance.now()-eburStarted)/1000;
const summaries=[...ebur.stderr.matchAll(/Integrated loudness:\s*I:\s*(-?[\d.]+)\s*LUFS[\s\S]*?Loudness range:\s*LRA:\s*([\d.]+)\s*LU[\s\S]*?True peak:\s*Peak:\s*(-?[\d.]+)\s*dBFS/g)];assert(summaries.length);
const summary=summaries.at(-1),independentMix={lufs:+summary[1],lra:+summary[2],truePeakDbTP:+summary[3],seconds:eburSeconds,method:'FFmpeg ebur128 true-peak analysis; unmodified recorded input'};
assert(independentMix.lufs>=-20&&independentMix.lufs<=-16&&independentMix.lra>=5&&independentMix.truePeakDbTP<=-1);
assert(Math.abs(independentMix.lufs-row.integratedLufs)<=.11&&Math.abs(independentMix.lra-row.lra)<=.11&&Math.abs(independentMix.truePeakDbTP-row.truePeakDbTP)<=.2);
assert(row.integratedLufs>=-20&&row.integratedLufs<=-16&&row.lra>=5&&row.truePeakDbTP<=-1);
assert(validation.continuousSingleSession&&Object.values(validation.gates).every(Boolean));
const manifest=read('apps/web/public/audio/manifest.json'),palettes=new Set(Object.keys(manifest.packs).filter(p=>p.includes('ranged')&&p!=='ranged'));
const counts={};for(const s of data.starts)counts[s.pack]=(counts[s.pack]??0)+1;
const rangedStarts=Object.entries(counts).filter(([pack])=>palettes.has(pack));assert(rangedStarts.length>0);
for(const [pack] of rangedStarts)assert(data.resources.some(r=>r.path===manifest.packs[pack].webm||r.path===manifest.packs[pack].mp3));
const historicalBase='reports/v4-ship/S5/ranged-endurance-1',historical=read(historicalBase+'/check.json');assert.equal(historical.rows.length,1);const before=historical.rows[0];verify(before.capture);verify(before.events);
const historyCommit='608b7b9864f308716e499e5379958a9fc10e9756';for(const file of historical.signature)assert.equal(hash(execFileSync('git',['show',historyCommit+':'+file.path],{cwd:root,maxBuffer:32*1024*1024})),file.sha256);
assert.notDeepEqual(historical.signature,check.signature);
const folder='reports/v4-ship/S11/palette-endurance-regression-1',baseline='reports/v4-ship/S11/history-residual-regression-1';const regression=read(folder+'/check.json');verify(regression.log);assert(regression.complete);
assert.deepEqual(Object.fromEntries(regression.rows.map(r=>[r.name,r.exitCode])),{server:0,rules:0,web:1,typecheck:0,'parity-probe':0,build:0});
function web(path){return gunzipSync(readFileSync(resolve(root,path))).toString().trim().split('\n').map(l=>JSON.parse(l)).filter(r=>r.name==='web').map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n').filter(l=>/^\s*(FAIL|Tests\s|Test Files\s)/.test(l)).map(l=>l.trim());}
const webSummary=web(folder+'/log.jsonl.gz');assert.deepEqual(webSummary,web(baseline+'/log.jsonl.gz'));assert.equal(webSummary.filter(l=>l.startsWith('FAIL ')).length,7);assert(webSummary.includes('Tests  7 failed | 2697 passed (2704)'));
const parity=read(folder+'/parity-probe.json');assert.deepEqual(parity.rows,read(baseline+'/parity-probe.json').rows);assert(parity.probePass&&!parity.newBaseline&&!parity.officialClassBaselineApproved);
const production=read('reports/v4-ship/S11/ranged-palette-production-review-1.json');assert(production.observedProductionIntegrationPass&&!production.overallAudioGatePass);
for(const index of [9,10]){const journey=read(`reports/v4-ship/S11/scene-journey-${index}.json`);assert.equal(journey.sourceCommit,installed);assert(journey.journeyPass&&journey.rollback);verify(journey.events);}
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-audio-delivery.md',pass:true,
 harness:reference(relative(root,import.meta.filename)),helpers:['tools/v4ship-lab/audio/duration.mjs','scripts/audio/runtime-signature.mjs','tools/v4ship-lab/audio/validate.mjs'].map(reference),
 inputs:[base+'/check.json',base+'/validation.json',row.events.path,historicalBase+'/check.json',historicalBase+'/validation.json',folder+'/check.json',folder+'/log.jsonl.gz',folder+'/parity-probe.json',baseline+'/log.jsonl.gz',baseline+'/parity-probe.json','reports/v4-ship/S11/ranged-palette-production-review-1.json','reports/v4-ship/S11/scene-journey-9.json','reports/v4-ship/S11/scene-journey-10.json'].map(reference),
 runtime:{sourceCommit:installed,files:check.signature.length,allCurrentAndCommittedHashesMatch:true},capture:row.capture,duration,
 sourceStarts:data.starts.length,maxStartsPer100ms:maxStarts,rangedPaletteStarts:rangedStarts.map(([pack,starts])=>({pack,starts})),
 duck:{heldSamples:held,minDb,maxDb,recoverySamples:recovery,minRecovery,duckPass,recoveryPass},voiceInterruptions:interruptions,errors:data.errors,maximumTelemetryGapMs:maxSampleGapMs,
 mix:{loudnorm:{lufs:row.integratedLufs,lra:row.lra,truePeakDbTP:row.truePeakDbTP},ebur128:independentMix},estimatedOnset:onset,
 historicalComparison:{sourceCommit:historyCommit,currentRuntimeValidation:false,wallSeconds:before.actualSeconds,sourceStarts:before.sourceStarts,lufs:before.integratedLufs,lra:before.lra,truePeakDbTP:before.truePeakDbTP,causalPaletteEffectClaimed:false},
 regression:{sameSevenArtFailures:true,webSummary,parityRowsUnchanged:true,gRegPass:false},continuousCurrentRuntime30Minutes:true,
 physicalAudibleOnsetVerified:false,humanListeningVerified:false,currentRepresentativeSceneCoverageVerified:false,overallAudioGatePass:false,
 limits:['Seeded fixture restarts in one browser context; actual production semantics are separately bound to journeys9/10.','Source telemetry and output timestamps are not physical audible onset or listening proof.','Historical monolith mix differs in random takes and runtime; no causal perceptual comparison.','Current per-scene range, recognition, complete weapon coverage and the8MB production transfer gate remain open.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),continuous30Minutes:true,duration,sourceStarts:data.starts.length,mix:report.mix,estimatedOnset:onset,overallAudioGatePass:false}));
