import type {CardEffectRecipe,CardEffectLayer} from './card-effect-data';
const l=(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'],anchor:CardEffectLayer['anchor'],o:Partial<CardEffectLayer>={}):CardEffectLayer=>({primitive,motion,anchor,start:.34,end:.94,count:1,size:.8,spread:.7,height:.18,turns:.25,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.8,...o});
export const ENEMY_BATCH4_EFFECTS:Record<string,CardEffectRecipe>={
 'enemy:crumb-sentinel:basic':{name:'Sugar pinch',color:'#c6a786',accent:'#f8dfad',element:'blunt',shot:'left',target:'hostile',ultimate:false,durations:[610,200,85,230,250],shake:.35,layers:[
  l('spice-star','orbit','caster',{start:.04,end:.43,count:2,size:.4,spread:.4}),
  l('bread','projectile','target',{start:.34,end:.60,size:.75}),
  l('spice-star','burst','target',{start:.49,count:4,size:.35,spread:.8}),
  l('crumb-crown','fall','target',{start:.65,size:.6,height:.6,accent:true}),
 ]},
 'enemy:crumb-sentinel':{name:'Sugar burst',color:'#d7b48e',accent:'#fff1b5',element:'ember',shot:'wide',target:'hostile',ultimate:false,durations:[650,170,95,220,240],shake:.8,layers:[
  l('crumb-crown','pulse','caster',{start:.03,end:.44,size:.8,offset:[.6,0,0]}),
  l('spice-star','pulse','all-targets',{start:.08,end:.34,size:.9,ground:true,height:.055,opacity:.5}),
  l('bread','fall','all-targets',{start:.34,count:3,size:.6,spread:.8,height:.9}),
  l('crumb-crown','cross','all-targets',{start:.48,size:1.25}),
  l('spice-star','burst','all-targets',{start:.56,count:6,size:.4,spread:1.3,accent:true}),
  l('steam','rise','all-targets',{start:.68,count:2,size:.65,spread:.8,height:.5}),
 ]},
};
