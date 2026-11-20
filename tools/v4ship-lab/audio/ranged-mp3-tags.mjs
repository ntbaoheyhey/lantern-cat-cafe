/** Compare native LAME and iTunes comments while preserving every earlier encode. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {measureSprites} from './ranged-codec-measure.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-mp3-tags-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-mp3-tags-${attempt}.json`);
assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const sourcePath='reports/v4-ship/S11/ranged-impact-bake-1.json',source=JSON.parse(readFileSync(resolve(root,sourcePath))),pcmPath=resolve(root,source.output,'impacts.f32'),pcm=readFileSync(pcmPath);
const originalPath=resolve(root,source.output,'v4-ranged-impacts.mp3'),original=readFileSync(originalPath);assert.equal(hash(original),source.comparisons.find(r=>r.format==='mp3').sha256);
const ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const wav=resolve(folder,'original.wav'),native=resolve(folder,'native-lame.mp3');
execFileSync(ffmpeg,['-v','error','-y','-f','f32le','-ar','48000','-ac','1','-i',pcmPath,'-c:a','pcm_f32le',wav]);
execFileSync('lame',['--silent','--noreplaygain','-b','192','-m','m',wav,native]);
const info=original.indexOf(Buffer.from('Info'));assert(info>=0);assert.equal(original.readUInt32BE(info+4),15);
const encodedFrames=original.readUInt32BE(info+8)*1152,inputFrames=pcm.length/4,delayAndPadding=original.readUIntBE(info+141,3),encoderDelay=delayAndPadding>>>12,encoderPadding=delayAndPadding&4095;
assert.equal(encodedFrames-encoderDelay-encoderPadding,inputFrames);
const skip=original.subarray(0,3).toString()==='ID3'?10+original.subarray(6,10).reduce((n,v)=>n*128+v,0):0,mp3Data=original.subarray(skip);
const files=[{name:'original',...signed(relative(root,originalPath)),processing:'Original FFmpeg encoded source.'},{name:'native-lame',...signed(relative(root,native)),processing:'Same float PCM, native LAME CBR192k mono, no ReplayGain.'}];
for(const [name,priming] of [['itunes-total-1105',encoderDelay+529],['itunes-encoder-576',encoderDelay]]){
 const remainder=encodedFrames-inputFrames-priming;assert(remainder>=0);
 const value=` 00000000 ${priming.toString(16).padStart(8,'0')} ${remainder.toString(16).padStart(8,'0')} ${inputFrames.toString(16).padStart(16,'0')} 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000000`;
 const body=Buffer.concat([Buffer.from([0]),Buffer.from('engiTunSMPB\0'+value,'ascii')]),frame=Buffer.alloc(10);frame.write('COMM');frame.writeUInt32BE(body.length,4);
 const tag=Buffer.concat([frame,body]),header=Buffer.from([73,68,51,3,0,0,0,0,0,0]);let size=tag.length;for(let i=9;i>=6;i--){header[i]=size&127;size>>>=7;}
 const path=resolve(folder,name+'.mp3');writeFileSync(path,Buffer.concat([header,tag,mp3Data]));
 files.push({name,...signed(relative(root,path)),priming,remainder,inputFrames,processing:'Replace ID3 only with an ISO-8859-1 English COMM iTunSMPB. MPEG frames remain byte-identical.',mpegSha256:hash(mp3Data),metadataMeaning:name.includes('total')?'Encoder plus decoder priming.':'Alternative encoder-only convention; experimental, not assumed interoperable.'});
}
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test'),rows=[];
for(const browserName of ['chromium','webkit']){
 const browser=await playwright[browserName].launch({headless:true});
 try{
  const page=await browser.newPage();await page.evaluate(base64=>{window.__originalPCM=new Float32Array(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);},pcm.toString('base64'));
  for(const file of files){
   assert(!existsSync(resolve(root,'STOP-V4SHIP')));const bytes=readFileSync(resolve(root,file.path));assert.equal(hash(bytes),file.sha256);
   const row={browser:browserName,version:browser.version(),file,bytes:bytes.length,...await measureSprites(page,bytes,source.layerCombinations)};rows.push(row);
   console.log(JSON.stringify({browser:browserName,candidate:file.name,lagSamples:row.lagSamples,minimumCanonicalCorrelation:row.minimumCanonicalCorrelation,minimumAlignedCorrelation:row.minimumAlignedCorrelation,allComplete:row.allComplete}));
  }
 }finally{await browser.close();}
}
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',source:signed(sourcePath),pcm:signed(relative(root,pcmPath)),harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/ranged-codec-measure.mjs')],mpeg:{frames:encodedFrames/1152,encoderDelay,encoderPadding,inputFrames},files,rows,
 method:'Same wide-lag full-sprite measurement as muxer comparison1. Native LAME changes encoding implementation; the two iTunes comments change only ID3 and explicitly retain identical MPEG frame bytes.',runtimeChanged:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),cases:rows.length}));
