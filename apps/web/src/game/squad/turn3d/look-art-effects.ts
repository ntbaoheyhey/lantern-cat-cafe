import type {CardEffectLayer as Layer,CardEffectRecipe as Recipe} from './card-effect-data';
import type {EffectFrame} from './effects';

// The actor's impact pose holds still, but light must arrive on the landing beat.
// Sampling the held pose progress left all new light layers fully transparent.
export function artLightBeatProgress(frame:EffectFrame):number{
 return frame.beat.kind==='impact'
  ? Math.max(0,Math.min(1,(frame.elapsed-frame.beat.start)/Math.max(1,frame.beat.duration)))
  : frame.progress;
}

// One generated RGBA atlas, four independently moving light components.
// Keep the rules' targeting, durations and landing clock; remove duplicate props.
const light=(tile:number,motion:Layer['motion'],anchor:Layer['anchor'],o:Partial<Layer>={}):Layer=>({
 primitive:'painted-light',spriteRow:tile,motion,anchor,start:.48,end:.84,count:1,size:1,
 spread:.3,height:.48,turns:0,offset:[0,0,.12],aspect:[1,1,1],ground:false,
 accent:false,opacity:.72,...o,
});
export function artEffectRecipes(base:Record<string,Recipe>):Record<string,Recipe>{
 const result={...base};
 for(const id of ['mochi-1','mochi-2','mochi-3','mochi-4','mochi-passive']){
  const old=base[id];if(!old)continue;
  const ultimate=id==='mochi-4',support=old.target==='friendly',passive=id==='mochi-passive';
  const target=ultimate?'all-targets':'target';
  const layers:Layer[]=[
   light(0,'pulse','caster',{start:.08,end:.34,size:.48,height:0,offset:[0,0,0],propOrigin:true,opacity:.56}),
   light(1,'projectile',target,{start:.34,end:.52,size:support?.62:.82,height:.50,propOrigin:true,opacity:.74}),
   light(support?2:3,support?'hold':'expand',target,{start:.52,end:support?.88:.70,size:ultimate?2.05:support?1.28:.94,height:support?.62:.48,opacity:ultimate?.66:.72}),
   light(0,'expand',target,{start:.52,end:.90,size:ultimate?1.8:1.05,height:.04,ground:true,opacity:.25}),
   light(3,'emit',target,{start:.54,end:.96,count:ultimate?10:6,size:.18,height:.38,spread:.6,opacity:.7,
    emitter:{mode:'burst',life:.8,velocity:[.7,.9,.5],gravity:-1.4,curl:.2,inherit:0}}),
  ];
  if(id==='mochi-3')layers.push(light(1,'orbit',target,{start:.52,end:.86,count:2,size:.65,height:.4,spread:.58,turns:.3,opacity:.65}));
  if(ultimate)layers.push(light(1,'orbit',target,{start:.54,end:.92,count:2,size:.9,height:.2,spread:.75,turns:.24,opacity:.55}));
  if(passive){layers.splice(1,1);for(const layer of layers){layer.size*=.6;layer.opacity*=.7;}}
  result[id]={...old,authored:true,color:'#edbd73',accent:'#fff0be',layers};
 }
 // Pilot enemies from the retained Mochi film: keep their distinct thread/steam
 // language without conjuring a second sock, cup, bow or button by the actor.
 for(const owner of ['sock-skipper','teacup-healer'])for(const suffix of ['',':basic']){
  const id=`enemy:${owner}${suffix}`,old=base[id];if(!old)continue;
  const sock=owner==='sock-skipper',target=old.layers.some(l=>l.anchor==='all-targets')?'all-targets':'target';
  const support=old.target==='friendly';
  result[id]={...old,color:sock?'#a93c53':support?'#75ac9b':'#8f394c',accent:sock?'#e6a972':'#cde9cf',layers:[
   light(0,'pulse','caster',{start:.12,end:.34,size:.38,height:.4,opacity:.4}),
   light(1,'projectile',target,{start:.34,end:.52,size:.64,height:.4,opacity:.65}),
   light(support?0:3,'expand',target,{start:.52,end:.72,size:.85,height:.42,opacity:.65}),
   light(3,'emit',target,{start:.54,end:.94,count:6,size:.15,height:.3,opacity:.6,
    emitter:{mode:'burst',life:.8,velocity:[.5,.7,.4],gravity:-1,curl:.15,inherit:0}}),
   {primitive:sock?'seam':'steam',motion:sock?'cross':'rise',anchor:target,start:.53,end:.85,count:2,size:sock?.5:.34,
    spread:.4,height:.25,turns:0,offset:[0,0,.1],aspect:[1,1,1],ground:false,accent:true,opacity:.5},
  ]};
 }
 return result;
}
