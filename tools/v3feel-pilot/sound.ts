// Quiet, original deterministic synthesis; accepted callout is reused unchanged.
export const cues=[
 {at:2.0,duration:.22,type:'whoosh',cause:'basic anticipation'},
 {at:2.35,duration:.2,type:'contact',cause:'basic contact'},
 {at:4.5,duration:1.0,type:'callout',cause:'ultimate focus'},
 {at:5.1,duration:.5,type:'riser',cause:'ultimate cast'},
 {at:5.6,duration:.35,type:'ultimate',cause:'ultimate contact'},
 {at:5.95,duration:.65,type:'tail',cause:'ultimate residue'},
 {at:8.5,duration:.2,type:'contact',cause:'hit response'},
 {at:10.8,duration:.8,type:'tail',cause:'death dissolve'},
];
export class PilotSound{
 context?:AudioContext;gain?:GainNode;buffers=new Map<string,AudioBuffer>();sources:AudioBufferSourceNode[]=[];events:any[]=[];
 async prepare(){if(this.context)return;const ctx=this.context=new AudioContext({sampleRate:48000});this.gain=ctx.createGain();this.gain.gain.value=.84;this.gain.connect(ctx.destination);
  const voice=await ctx.decodeAudioData(await(await fetch('/audio/callout-soot.mp3')).arrayBuffer());
  const manifest=await(await fetch('/audio/manifest.json')).json(),line=manifest.cues['voice.soot.ult.charge'][0];
  const cut=ctx.createBuffer(voice.numberOfChannels,Math.round(line.duration*ctx.sampleRate),ctx.sampleRate);
  for(let c=0;c<voice.numberOfChannels;c++)cut.copyToChannel(voice.getChannelData(c).subarray(Math.round(line.start*ctx.sampleRate),Math.round((line.start+line.duration)*ctx.sampleRate)),c);
  this.buffers.set('callout',cut);
  for(const cue of cues.filter(c=>c.type!=='callout')){
   const buffer=ctx.createBuffer(1,Math.ceil(cue.duration*48000),48000),v=buffer.getChannelData(0);let seed=971;
   for(let i=0;i<v.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967296*2-1,t=i/48000,p=i/v.length;
    const attack=Math.min(1,i/64),env=attack*(1-p)**2;
    if(cue.type==='whoosh')v[i]=noise*Math.sin(Math.PI*p)**2*.15;
    else if(cue.type==='riser')v[i]=(Math.sin(2*Math.PI*(180*t+620*t*t))*.12+noise*.04)*Math.sin(Math.PI*p)**2;
    else if(cue.type==='tail')v[i]=(Math.sin(t*2*Math.PI*740)+Math.sin(t*2*Math.PI*1110)*.5)*.10*env;
    else v[i]=(Math.sin(2*Math.PI*(120*t-80*t*t))*.28+noise*.12+Math.sin(t*2*Math.PI*1450)*.12)*env;
   }this.buffers.set(cue.type,buffer);
  }
 }
 play(zero:number,cycle=0){for(const cue of cues){const src=this.context!.createBufferSource();src.buffer=this.buffers.get(cue.type)!;src.connect(this.gain!);src.start(zero+cue.at);this.sources.push(src);this.events.push({...cue,cycle,actualBufferDuration:src.buffer.duration,contextAt:zero+cue.at});}}
 stop(){for(const src of this.sources){try{src.stop();}catch{}}this.sources=[];}
}
