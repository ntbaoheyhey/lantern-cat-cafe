/** Additive cast on commissioned idle pixels. Feet are local y=0, opaque height=512.
 * Design values from the Batch M experiment, not recovered Cubism parameters.
 * Keep the independent ten-second media clock running; never warp last frame's vertices.
 */
export interface LivingCatCastPose {lean:number;lift:number;tilt:number;follow:number}
export interface LivingCatCastPoint {x:number;y:number}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10);};
const pulse=(p:number,start:number,peak:number,end:number)=>p<peak?smooth((p-start)/(peak-start)):1-smooth((p-peak)/(end-peak));
export const LIVING_CAT_SKILL_SECONDS=1;
export const LIVING_CAT_SKILL_EVENTS=[{name:'cast',time:.25},{name:'hit',time:.55}] as const;

export function sampleLivingCatCast(unit:string,animation:string,progress:number,reduced:boolean,out:LivingCatCastPose):LivingCatCastPose {
 out.lean=0;out.lift=0;out.tilt=0;out.follow=0;
 if((unit!=='mochi'&&unit!=='clover')||(animation!=='skill'&&animation!=='ult')||reduced||!Number.isFinite(progress)||progress<=0||progress>=1)return out;
 const p=progress,clover=unit==='clover',hit=animation==='ult'?.5:.55;
 const anticipation=pulse(p,0,.14,.28),reach=pulse(p,.14,.31,hit+.17);
 const recoil=pulse(p,hit-.08,hit,hit+.16),recover=pulse(p,hit+.10,.84,1);
 out.lean=-.012*anticipation+(clover?.018:.025)*reach-.006*recoil;
 out.lift=-.012*anticipation+(clover?.022:.016)*reach-.008*recoil+.003*recover;
 out.tilt=(clover?.021:.03)*(-.6*anticipation+reach-.35*recoil);
 const lag=clover?.085:.055;
 out.follow=.008*pulse(p,lag,.31+lag,hit+.23)-.004*pulse(p,hit,hit+.13,.98);
 return out;
}

/** Same function for mesh points and sockets. Below-foot pixels remain unwarped. */
export function livingCatCastOffset(x:number,y:number,height:number,pose:LivingCatCastPose,out:LivingCatCastPoint):LivingCatCastPoint {
 out.x=0;out.y=0;
 if(!(height>0)||y<=0||!Number.isFinite(x+y+height))return out;
 const row=y/height,upper=smooth((row-.06)/.72),head=smooth((row-.57)/.29);
 const dx=x,dy=y-height*.63,s=Math.sin(pose.tilt),c=Math.cos(pose.tilt);
 out.x=height*pose.lean*upper+(dx*(c-1)-dy*s)*head;
 out.y=height*(pose.lift*upper+pose.follow*upper*(1-head*.75))+(dx*s+dy*(c-1))*head;
 return out;
}

/** Accepts the loader's immutable 24x24 base positions and matching mutable output. */
export function applyLivingCatCast(base:ArrayLike<number>,target:Float32Array,height:number,pose:LivingCatCastPose):void {
 if(base===target)throw new Error('Cast requires immutable base positions');
 if(base.length!==target.length||base.length%3)throw new Error('Cast position layout mismatch');
 const out={x:0,y:0};
 for(let i=0;i<base.length;i+=3){livingCatCastOffset(base[i]!,base[i+1]!,height,pose,out);target[i]=base[i]!+out.x;target[i+1]=base[i+1]!+out.y;target[i+2]=base[i+2]!;}
}
