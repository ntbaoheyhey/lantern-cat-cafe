/** Pinned delivery review: native sample alignment, channels, gain and cue windows. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,judgeUrl,runtimeEvidence} from './production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),[label,candidateRef,set]=process.argv.slice(2);
assert(/^[a-z0-9-]+$/.test(label??''));assert(/^[a-f0-9]{7,40}$/.test(candidateRef??''));assert(['callouts','beds'].includes(set));
const out=resolve(root,'work/v5/CXI/audio',label);try{await access(out);throw Error('Fresh label required');}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(out,{recursive:true});
const sourceRef='v5-m1.11',names=set==='callouts'?['spool-ram','needle-moth','teacup-healer','kettle-knight','pollen-scout','crumb-sentinel'].map(x=>'callout-'+x):['score-boss','score-dawn','scene-workshop','scene-rain'];
const manifest=JSON.parse(await readFile(resolve(root,'apps/web/public/audio/manifest.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
function cuesFor(pack){const result=[];function walk(v,path){if(!v||typeof v!=='object')return;if(v.pack===pack&&typeof v.start==='number')result.push({path,start:v.start,duration:v.duration,loop:v.loop,variantId:v.variantId});for(const[k,x]of Object.entries(v))walk(x,path+'.'+k);}walk(manifest,'manifest');return result;}
function file(ref,path){const bytes=execFileSync('git',['show',ref+':'+path],{cwd:root,maxBuffer:8*1024*1024});const at=bytes.indexOf('OpusHead');return{ref,path,bytes:bytes.length,sha256:hash(bytes),base64:bytes.toString('base64'),opusHeader:at<0?null:{channels:bytes[at+9],preSkip:bytes.readUInt16LE(at+10),inputRate:bytes.readUInt32LE(at+12),outputGainQ78:bytes.readInt16LE(at+16)}};}
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceRef,candidateRef,set,judgeUrl,...runtimeEvidence(),toolSha256:hash(await readFile(import.meta.filename)),method:'Pinned git bytes decoded by native Chromium AudioContext at48000Hz. Exact lengths/channels/PCM, onset alignment search±960samples, aligned gain/SNR and canonical cue coverage. No subjective listening, loop quality or integration acceptance claim.',rows:[],complete:false};
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto(judgeUrl);
 for(const name of names){
  const files={source:file(sourceRef,'apps/web/public/audio/'+name+'.webm'),candidate:file(candidateRef,'apps/web/public/audio/v5/'+(set==='callouts'?'voice_reencoded/':'legacy/')+name+'.opus')};
  for(const [variant,f]of Object.entries(files))await writeFile(resolve(out,name+'-'+variant+(variant==='source'?'.webm':'.opus')),Buffer.from(f.base64,'base64'));
  const cues=cuesFor(name);
  const decoded=await page.evaluate(async({files,cues})=>{
   const ctx=new AudioContext({sampleRate:48000}),buffers={},rows={};
   const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   try{
    for(const [name,f]of Object.entries(files)){
     const bytes=Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0));const b=await ctx.decodeAudioData(bytes.buffer);buffers[name]=b;const channels=[];
     for(let c=0;c<b.numberOfChannels;c++){const a=b.getChannelData(c);let sum=0,peak=0,clipped=0;for(const v of a){sum+=v*v;peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>=1)clipped++;}channels.push({pcmSha256:await hash(a.buffer),rms:Math.sqrt(sum/a.length),peak,clipped});}
     rows[name]={sampleRate:b.sampleRate,frames:b.length,duration:b.duration,channels:b.numberOfChannels,channelMetrics:channels,cueCoverage:cues.map(c=>({...c,endFrame:Math.round((c.start+c.duration)*b.sampleRate),missingFrames:Math.max(0,Math.round((c.start+c.duration)*b.sampleRate)-b.length)}))};
    }
    const a=buffers.source;
    for(const name of Object.keys(buffers).filter(n=>n!=='source')){
     const b=buffers[name],comparisons=[];
     for(let c=0;c<Math.min(a.numberOfChannels,b.numberOfChannels);c++){
      const x=a.getChannelData(c),y=b.getChannelData(c),n=Math.min(x.length,y.length);let xx=0,yy=0,xy=0,error=0;
      for(let i=0;i<n;i++){xx+=x[i]*x[i];yy+=y[i]*y[i];xy+=x[i]*y[i];error+=(x[i]-y[i])**2;}
      const score=(lag,stride)=>{let xx=0,yy=0,xy=0;for(let i=960;i<n-960;i+=stride){const u=x[i+lag],v=y[i];xx+=u*u;yy+=v*v;xy+=u*v;}return xy/Math.sqrt(xx*yy);};
      let bestLag=0,bestScore=-Infinity;
      for(let lag=-960;lag<=960;lag+=8){const v=score(lag,32);if(v>bestScore){bestScore=v;bestLag=lag;}}
      const coarse=bestLag;for(let lag=Math.max(-960,coarse-8);lag<=Math.min(960,coarse+8);lag++){const v=score(lag,16);if(v>bestScore){bestScore=v;bestLag=lag;}}
      let axx=0,ayy=0,axy=0,ae=0,count=0;
      for(let i=Math.max(0,-bestLag);i<Math.min(y.length,x.length-bestLag);i++){const u=x[i+bestLag],v=y[i];axx+=u*u;ayy+=v*v;axy+=u*v;ae+=(u-v)**2;count++;}
      comparisons.push({correlation:xy/Math.sqrt(xx*yy),rmsGainDb:10*Math.log10(yy/xx),leastSquaresGain:xy/xx,snrDb:10*Math.log10(xx/error),comparedFrames:n,alignment:{sourceOffsetSamples:bestLag,searchRangeSamples:960,correlation:axy/Math.sqrt(axx*ayy),rmsGainDb:10*Math.log10(ayy/axx),snrDb:10*Math.log10(axx/ae),comparedFrames:count}});
     }
     rows[name].vsSource={frameDelta:b.length-a.length,channelsMatch:b.numberOfChannels===a.numberOfChannels,comparisons};
    }
    return rows;
   }finally{await ctx.close();}
  },{files,cues});
  for(const f of Object.values(files))delete f.base64;
  report.rows.push({name,files,cues,decoded});
  console.log(JSON.stringify({name,saving:files.source.bytes-files.candidate.bytes,channels:[decoded.source.channels,decoded.candidate.channels],frames:[decoded.source.frames,decoded.candidate.frames],comparison:decoded.candidate.vsSource,missingCueFrames:Math.max(0,...decoded.candidate.cueCoverage.map(c=>c.missingFrames))}));
 }
 report.complete=true;
}finally{await browser.close();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
