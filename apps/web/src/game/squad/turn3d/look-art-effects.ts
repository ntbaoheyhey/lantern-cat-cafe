import type {CardEffectLayer as Layer,CardEffectRecipe as Recipe} from './card-effect-data';
import type {EffectFrame} from './effects';

// The actor's impact pose holds still, but light must arrive on the landing beat.
// Sampling the held pose progress left all new light layers fully transparent.
export function artLightBeatProgress(frame:EffectFrame):number{
 return frame.beat.kind==='impact'
  ? Math.max(0,Math.min(1,(frame.elapsed-frame.beat.start)/Math.max(1,frame.beat.duration)))
  : frame.progress;
}

// One shared atlas, four independently moving original components per hero.
// Keep the rules' targeting, durations and landing clock; remove duplicate props.
const light=(tile:number,motion:Layer['motion'],anchor:Layer['anchor'],o:Partial<Layer>={}):Layer=>({
 primitive:'painted-light',spriteRow:tile,motion,anchor,start:.48,end:.84,count:1,size:1,
 spread:.3,height:.48,turns:0,offset:[0,0,.12],aspect:[1,1,1],ground:false,
 accent:false,opacity:.72,...o,
});
export const ART_LIGHT_UNITS=['mochi','soot','clover','panko','mallow','cinnamon','velvet','biscuit','brioche','marigold','sorrel','inkcap'] as const;
const profiles:Record<string,{color:string;accent:string;motion:Layer['motion'];size:number;aspect:[number,number,number];height:number;turns:number}>={
 soot:{color:'#ac80dc',accent:'#f3bb61',motion:'orbit',size:2.15,aspect:[1.1,.95,1],height:.6,turns:.42},
 clover:{color:'#87cdb0',accent:'#e9f4c0',motion:'hold',size:2.05,aspect:[.9,1.1,1],height:.68,turns:.12},
 panko:{color:'#f1ae65',accent:'#fff0d2',motion:'hold',size:2.1,aspect:[1.2,.8,1],height:.5,turns:.18},
 mallow:{color:'#ed9271',accent:'#ffe7b3',motion:'hold',size:2.6,aspect:[.9,1.12,1],height:.85,turns:.08},
 cinnamon:{color:'#e5a36c',accent:'#ffe2a8',motion:'hold',size:2.5,aspect:[.85,1.25,1],height:.85,turns:.22},
 velvet:{color:'#d99fc8',accent:'#ffe4c9',motion:'cross',size:2.5,aspect:[1.12,.94,1],height:.9,turns:.34},
 biscuit:{color:'#ebbb71',accent:'#fff0d2',motion:'hold',size:2.1,aspect:[1.1,1,1],height:.58,turns:.12},
 brioche:{color:'#dba881',accent:'#ffe1a5',motion:'pulse',size:2.0,aspect:[1,1.08,1],height:.56,turns:.28},
 marigold:{color:'#efd18a',accent:'#f4f2ce',motion:'orbit',size:2.05,aspect:[1,1,1],height:.56,turns:.2},
 sorrel:{color:'#b3cf83',accent:'#f9ebaf',motion:'rise',size:2.05,aspect:[.88,1.12,1],height:.38,turns:.16},
 inkcap:{color:'#a9a2cf',accent:'#bcf3c0',motion:'hold',size:2.55,aspect:[1.1,.95,1],height:.95,turns:.2},
};
// Foes use the original light components as threads, steam and cracks, without
// materializing copies of their physical bodies/props on either side of the hit.
const enemyProfiles:Record<string,{unit:number;motion:Layer['motion'];color:string;accent:string;size:number}>={
 'button-guard':{unit:7,motion:'hold',color:'#b75c5a',accent:'#f3c78b',size:1.35},
 'spool-ram':{unit:8,motion:'sweep',color:'#a95a76',accent:'#eac6a0',size:1.5},
 'needle-moth':{unit:6,motion:'fall',color:'#b77aaf',accent:'#e6d4c4',size:1.35},
 'yarn-giant':{unit:8,motion:'cross',color:'#a44d68',accent:'#e8b48a',size:2.4},
 'binding-thread':{unit:6,motion:'shrink',color:'#a95e9d',accent:'#dbbcc9',size:1.4},
 'practice-cushion':{unit:3,motion:'expand',color:'#b17864',accent:'#ebbb88',size:1.15},
 'kettle-knight':{unit:4,motion:'rise',color:'#cc6755',accent:'#ffd38b',size:2.15},
 'pollen-scout':{unit:10,motion:'rise',color:'#9caa65',accent:'#e5cb91',size:1.45},
 'crumb-sentinel':{unit:7,motion:'expand',color:'#b88a51',accent:'#f1c689',size:1.45},
 'rain-spool':{unit:11,motion:'fall',color:'#8f92b7',accent:'#ced2e0',size:1.75},
 'pantry-crown':{unit:9,motion:'orbit',color:'#b97955',accent:'#f5cd81',size:2.25},
};
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
 // Match the source artwork's shape language while preserving each skill's
 // existing targets, impact clock, staggered landings and authored kit data.
 for(let unit=1;unit<ART_LIGHT_UNITS.length;unit++){
  const owner=ART_LIGHT_UNITS[unit]!,profile=profiles[owner]!,first=unit*4;
  for(const suffix of ['1','2','3','4','passive']){
   const id=`${owner}-${suffix}`,old=base[id];if(!old)continue;
   const ultimate=old.ultimate,passive=suffix==='passive',support=old.target==='friendly';
   const target=old.layers.some(l=>l.anchor==='all-targets')?'all-targets':'target';
   const impact=ultimate||support?2:3;
   const size=ultimate?profile.size:support?1.18:suffix==='3'?1.25:.82;
   const layers:Layer[]=[
    light(first,'pulse','caster',{start:.08,end:.34,size:ultimate?.58:.4,height:0,offset:[0,0,0],propOrigin:true,opacity:.62}),
    light(first+1,'projectile',target,{start:.34,end:.52,size:ultimate?.94:suffix==='1'?.66:.8,height:.46,propOrigin:true,opacity:.82,turns:profile.turns*.2}),
    light(first+impact,ultimate?profile.motion:support?'hold':'expand',target,{start:.52,end:ultimate?.88:support?.86:.74,size,height:profile.height,aspect:profile.aspect,opacity:ultimate?.75:.78,turns:profile.turns,spread:profile.motion==='orbit'?.14:.3}),
    light(first,'expand',target,{start:.52,end:.9,size:ultimate?1.9:1.0,height:.035,ground:true,opacity:.22}),
    light(first+3,'emit',target,{start:.54,end:.96,count:ultimate?10:5,size:ultimate?.22:.16,height:.34,spread:.5,opacity:.72,
     emitter:{mode:'burst',life:.8,velocity:[.7,.8,.5],gravity:-1.2,curl:.2,inherit:0}}),
   ];
   if(suffix==='2')layers.push(light(first+1,'rise',target,{start:.54,end:.88,count:2,size:.55,spread:.4,height:.2,turns:-profile.turns,opacity:.58}));
   if(suffix==='3')layers.push(light(first+1,'cross',target,{start:.52,end:.82,count:2,size:.72,spread:.55,height:.45,opacity:.7}));
   if(ultimate)layers.push(light(first+1,owner==='velvet'?'cross':'orbit',target,{start:.54,end:.92,count:2,size:.88,spread:.7,height:.24,turns:profile.turns,opacity:.65}));
   if(passive){layers.splice(1,1);for(const layer of layers){layer.size*=.55;layer.opacity*=.65;}}
   result[id]={...old,authored:true,color:profile.color,accent:profile.accent,layers};
  }
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
 for(const [owner,p] of Object.entries(enemyProfiles))for(const suffix of ['',':basic']){
  const id=`enemy:${owner}${suffix}`,old=base[id];if(!old)continue;
  const basic=!!suffix,first=p.unit*4,target=old.layers.some(l=>l.anchor==='all-targets')?'all-targets':'target';
  result[id]={...old,authored:true,color:p.color,accent:p.accent,layers:[
   light(first,'pulse','caster',{start:.1,end:.34,size:.38,height:0,offset:[0,0,0],propOrigin:true,opacity:.55}),
   light(first+1,'projectile',target,{start:.34,end:.52,size:basic?.6:.85,height:.5,propOrigin:true,opacity:.76}),
   light(first+(basic?3:2),basic?'expand':p.motion,target,{start:.52,end:.88,size:basic?.9:p.size,height:.65,turns:.2,spread:.25,opacity:.78}),
   light(first,'expand',target,{start:.52,end:.9,size:basic?1:p.size,height:.035,ground:true,opacity:.2}),
   light(first+3,'emit',target,{start:.54,end:.95,count:basic?5:8,size:.18,height:.3,spread:.45,opacity:.68,
    emitter:{mode:'burst',life:.8,velocity:[.65,.85,.45],gravity:-1.25,curl:.16,inherit:0}}),
  ]};
 }
 return result;
}
