import type {EffectPlan} from '../../squad/turn3d/effects';
export interface FinalHitPlan extends EffectPlan {finalHit?:boolean}
/** Analytic clock: 200 ms of authored movement takes 500 ms around the last contact. */
export function advanceBattleClock(plan:FinalHitPlan,elapsed:number,delta:number,reduced:boolean,speed=1){
 if(!plan.finalHit||reduced)return elapsed+delta*speed;
 const start=Math.max(0,plan.beats[2]!.start-80),end=Math.min(plan.duration,start+200);
 const entry=start/speed,exit=entry+(end-start)/.4;
 const toWall=(t:number)=>t<=start?t/speed:t<end?entry+(t-start)/.4:exit+(t-end)/speed;
 const wall=toWall(elapsed)+delta;
 return wall<=entry?wall*speed:wall<exit?start+(wall-entry)*.4:end+(wall-exit)*speed;
}
