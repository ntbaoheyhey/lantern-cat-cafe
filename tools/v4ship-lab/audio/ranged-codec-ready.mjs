/** Validate prepared sprite encodes at both desktop context rates before installing anything. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {measureSprites} from './ranged-codec-measure.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-codec-ready-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-codec-ready-${attempt}.json`),raw=output.replace('.json','.rows.json.gz');
assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const sourcePath='reports/v4-ship/S11/ranged-impact-bake-1.json',source=read(sourcePath),paddingPath='reports/v4-ship/S11/ranged-codec-padding-1.json',padding=read(paddingPath),tagsPath='reports/v4-ship/S11/ranged-mp3-tags-1.json',tags=read(tagsPath);
const referencePath='work/v4ship-audio/ranged-mp3-tags-1/original.wav',reference=readFileSync(resolve(root,referencePath)),native=tags.files.find(f=>f.name==='native-lame');
assert.equal(hash(readFileSync(resolve(root,native.path))),native.sha256);
const target=resolve(folder,'v4-ranged-impacts.mp3'),options=['--silent','--noreplaygain','--scale','1','-b','192','-m','m'];
execFileSync('lame',[...options,resolve(root,referencePath),target]);
const files=[{name:'native-default',format:'mp3',...native},{name:'native-unity',format:'mp3',...signed(relative(root,target)),options},{name:'padded-vorbis',format:'webm',...padding.selectedCandidate}],rows=[];
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test');
for(const browserName of ['chromium','webkit']){
 const browser=await playwright[browserName].launch({headless:true});
 try{
  const page=await browser.newPage();
  for(const rate of [48000,44100]){
   await page.evaluate(async({base64,rate})=>{const ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);window.__originalPCM=decoded.getChannelData(0);},{base64:reference.toString('base64'),rate});
   for(const file of files){
    assert(!existsSync(resolve(root,'STOP-V4SHIP')));const bytes=readFileSync(resolve(root,file.path));assert.equal(hash(bytes),file.sha256);
    const row={browser:browserName,version:browser.version(),candidate:file.name,format:file.format,file,bytes:bytes.length,rate,...await measureSprites(page,bytes,source.layerCombinations,rate)};rows.push(row);
    console.log(JSON.stringify({browser:browserName,rate,candidate:file.name,lagSamples:row.lagSamples,minimumCanonicalCorrelation:row.minimumCanonicalCorrelation,maximumAlignedRmsDeltaDb:row.maximumAlignedRmsDeltaDb,allComplete:row.allComplete}));
   }
  }
 }finally{await browser.close();}
}
const selectedRows=rows.filter(r=>r.candidate==='native-unity'||r.candidate==='padded-vorbis');
const reconstructionPass=selectedRows.length===8&&selectedRows.every(r=>r.channels===1&&r.allComplete&&r.lagSamples.every(n=>n===0)&&r.minimumCanonicalCorrelation>=.99&&r.maximumAlignedRmsDeltaDb<=.1);
const bytes=gzipSync(JSON.stringify(rows));writeFileSync(raw,bytes);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',inputs:[signed(sourcePath),signed(paddingPath),signed(tagsPath),signed(referencePath)],harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/ranged-codec-measure.mjs')],
 rows:rows.map(({variants,...r})=>r),raw:signed(relative(root,raw)),reconstructionPass,
 selectedCandidate:reconstructionPass?{webm:padding.selectedCandidate,mp3:signed(relative(root,target))}:null,
 criteria:'Preparation reconstruction check: each of72complete sprites at48/44.1kHz in Chromium/WebKit has zero best lag, correlation>=0.99 and absolute RMS difference<=0.1dB. These are codec checks, not changes to any SHIP acceptance gate.',
 limits:['Each reference WAV is resampled by the same browser to the same context rate as the candidate.','Native default scale is compared with explicitly requested unity scale. No loudness normalization or new recording.','Browser decoding is not actual playback, physical onset or human listening. Runtime and published assets are unchanged.'],runtimeChanged:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),reconstructionPass}));
if(!reconstructionPass)process.exitCode=1;
