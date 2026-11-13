import type {EffectFrame} from '../../squad/turn3d/effects';
import {voiceTiming} from './audio-timeline';
import {sequenceAt,SIGNATURES} from './sequence';

/** The rules contact clock drives visibility; late/failed media can never delay damage. */
export class CinematicPlayer {
 readonly root=document.createElement('div');
 private dim=document.createElement('div');private flash=document.createElement('div');
 private cutin=document.createElement('div');private bust=document.createElement('img');private title=document.createElement('strong');
 private video=document.createElement('video');private poster=document.createElement('img');
 private plan:EffectFrame['plan']|null=null;private failed=false;
 readonly audit={plate:false,cutin:false,elapsed:0,contact:0,videoTime:0,expectedVideoTime:0};
 constructor(host:HTMLElement){
  this.root.className='b3-cinema';this.root.setAttribute('aria-hidden','true');
  this.dim.className='b3-cinema-dim';this.flash.className='b3-cinema-flash';this.cutin.className='b3-cutin';
  this.video.className='b3-plate';this.poster.className='b3-plate';this.video.muted=true;this.video.playsInline=true;this.video.preload='auto';
  this.video.addEventListener('error',()=>{this.failed=true;});this.cutin.append(this.bust,this.title);
  this.root.append(this.dim,this.poster,this.video,this.cutin,this.flash);host.append(this.root);this.hide();
 }
 private hide(){this.dim.hidden=this.flash.hidden=this.cutin.hidden=this.video.hidden=this.poster.hidden=true;this.video.pause();this.audit.plate=false;this.audit.cutin=false;}
 render(frame:EffectFrame|null,paused:boolean,speed:number,reduced:boolean,fixed=false){
  const state=frame?sequenceAt(frame.plan,frame.elapsed,reduced):null;
  if(!frame||!state){this.hide();this.plan=null;return;}
  const {seq,at}=state;
  if(this.plan!==frame.plan){
   this.plan=frame.plan;this.failed=false;
   const owner=(frame.plan.presentationId??frame.plan.skillId).replace(/^enemy:/,'').replace(/-[1-4]$/,'');
   if(seq.cutin){this.bust.src=seq.cutin.portrait;this.title.textContent=voiceTiming(owner,frame.plan.presentationId??frame.plan.skillId,'charge')?.text??seq.cutin.name;}
   this.cutin.style.setProperty('--element',SIGNATURES.get(owner)?.element.palette[1]??frame.color);
   if(seq.plate){this.video.replaceChildren();for(const ext of ['webm','mp4']){const source=document.createElement('source');source.src=`/cinematics/${seq.plate.id}.${ext}`;source.type=ext==='webm'?'video/webm':'video/mp4';this.video.append(source);}this.video.load();this.poster.src=`/cinematics/${seq.plate.id}-poster.webp`;}
  }
  this.dim.hidden=state.dim<=0;this.dim.style.opacity=String(state.dim);
  this.cutin.hidden=!state.cutin;
  if(state.cutin&&seq.cutin){const p=Math.min(1,(at-seq.cutin.start)/120),ease=1+2.70158*(p-1)**3+1.70158*(p-1)**2;this.cutin.style.transform=`translateX(${(1-ease)*-105}%)`;}
  this.flash.hidden=state.flash===0;this.flash.style.opacity=String(state.flash);
  this.video.hidden=!state.plate||this.failed;this.poster.hidden=!state.plate||!this.failed&&this.video.readyState>=2;
  if(state.plate&&seq.plate){
   const seconds=(at-seq.plate.start)/1000;this.audit.expectedVideoTime=seconds;
   this.video.playbackRate=Math.max(.25,Math.min(4,speed));
   if(Number.isFinite(this.video.duration)&&Math.abs(this.video.currentTime-seconds)>1/30)this.video.currentTime=Math.min(this.video.duration,seconds);
   if(paused||fixed)this.video.pause();else if(this.video.paused)void this.video.play().catch(()=>{this.failed=true;});
  }else this.video.pause();
  Object.assign(this.audit,{plate:state.plate,cutin:state.cutin,elapsed:at,contact:seq.impact,videoTime:this.video.currentTime});
 }
 dispose(){this.video.pause();this.video.removeAttribute('src');this.video.replaceChildren();this.video.load();this.root.remove();}
}
