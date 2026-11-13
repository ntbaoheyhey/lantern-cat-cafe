/** Infer interrupted speech from real source starts and selected sprite lengths. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const base='reports/v3-shell/b2',trial=process.env.MIX_TRIAL||'11-room-tails';
const manifestPath='apps/web/public/audio/manifest.json';
const manifest=JSON.parse(readFileSync(manifestPath));
const sign=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const scenes=['battle','boss'].map(name=>{
 const metric=JSON.parse(readFileSync(`${base}/mix/${trial}-${name}.json`));
 const runtime=JSON.parse(gunzipSync(readFileSync(metric.runtime.path)));
 const voices=runtime.hits.filter(h=>h.id.startsWith('voice.')&&h.result==='played');
 const interrupted=[];
 for(let i=0;i<voices.length-1;i++){
  const current=voices[i],next=voices[i+1],layer=current.layers[0];
  const sample=manifest.cues[current.id]?.find(s=>s.variantId===layer.variantId);
  if(!sample)throw Error(`No selected voice sample for ${current.id}/${layer.variantId}`);
  const expectedMs=sample.duration/(layer.pitch||1)*1000,heardMs=next.at-current.at;
  if(expectedMs>heardMs+40)interrupted.push({cueId:current.id,variantId:layer.variantId,expectedMs:Math.round(expectedMs),heardMs,nextCueId:next.id,at:current.at});
 }
 const required=cue=>/^voice\..+\.(ult\.(charge|release)|skill\..+)$/.test(cue);
 return {name,runtime:metric.runtime,played:voices.length,interruptedCount:interrupted.length,
  requiredInterruptedCount:interrupted.filter(row=>required(row.cueId)).length,
  preemptibleBarkCount:interrupted.filter(row=>!required(row.cueId)).length,interrupted};
});
const result={trial,manifest:sign(manifestPath),method:'Inferred from logged source starts, selected sprite duration and the engine single-voice stop policy. A 40 ms tolerance excludes timing jitter. Not a waveform transcription.',scenes};
writeFileSync(`${base}/VOICE-INTERRUPTIONS.json`,JSON.stringify(result,null,2)+'\n');
console.log(scenes.map(s=>`${s.name}: ${s.interruptedCount}/${s.played} interrupted`).join('\n'));
