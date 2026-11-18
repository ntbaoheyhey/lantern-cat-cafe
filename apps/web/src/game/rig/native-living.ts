/** Native layered pilot, calibrated with the commissioned ten-second reference.
 * Values are authored offsets in canonical 512px rig space, not recovered Cubism keys.
 */
export type NativeLivingCat='mallow';
export const isNativeLivingCat=(id:string):id is NativeLivingCat=>id==='mallow';
export const nativeLivingClip=(name:string)=>name==='idle'||name==='idle-phase2'||name==='skill';
export const nativeLivingDuration=(name:string)=>name==='skill'?1:10;
const w=Math.PI*2/10;
const phase=(t:number)=>((t%10)+10)%10;
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*t*(t*(t*6-15)+10);};
const pulse=(p:number,a:number,b:number,c:number)=>p<b?smooth((p-a)/(b-a)):1-smooth((p-b)/(c-b));
export function nativeLivingBlink(clock:number,right=false){
 const t=phase(clock-(right?.045:0));let amount=0;
 for(let i=0;i<3;i++){const age=phase(t-1-i*10/3);amount=Math.max(amount,smooth(age/.18)*(1-smooth((age-.58)/.32)));}
 return amount;
}
export function nativeLivingFeature(slot:string,clock:number,reduced:boolean){
 const turn=Math.sin(w*phase(clock)+.4),eye=slot==='eye_l'||slot==='eye_r';
 return{x:reduced?0:(eye?1.2:2.4)*turn,blink:eye?nativeLivingBlink(clock,slot==='eye_r'):0};
}
export function nativeLivingCloth(y:number,clock:number,reduced:boolean){
 return reduced?0:1.8*Math.sin(3*w*(phase(clock)-.16)+.4)*smooth((y-60)/40)*(1-smooth((y-180)/100));
}
/** Add only to instance locals; root/hip/legs stay exactly in setup pose. */
export function applyNativeLivingPose(nodes:readonly {name:string}[],local:number[][],clock:number,name:string,at:number,reduced:boolean){
 const t=phase(clock),g=reduced?0:1,breath=reduced?.23:1;
 const cast=name==='skill'&&!reduced&&at>0&&at<1,anticipation=cast?pulse(at,0,.14,.28):0;
 const reach=cast?pulse(at,.14,.31,.72):0,hit=cast?pulse(at,.47,.55,.71):0;
 const follow=cast?pulse(at,.07,.38,.88):0;
 for(let i=0;i<nodes.length;i++){
  const p=local[i]!;switch(nodes[i]!.name){
   case 'torso':p[0]!+=g*.6*Math.sin(w*t+.2)+512*(-.010*anticipation+.016*reach-.004*hit);p[1]!+=breath*2.4*Math.sin(3*w*t+.4)+512*(-.008*anticipation+.012*reach-.006*hit);p[4]!*=1+breath*.006*Math.sin(3*w*t+.4);break;
   case 'neck':p[0]!+=g*3.6*Math.sin(w*t+.4);p[1]!+=breath*1.8*Math.sin(3*w*(t-.1)+.4);break;
   case 'head':p[2]!+=g*(1.6*Math.sin(w*t+.8)+.3*Math.sin(2*w*t-.3))-anticipation+1.8*reach-.6*hit;p[3]!*=1-g*.008*(1-Math.cos(w*t+.4));break;
   case 'ear_l':p[2]!+=g*(1.6*Math.sin(3*w*(t-.045)+.4)+.9*Math.sin(2*w*t))+.8*follow;break;
   case 'ear_r':p[2]!+=g*(-1.2*Math.sin(3*w*(t-.07)+.7)-.7*Math.sin(2*w*t))-.7*follow;break;
   case 'tail_1':p[2]!+=g*(7*Math.sin(w*(t-.12))+2*Math.sin(3*w*(t-.12)))+1.5*follow;break;
   case 'tail_2':p[2]!+=g*(-3.5*Math.sin(w*(t-.24))+2*Math.sin(3*w*(t-.2)))-follow;break;
   case 'tail_3':p[2]!+=g*(7*Math.sin(w*(t-.36))+3*Math.sin(3*w*(t-.28)))+2*follow;break;
   case 'arm_upper_l':p[2]!+=g*-.7*Math.sin(3*w*(t-.06)+.4)+2*anticipation-3*reach;break;
   case 'arm_upper_r':p[2]!+=g*.9*Math.sin(3*w*(t-.06)+.4)-4*anticipation+9*reach;break;
   case 'arm_lower_l':p[2]!+=g*Math.sin(3*w*(t-.12)+.4)-2*follow;break;
   case 'arm_lower_r':p[2]!+=g*.8*Math.sin(3*w*(t-.12)+.4)+3*follow;break;
   case 'weapon':p[2]!+=g*(1.5*Math.sin(3*w*(t-.18)+.4)+Math.sin(w*t))-4*anticipation+8*follow;break;
  }
 }
}
