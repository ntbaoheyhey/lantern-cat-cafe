/** Diagnose packet concatenation without altering any original scene recording. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),folder=resolve(root,'work/v4ship-audio/palette-coverage-1/aggregate-study-1');
const output=resolve(root,'reports/v4-ship/S11/palette-coverage-aggregate-1.json');
assert(!existsSync(output)&&!existsSync(folder)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder);
const hash=b=>createHash('sha256').update(b).digest('hex');
const reference=path=>{const b=readFileSync(resolve(root,path));return {path,bytes:b.length,sha256:hash(b)};};
const checkPath='reports/v4-ship/S5/palette-coverage-1/check.json',check=JSON.parse(readFileSync(resolve(root,checkPath)));
const validationPath='reports/v4-ship/S5/palette-coverage-1/validation.json',validation=JSON.parse(readFileSync(resolve(root,validationPath)));
assert.equal(check.rows.length,5);assert.equal(validation.gates.truePeak,false);
const rate=48000,channels=2,bytesPerFrame=channels*4,joined=resolve(folder,'separately-decoded.f32'),rows=[];
writeFileSync(joined,Buffer.alloc(0));let cursor=0;
function run(args){const result=spawnSync('ffmpeg',args,{encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(result.status,0);return result.stderr;}
function decode(input,path){assert(!existsSync(path));run(['-v','error','-n',...input,'-map','0:a:0','-vn','-ar',String(rate),'-ac',String(channels),'-c:a','pcm_f32le','-f','f32le',path]);}
function peak(buffer){
 assert.equal(buffer.length%bytesPerFrame,0);const samples=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.length/4);let value=0,index=0;
 for(let i=0;i<samples.length;i++){assert(Number.isFinite(samples[i]));const a=Math.abs(samples[i]);if(a>value){value=a;index=i;}}
 return {samplePeakDbFS:20*Math.log10(value),samplePeakLinear:value,peakFrame:Math.floor(index/channels),peakSeconds:Math.floor(index/channels)/rate,frames:buffer.length/bytesPerFrame,seconds:buffer.length/bytesPerFrame/rate};
}
for(const row of check.rows){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));
 const clip=resolve(root,row.capture.path);assert.equal(hash(readFileSync(clip)),row.capture.sha256);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels','-of','json',clip],{encoding:'utf8'}));
 assert.equal(probe.streams.length,1);assert.equal(Number(probe.streams[0].sample_rate),rate);assert.equal(probe.streams[0].channels,channels);
 const path=resolve(folder,row.name+'.f32');decode(['-i',clip],path);const data=readFileSync(path);appendFileSync(joined,data);
 rows.push({name:row.name,capture:row.capture,decoded:reference(relative(root,path)),offsetBytes:cursor,...peak(data)});cursor+=data.length;
}
const separate=readFileSync(joined);assert.equal(separate.length,cursor);
for(const row of rows)assert(separate.subarray(row.offsetBytes,row.offsetBytes+row.decoded.bytes).equals(readFileSync(resolve(root,row.decoded.path))));
const packetPath=resolve(folder,'packet-concat.f32'),list=resolve(root,'work/v4ship-audio/palette-coverage-1/concat.txt');
assert.equal(readFileSync(list,'utf8'),check.rows.map(r=>`file '${resolve(root,r.capture.path)}'`).join('\n')+'\n');
decode(['-f','concat','-safe','0','-i',list],packetPath);const packet=readFileSync(packetPath);
const separatePeak=peak(separate),packetPeak=peak(packet);assert.equal(separatePeak.samplePeakLinear,Math.max(...rows.map(r=>r.samplePeakLinear)));
const a=new Uint32Array(separate.buffer,separate.byteOffset,separate.length/4),b=new Uint32Array(packet.buffer,packet.byteOffset,packet.length/4);
let unequalSamples=Math.abs(a.length-b.length),firstDifferentSample=null;
for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i]){unequalSamples++;firstDifferentSample??=i;}
const boundaries=rows.slice(1).map(r=>r.offsetBytes/bytesPerFrame/rate);
function meters(path){
 const input=['-f','f32le','-ar',String(rate),'-ac',String(channels),'-i',path],start=performance.now();
 const loud=run(['-hide_banner','-nostats',...input,'-af','loudnorm=I=-18:TP=-1:LRA=5:print_format=json','-f','null','-']);
 const x=JSON.parse(loud.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
 const loudnorm={lufs:+x.input_i,lra:+x.input_lra,truePeakDbTP:+x.input_tp,seconds:(performance.now()-start)/1000};
 const next=performance.now(),ebur=run(['-hide_banner','-nostats',...input,'-af','ebur128=peak=true:framelog=verbose','-f','null','-']);
 const m=[...ebur.matchAll(/Integrated loudness:\s*I:\s*(-?[\d.]+)\s*LUFS[\s\S]*?Loudness range:\s*LRA:\s*([\d.]+)\s*LU[\s\S]*?True peak:\s*Peak:\s*(-?[\d.]+)\s*dBFS/g)].at(-1);assert(m);
 return {loudnorm,ebur128:{lufs:+m[1],lra:+m[2],truePeakDbTP:+m[3],seconds:(performance.now()-next)/1000}};
}
const separateMeters=meters(joined),packetMeters=meters(packetPath);
const report={at:new Date().toISOString(),harness:reference(relative(root,import.meta.filename)),inputs:[checkPath,validationPath].map(reference),
 ffmpegVersion:execFileSync('ffmpeg',['-version'],{encoding:'utf8'}).split('\n')[0],sampleRate:rate,channels,rows,boundariesSeconds:boundaries,
 independentPcm:{file:reference(relative(root,joined)),...separatePeak,eachJoinedChunkByteExact:true,meters:separateMeters},
 packetConcat:{file:reference(relative(root,packetPath)),...packetPeak,meters:packetMeters,nearestSeparateBoundarySeconds:Math.min(...boundaries.map(t=>Math.abs(t-packetPeak.peakSeconds)))},
 comparison:{sameDecodedBytes:packet.equals(separate),separateFrames:separatePeak.frames,packetFrames:packetPeak.frames,unequalSamples,firstDifferentFrame:firstDifferentSample===null?null:Math.floor(firstDifferentSample/channels)},
 originalValidation:{aggregate:validation.aggregate,truePeakPass:validation.gates.truePeak,unchanged:true},pass:true,runtimeChanged:false,overallAudioGatePass:false,
 limits:['No fades, gain changes, added silence or omitted decoded samples in the independent PCM concatenation.',
 'The two concatenation methods can differ in decoder state or timestamp handling; this diagnostic alone does not identify a specific codec implementation defect.',
 'Both aggregates are artificial sequences of separate contexts, not physical recordings of transitions. Original per-scene gates and failed packet validation remain authoritative evidence of their own scopes.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:relative(root,output),independentPcm:{...separatePeak,meters:separateMeters},packetConcat:{...packetPeak,meters:packetMeters},comparison:report.comparison,originalTruePeakFailurePreserved:true}));
