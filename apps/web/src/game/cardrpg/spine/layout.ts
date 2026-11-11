import { PAINT } from './style';
/** Stable identity lanes keep later summons from moving living actors. */
export function stagePosition(side:'party'|'enemy',slot:number,boss:boolean,hasBoss:boolean,width:number){
 const lane=Math.max(0,slot),scale=side==='party'?1+(lane%3)*.018:1;
 const x=side==='party'?[-.38,-.245,-.105][lane%3]!:boss?.255:hasBoss?[.43,.36,.45][lane%3]!:[.16,.305,.435][lane%3]!;
 const y=side==='party'?[.20,.165,.23][lane%3]!:boss?.20:hasBoss?[.32,.13,.24][lane%3]!:[.22,.17,.29][lane%3]!;
 return {x:x*width,y:y*PAINT.worldHeight,scale};
}
