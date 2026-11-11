import { SPINE_CONFIG, type SpineAnimation } from './config';
export interface SpineCue {name:string;time:number;fallback:boolean}
export function animationCues(name:SpineAnimation,duration:number,authored:readonly {name:string;time:number}[]):SpineCue[]{
 const events:SpineCue[]=authored.map(event=>({...event,fallback:false}));
 for(const [event,fraction] of Object.entries(SPINE_CONFIG.animations[name]?.events??{}))if(!authored.some(e=>e.name===event))events.push({name:event,time:duration*fraction,fallback:true});
 return events.sort((a,b)=>a.time-b.time);
}
/** The cursor catches every crossing at x3 and emits each event once per action. */
export class SpineEventCursor {
 private next=0;private last=-1;
 reset(){this.next=0;this.last=-1;}
 advance(cues:readonly SpineCue[],time:number,emit:(cue:SpineCue)=>void){
  if(time<this.last)this.reset();
  while(this.next<cues.length&&cues[this.next]!.time<=time+1e-6)emit(cues[this.next++]!);
  this.last=time;
 }
}
/** Match the authored contact to the existing rules snapshot boundary without changing combat. */
export function retimedClipTime(progress:number,duration:number,hitTime:number,impactFraction:number){
 const p=Math.max(0,Math.min(1,progress)),pivot=Math.max(.01,Math.min(.99,impactFraction));
 return p<=pivot?p/pivot*hitTime:hitTime+(p-pivot)/(1-pivot)*(duration-hitTime);
}
