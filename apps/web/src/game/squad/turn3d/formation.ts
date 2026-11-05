/** Render-space formation. It never changes combat slots, target legality or turn order. */
import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
export type Position={x:number;y:number;z:number};
const HERO_SLOTS=[[-4.8,-.65],[-2.75,.8],[-1.25,-.65]] as const;
const ENEMY_SLOTS=[[1.5,-2.05],[3.15,-2.05],[4.8,-2.05],[1.5,2.05],[3.15,2.05],[4.8,2.05]] as const;
export const REST_YAW=Math.PI*32/180;
export function formationPoint(actor:Pick<TurnActor,'side'|'slot'|'role'>,boss=false):Position {
 if(actor.side==='party'){const p=HERO_SLOTS[actor.slot%3]!;return {x:p[0],y:0,z:p[1]}}
 if(actor.role==='yarn')return {x:3.25,y:0,z:-.9};
 if(boss||actor.role==='thread')return {x:actor.slot%2?5.2:1.2,y:0,z:2.1};
 const p=ENEMY_SLOTS[actor.slot%6]!;return {x:p[0],y:0,z:p[1]};
}
export const figureScale=(role:string,side:string)=>role==='yarn'?.87:role==='witch'?.72:side==='party'?.79:role==='elite'?.72:.76;
export const restYaw=(side:string)=>side==='party'?REST_YAW:-REST_YAW;
export const targetYaw=(source:Position,target:Position)=>Math.atan2(target.x-source.x,target.z-source.z);
export const blendYaw=(from:number,to:number,t:number)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*Math.max(0,Math.min(1,t));
/** Minimum vertical headroom survives unusually wide desktop stages. */
export const stageHeight=(aspect:number)=>Math.max(4.4,14/aspect);
