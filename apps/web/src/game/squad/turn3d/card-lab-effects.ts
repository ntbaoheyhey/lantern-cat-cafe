import type { CardEffectLayer, CardEffectRecipe } from './card-effect-data';
const layer = (primitive: CardEffectLayer['primitive'], motion: CardEffectLayer['motion'], options: Partial<CardEffectLayer>): CardEffectLayer => ({primitive,motion,anchor:'target',start:0,end:1,count:1,size:.6,spread:.6,height:.2,turns:.2,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.65,...options});
const recipe = (name:string,color:string,accent:string,element:string,layers:CardEffectLayer[]):CardEffectRecipe => ({name,color,accent,element,layers,shot:'rise',target:'friendly',ultimate:false,durations:[600,200,80,220,200],shake:0});
/** Additive cues share the existing bounded pool; no new materials or geometry. */
export const LAB_EFFECT_RECIPES:Record<string,CardEffectRecipe> = {
 'auto-extra:tea-cloud':recipe('Tea cloud','#9fded1','#fae5aa','tide',[
   layer('steam','rise',{count:3,spread:.6,height:.15,size:.6}),
   layer('shield-facet','orbit',{start:.12,count:3,size:.3,spread:.7,height:.12,accent:true}),
 ]),
 'auto-extra:front-relay':recipe('Front relay','#f0cf83','#c2edb2','garden',[
   layer('seam','rise',{count:2,size:.75,spread:.45,height:.1,aspect:[.3,1,1]}),
   layer('spark','pulse',{start:.15,count:2,size:.25,spread:.45,height:.7,accent:true}),
 ]),
};
