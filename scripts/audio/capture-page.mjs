/** Tee the browser's actual output into MediaRecorder. No synthetic event replay. */
import {appendFileSync,writeFileSync} from 'node:fs';
export async function installOutputCapture(page,path){
 writeFileSync(path,Buffer.alloc(0));
 await page.exposeFunction('__saveAudioChunk',bytes=>appendFileSync(path,Buffer.from(bytes)));
 await page.addInitScript(()=>{
  const connect=AudioNode.prototype.connect,contexts=new WeakMap(),tapped=new WeakSet();
  let mixer,destination,recorder,pending=Promise.resolve();
  AudioNode.prototype.connect=function(target,...args){
   const result=connect.call(this,target,...args);
   if(target===this.context.destination&&!tapped.has(this)){
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
    recorder.start(1000);return Date.now()/1000;
   },
   async stop(){await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});await pending;return Date.now()/1000;}
  };
 });
}
