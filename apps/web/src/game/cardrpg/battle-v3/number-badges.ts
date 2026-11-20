import type {EffectPlan} from '../../squad/turn3d/effects';
export type NumberBadge='absorb'|'resist'|'immune';
export interface BadgeEvent {kind:NumberBadge;targetId:string;amount:number}
export type BadgePlan=EffectPlan&{numberBadges?:BadgeEvent[]};
/** Preserve the exact resolved value; labels are icon-only on the battlefield. */
export function badgeEvents(log:readonly {kind:string;targetId:string;amount:number}[]):BadgeEvent[]{
 return log.flatMap<BadgeEvent>(e=>e.kind==='absorbed'?[{kind:'absorb',targetId:e.targetId,amount:e.amount}]:e.kind==='resist'||e.kind==='immune'?[{kind:e.kind,targetId:e.targetId,amount:0}]:[]);
}
export function paintNumberBadge(c:CanvasRenderingContext2D,kind:NumberBadge,x:number,y:number,size:number){
 c.save();c.translate(x,y);c.scale(size/32,size/32);c.lineWidth=2.3;c.lineJoin='round';c.lineCap='round';
 c.fillStyle=kind==='absorb'?'#3f8299':kind==='resist'?'#9378ad':'#c79a51';c.strokeStyle='#fff3c5';
 c.shadowColor='#22172c';c.shadowBlur=3;c.beginPath();c.moveTo(0,-14);c.lineTo(12,-9);c.lineTo(10,5);c.quadraticCurveTo(6,12,0,15);c.quadraticCurveTo(-6,12,-10,5);c.lineTo(-12,-9);c.closePath();c.fill();c.stroke();c.shadowBlur=0;
 if(kind==='absorb'){c.beginPath();c.moveTo(-6,0);c.lineTo(6,0);c.moveTo(0,-6);c.lineTo(0,6);c.stroke();}
 else if(kind==='resist'){c.beginPath();c.moveTo(-5,6);c.lineTo(6,-6);c.lineTo(0,-6);c.moveTo(6,-6);c.lineTo(6,0);c.stroke();}
 else{c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.moveTo(-5,5);c.lineTo(5,-5);c.stroke();}
 c.restore();
}
