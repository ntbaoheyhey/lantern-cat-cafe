/** Shared absolute reaction clock for native and drawn actors; combat events stay untouched. */
export type ReactionPhase='none'|'flash'|'squash'|'recover'|'dissolve'|'gone';
export interface ReactionSample {phase:ReactionPhase;flash:number;recoil:number;squash:number;opacity:number;dissolve:number}
export const reactionSample=():ReactionSample=>({phase:'none',flash:0,recoil:0,squash:0,opacity:1,dissolve:0});
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
export function sampleReaction(hitAgeMs:number,deathAgeMs=-1,reduced=false,out:ReactionSample=reactionSample()):ReactionSample {
 out.phase='none';out.flash=0;out.recoil=0;out.squash=0;out.opacity=1;out.dissolve=0;
 if(deathAgeMs>=0){
  out.dissolve=clamp(deathAgeMs/600);out.opacity=1-out.dissolve;out.phase=out.dissolve===1?'gone':'dissolve';return out;
 }
 if(!Number.isFinite(hitAgeMs)||hitAgeMs<0||hitAgeMs>=300)return out;
 out.phase=hitAgeMs<60?'flash':hitAgeMs<120?'squash':'recover';
 out.flash=hitAgeMs<60?(reduced?.3:1):0;
 if(!reduced){out.recoil=1-smooth((hitAgeMs-90)/210);out.squash=1-smooth((hitAgeMs-120)/180);}
 return out;
}
