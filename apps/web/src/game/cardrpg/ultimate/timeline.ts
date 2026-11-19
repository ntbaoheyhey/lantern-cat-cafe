/**
 * V9 five-beat ultimate inside the existing 2200 ms ultimate clock
 * (battle-v3/sequence ACTION_TIMING: anticipation 600, impact 1100):
 *   1 dim      0 ms, field to ~40% in one frame
 *   2 cut-in   0-650 ms banner (portrait crop, speed lines, rune circle, name)
 *   3 cast     600-1100 squash then lunge on the frozen idle frame
 *   4 impact   1100 core + ring + debris, trauma shake, ~90 ms hit-stop, big numbers
 *   5 linger   1100-2200 smoke/embers, step back at 1450-1800, undim by 2000
 * Pure functions only, so the curves are testable without a renderer.
 */
export const ULT_TIMING=Object.freeze({duration:2200,impact:1100,cutinIn:120,cutinOut:520,cutinEnd:650,squash:600,lunge:720,holdEnd:1450,back:1800,dimHold:1600,dimEnd:2000,hitstop:90,lingerEnd:2200});
export const ULT_DIM=.6;

const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const easeOutCubic=(t:number)=>1-(1-clamp(t))**3;
export const easeInOut=(t:number)=>{t=clamp(t);return t<.5?4*t*t*t:1-(-2*t+2)**3/2;};
export const easeOutBack=(t:number,s=1.70158)=>{t=clamp(t);if(t<=0)return 0;if(t>=1)return 1;t-=1;return 1+(s+1)*t*t*t+s*t*t;};

/** Field dim (0 = none). Snaps on, holds through the impact, eases off in the linger. */
export function ultimateDim(at:number,reduced=false){
 const T=ULT_TIMING,peak=reduced?ULT_DIM*.7:ULT_DIM;
 if(at<0||at>=T.dimEnd)return 0;
 if(at<=T.dimHold)return peak;
 return peak*(1-easeInOut((at-T.dimHold)/(T.dimEnd-T.dimHold)));
}

/** Banner slide: 0 hidden left, 1 in place; `alpha` fades the out. */
export function cutinState(at:number,reduced=false){
 const T=ULT_TIMING;
 if(at<0||at>=T.cutinEnd)return {visible:false,slide:0,alpha:0,lines:0};
 if(reduced)return {visible:true,slide:1,alpha:at<T.cutinOut?1:1-(at-T.cutinOut)/(T.cutinEnd-T.cutinOut),lines:0};
 const slide=at<T.cutinIn?easeOutBack(at/T.cutinIn,1.2):1;
 const alpha=at<T.cutinOut?1:1-easeInOut((at-T.cutinOut)/(T.cutinEnd-T.cutinOut));
 return {visible:true,slide,alpha,lines:at/T.cutinEnd};
}

export interface CastPose {x:number;y:number;sx:number;sy:number;angle:number;held:boolean;phase:'banner'|'squash'|'lunge'|'hold'|'back'|'done'}
/**
 * Caster body on the frozen frame. `reach` is the lunge distance in screen
 * pixels (positive = toward the target); `height` the body height in pixels.
 */
export function castPose(at:number,reach:number,height:number,reduced=false):CastPose{
 const T=ULT_TIMING,dir=Math.sign(reach)||1;
 const pose:CastPose={x:0,y:0,sx:1,sy:1,angle:0,held:at>=0&&at<T.back,phase:'done'};
 if(at<0||at>=T.back){pose.held=false;return pose;}
 if(reduced){pose.phase=at<T.squash?'banner':at<T.holdEnd?'hold':'back';return pose;}
 if(at<T.squash){
  // Banner time: a slow inhale so the frozen frame does not read as a stall.
  const u=at/T.squash;pose.phase='banner';pose.sy=1+.015*Math.sin(u*Math.PI);pose.sx=1-.008*Math.sin(u*Math.PI);return pose;
 }
 if(at<T.lunge){
  const u=easeOutCubic((at-T.squash)/(T.lunge-T.squash));pose.phase='squash';
  pose.sx=1+.07*u;pose.sy=1-.09*u;pose.x=-dir*.025*Math.abs(reach)*u;pose.angle=-dir*.03*u;return pose;
 }
 if(at<T.impact){
  const u=(at-T.lunge)/(T.impact-T.lunge),e=easeOutCubic(u*1.15);
  pose.phase='lunge';pose.x=-dir*.025*Math.abs(reach)*(1-e)+reach*e;
  pose.sx=1.07-.11*Math.min(1,u*2)+.04*e;pose.sy=.91+.14*Math.min(1,u*2)-.05*e;pose.y=-.04*height*Math.sin(Math.min(1,u)*Math.PI);
  pose.angle=dir*.06*Math.sin(Math.min(1,u)*Math.PI);return pose;
 }
 if(at<T.holdEnd){
  const u=(at-T.impact)/(T.holdEnd-T.impact);pose.phase='hold';
  // Contact squash then settle.
  const k=Math.exp(-u*5)*Math.cos(u*12);pose.x=reach;pose.sx=1+.05*k;pose.sy=1-.05*k;return pose;
 }
 const u=easeInOut((at-T.holdEnd)/(T.back-T.holdEnd));pose.phase='back';pose.x=reach*(1-u);pose.y=-.025*height*Math.sin(u*Math.PI);return pose;
}

/** Camera trauma (0..1) after the impact; shake amplitude uses trauma squared. */
export function impactTrauma(at:number,reduced=false){
 if(reduced)return 0;const age=at-ULT_TIMING.impact;
 if(age<0||age>480)return 0;
 return Math.max(0,1-age/480);
}
/** Deterministic shake offset in pixels from trauma, with a max of `max` px. */
export function shakeOffset(at:number,trauma:number,max=18){
 const t2=trauma*trauma,s=at*.001;
 return {x:max*t2*(Math.sin(s*71.3)*.6+Math.sin(s*137.9+1.3)*.4),y:max*.7*t2*(Math.sin(s*83.1+2.1)*.6+Math.sin(s*151.7)*.4),angle:.012*t2*Math.sin(s*59.7+.7)};
}

export type UltBeat='dim'|'cutin'|'squash'|'lunge'|'impact'|'linger'|'undim';
export const ULT_BEATS:readonly {beat:UltBeat;t:number}[]=[
 {beat:'dim',t:0},{beat:'cutin',t:0},{beat:'squash',t:ULT_TIMING.squash},{beat:'lunge',t:ULT_TIMING.lunge},
 {beat:'impact',t:ULT_TIMING.impact},{beat:'linger',t:ULT_TIMING.impact+200},{beat:'undim',t:ULT_TIMING.dimHold},
];
/** Beats crossed between two clock samples (inclusive of `to`). */
export function beatsBetween(from:number,to:number){return ULT_BEATS.filter(b=>b.t>from&&b.t<=to||from<0&&b.t===0&&to>=0);}
