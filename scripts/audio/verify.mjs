import {readFileSync,writeFileSync,statSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'apps/web/public/audio');
const m=JSON.parse(readFileSync(resolve(dir,'manifest.json'))),licenses=JSON.parse(readFileSync(resolve(dir,'LICENSES.json'))).files;
const report=[];let errors=[];
for(const file of readdirSync(dir).filter(f=>/\.(webm|mp3)$/.test(f))){
 const p=resolve(dir,file),r=spawnSync('ffmpeg',['-hide_banner','-i',p,'-af','loudnorm=I=-18:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8'});
 const match=r.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);if(!match)throw new Error(file+' loudness unavailable');const loud=JSON.parse(match[0]);
 const music=/^(landing|home|battle|boss)\./.test(file),voice=file.startsWith('voice.');
 const pcm=spawnSync('ffmpeg',['-v','error','-i',p,'-f','f32le','-ac','1','-ar','44100','pipe:1'],{maxBuffer:32*1024*1024}).stdout;const f=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength));
 const size=2205,rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/a.length),seam=music?Math.abs(20*Math.log10(rms(f.slice(0,size))/rms(f.slice(-size)))):null;
 if(Number(loud.input_tp)>-1)errors.push(file+' peak > -1 dBTP');
 if((music||voice)&&Math.abs(Number(loud.input_i)-(voice?-16:-18))>1.1)errors.push(file+' loudness');
 if(music&&seam>6)errors.push(file+' loop RMS gap > 6 dB');
 if(!licenses.find(l=>l.file===file&&l.sourceUrl&&l.author&&l.license==='CC0-1.0'))errors.push(file+' missing licence');
 report.push({file,bytes:statSync(p).size,integratedLUFS:Number(loud.input_i),truePeakDbTP:Number(loud.input_tp),loopRmsDifferenceDb:seam});
}
for(const [id,samples] of Object.entries(m.cues))if(!samples.length||samples.some(s=>!m.packs[s.pack]||!(s.duration>0)))errors.push(id+' invalid mapping');
const bytes=report.reduce((a,b)=>a+b.bytes,0);if(bytes>12*1024*1024)errors.push('12 MB budget');
writeFileSync(resolve(root,'reports/v3-shell/AUDIO-LOUDNESS.json'),JSON.stringify({bytes,files:report,errors},null,2)+'\n');
console.log(JSON.stringify({files:report.length,cues:Object.keys(m.cues).length,bytes,errors},null,2));process.exitCode=errors.length?1:0;
