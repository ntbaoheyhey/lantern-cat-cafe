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
 private clip='idle';private poseTime=0;private hitAge=-1;private amount=1;
 constructor(id:string){this.seed=motionSeed(id);}
 sample(clock:number,clip:string,poseTime:number,reduced:boolean,look=0,hitAge=-1,critAge=-1){
  this.clock=clock;this.clip=clip;this.poseTime=poseTime;this.hitAge=hitAge;this.amount=reduced?0:1;
  const phase=random(this.seed,31)*Math.PI*2;
  this.body=Math.sin(clock*Math.PI*2/3.6+phase)*(reduced?.25:1);
  this.look=reduced?0:Math.max(-1,Math.min(1,look))*(clip==='idle'||clip==='idle-phase2'?1:clamp(poseTime/.18));
  const blink=clip==='ko'?clamp(poseTime/.2):seededBlink(clock,this.seed);
  this.leftBlink=Math.max(blink,critAge>=0?blinkEnvelope(critAge*.6):0);this.rightBlink=blink;
  this.earFlatten=reduced||hitAge<0?0:(1-clamp(hitAge/.32));
  this.hair=this.layer('hair',phase);
  this.ear=this.layer('ear',phase+.4);this.accessory=this.layer('accessory',phase+.8);
 }
 layer(part:string,phase:number){
  if(!this.amount||this.clip==='ko')return 0;
  const spec=springForPart(part),frequency=Math.PI*2/3.6;
  let value=.72*springWave(this.clock,frequency,phase,spec)+.18*springWave(this.clock,frequency*1.7,phase+1,spec);
  if(this.clip==='attack')value+=.65*springImpulse(this.poseTime-.05,spec)-.8*springImpulse(this.poseTime-.35,spec);
  if(this.clip==='ult'||this.clip==='skill')value+=.6*springImpulse(this.poseTime-.3,spec)-.8*springImpulse(this.poseTime-1.1,spec);
  if(this.hitAge>=0)value-=1.2*springImpulse(this.hitAge,spec);
  return Math.max(-1.5,Math.min(1.5,value));
 }
}
