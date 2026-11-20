/** Actual compositor frames and the unchanged WebAudio output, on a common wall clock. */
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {installOutputCapture} from '../../../scripts/audio/capture-page.mjs';
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function prepareRecording(page,raw,{audio=true}={}){
 mkdirSync(raw,{recursive:true});
 if(audio)await installOutputCapture(page,resolve(raw,'audio.webm'));
 const cdp=await page.context().newCDPSession(page),pictures=[];
 let zero=Infinity,stopped=false;
 cdp.on('Page.screencastFrame',event=>{
  void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  const t=event.metadata.timestamp-zero;if(t<0||stopped)return;
  const name=`shot-${String(pictures.length).padStart(6,'0')}.jpg`;
  writeFileSync(resolve(raw,name),Buffer.from(event.data,'base64'));pictures.push({t,name});
 });
 return {
  async start(label){
   await page.evaluate(text=>{
    const label=document.createElement('aside');label.id='film-provenance';label.textContent=text;
    Object.assign(label.style,{position:'fixed',left:'50%',top:'0',transform:'translateX(-50%)',zIndex:'2147483647',padding:'6px 14px',background:'#182522',color:'#fff',font:'600 14px system-ui',pointerEvents:'none',whiteSpace:'nowrap'});document.body.append(label);
    const style=document.createElement('style');style.textContent='body:has(.dp-app[data-battle-active="true"]) #film-provenance{top:auto!important;left:auto!important;right:12px;bottom:78px;transform:none!important}';document.head.append(style);
   },label);
   await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1280,maxHeight:720,everyNthFrame:2});
   zero=await page.evaluate(async audio=>audio?await window.__outputCapture.start():Date.now()/1000,audio);
   return zero;
  },
  async stop(){
   stopped=true;await cdp.send('Page.stopScreencast');
   const end=await page.evaluate(async audio=>audio?await window.__outputCapture.stop():Date.now()/1000,audio);
   if(!pictures.length)throw Error('No actual compositor frames');
   const data={zero,end,seconds:end-zero,pictures,firstFrameSeconds:pictures[0].t,maxGapSeconds:Math.max(...pictures.slice(1).map((p,i)=>p.t-pictures[i].t)),audio:audio?{path:'audio.webm',bytes:readFileSync(resolve(raw,'audio.webm')).length,sha256:sha(readFileSync(resolve(raw,'audio.webm')))}:null};
   writeFileSync(resolve(raw,'recording.json'),JSON.stringify(data)+'\n');return data;
  },
 };
}
export async function observeAudioStarts(page){
 await page.evaluate(()=>{
  const audio=window.__thAudio,original=audio.start;window.__filmAudioStarts=[];
  audio.start=function(id,buffer,sample){
   const create=this.ctx.createBufferSource;
   this.ctx.createBufferSource=function(){
    const source=create.call(this),start=source.start;
    source.start=function(when=0,offset=0,duration){
     const output=this.context.getOutputTimestamp(),wall=performance.timeOrigin+output.performanceTime+(Math.max(when,this.context.currentTime)-output.contextTime)*1000;
     window.__filmAudioStarts.push({id,bus:sample.bus,wallMs:wall,durationSeconds:(duration??buffer.duration-offset)/this.playbackRate.value,loop:this.loop});
     return start.call(this,when,offset,duration);
    };return source;
   };
   try{return original.apply(this,arguments);}finally{this.ctx.createBufferSource=create;}
  };
 });
}
