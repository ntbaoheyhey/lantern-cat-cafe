import type {CardEffectRecipe,CardEffectLayer} from './card-effect-data';
const l=(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'],anchor:CardEffectLayer['anchor'],o:Partial<CardEffectLayer>={}):CardEffectLayer=>({primitive,motion,anchor,start:.32,end:.94,count:1,size:.8,spread:.7,height:.18,turns:.25,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.8,...o});
const r=(name:string,color:string,accent:string,element:string,shot:CardEffectRecipe['shot'],target:CardEffectRecipe['target'],layers:CardEffectLayer[]):CardEffectRecipe=>({name,color,accent,element,shot,target,layers,ultimate:false,durations:[600,200,85,240,250],shake:target==='friendly'?0:.5});
export const ENEMY_BATCH1_EFFECTS:Record<string,CardEffectRecipe>={
 'enemy:button-guard:basic':r('Button tap','#d4ab77','#fff0bc','blunt','left','hostile',[
  l('button','sweep','caster',{start:.04,end:.42,size:.5,offset:[.55,0,0]}),
  l('button','projectile','target',{start:.34,end:.60,size:.75,turns:.7}),
  l('collar','cross','target',{start:.49,count:2,size:.6,spread:.55}),
  l('seam','fall','target',{start:.62,count:3,size:.26,spread:.6,height:.5,accent:true}),
 ]),
 'enemy:button-guard':r('Button barricade','#d8bc8a','#f7e6af','hearth','push','friendly',[
  l('collar','pulse','caster',{start:.04,end:.44,size:.75,offset:[.65,0,0]}),
  l('button','cross','all-targets',{start:.34,count:3,size:.7,spread:.9,height:.1}),
  l('shield-facet','rise','all-targets',{start:.46,count:2,size:1.1,spread:.8,height:.15}),
  l('seam','orbit','all-targets',{start:.62,count:4,size:.32,spread:.95,height:.12,accent:true}),
 ]),
 'enemy:sock-skipper:basic':r('Heel scuff','#d8a1ad','#f8dcc4','slash','right','hostile',[
  l('sock','sweep','caster',{start:.05,end:.44,size:.6,height:.05}),
  l('sock','cross','target',{start:.34,count:2,size:.85,spread:.55,height:.08}),
  l('comet','sweep','target',{start:.49,size:.8,ground:true,height:.06}),
  l('bow','rise','caster',{start:.62,count:2,size:.45,spread:.6,accent:true}),
 ]),
 'enemy:sock-skipper':r('Pocket skip','#df9fba','#ffe4ad','slash','right','hostile',[
  l('sock','pulse','caster',{start:.04,end:.43,size:.7,offset:[-.6,0,0]}),
  l('bow','projectile','target',{start:.34,end:.62,count:2,size:.7,spread:.6}),
  l('button','orbit','target',{start:.48,count:3,size:.5,spread:.75,height:.25}),
  l('sock','projectile','caster',{start:.59,end:.83,size:1.0}),
  l('crescent','cross','target',{start:.66,count:2,size:.8,spread:.8,ground:true,height:.055,accent:true}),
 ]),
 'enemy:spool-ram:basic':r('Bobbin nudge','#b6a3cf','#e4d1fa','blunt','left','hostile',[
  l('spool','orbit','caster',{start:.05,end:.43,size:.55,spread:.5,height:.1}),
  l('spool','sweep','target',{start:.34,size:.95,height:.08,turns:.75}),
  l('knot','cross','target',{start:.51,count:2,size:.5,spread:.65}),
  l('wick','burst','target',{start:.63,count:3,size:.3,spread:.8,accent:true}),
 ]),
 'enemy:spool-ram':r('Spring-loaded sweep','#b9a2d0','#f4cf92','blunt','push','hostile',[
  l('spool','pulse','caster',{start:.03,end:.44,size:.8,offset:[.65,0,0]}),
  l('seam','cross','caster',{start:.15,end:.45,count:3,size:.8,spread:.7,height:.1}),
  l('spool','projectile','all-targets',{start:.34,end:.61,size:1.2}),
  l('yarn-fan','sweep','all-targets',{start:.46,size:1.5,height:.1,turns:.6}),
  l('knock-ring','expand','all-targets',{start:.59,size:1.2,ground:true,height:.055,accent:true}),
  l('knot','fall','all-targets',{start:.67,count:3,size:.35,spread:1.0,height:.7}),
 ]),
};
