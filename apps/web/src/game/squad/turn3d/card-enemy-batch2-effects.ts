import type {CardEffectRecipe,CardEffectLayer} from './card-effect-data';
const l=(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'],anchor:CardEffectLayer['anchor'],o:Partial<CardEffectLayer>={}):CardEffectLayer=>({primitive,motion,anchor,start:.34,end:.94,count:1,size:.8,spread:.7,height:.18,turns:.25,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.8,...o});
const r=(name:string,color:string,accent:string,element:string,shot:CardEffectRecipe['shot'],target:CardEffectRecipe['target'],layers:CardEffectLayer[]):CardEffectRecipe=>({name,color,accent,element,shot,target,layers,ultimate:false,durations:[610,200,85,230,250],shake:target==='friendly'?0:.45});
export const ENEMY_BATCH2_EFFECTS:Record<string,CardEffectRecipe>={
 'enemy:needle-moth:basic':r('Running stitch','#83bbd6','#e6e4fb','pierce','left','hostile',[
  l('needle','sweep','caster',{start:.04,end:.43,size:.65,offset:[-.6,0,0]}),
  l('needle','projectile','target',{start:.34,end:.62,size:1.1,turns:0}),
  l('seam','cross','target',{start:.52,count:2,size:.9,spread:.6}),
  l('wing','fall','target',{start:.65,count:2,size:.35,spread:.8,height:.5,accent:true}),
 ]),
 'enemy:needle-moth':r('Needle canopy','#75bad2','#dbeafc','pierce','rise','hostile',[
  l('wing','cross','caster',{start:.03,end:.44,count:2,size:.65,spread:.65}),
  l('needle','fall','all-targets',{start:.34,count:7,size:.7,spread:1.3,height:1.1,turns:-.5}),
  l('seam','expand','all-targets',{start:.50,size:1.3,ground:true,height:.055}),
  l('droplet','rise','all-targets',{start:.63,count:4,size:.3,spread:.8,height:.5,accent:true}),
 ]),
 'enemy:teacup-healer:basic':r('Saucer flick','#91c8b8','#f1e1a8','blunt','right','hostile',[
  l('tray','orbit','caster',{start:.05,end:.43,size:.5,spread:.45}),
  l('tray','projectile','target',{start:.34,end:.59,size:.85,turns:.9}),
  l('steam','cross','target',{start:.50,count:2,size:.65,spread:.55}),
  l('bubble','fall','target',{start:.64,count:4,size:.2,spread:.8,height:.5,accent:true}),
 ]),
 'enemy:teacup-healer':r('Careful refill','#9dd3ba','#ffedb5','tide','rise','friendly',[
  l('cup','pulse','caster',{start:.03,end:.44,size:.65,offset:[.65,0,0]}),
  l('wave','projectile','target',{start:.34,end:.61,size:.9,height:.5}),
  l('cup','rise','target',{start:.47,size:.9,height:.3}),
  l('steam','orbit','target',{start:.55,count:3,size:.55,spread:.8,height:.4,accent:true}),
  l('leaf','fall','target',{start:.67,count:3,size:.3,spread:.85,height:.8}),
 ]),
 'enemy:kettle-knight:basic':r('Spout jab','#a7b7c8','#f0cc8c','blunt','push','hostile',[
  l('teapot','pulse','caster',{start:.04,end:.43,size:.55,offset:[.6,0,0]}),
  l('teapot','projectile','target',{start:.34,end:.60,size:.85}),
  l('steam','burst','target',{start:.51,count:3,size:.5,spread:.85}),
  l('handle','fall','target',{start:.64,count:2,size:.4,spread:.7,height:.55,accent:true}),
 ]),
 'enemy:kettle-knight':r('Mirror polish','#b1c7dc','#ffe6a1','hearth','left','friendly',[
  l('handle','sweep','caster',{start:.04,end:.43,size:.75,offset:[-.6,0,0]}),
  l('teapot','rise','caster',{start:.34,size:1.2,height:.2}),
  l('shield-facet','cross','caster',{start:.46,count:3,size:.7,spread:1.0,height:.25}),
  l('star','orbit','caster',{start:.58,count:4,size:.3,spread:.95,accent:true}),
  l('light-pool','expand','caster',{start:.68,size:1.2,ground:true,height:.05}),
 ]),
};
