import type {CardEffectRecipe,CardEffectLayer} from './card-effect-data';
const l=(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'],anchor:CardEffectLayer['anchor'],o:Partial<CardEffectLayer>={}):CardEffectLayer=>({primitive,motion,anchor,start:.34,end:.94,count:1,size:.8,spread:.7,height:.18,turns:.25,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.8,...o});
const r=(name:string,color:string,accent:string,element:string,shot:CardEffectRecipe['shot'],target:CardEffectRecipe['target'],layers:CardEffectLayer[]):CardEffectRecipe=>({name,color,accent,element,shot,target,layers,ultimate:false,durations:[610,200,85,230,250],shake:target==='friendly'?0:.4});
export const ENEMY_BATCH3_EFFECTS:Record<string,CardEffectRecipe>={
 'enemy:binding-thread:basic':r('Shoulder tug','#b69dce','#e2c7ed','thread','left','hostile',[
  l('spindle','sweep','caster',{start:.04,end:.43,size:.55,offset:[-.6,0,0]}),
  l('wick','projectile','target',{start:.34,end:.60,size:.85,turns:0}),
  l('knot','sweep','target',{start:.49,size:.85,turns:.5}),
  l('seam','fall','target',{start:.63,count:3,size:.5,spread:.6,height:.7,accent:true}),
 ]),
 'enemy:binding-thread':r('Woven snare','#b49ccf','#e9bfda','thread','right','hostile',[
  l('knot','orbit','caster',{start:.03,end:.44,count:2,size:.55,spread:.55}),
  l('spindle','cross','target',{start:.34,count:2,size:.8,spread:.6}),
  l('wick','orbit','target',{start:.46,count:4,size:.7,spread:.8,height:.3}),
  l('knot','pulse','target',{start:.57,size:1.1,ground:true,height:.055,accent:true}),
  l('veil','fall','target',{start:.66,size:.6,height:.6}),
 ]),
 'enemy:practice-cushion:basic':r('Soft hop','#d9b8a2','#f6d9ba','blunt','left','hostile',[
  l('cushion','sweep','caster',{start:.05,end:.43,size:.55,height:.1}),
  l('cushion','cross','target',{start:.34,count:2,size:.65,spread:.5}),
  l('bubble','expand','target',{start:.50,size:1.1,ground:true,height:.055}),
  l('petal','rise','caster',{start:.65,count:3,size:.25,spread:.7,accent:true}),
 ]),
 'enemy:practice-cushion':r('Cushion tumble','#dcb39b','#f4e2bd','blunt','push','hostile',[
  l('cushion','pulse','caster',{start:.04,end:.44,size:.85,height:.1}),
  l('cushion','projectile','target',{start:.34,end:.60,size:1.3,turns:.5}),
  l('blanket','cross','target',{start:.48,size:1.1,height:.2}),
  l('bubble','burst','target',{start:.58,count:6,size:.3,spread:1.1,height:.35,accent:true}),
  l('petal','fall','target',{start:.69,count:3,size:.4,spread:.9,height:.8}),
 ]),
 'enemy:pollen-scout:basic':r('Seedbrush flick','#b3ca75','#f2dc91','garden','right','hostile',[
  l('seed-pod','sweep','caster',{start:.04,end:.43,size:.6,offset:[.6,0,0]}),
  l('seed-pod','projectile','target',{start:.34,end:.61,count:3,size:.45,spread:.6}),
  l('flower-bell','cross','target',{start:.50,count:2,size:.6,spread:.65}),
  l('leaf','rise','target',{start:.64,count:4,size:.28,spread:.9,accent:true}),
 ]),
 'enemy:pollen-scout':r('Thread garden','#9bbb79','#eddc98','garden','rise','friendly',[
  l('seed-pod','pulse','caster',{start:.03,end:.44,size:.8,offset:[-.6,0,0]}),
  l('seed-pod','fall','caster',{start:.34,size:.9,height:.8}),
  l('sprout','rise','caster',{start:.46,count:3,size:.8,spread:1.0}),
  l('spindle','rise','caster',{start:.56,size:1.0,height:.3}),
  l('leaf','orbit','caster',{start:.63,count:5,size:.35,spread:1.1,accent:true}),
 ]),
};
