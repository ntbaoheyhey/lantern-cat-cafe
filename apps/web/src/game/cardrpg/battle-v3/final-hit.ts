import type {EffectPlan} from '../../squad/turn3d/effects';
import type {VoiceWindow} from './voice-windows';
export interface FinalHitPlan extends EffectPlan {finalHit?:boolean;fixedTiming?:boolean;voiceWindows?:VoiceWindow[];speechLeadInMs?:number}
/** Spoken windows stay at real time; final contact retains its half-second hold. */
export function advanceBattleClock(plan:FinalHitPlan,elapsed:number,delta:number,reduced:boolean,speed=1){
 if(plan.fixedTiming)return elapsed+delta*speed;
 const windows=(plan.voiceWindows??[]).map(window=>({start:window.start,end:window.end,rate:1}));
 if(plan.speechLeadInMs)windows.push({start:0,end:plan.speechLeadInMs,rate:1});
 if(plan.finalHit&&!reduced){const start=Math.max(0,plan.beats[2]!.start-80);windows.push({start,end:Math.min(plan.duration,start+200),rate:.4});}
 if(!windows.length)return elapsed+delta*speed;
 const boundaries=[...new Set(windows.flatMap(window=>[window.start,window.end]))].sort((a,b)=>a-b);
 let at=elapsed,remaining=delta;
 for(const end of [...boundaries.filter(t=>t>elapsed+1e-7),Infinity]){
  const rate=Math.min(speed,...windows.filter(window=>at>=window.start-1e-7&&at<window.end-1e-7).map(window=>window.rate));
  const wall=(end-at)/rate;
  if(remaining<=wall)return at+remaining*rate;
  at=end;remaining-=wall;
 }
 return at;
}
