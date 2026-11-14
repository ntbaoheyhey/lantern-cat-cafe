import type {EffectPlan} from '../../squad/turn3d/effects';

export const MOTIONS=['dash-slash','leap-slam','spin','throw','staff-cast','summon'] as const;
export type AttackMotion=typeof MOTIONS[number];
export interface MotionPoint {x:number;y:number;core:number}
export interface RootPose {x:number;y:number;sx:number;sy:number;angle:number;phase:'idle'|'anticipation'|'travel'|'strike'|'return'|'land';flash:number}
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const out=(x:number)=>1-(1-clamp(x))**3;
const smooth=(x:number)=>{const u=clamp(x);return u*u*(3-2*u);};
export const neutralPose=():RootPose=>({x:0,y:0,sx:1,sy:1,angle:0,phase:'idle',flash:0});
const archetypes:Record<string,AttackMotion>={mochi:'dash-slash',biscuit:'dash-slash',panko:'leap-slam',brioche:'spin',velvet:'spin',cinnamon:'throw',marigold:'throw',soot:'staff-cast',sorrel:'staff-cast',clover:'summon',mallow:'summon',inkcap:'summon','button-guard':'dash-slash','sock-skipper':'spin','spool-ram':'dash-slash','kettle-knight':'leap-slam','yarn-giant':'leap-slam','needle-moth':'throw','pollen-scout':'throw','teacup-healer':'summon','binding-thread':'staff-cast','rain-spool':'staff-cast','crumb-sentinel':'dash-slash','pantry-crown':'summon'};
export function attackMotion(asset:string,plan:EffectPlan):AttackMotion {
 return archetypes[asset]??(['slash','bash','charge','sweep','cross'].includes(plan.shape)?'dash-slash':'staff-cast');
}
export function hasActorAction(plan:EffectPlan){return plan.events.some(e=>e.type==='action_start'||e.type==='charge');}
export interface MotionInput {plan:EffectPlan;elapsed:number;asset:string;side:string;home:MotionPoint;target:MotionPoint;width:number;height:number;motion?:AttackMotion}
/** Seekable screen-space choreography. No rules state, wall clock, or random state. */
export function actionPose(input:MotionInput):RootPose {
 const {plan,elapsed:t}=input,p=neutralPose();
 if(!hasActorAction(plan)||t<0||t>=plan.duration)return p;
 const impact=plan.beats[2]!.start,cast=plan.ultimate?600:0,direction=input.side==='enemy'?-1:1;
 const wind=smooth((t-cast)/Math.max(1,impact-cast)),release=smooth((t-impact-200/3)/Math.max(1,plan.duration-impact-200/3));
 const weight=t<impact?wind:1-release;
 p.phase=t<cast?'idle':t<impact?'anticipation':t<impact+200/3?'strike':'return';
 // Planted roots: silhouette changes come from the rig and foot-pivoted weight.
 p.sx=1+.045*weight;p.sy=1-.045*weight;p.angle=direction*(t<impact?.075:-.055)*weight;
 return p;
}

/** A recipient plants its weight before contact; this is separate from hit recoil. */
export function bracePose(plan:EffectPlan|null,elapsed:number,id:string,direction:number,height:number):RootPose {
 const p=neutralPose();
 if(!plan||!hasActorAction(plan)||!plan.events.some(e=>e.type==='damage'&&e.targetIds.includes(id)))return p;
 const age=elapsed-plan.beats[2]!.start;
 if(age<=-200||age>=100)return p;
 const weight=smooth((age+200)/133)*(1-smooth(age/100));
 p.phase=age<0?'anticipation':'strike';p.x=direction*8*height/720*weight;
 p.sx=1+.04*weight;p.sy=1-.04*weight;p.angle=direction*.10*weight;
 return p;
}
/** One visible impulse for each target, including counter-hits and damage over time. */
export function hitPose(plan:EffectPlan|null,elapsed:number,id:string,direction:number,height:number,planted=false):RootPose {
 const p=neutralPose();if(!plan)return p;
 const hits=plan.events.filter(e=>e.type==='damage'&&e.targetIds.includes(id));
 const impact=plan.beats[2]!.start,scale=height/720;
 for(let i=0;i<hits.length;i++){
  const age=elapsed-impact-Math.min(i,5)*33;if(age<0||age>360)continue;
  const strength=hits[i]!.critical?30:28,attack=out(age/67),settle=1-smooth((age-100)/260),amount=attack*settle;
  p.x+=direction*strength*scale*amount;p.y-=Math.sin(clamp(age/260)*Math.PI)*5*scale;
  p.angle+=direction*(hits[i]!.critical?.13:.07)*amount;p.sx+=.055*amount;p.sy-=.055*amount;
  p.flash=Math.max(p.flash,age<2000/30?1:0);
 }
 p.x=Math.max(-38*scale,Math.min(38*scale,p.x));
 // A ranged caster can receive reflected damage during its own action. Keep
 // that slot planted while retaining squash, tilt and the contact flash.
 if(planted){p.x=0;p.y=0;}
 return p;
}
export function idlePhase(id:string){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%6283/1000;}

/** Slow weight shifts around planted feet; independent phases keep a squad alive. */
export function idlePose(time:number,id:string):RootPose {
 const p=neutralPose(),phase=idlePhase(id),breath=Math.sin(time*2.1+phase);
 p.sx=1-breath*.014;p.sy=1+breath*.028;
 // Weight transfer and a smaller shoulder counter-motion share a planted foot.
 p.angle=Math.sin(time*1.45+phase)*.052+Math.sin(time*3.7+phase*.7)*.012;
 return p;
}

/** F2: the battle camera stays at its authored wide framing. */
export function actionCamera(_input:MotionInput,_tier:'basic'|'active'|'ultimate'){
 return {zoom:1,x:0,y:0,tilt:0};
}
export function fitMotionFrame(_boxes:readonly {x:number;y:number;width:number;height:number}[],_width:number,_height:number){
 return {scale:1,dx:0,dy:0};
}
