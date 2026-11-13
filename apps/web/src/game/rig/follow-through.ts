const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const p=clamp(n);return p*p*(3-2*p);};

/** One weapon-led swing with delayed head/tail counterweight, never a loop. */
export function followThrough(name:string,at:number,duration:number,contact:number){
 if(!/^(attack|cast|skill|ultimate|ult)$/.test(name)||at<=0||at>=duration)return 0;
 const windup=smooth(at/Math.max(.01,contact*.65));
 const release=smooth((at-contact*.65)/Math.max(.01,contact*.35));
 const recovery=smooth((at-contact)/Math.max(.01,duration-contact));
 return (-.45*windup+1.45*release)*(1-recovery);
}

export const FOLLOW_THROUGH_DEGREES:Readonly<Record<string,number>>={
 arm_upper_l:18,arm_lower_l:12,arm_upper_r:-10,weapon:22,
 head:-4,tail_1:-12,tail_2:-16,tail_3:-18,
};
