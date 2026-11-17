/** Tee the browser's actual output into MediaRecorder. No synthetic event replay. */
import {appendFileSync,writeFileSync} from 'node:fs';
export async function installOutputCapture(page,path,stemPaths={}){
 writeFileSync(path,Buffer.alloc(0));
 await page.exposeFunction('__saveAudioChunk',bytes=>appendFileSync(path,Buffer.from(bytes)));
 for(const file of Object.values(stemPaths))writeFileSync(file,Buffer.alloc(0));
 if(Object.keys(stemPaths).length)await page.exposeFunction('__saveAudioStem',(name,bytes)=>{
  if(!Object.hasOwn(stemPaths,name))throw Error('Unknown diagnostic stem');
  appendFileSync(stemPaths[name],Buffer.from(bytes));
 });
 await page.addInitScript(stemNames=>{
  const connect=AudioNode.prototype.connect,contexts=new WeakMap(),tapped=new WeakSet();
  let mixer,destination,recorder,pending=Promise.resolve();const stems=[];
  AudioNode.prototype.connect=function(target,...args){
   const result=connect.call(this,target,...args);
   if(typeof this.context.createMediaStreamDestination==='function'&&target===this.context.destination&&!tapped.has(this)){
    tapped.add(this);
    mixer??=new AudioContext();destination??=mixer.createMediaStreamDestination();
    let tee=contexts.get(this.context);
    if(!tee){tee=this.context.createMediaStreamDestination();contexts.set(this.context,tee);mixer.createMediaStreamSource(tee.stream).connect(destination);}
    connect.call(this,tee);
   }
   return result;
  };
  window.__outputCapture={
   async start(){
    if(!destination)throw Error('No real audio output has connected.');
    await mixer.resume();
    recorder=new MediaRecorder(destination.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:128000});
    recorder.ondataavailable=event=>{pending=pending.then(async()=>{if(event.data.size)await window.__saveAudioChunk(Array.from(new Uint8Array(await event.data.arrayBuffer())));});};
    recorder.start(1000);
    for(const name of stemNames){
     const audio=window.__thAudio,node=name==='music'?audio.duck:audio.buses.get(name);
     if(!node)throw Error('Missing diagnostic bus '+name);
     const output=node.context.createMediaStreamDestination();node.connect(output);
     // Keep disconnected buses clocked through silence. Without this source,
     // MediaRecorder can omit inactive periods, making stems unalignable.
     // The zero signal goes only to the diagnostic destination.
     const silence=node.context.createConstantSource();silence.offset.value=0;
     silence.connect(output);silence.start();
     const recording=new MediaRecorder(output.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:128000});
     recording.ondataavailable=event=>{pending=pending.then(async()=>{if(event.data.size)await window.__saveAudioStem(name,Array.from(new Uint8Array(await event.data.arrayBuffer())));});};
     recording.start(1000);stems.push({recording,node,output,silence});
    }
    return Date.now()/1000;
   },
   async stop(){
    if(!recorder)throw Error('Audio capture was not started in this page. A navigation or development reload invalidates the recording; record again.');
    await Promise.all([recorder,...stems.map(s=>s.recording)].map(r=>new Promise(resolve=>{r.onstop=resolve;r.stop();})));
    for(const s of stems){s.node.disconnect(s.output);s.silence.stop();s.silence.disconnect();}
    await pending;return Date.now()/1000;
   }
  };
 },Object.keys(stemPaths));
}
