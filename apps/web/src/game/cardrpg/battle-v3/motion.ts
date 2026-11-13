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
 const {plan,elapsed:t,home,target,width,height}=input,p=neutralPose();
 if(!hasActorAction(plan)||t<0||t>=plan.duration)return p;
 const direction=input.side==='enemy'?-1:1,kind=input.motion??attackMotion(input.asset,plan),impact=plan.beats[2]!.start;
 const ultimate=plan.ultimate,launch=ultimate?0:Math.max(120,impact-200),arrival=ultimate?150:impact;
 const holdEnd=Math.min(plan.duration-100,impact+100),returnEnd=Math.min(plan.duration,holdEnd+267);
 const melee=['dash-slash','leap-slam','spin'].includes(kind),scale=height/720;
 // Caster steps deliberately clear six percent of the viewport; melee stops
 // before the target's body. An ultimate arrives before the 150 ms cut-in.
 let dx=ultimate?(width*(direction>0?.48:.52)-home.x):melee?(target.x-direction*(home.core*.42+target.core*.30)-home.x):direction*width*.088;
 if(dx*direction<width*.088)dx=direction*width*.088;
 dx=direction*Math.min(Math.abs(dx),width*.46);
 const dy=ultimate?(height*.59-home.y):melee?(target.y-home.y):0;
 let travel=0,arc=0;
 if(t<launch){const lean=smooth(t/120);p.phase='anticipation';p.x=-direction*8*scale*lean;p.sx=1+.065*lean;p.sy=1-.065*lean;p.angle=direction*.10*lean;return p;}
 if(t<arrival){const u=clamp((t-launch)/Math.max(1,arrival-launch));travel=out(u);arc=Math.sin(u*Math.PI);p.phase='travel';p.sx=1+.10*arc;p.sy=1-.07*arc;}
 else if(t<holdEnd){travel=1;p.phase='strike';p.sx=1.04;p.sy=.96;}
 else if(t<returnEnd){const u=clamp((t-holdEnd)/Math.max(1,returnEnd-holdEnd));travel=1-smooth(u);arc=Math.sin(u*Math.PI);p.phase='return';p.sx=1+.03*arc;p.sy=1-.03*arc;}
 else {if(t>=returnEnd+67)return p;const settle=Math.sin(clamp((t-returnEnd)/67)*Math.PI);p.phase='land';p.sx=1+.06*settle;p.sy=1-.06*settle;return p;}
 p.x=dx*travel;p.y=dy*travel;
 const jump=ultimate?40:kind==='leap-slam'?58:kind==='spin'?20:kind==='summon'?18:6;
 p.y-=arc*jump*scale;
 if(kind==='spin'&&!ultimate)p.angle=direction*Math.PI*2*(t<arrival?travel:t<holdEnd?1:travel);
 else if(kind==='throw')p.angle=direction*(p.phase==='strike'?-.18:-.09*travel);
 else if(kind==='staff-cast')p.angle=-direction*.065*travel;
 else if(kind==='summon'){p.sy+=.05*travel;p.y-=12*scale*travel;}
 else p.angle=-direction*.10*travel;
 if(p.phase==='strike'&&!melee&&!ultimate){const recoil=Math.sin(clamp((t-impact)/100)*Math.PI);p.x-=direction*20*scale*recoil;}
 return p;
}
/** One visible impulse for each target, including counter-hits and damage over time. */
export function hitPose(plan:EffectPlan|null,elapsed:number,id:string,direction:number,height:number):RootPose {
 const p=neutralPose();if(!plan)return p;
 const hits=plan.events.filter(e=>e.type==='damage'&&e.targetIds.includes(id));
 const impact=plan.beats[2]!.start,scale=height/720;
 for(let i=0;i<hits.length;i++){
  const age=elapsed-impact-Math.min(i,5)*33;if(age<0||age>360)continue;
  const strength=hits[i]!.critical?30:24,attack=out(age/67),settle=1-smooth((age-100)/260),amount=attack*settle;
  p.x+=direction*strength*scale*amount;p.y-=Math.sin(clamp(age/260)*Math.PI)*5*scale;
  p.angle+=direction*(hits[i]!.critical?.13:.07)*amount;p.sx+=.055*amount;p.sy-=.055*amount;
  p.flash=Math.max(p.flash,age<2000/30?1:0);
 }
 p.x=Math.max(-38*scale,Math.min(38*scale,p.x));return p;
}
export function idlePhase(id:string){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)%6283/1000;}

/** Slow weight shifts around planted feet; independent phases keep a squad alive. */
export function idlePose(time:number,id:string):RootPose {
 const p=neutralPose(),phase=idlePhase(id),breath=Math.sin(time*2.1+phase);
 p.sx=1-breath*.010;p.sy=1+breath*.018;
 p.angle=Math.sin(time*1.45+phase)*.035;
 return p;
}

/** A single follow-through move per action, with a stable contact hold and home framing. */
export function actionCamera(input:MotionInput,tier:'basic'|'active'|'ultimate'){
 const {plan,elapsed:t,home,target,width,height}=input,rest={zoom:1,x:0,y:0,tilt:0};
 if(!hasActorAction(plan)||t<=0||t>=plan.duration)return rest;
 const impact=plan.beats[2]!.start,direction=input.side==='enemy'?-1:1;
 // The plate owns its camera up to contact. On return to the field, follow
 // the receiving group through the release line, then restore the wide shot.
 if(tier==='ultimate'){
  if(t<=impact)return rest;
  const age=t-impact,enter=smooth(age/133),recover=1-smooth((age-233)/Math.max(1,plan.duration-impact-233));
  const zoom=1+.20*enter*recover;
  return {zoom,x:(target.x/width-.5)*(1-1/zoom),y:(.5-(target.y-target.core*.4)/height)*(1-1/zoom),tilt:0};
 }
 const travel=smooth((t-Math.max(100,impact-230))/230);
 const enter=smooth(t/Math.max(100,impact-180));
 const recover=1-smooth((t-impact-100)/Math.max(1,plan.duration-impact-100));
 const envelope=enter*recover,zoom=1+(tier==='active'?.24:.18)*envelope;
 // Begin on the striking hand, cross the complete travel corridor, and hold
 // the receiver at contact. This keeps the wide field moving with the action
 // without enlarging the cats further or adding repeated camera oscillation.
 const focusX=home.x+(target.x-home.x)*travel;
 const focusY=home.y+(target.y-home.y)*travel-home.core*.4;
 const kind=input.motion??attackMotion(input.asset,plan);
 return {zoom,x:(focusX/width-.5)*(1-1/zoom)+direction*.030*(travel-.5)*envelope,
  y:(.5-focusY/height)*(1-1/zoom),tilt:(kind==='spin'?.012:kind==='leap-slam'?-.006:0)*direction*envelope};
}

/** Keep the occupied bodies and their head bars inside an action shot. */
export function fitMotionFrame(boxes:readonly {x:number;y:number;width:number;height:number}[],width:number,height:number){
 if(!boxes.length)return {scale:1,dx:0,dy:0};
 const left=Math.min(...boxes.map(b=>b.x)),right=Math.max(...boxes.map(b=>b.x+b.width));
 const top=Math.min(...boxes.map(b=>b.y)),bottom=Math.max(...boxes.map(b=>b.y+b.height));
 const padX=12,padTop=Math.min(60,height*.10),padBottom=10;
 const scale=Math.min(1,(width-2*padX)/Math.max(1,right-left),(height-padTop-padBottom)/Math.max(1,bottom-top));
 const x=width*.5+(left-width*.5)*scale,y=height*.5+(top-height*.5)*scale;
 const endX=x+(right-left)*scale,endY=y+(bottom-top)*scale;
 return {scale,dx:Math.max(padX-x,Math.min(width-padX-endX,0)),dy:Math.max(padTop-y,Math.min(height-padBottom-endY,0))};
}
