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

/** A6's measured dense lane, parameterized by home/contact instead of viewport pixels.
 * The final bend coincides with the K1 -> K2 smear at 270ms. K0 returns at 560ms. */
const denseApproach:readonly (readonly [number,number])[]=[
 [0.0,-0.0],
 [0.0,0.060948],
 [0.061224,0.115124],
 [0.061224,0.133183],
 [0.857143,0.837472],
 [0.857143,0.85553],
 [1.0,0.981941],
 [1.0,1.0],
];
export function denseMeleeRoot(elapsed:number,home:MotionPoint,contact:{x:number;y:number}):RootPose {
 const p=neutralPose();if(elapsed<0||elapsed>=800)return p;
 let q=elapsed<300?smooth((elapsed-100)/200):1-smooth((elapsed-560)/240);
 // The measured K1 corridor ends at 94.9% of the path; map its endpoint to the smear.
 if(elapsed<300)q=q<.93925?q*.949155/.93925:.949155+(q-.93925)*(.050845/.06075);
 const points=denseApproach.map(([x,y])=>({x:x*(contact.x-home.x),y:y*(contact.y-home.y)}));
 const lengths=points.slice(1).map((b,i)=>Math.hypot(b.x-points[i]!.x,b.y-points[i]!.y));
 let remaining=q*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){
  const length=lengths[i]!;
  if(remaining<=length||i===lengths.length-1){const a=points[i]!,b=points[i+1]!,t=length?remaining/length:0;p.x=a.x+(b.x-a.x)*t;p.y=a.y+(b.y-a.y)*t;break;}
  remaining-=length;
 }
 p.phase=elapsed<100?'anticipation':elapsed<300?'travel':elapsed<560?'strike':'return';return p;
}
