/** V4 class choreography. LEARN/A1b,A4: a pure out/contact/back envelope. */
import {neutralPose,type MotionPoint,type RootPose} from './motion';
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function meleeRoot(elapsed:number,ultimate:boolean,home:MotionPoint,contact:{x:number;y:number},lift=0,bow=0):RootPose {
 const p=neutralPose(),end=ultimate?2200:800;
 if(elapsed<0||elapsed>=end)return p;
 const departure=ultimate?600:100,arrival=ultimate?1000:300,release=ultimate?1190:440;
 const progress=elapsed<arrival?smooth((elapsed-departure)/(arrival-departure)):1-smooth((elapsed-release)/(end-release));
 if(progress>0){p.x=(contact.x-home.x)*progress+4*bow*progress*(1-progress);p.y=(contact.y-home.y)*progress-4*lift*progress*(1-progress);}
 p.phase=elapsed<departure?'anticipation':elapsed<arrival?'travel':elapsed<release?'strike':'return';
 return p;
}

/** The translated strike's front edge stops outside the recipient's opaque edge. */
export function meleeContact(home:MotionPoint,target:MotionPoint,frontReach:number,targetHalfWidth:number,direction:1|-1,gap:number){
 const x=target.x-direction*(targetHalfWidth+frontReach+gap);
 // A very large boss or a close target never pulls the attacker backwards.
 return{x:direction>0?Math.max(home.x,x):Math.min(home.x,x),y:target.y};
}
