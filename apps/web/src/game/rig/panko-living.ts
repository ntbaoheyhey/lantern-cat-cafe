/** Batch M Panko pilot. Source tables: reports/v5/CXV/M-V1-L1-TIMING.md.
 * Ten-second periodic family; these are calibrated design values, not Cubism keys.
 * No other actor is enrolled by this helper. */
export const PANKO_IDLE_SECONDS=10;
export const isPankoLivingClip=(clip:string)=>clip==='idle'||clip==='idle-phase2'||clip==='skill';
export const pankoPhase=(time:number)=>((time%PANKO_IDLE_SECONDS)+PANKO_IDLE_SECONDS)%PANKO_IDLE_SECONDS;
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*t*(t*(t*6-15)+10);};
export function pankoBlink(time:number){
 let value=0;
 for(let i=0;i<3;i++){const age=pankoPhase(time-1-i*10/3);value=Math.max(value,smooth(age/.18)*(1-smooth((age-.58)/.32)));}
 return value;
}
export interface PankoIdleSignals {
 body:number;weight:number;turn:number;tilt:number;tiltSin:number;tiltCos:number;nod:number;
 leftBlink:number;rightBlink:number;leftSoftness:number;rightSoftness:number;
 earFlick:number;handLift:number;tailSweep:number;overlapGain:number;fidgetAge:number;
}
export function samplePankoIdle(out:PankoIdleSignals,clock:number,reduced:boolean){
 const t=pankoPhase(clock),w=2*Math.PI/10;
 out.body=.55*Math.sin(3*w*t+.4)*(reduced?.25:1);
 out.weight=reduced?0:.48*Math.sin(w*t+.2);
 out.turn=reduced?0:.5*Math.sin(w*t+.4)+.12*Math.sin(2*w*t-.7);
 out.tilt=reduced?0:1.4*Math.sin(w*t+.8)+.35*Math.sin(2*w*t-.3);
 out.tiltSin=Math.sin(out.tilt*Math.PI/180);out.tiltCos=Math.cos(out.tilt*Math.PI/180);
 out.nod=reduced?0:.2*Math.sin(3*w*t-.2);
 out.leftBlink=pankoBlink(t);out.rightBlink=pankoBlink(t-.045);
 out.leftSoftness=reduced?0:.025+.02*Math.sin(w*t+.4);
 out.rightSoftness=reduced?0:.025+.02*Math.sin(w*t+.55);
 out.earFlick=0;out.handLift=0;out.tailSweep=0;
 out.overlapGain=1.8;out.fidgetAge=-1;
}
