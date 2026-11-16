/** Quantify an immutable coverage capture without substituting proxies for physical checks. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),trial=process.argv[2];
if(!/^[a-z0-9-]+$/.test(trial))throw Error('Invalid trial');
const folder=resolve(root,'reports/v4-ship/S5',trial),check=JSON.parse(readFileSync(resolve(folder,'check.json')));
const output=resolve(folder,'validation.json');if(existsSync(output))throw Error('Preserve previous validation');
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const rows=[],clips=[];
for(const row of check.rows){
 for(const item of [row.capture,row.events])if(hash(resolve(root,item.path))!==item.sha256)throw Error('Changed evidence');
 clips.push(resolve(root,row.capture.path));
 const data=JSON.parse(gunzipSync(readFileSync(resolve(root,row.events.path))));
 const duckers=data.starts.filter(s=>s.bus==='voice'||s.id.startsWith('ult.'));
 const voice=data.starts.filter(s=>s.bus==='voice');
 const held=data.samples.filter(s=>voice.some(v=>s.audioTime>=v.when+.1&&s.audioTime<(v.endedAudioTime??v.when+v.bufferDuration/v.rate)));
 const heldDb=held.map(s=>20*Math.log10(s.duck));
 const release=[];
 for(const sample of data.samples){
  if(duckers.some(v=>sample.audioTime>=v.when&&sample.audioTime<(v.endedAudioTime??v.when+v.bufferDuration/v.rate)))continue;
  const ends=duckers.map(v=>v.endedAudioTime??v.when+v.bufferDuration/v.rate).filter(t=>t<=sample.audioTime);
  if(ends.length&&sample.audioTime-Math.max(...ends)>=.45)release.push(sample.duck);
 }
 const groups=new Set(),onsets=[];
 for(const s of data.starts){
  if(s.loop||!s.request||groups.has(s.group))continue;groups.add(s.group);
  const stamp=s.outputTimestamp;
  if(stamp?.contextTime>0)onsets.push(stamp.performanceTime+(s.when-stamp.contextTime)*1000-s.request.performanceMs);
 }
 onsets.sort((a,b)=>a-b);
 rows.push({name:row.name,seconds:row.actualSeconds,lufs:row.integratedLufs,lra:row.lra,peak:row.truePeakDbTP,sourceBudget:row.rollingAll.max<=6,maxStartsPer100ms:row.rollingAll.max,
  heldDuckDb:heldDb.length?{min:Math.min(...heldDb),max:Math.max(...heldDb),samples:heldDb.length}:null,
  duckDepthPass:heldDb.length?heldDb.every(v=>v>=-8.0001&&v<=-3.9999):null,
  recoveryPass:release.length?release.every(v=>v>=.995):null,recoverySamples:release.length,
  estimatedOutputLatencyMs:onsets.length?{min:onsets[0],p95:onsets[Math.floor(onsets.length*.95)],max:onsets.at(-1)}:null,
  estimatedOnsetPass:onsets.length?onsets.every(v=>Math.abs(v)<=33):null,
  pageErrors:row.errors,voiceInterruptions:voice.filter(v=>(v.endedAudioTime??v.when+v.bufferDuration/v.rate)<v.when+v.bufferDuration/v.rate-.05).length,
  rateLimitedRequests:data.hits.filter(h=>h.result==='rate-limit').length});
}
const list=resolve(root,'work/v4ship-audio',trial,'concat.txt');
if(clips.some(p=>p.includes("'")))throw Error('Unsupported concat path');
writeFileSync(list,clips.map(p=>`file '${p}'`).join('\n')+'\n');
const analysis=spawnSync('ffmpeg',['-hide_banner','-f','concat','-safe','0','-i',list,'-af','loudnorm=I=-18:TP=-1:LRA=5:print_format=json','-f','null','-'],{encoding:'utf8'});
if(analysis.status!==0)throw Error('Aggregate loudness analysis failed');
const levels=JSON.parse(analysis.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
const total=rows.reduce((sum,r)=>sum+r.seconds,0),aggregate={lufs:+levels.input_i,lra:+levels.input_lra,peak:+levels.input_tp};
const report={at:new Date().toISOString(),trial,rows,coverageSeconds:total,continuousSingleSession:false,aggregate,
 gates:{coverage30Minutes:total>=1800,loudness:aggregate.lufs>=-20&&aggregate.lufs<=-16,truePeak:aggregate.peak<=-1,loudnessRange:aggregate.lra>=5,sourceBudget:rows.every(r=>r.sourceBudget),duckDepth:rows.filter(r=>r.heldDuckDb).every(r=>r.duckDepthPass),duckRecovery:rows.filter(r=>r.recoverySamples).every(r=>r.recoveryPass),zeroErrors:rows.every(r=>r.pageErrors.length===0)},
 physicalAudibleOnsetVerified:false,overallAudioGatePass:false,
 note:'Aggregate metrics concatenate unaltered scene recordings for representative coverage, not a continuous endurance session. Per-scene values remain visible. Output timestamps estimate device presentation; physical audible onset and listening are not proven. The independent12-line proxy and native UI/persistence evidence are required separately.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({coverageSeconds:total,aggregate,gates:report.gates}));
