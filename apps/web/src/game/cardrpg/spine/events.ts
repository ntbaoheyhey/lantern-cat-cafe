import { SPINE_CONFIG, type SpineAnimation } from './config';
export interface SpineCue {name:string;time:number;fallback:boolean}
export function animationCues(name:SpineAnimation,duration:number,authored:readonly {name:string;time:number}[]):SpineCue[]{
 // Timing is a WARN at intake. Unreachable cues must not suppress defaults or
 // block later valid cues in the cursor (for example, a NaN before a real hit).
 const events:SpineCue[]=authored.filter(event=>Number.isFinite(event.time)&&event.time>=0&&event.time<=duration).map(event=>({...event,fallback:false}));
 for(const [event,fraction] of Object.entries(SPINE_CONFIG.animations[name]?.events??{}))if(!events.some(e=>e.name===event))events.push({name:event,time:duration*fraction,fallback:true});
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

/** Hold the resting pose during ultimate focus and the contact pose for two
 * 30 Hz frames, inside the action's unchanged envelope. Seeking is identical
 * to playback; neither frame rate nor wall-clock hit-stop can stretch a turn. */
export function fixedActionClipTime(elapsed:number,duration:number,hitTime:number,impact:number,total:number,focus=0){
 const t=Math.max(0,Math.min(total,elapsed)),hold=200/3;
 if(t<=focus)return 0;
 if(t<impact)return (t-focus)/Math.max(1,impact-focus)*hitTime;
 if(t<impact+hold)return hitTime;
 return hitTime+(t-impact-hold)/Math.max(1,total-impact-hold)*(duration-hitTime);
}
