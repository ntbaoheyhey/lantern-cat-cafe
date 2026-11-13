/** Reference measurement only. Never writes decoded reference audio or ships it. */
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),base=resolve(root,'reports/v3-shell/b2');
const plan=JSON.parse(readFileSync(resolve(base,'REFERENCE-WINDOWS.json'),'utf8'));
const windows=[];
for(const window of plan.windows) {
  if(!existsSync(window.source)) throw Error(`Reference missing: ${window.source}`);
  const measured=JSON.parse(execFileSync('python3',[resolve(root,'scripts/audio/analyse.py'),window.source,'--start',String(window.startSeconds),'--duration',String(window.durationSeconds)],{encoding:'utf8',maxBuffer:8*1024*1024}));
  windows.push({...window,metrics:measured});
  console.log(`${window.id}: ${measured.onsetsPerSecond.toFixed(2)} onsets/s, ${measured.layersPerOnset.toFixed(2)} bands/onset, ${measured.integratedLufs.toFixed(1)} LUFS`);
}
const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return (a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2;};
const targets={};
for(const kind of ['battle','home','bag','gacha','forge']) {
  const rows=windows.filter(w=>w.kind===kind);
  if(!rows.length) throw Error('No measured reference for '+kind);
  targets[kind]=Object.fromEntries(['onsetsPerSecond','layersPerOnset','musicBedFraction','voiceContoursPerMinute','tickTransientsPerSecond','silenceFraction','integratedLufs','loudnessRange'].map(k=>[k,median(rows.map(r=>r.metrics[k]))]));
}
mkdirSync(base,{recursive:true});
writeFileSync(resolve(base,'REFERENCE-AUDIO.json'),JSON.stringify({version:1,measurementOnly:true,videosMissing:false,algorithmSha256:createHash('sha256').update(readFileSync(resolve(root,'scripts/audio/analyse.py'))).digest('hex'),method:'Spectral flux; 6 dB four-band rises within 30 ms; sustained tonal proxy; autocorrelation contour proxy; 2-8 kHz <40 ms transients; ffmpeg EBU loudness. Not source separation; narrator can contribute.',decodedAudioFilesWritten:0,windows,targets},null,2)+'\n');
