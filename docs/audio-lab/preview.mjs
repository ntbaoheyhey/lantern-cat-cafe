/** Live audition from licensed cat + mouth recordings. No speech API or new media files. */
export const syllables=text=>[...text.toLowerCase().matchAll(/[a-z']+/g)].flatMap(([word])=>{const parts=word.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=[^aeiouy]|$))?|[^aeiouy]+$/g)||[word];if(parts.length>1&&parts.at(-1)==='e'){parts[parts.length-2]+='e';parts.pop();}return parts;}).slice(0,24);
const vowel=s=>s.match(/[aeiouy]/)?.[0]?.replace('y','i')||'u';
const onset=s=>/^(sh|ch|s|f|h|v|z)/.test(s)?'fricative':/^[mn]/.test(s)?'nasal':/^[lrwy]/.test(s)?'liquid':'plosive';
const formants={a:[730,1090],e:[530,1840],i:[270,2290],o:[570,840],u:[300,870]};
export class CatPreview{
 constructor(root,profiles,clips){this.root=root;this.profiles=profiles;this.clips=clips;this.buffers=new Map();this.sources=[];this.level=.5;this.generation=0;this.renders=[];}
 async buffer(path){if(!this.buffers.has(path))this.buffers.set(path,(async()=>{const r=await fetch(new URL(path,this.root));if(!r.ok)throw Error(`Voice source ${r.status}`);return this.ctx.decodeAudioData(await r.arrayBuffer());})());return this.buffers.get(path);}
 stop(){this.generation++;for(const source of this.sources)try{source.stop();}catch{}this.sources=[];}
 async say(cat,text){
  this.stop();const token=this.generation;this.ctx??=new AudioContext();await this.ctx.resume();const p=this.profiles[cat],parts=syllables(text);if(!parts.length)throw Error('Enter a short line first.');
  const mouth=this.clips.filter(r=>r.role==='consonant'),pools={plosive:mouth.filter(r=>r.tags.some(t=>/pop|click/.test(t))),fricative:mouth.filter(r=>r.sourceId==='freesound:691913'),nasal:mouth.filter(r=>r.sourceId==='freesound:104374'),liquid:mouth.filter(r=>r.sourceId==='freesound:843435')};
  const catBuffer=await this.buffer(`assets/audio-sources/b2/cats/${p.source}.flac`),mouthRows=parts.map((s,i)=>pools[onset(s)][i%pools[onset(s)].length]),mouthBuffers=await Promise.all(mouthRows.map(r=>this.buffer(r.path)));if(token!==this.generation)return {syllables:0,consonants:0};
  const data=catBuffer.getChannelData(0),size=Math.floor(catBuffer.sampleRate*.12),candidates=[];
  for(let start=0;start+size<=data.length;start+=Math.max(1,size>>1)){let energy=0;for(let j=0;j<size;j+=8)energy+=data[start+j]**2;candidates.push({start,energy});}
  candidates.sort((a,b)=>b.energy-a.energy);const selected=[];for(const c of candidates){if(selected.every(s=>Math.abs(c.start-s)>=size))selected.push(c.start);if(selected.length===5)break;}if(!selected.length)throw Error('Cat source has no usable grain');selected.sort((a,b)=>a-b);
  const gain=this.ctx.createGain(),meter=this.ctx.createAnalyser();meter.fftSize=2048;this.meter=meter;gain.gain.value=this.level*.28;gain.connect(meter).connect(this.ctx.destination);let at=this.ctx.currentTime+.025;
  const source=(buffer,start,duration,offset,volume,rate,filter)=>{
   const node=this.ctx.createBufferSource(),envelope=this.ctx.createGain();node.buffer=buffer;node.playbackRate.value=rate;node.connect(envelope);if(filter)envelope.connect(filter).connect(gain);else envelope.connect(gain);
   envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(volume,start+.005);envelope.gain.setValueAtTime(volume,start+duration-.012);envelope.gain.linearRampToValueAtTime(0,start+duration);
   node.start(start,offset);node.stop(start+duration);this.sources.push(node);node.onended=()=>{node.disconnect();envelope.disconnect();filter?.disconnect();};return node;
  };
  parts.forEach((part,i)=>{
   const cls=onset(part),mouthDuration=cls==='plosive'?.035:.05,f=this.ctx.createBiquadFilter();f.type=cls==='fricative'?'highpass':cls==='nasal'?'lowpass':'bandpass';f.frequency.value=cls==='fricative'?1900:cls==='nasal'?650:1100;f.Q.value=.6;
   source(mouthBuffers[i],at,mouthDuration,0,.7,1,f);const v=vowel(part),offset=selected['aeiou'.indexOf(v)%selected.length]/catBuffer.sampleRate,duration=p.speed*(i===parts.length-1&&/[!?]$/.test(text)?1.3:1),filter=this.ctx.createBiquadFilter();filter.type='peaking';filter.frequency.value=formants[v][0]*p.formantShift;filter.Q.value=.8;filter.gain.value=6;
   const node=source(catBuffer,at+mouthDuration,duration,offset,.9,2**(p.baseSemitones/12),filter);node.loop=true;node.loopStart=offset;node.loopEnd=offset+.12;
   node.playbackRate.exponentialRampToValueAtTime(2**((p.baseSemitones+p.range*(/[!?]$/.test(text)?.65:-.55)*(i+1)/parts.length)/12),at+mouthDuration+duration);at+=mouthDuration+duration+.018;
  });
  const result={cat,text,syllables:parts.length,consonants:parts.length,duration:at-this.ctx.currentTime};this.renders.push(result);setTimeout(()=>{gain.disconnect();meter.disconnect();},(result.duration+.1)*1000);return result;
 }
}
