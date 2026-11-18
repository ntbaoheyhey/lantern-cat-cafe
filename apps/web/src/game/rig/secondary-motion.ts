import {samplePankoIdle,pankoPhase} from './panko-living';
/** Absolute-time damped springs: seeking and frame-rate changes cannot accumulate drift. */
export interface SpringSpec {stiffness:number;damping:number;delay:number}
export const SECONDARY_SPRINGS={
 hair:{stiffness:150,damping:13,delay:.035},
 ear:{stiffness:190,damping:16,delay:.045},
 tail:{stiffness:62,damping:9,delay:.12},
 cloth:{stiffness:95,damping:12,delay:.085},
 accessory:{stiffness:125,damping:11,delay:.065},
} satisfies Record<string,SpringSpec>;
export function motionSeed(id:string){let value=2166136261;for(let i=0;i<id.length;i++)value=Math.imul(value^id.charCodeAt(i),16777619);return value>>>0;}
function random(seed:number,index:number){let n=Math.imul(seed^(index+1),1597334677);n^=n>>>16;n=Math.imul(n,2246822507);return (n>>>0)/4294967296;}
interface LivingGesture {turn:number;tilt:number;nod:number;ear:number;hand:number;tail:number;weight:number}
interface LivingProfile {breath:number;softEyes:readonly [number,number];gestures:readonly [Partial<LivingGesture>,Partial<LivingGesture>]}
const HERO_LIVING:Readonly<Record<string,LivingProfile>>={
 mochi:{breath:3.35,softEyes:[.10,.07],gestures:[{turn:.65,tilt:1.8,tail:.4},{ear:1,turn:-.25,tilt:-.6,tail:.7}]},
 soot:{breath:4.15,softEyes:[.13,.10],gestures:[{turn:.3,tilt:.8,hand:1},{ear:.5,tilt:-1.2,tail:1,weight:-.3}]},
 clover:{breath:3.8,softEyes:[.18,.18],gestures:[{turn:.35,nod:.8,hand:.7},{turn:-.4,tilt:1.7,ear:.3,tail:.6}]},
 panko:{breath:4.4,softEyes:[.11,.13],gestures:[{tilt:-1.3,nod:.3,weight:.5},{turn:.4,ear:.7,nod:.45,tail:.4}]},
};
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
/** Seeded absolute starts: gestures survive seeks without a per-frame random clock. */
export function fidgetStart(seed:number,index:number){return 2+index*8.5+(random(seed,index+100)-.5)*1.1;}
export function fidgetEnvelope(age:number){return smooth(age/.3)*(1-smooth((age-.45)/1.1));}
function ambientMix(clip:string,time:number){
 if(clip==='idle'||clip==='idle-phase2'||clip==='victory')return 1;
 if(clip==='attack')return 1-smooth(time/.16)+smooth((time-.56)/.24);
 if(clip==='ult'||clip==='skill')return 1-smooth(time/.18)+smooth((time-1.8)/.4);
 if(clip==='hurt')return smooth((time-.18)/.22);
 return 0;
}
/** 4-second cells with bounded jitter give consecutive intervals of 2.2–5.8s. */
export function blinkStart(seed:number,index:number){return 3+index*4+(random(seed,index)-.5)*1.8;}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function blinkEnvelope(age:number){return age<0||age>=.18?0:age<.05?age/.05:age<.07?1:1-(age-.07)/.11;}
export function seededBlink(time:number,seed:number){
 const index=Math.max(0,Math.floor((time-2.1)/4));
 return Math.max(blinkEnvelope(time-blinkStart(seed,index)),index?blinkEnvelope(time-blinkStart(seed,index-1)):0);
}
/** Exact steady-state response to a body/head sinusoidal driver. */
export function springWave(time:number,frequency:number,phase:number,spec:SpringSpec){
 const reactive=spec.stiffness-frequency*frequency,drag=spec.damping*frequency;
 const gain=spec.stiffness/Math.hypot(reactive,drag),lag=Math.atan2(drag,reactive);
 return gain*Math.sin((time-spec.delay)*frequency+phase-lag);
}
/** Velocity impulse, with analytical under/critical/overdamped recovery. */
export function springImpulse(age:number,spec:SpringSpec){
 const t=age-spec.delay;if(t<=0||t>3)return 0;
 const decay=spec.damping*.5,disc=spec.stiffness-decay*decay;
 if(Math.abs(disc)<.0001)return spec.stiffness*t*Math.exp(-decay*t)*.1;
 if(disc>0){const w=Math.sqrt(disc);return spec.stiffness*Math.exp(-decay*t)*Math.sin(w*t)/w*.1;}
 const w=Math.sqrt(-disc);return spec.stiffness*(Math.exp((-decay+w)*t)-Math.exp((-decay-w)*t))/(2*w)*.1;
}
export function springForPart(part:string):SpringSpec {
 return /tail/.test(part)?SECONDARY_SPRINGS.tail:/ear/.test(part)?SECONDARY_SPRINGS.ear:
  /cloak|hem|cloth|dress|apron/.test(part)?SECONDARY_SPRINGS.cloth:/hair|tuft/.test(part)?SECONDARY_SPRINGS.hair:SECONDARY_SPRINGS.accessory;
}
export class SecondaryMotion {
 readonly seed:number;clock=0;body=0;look=0;leftBlink=0;rightBlink=0;earFlatten=0;hair=0;ear=0;accessory=0;
 turn=0;tilt=0;tiltSin=0;tiltCos=1;nod=0;weight=0;earFlick=0;handLift=0;tailSweep=0;overlapGain=1;fidgetAge=-1;fidgetKind=0;
 leftSoftness=0;rightSoftness=0;
 private clip='idle';private poseTime=0;private hitAge=-1;private amount=1;private period=3.6;
 private readonly profile:LivingProfile|undefined;
 private readonly pankoLiving:boolean;
 constructor(id:string){this.seed=motionSeed(id);this.profile=HERO_LIVING[id];this.pankoLiving=id==='panko';}
 sample(clock:number,clip:string,poseTime:number,reduced:boolean,look=0,hitAge=-1,critAge=-1){
  this.clock=clock;this.clip=clip;this.poseTime=poseTime;this.hitAge=hitAge;this.amount=reduced?0:1;
  const phase=random(this.seed,31)*Math.PI*2;
  this.period=this.pankoLiving&&(clip==='idle'||clip==='idle-phase2')?10/3:this.profile?.breath??3.6;
  this.body=Math.sin(clock*Math.PI*2/this.period+phase)*(reduced?.25:1);
  this.look=reduced?0:Math.max(-1,Math.min(1,look))*(clip==='idle'||clip==='idle-phase2'?1:clamp(poseTime/.18));
  const blink=clip==='ko'?clamp(poseTime/.2):seededBlink(clock,this.seed);
  this.leftBlink=Math.max(blink,critAge>=0?blinkEnvelope(critAge*.6):0);this.rightBlink=blink;
  this.earFlatten=reduced||hitAge<0?0:(1-clamp(hitAge/.32));
  this.living(phase,reduced);
  this.hair=this.layer('hair',phase);
  this.ear=this.layer('ear',phase+.4);this.accessory=this.layer('accessory',phase+.8);
 }
 private living(phase:number,reduced:boolean){
  this.turn=this.tilt=this.nod=this.weight=this.earFlick=this.handLift=this.tailSweep=0;
  this.leftSoftness=this.rightSoftness=0;
  this.tiltSin=0;this.tiltCos=1;this.overlapGain=this.profile?1.6:1;this.fidgetAge=-1;
  if(this.pankoLiving&&(this.clip==='idle'||this.clip==='idle-phase2')){samplePankoIdle(this,this.clock,reduced);return;}
  if(!this.profile||reduced||this.clip==='ko')return;
  const index=Math.max(0,Math.floor((this.clock-1.45)/8.5));
  const age=this.clock-fidgetStart(this.seed,index),previous=index>0&&age<0?index-1:index;
  this.fidgetAge=this.clock-fidgetStart(this.seed,previous);this.fidgetKind=previous%2;
  const gesture=this.profile.gestures[this.fidgetKind]!,envelope=fidgetEnvelope(this.fidgetAge);
  const mix=ambientMix(this.clip,this.poseTime),tau=Math.PI*2;
  const expression=mix*envelope;
  this.leftSoftness=this.profile.softEyes[0]*expression;this.rightSoftness=this.profile.softEyes[1]*expression;
  this.weight=mix*(.55*Math.sin(this.clock*tau/(this.period*2.35)+phase+.5)+(gesture.weight??0)*envelope);
  this.turn=mix*(.45*Math.sin(this.clock*tau/(this.period*1.8)+phase*.7)+(gesture.turn??0)*envelope);
  this.tilt=mix*(2*Math.sin(this.clock*tau/(this.period*2.1)+phase+1)+(gesture.tilt??0)*envelope);
  this.nod=mix*(.18*Math.sin(this.clock*tau/(this.period*1.4)+phase+.3)+(gesture.nod??0)*envelope);
  this.earFlick=mix*(gesture.ear??0)*springImpulse(this.fidgetAge,SECONDARY_SPRINGS.ear);
  this.handLift=mix*(gesture.hand??0)*springImpulse(this.fidgetAge,SECONDARY_SPRINGS.accessory);
  this.tailSweep=mix*(gesture.tail??0)*springImpulse(this.fidgetAge,SECONDARY_SPRINGS.tail);
  if(this.clip==='victory'){
   const joy=springImpulse(this.poseTime,SECONDARY_SPRINGS.accessory);
   this.tilt+=joy;this.handLift+=joy;this.tailSweep+=joy*.7;
  }
  this.tiltSin=Math.sin(this.tilt*Math.PI/180);this.tiltCos=Math.cos(this.tilt*Math.PI/180);
 }
 layer(part:string,phase:number){
  if(!this.amount||this.clip==='ko')return 0;
  const spec=springForPart(part),frequency=Math.PI*2/this.period;
  if(this.pankoLiving&&(this.clip==='idle'||this.clip==='idle-phase2')){
   const t=pankoPhase(this.clock),w=2*Math.PI/10;
   return .72*springWave(t,w*3,.4,spec)+.22*springWave(t,w,0,spec);
  }
  let value=.72*springWave(this.clock,frequency,phase,spec)+.18*springWave(this.clock,frequency*1.7,phase+1,spec);
  if(/tail/.test(part))value+=this.tailSweep;
  if(this.clip==='attack')value+=.65*springImpulse(this.poseTime-.05,spec)-.8*springImpulse(this.poseTime-.35,spec);
  if(this.clip==='ult'||this.clip==='skill')value+=.6*springImpulse(this.poseTime-.3,spec)-.8*springImpulse(this.poseTime-1.1,spec);
  if(this.hitAge>=0)value-=1.2*springImpulse(this.hitAge,spec);
  return Math.max(-1.5,Math.min(1.5,value));
 }
}
