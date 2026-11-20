/** Native layered pilot, calibrated with the commissioned ten-second reference.
 * Values are authored offsets in canonical 512px rig space, not recovered Cubism keys.
 */
const mallow={idea:'soft whisk spark',neck:3.6,tilt:1,breath:1,ear:1,tail:1,prop:1,cloth:1,face:1,offset:0,blink:0,lag:1,castX:1,castY:1,castArm:1,castRight:1,castProp:1};
/** Individual authoring in the measured ten-second family; no source rig edits. */
export const nativeLivingProfiles={
 mallow,
 sorrel:{...mallow,idea:'careful moonlit pour',neck:3.1,tilt:1.12,breath:.82,ear:.85,tail:.8,prop:1.35,cloth:.8,face:.9,offset:.5,blink:.22,lag:1.15,castX:.75,castY:1.2,castArm:1.2,castProp:-.9},
 biscuit:{...mallow,idea:'steady shield brace',neck:2.5,tilt:.65,breath:.9,ear:.8,tail:.65,prop:.65,cloth:.65,face:.8,offset:1.1,blink:.35,lag:1.2,castX:.9,castY:.55,castArm:.75,castRight:.4,castProp:.55},
 inkcap:{...mallow,idea:'buoyant mushroom glyph',neck:4,tilt:1.1,breath:.95,ear:1.1,tail:1.1,prop:1.2,cloth:1.1,face:1.1,offset:1.6,blink:-.18,lag:.9,castX:1.12,castY:1.05,castArm:1.15,castRight:.45,castProp:1.2},
 cinnamon:{...mallow,idea:'warm measured cup',neck:3.2,tilt:.9,breath:1.05,ear:1.05,tail:.8,prop:1.15,cloth:1.05,face:.95,offset:2.2,blink:.1,lag:1.1,castX:.7,castY:1.2,castArm:.9,castProp:-.7},
 brioche:{...mallow,idea:'regal night watch',neck:3,tilt:.8,breath:.8,ear:.75,tail:1,prop:.8,cloth:.9,face:.85,offset:2.7,blink:.3,lag:1.25,castX:1.05,castY:.65,castArm:.8,castRight:.6,castProp:.7},
 velvet:{...mallow,idea:'floating lantern invocation',neck:4.2,tilt:1.2,breath:.85,ear:.8,tail:1.15,prop:1.1,cloth:1.2,face:1.15,offset:3.3,blink:-.12,lag:1.3,castX:.9,castY:1.35,castArm:1.1,castRight:.75,castProp:1.3},
 marigold:{...mallow,idea:'gentle first-leaf offering',neck:3.7,tilt:1,breath:1.1,ear:.9,tail:.95,prop:1.4,cloth:1.25,face:1,offset:3.8,blink:.16,lag:1.15,castX:.8,castY:1.1,castArm:1.1,castProp:-1},
} as const;
export type NativeLivingCat=keyof typeof nativeLivingProfiles;
export const isNativeLivingCat=(id:string):id is NativeLivingCat=>Object.hasOwn(nativeLivingProfiles,id);
export const nativeLivingClip=(name:string)=>name==='idle'||name==='idle-phase2'||name==='skill';
export const nativeLivingDuration=(name:string)=>name==='skill'?1:10;
const w=Math.PI*2/10;
const phase=(t:number)=>((t%10)+10)%10;
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*t*(t*(t*6-15)+10);};
const pulse=(p:number,a:number,b:number,c:number)=>p<b?smooth((p-a)/(b-a)):1-smooth((p-b)/(c-b));
export function nativeLivingBlink(clock:number,right=false,cat:NativeLivingCat='mallow'){
 const t=phase(clock-nativeLivingProfiles[cat].blink-(right?.045:0));let amount=0;
 for(let i=0;i<3;i++){const age=phase(t-1-i*10/3);amount=Math.max(amount,smooth(age/.18)*(1-smooth((age-.58)/.32)));}
 return amount;
}
export function nativeLivingFeature(slot:string,clock:number,reduced:boolean,cat:NativeLivingCat='mallow'){
 const profile=nativeLivingProfiles[cat],turn=Math.sin(w*phase(clock+profile.offset)+.4),eye=slot==='eye_l'||slot==='eye_r';
 return{x:reduced?0:(eye?1.2:2.4)*turn*profile.face,blink:eye?nativeLivingBlink(clock,slot==='eye_r',cat):0};
}
export function nativeLivingCloth(y:number,clock:number,reduced:boolean,cat:NativeLivingCat='mallow'){
 const profile=nativeLivingProfiles[cat];
 return reduced?0:1.8*Math.sin(3*w*(phase(clock+profile.offset)-.16*profile.lag)+.4)*smooth((y-60)/40)*(1-smooth((y-180)/100))*profile.cloth;
}
/** Add only to instance locals; root/hip/legs stay exactly in setup pose. */
export function applyNativeLivingPose(nodes:readonly {name:string}[],local:number[][],clock:number,name:string,at:number,reduced:boolean,cat:NativeLivingCat='mallow'){
 const profile=nativeLivingProfiles[cat],t=phase(clock+profile.offset),g=reduced?0:1,breath=(reduced?.23:1)*profile.breath,lag=profile.lag;
 const cast=name==='skill'&&!reduced&&at>0&&at<1,anticipation=cast?pulse(at,0,.14,.28):0;
 const reach=cast?pulse(at,.14,.31,.72):0,hit=cast?pulse(at,.47,.55,.71):0;
 const follow=cast?pulse(at,.07,.38,.88):0;
 for(let i=0;i<nodes.length;i++){
  const p=local[i]!;switch(nodes[i]!.name){
   case 'torso':p[0]!+=g*.6*Math.sin(w*t+.2)+512*(-.010*anticipation+.016*reach-.004*hit)*profile.castX;p[1]!+=breath*2.4*Math.sin(3*w*t+.4)+512*(-.008*anticipation+.012*reach-.006*hit)*profile.castY;p[4]!*=1+breath*.006*Math.sin(3*w*t+.4);break;
   case 'neck':p[0]!+=g*profile.neck*Math.sin(w*t+.4);p[1]!+=breath*1.8*Math.sin(3*w*(t-.1*lag)+.4);break;
   case 'head':p[2]!+=g*(1.6*Math.sin(w*t+.8)+.3*Math.sin(2*w*t-.3))*profile.tilt+(-anticipation+1.8*reach-.6*hit)*profile.castY;p[3]!*=1-g*.008*(1-Math.cos(w*t+.4));break;
   case 'ear_l':p[2]!+=g*(1.6*Math.sin(3*w*(t-.045*lag)+.4)+.9*Math.sin(2*w*t))*profile.ear+.8*follow;break;
   case 'ear_r':p[2]!+=g*(-1.2*Math.sin(3*w*(t-.07*lag)+.7)-.7*Math.sin(2*w*t))*profile.ear-.7*follow;break;
   case 'tail_1':p[2]!+=g*(7*Math.sin(w*(t-.12*lag))+2*Math.sin(3*w*(t-.12*lag)))*profile.tail+1.5*follow;break;
   case 'tail_2':p[2]!+=g*(-3.5*Math.sin(w*(t-.24*lag))+2*Math.sin(3*w*(t-.2*lag)))*profile.tail-follow;break;
   case 'tail_3':p[2]!+=g*(7*Math.sin(w*(t-.36*lag))+3*Math.sin(3*w*(t-.28*lag)))*profile.tail+2*follow;break;
   case 'arm_upper_l':p[2]!+=g*-.7*Math.sin(3*w*(t-.06*lag)+.4)*profile.prop+(2*anticipation-3*reach)*profile.castArm;break;
   case 'arm_upper_r':p[2]!+=g*.9*Math.sin(3*w*(t-.06*lag)+.4)*profile.prop+(-4*anticipation+9*reach)*profile.castArm*profile.castRight;break;
   case 'arm_lower_l':p[2]!+=g*Math.sin(3*w*(t-.12*lag)+.4)*profile.prop-2*follow*profile.castArm;break;
   case 'arm_lower_r':p[2]!+=g*.8*Math.sin(3*w*(t-.12*lag)+.4)*profile.prop+3*follow*profile.castArm*profile.castRight;break;
   case 'weapon':p[2]!+=g*(1.5*Math.sin(3*w*(t-.18*lag)+.4)+Math.sin(w*t))*profile.prop+(-4*anticipation+8*follow)*profile.castProp;break;
  }
 }
}
