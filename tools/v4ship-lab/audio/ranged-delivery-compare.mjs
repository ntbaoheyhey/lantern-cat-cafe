/** Compare packaging of the signed PCM without changing any installed audio. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {measureSprites} from './ranged-codec-measure.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const reuse=process.argv[3]?.match(/^--reuse=(\d+)$/)?.[1];assert(!process.argv[3]||reuse);
const out=resolve(root,`reports/v4-ship/S11/ranged-delivery-comparison-${attempt}.json`),raw=out.replace('.json','.rows.json.gz');
const folder=resolve(root,`work/v4ship-audio/ranged-delivery-compare-${reuse??attempt}`);
assert(![out,raw].some(existsSync)&&!existsSync(resolve(root,'STOP-V4SHIP')));if(reuse)assert(existsSync(folder));else{assert(!existsSync(folder));mkdirSync(folder,{recursive:true});}
const hash=b=>createHash('sha256').update(b).digest('hex');
const sign=p=>({path:relative(root,p),bytes:readFileSync(p).length,sha256:hash(readFileSync(p))});
const read=p=>JSON.parse(readFileSync(resolve(root,p)));
const verify=s=>{const b=readFileSync(resolve(root,s.path));assert.equal(hash(b),s.sha256,s.path);return b;};
const reusedAttempt=reuse?read(`reports/v4-ship/S11/ranged-delivery-attempt-${reuse}.json`):null;
if(reusedAttempt)for(const file of reusedAttempt.candidateFiles)verify(file);
const sourcePath='reports/v4-ship/S11/ranged-class-bake-1.json',source=read(sourcePath),pcm=verify(source.pcm);
const prepared=JSON.parse(verify(source.manifest)),manifest=read('apps/web/public/audio/manifest.json'),signature=runtimeSignature(root);
assert(source.reconstructionPass&&source.uniqueSprites===144&&pcm.length%4===0);
for(const [cue,design]of Object.entries(prepared.designs))assert.deepEqual(manifest.designs[cue],design);
const monolith=source.files.map(f=>{const p=resolve(root,`apps/web/public/audio/v4-ranged-impacts.${f.format}`);assert.equal(hash(readFileSync(p)),f.sha256);return {format:f.format,...sign(p)};});
const rate=48000,guard=Math.round(rate*.08),ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const run=(cmd,args)=>{const result=spawnSync(cmd,args,{encoding:'utf8'});assert.equal(result.status,0,`${cmd} failed; runtime unchanged`);return result;};
const groups=[...['ember','heavy','shadow','tide'].map(element=>({id:element,elements:[element]})),{id:'ember-heavy',elements:['ember','heavy']}],packages=[];
for(const group of groups){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));
 const pack=`v4-ranged-${group.id}`,parts=[],variants=[];let cursor=0;
 for(const row of source.variants.filter(v=>group.elements.includes(v.element))){
  const start=Math.round(row.sample.start*rate),length=Math.round(row.sample.duration*rate);
  assert(Math.abs(start-row.sample.start*rate)<1e-6&&Math.abs(length-row.sample.duration*rate)<1e-6);
  assert(start>=0&&(start+length)*4<=pcm.length);
  parts.push(pcm.subarray(start*4,(start+length)*4),Buffer.alloc(guard*4));
  variants.push({...row,sample:{...row.sample,pack,start:cursor/rate}});cursor+=length+guard;
 }
 assert.equal(variants.length,36*group.elements.length);
 const local=resolve(folder,group.id);if(!reuse)mkdirSync(local);const selected=Buffer.concat(parts),pcmPath=resolve(local,'reference.f32'),wavPath=resolve(local,'reference.wav'),paddedPath=resolve(local,'vorbis-input.f32');
 assert.equal(selected.length,cursor*4);let scaling=null;
 if(reuse){assert(readFileSync(pcmPath).equals(selected));assert(readFileSync(paddedPath).equals(Buffer.concat([Buffer.alloc(128*4),selected])));}else{
  writeFileSync(pcmPath,selected);writeFileSync(paddedPath,Buffer.concat([Buffer.alloc(128*4),selected]));
  run(ffmpeg,['-v','error','-n','-f','f32le','-ar',String(rate),'-ac','1','-i',pcmPath,'-c:a','pcm_f32le',wavPath]);
  run(ffmpeg,['-v','error','-n','-f','f32le','-ar',String(rate),'-ac','1','-i',paddedPath,'-c:a','libvorbis','-q:a','7',resolve(local,pack+'.webm')]);
  const encoded=run('lame',['--verbose','--noreplaygain','--scale',String(1/.97),'-b','192','-m','m',wavPath,resolve(local,pack+'.mp3')]);
  scaling=Number(encoded.stderr.match(/\n\s*scaling:\s*([\d.]+)/)?.[1]);assert.equal(scaling,1);
 }
 packages.push({...group,pack,variants,samples:cursor,pcm:sign(pcmPath),reference:sign(wavPath),files:['webm','mp3'].map(format=>({format,...sign(resolve(local,pack+'.'+format))})),reportedLameScaling:scaling});
 console.log(JSON.stringify({group:group.id,sprites:variants.length,bytes:packages.at(-1).files.map(f=>({format:f.format,bytes:f.bytes}))}));
}
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test'),rows=[],baselineDecodes=[];
for(const name of ['chromium','webkit']){
 const browser=await playwright[name].launch({headless:true});
 try{const page=await browser.newPage();for(const rate of [48000,44100]){
  for(const file of monolith){
   const result=await page.evaluate(async({base64,rate})=>{try{const context=new OfflineAudioContext(1,1,rate),buffer=await context.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);return {decoded:true,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,frames:buffer.length};}catch(error){return {decoded:false,errorName:error.name,errorMessage:String(error.message).slice(0,180)};}},{base64:readFileSync(resolve(root,file.path)).toString('base64'),rate});
   baselineDecodes.push({browser:name,version:browser.version(),rate,file,...result});
  }
  for(const pack of packages){
  assert(!existsSync(resolve(root,'STOP-V4SHIP')));
  await page.evaluate(async({base64,rate})=>{const ctx=new OfflineAudioContext(1,1,rate),buffer=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);if(buffer.numberOfChannels!==1)throw Error('Unexpected reference channels');window.__originalPCM=buffer.getChannelData(0);},{base64:readFileSync(resolve(root,pack.reference.path)).toString('base64'),rate});
  for(const file of pack.files){
   let measured;try{measured={decoded:true,...await measureSprites(page,readFileSync(resolve(root,file.path)),pack.variants,rate)};}catch(error){measured={decoded:false,errorName:error.name,errorMessage:String(error.message).slice(0,180),allComplete:false};}
   const row={browser:name,version:browser.version(),rate,group:pack.id,format:file.format,...measured};rows.push(row);writeFileSync(raw,gzipSync(JSON.stringify(rows)));
   console.log(JSON.stringify({browser:name,rate,group:pack.id,format:file.format,lagSamples:row.lagSamples,minCorrelation:row.minimumCanonicalCorrelation,maxRmsDeltaDb:row.maximumAlignedRmsDeltaDb,complete:row.allComplete}));
  }
 }}}finally{await browser.close();}
}
const cases=[...['ember','heavy','shadow','tide'].map(x=>({name:x,elements:[x]})),{name:'observed-trial-boss',elements:['ember','heavy']},{name:'all-ranged-palettes',elements:['ember','heavy','shadow','tide']}];
const costs=[];
for(const format of ['webm','mp3'])for(const c of cases)for(const method of ['monolith','palettes','encounter-with-fallback']){
 const files=method==='monolith'?monolith.filter(f=>f.format===format):method==='palettes'?packages.filter(p=>c.elements.includes(p.id)).flatMap(p=>p.files.filter(f=>f.format===format)):[...(c.elements.some(e=>['ember','heavy'].includes(e))?packages.find(p=>p.id==='ember-heavy').files.filter(f=>f.format===format):[]),...(c.elements.some(e=>['shadow','tide'].includes(e))?monolith.filter(f=>f.format===format):[])];
 costs.push({...c,format,method,requests:files.length,encodedPayloadBytes:files.reduce((n,f)=>n+f.bytes,0),files:files.map(f=>({path:f.path,sha256:f.sha256}))});
}
const reconstructionPass=rows.length===40&&rows.every(r=>r.decoded===true&&r.channels===1&&r.allComplete&&r.lagSamples.every(n=>n===0)&&r.minimumCanonicalCorrelation>=.99&&r.maximumAlignedRmsDeltaDb<=.1);
writeFileSync(raw,gzipSync(JSON.stringify(rows)));assertUnchanged(root,signature);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-audio-delivery.md',inputs:[sign(resolve(root,sourcePath)),source.pcm,source.manifest,...monolith],harness:[sign(import.meta.filename),sign(resolve(root,'tools/v4ship-lab/audio/ranged-codec-measure.mjs'))],signature,packages,rows:rows.map(({variants,...r})=>r),raw:sign(raw),costs,reconstructionPass,runtimeChanged:false,overallTransferGatePass:false,physicalOnsetVerified:false,humanListeningVerified:false,limits:['Encoded payload sizes exclude HTTP headers, manifest changes and cache behavior; no actual shipping transfer result is inferred.','Nominal-pitch reconstruction preserves the existing composite limitations; human or arbitrary-speed waveform equality is not inferred.','Preload routing is unchanged and every candidate remains outside installed/public assets.','Current ART images alone exceed the entire 8MB transfer budget.']};
report.baselineDecodes=baselineDecodes;report.reusedCandidateAttempt=reuse?sign(resolve(root,`reports/v4-ship/S11/ranged-delivery-attempt-${reuse}.json`)):null;
report.limits.push('All40prespecified cases remain required; decode errors are recorded failures, never removed from the reconstruction gate.');
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,out),reconstructionPass,decodeFailures:rows.filter(r=>!r.decoded).map(({browser,rate,group,format,errorMessage})=>({browser,rate,group,format,errorMessage})),baselineDecodes,costs:costs.filter(c=>c.name==='observed-trial-boss').map(({files,...r})=>r)}));
if(!reconstructionPass)process.exitCode=1;
