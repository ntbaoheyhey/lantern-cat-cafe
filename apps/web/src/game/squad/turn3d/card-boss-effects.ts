import type {CardEffectRecipe,CardEffectLayer} from './card-effect-data';
const l=(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'],anchor:CardEffectLayer['anchor'],o:Partial<CardEffectLayer>={}):CardEffectLayer=>({primitive,motion,anchor,start:.34,end:.94,count:1,size:.8,spread:.7,height:.18,turns:.25,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.8,...o});
const r=(name:string,color:string,accent:string,element:string,shot:CardEffectRecipe['shot'],layers:CardEffectLayer[]):CardEffectRecipe=>({name,color,accent,element,shot,target:'hostile',layers,ultimate:false,durations:[640,200,100,220,215],shake:.8});
export const BOSS_EFFECTS:Record<string,CardEffectRecipe>={
 'enemy:yarn-giant:basic':r('Weaver sweep','#bd938f','#eec48f','thread','left',[
  l('spool','sweep','caster',{start:.03,end:.43,size:.65,offset:[.7,0,0]}),
  l('yarn-fan','projectile','target',{start:.34,end:.60,size:1.0}),
  l('spindle','cross','target',{start:.49,count:2,size:.7,spread:.65}),
  l('seam','rise','target',{start:.64,count:3,size:.65,spread:.8,accent:true}),
 ]),
 'enemy:yarn-giant':r('Loomfall','#c38b91','#f5cb91','thread','wide',[
  l('spool','orbit','caster',{start:.03,end:.44,count:2,size:.75,spread:1.1}),
  l('seam','pulse','all-targets',{start:.06,end:.34,size:1.15,ground:true,height:.055,opacity:.5}),
  l('yarn-fan','fall','all-targets',{start:.34,size:1.6,height:1.3}),
  l('spool','cross','all-targets',{start:.48,count:2,size:.7,spread:.8}),
  l('knot','burst','all-targets',{start:.57,count:4,size:.5,spread:1.2,accent:true}),
  l('veil','rise','all-targets',{start:.68,size:1.1,height:.4,opacity:.45}),
 ]),
 'enemy:rain-spool:basic':r('Rain sling','#83afce','#cce3ee','tide','right',[
  l('droplet','orbit','caster',{start:.03,end:.43,count:3,size:.35,spread:.55}),
  l('wave','projectile','target',{start:.34,end:.60,size:.85}),
  l('spool','cross','target',{start:.49,size:.8}),
  l('droplet','burst','target',{start:.61,count:4,size:.3,spread:.8,accent:true}),
 ]),
 'enemy:rain-spool':r('Cloudburst','#7ca6cf','#dbecf6','tide','wide',[
  l('spool','pulse','caster',{start:.03,end:.44,size:.85,offset:[-.7,0,0]}),
  l('wave','pulse','all-targets',{start:.06,end:.34,size:1.1,ground:true,height:.055,opacity:.55}),
  l('steam','cross','all-targets',{start:.34,count:3,size:1.0,spread:.95,height:.9}),
  l('droplet','fall','all-targets',{start:.42,count:7,size:.42,spread:1.2,height:1.25,turns:0}),
  l('wave','sweep','all-targets',{start:.54,size:1.6,ground:true,height:.08}),
  l('bubble','burst','all-targets',{start:.66,count:4,size:.35,spread:1.2,accent:true}),
 ]),
 'enemy:pantry-crown:basic':r('Cup tally','#bdac83','#eee4b8','holy','left',[
  l('cup','pulse','caster',{start:.03,end:.43,size:.65,offset:[.7,0,0]}),
  l('cup','projectile','target',{start:.34,end:.61,size:.85,turns:.5}),
  l('serving-bell','cross','target',{start:.50,size:.9}),
  l('spice-star','fall','target',{start:.64,count:4,size:.3,spread:.85,height:.7,accent:true}),
 ]),
 'enemy:pantry-crown':r('Empty banquet','#c8b67f','#f9e6ac','holy','wide',[
  l('crumb-crown','pulse','caster',{start:.03,end:.44,size:.85,offset:[-.7,0,0]}),
  l('tray','pulse','all-targets',{start:.06,end:.34,size:1.15,ground:true,height:.055,opacity:.5}),
  l('apron-cloth','sweep','all-targets',{start:.34,size:1.5,height:.08,ground:true}),
  l('cup','projectile','caster',{start:.45,end:.70,count:3,size:.65,spread:1.0,height:.6}),
  l('serving-bell','cross','all-targets',{start:.53,size:1.2,height:.3}),
  l('crumb-crown','rise','caster',{start:.65,size:1.3,height:.6,accent:true}),
 ]),
};
