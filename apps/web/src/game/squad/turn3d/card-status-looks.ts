import type { CardEffectLayer } from './card-effect-data';
import type { VisualStatusId } from './card-status-data';
import { STATUS_IDENTITIES } from './card-status-data';

function mark(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'], options:Partial<CardEffectLayer>={}):CardEffectLayer {
  return {primitive,motion,anchor:'target',start:0,end:1,count:1,size:.36,spread:.46,height:0,turns:.35,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.74,...options};
}
const layers:Record<VisualStatusId,CardEffectLayer>={
  scald:mark('flame','hold',{size:.30,spread:0,opacity:.80}),
  snag:mark('seam','hold',{count:3,size:.40,spread:.20,opacity:.78}),
  bitter:mark('steam','orbit',{count:3,size:.34,spread:.58,height:.06,opacity:.76}),
  scent:mark('cup','orbit',{size:.40,spread:.10,turns:.16}),
  brittle:mark('seam','cross',{count:2,size:.52,spread:.30,turns:0}),
  tangle:mark('knot','orbit',{count:2,size:.30,spread:.46}),
  drowsy:mark('steam','orbit',{count:3,size:.25,spread:.35}),
  hush:mark('steam','orbit',{count:3,size:.23,spread:.35}),
  rattled:mark('star','orbit',{count:3,size:.25,spread:.48}),
  steep:mark('leaf','fall',{count:2,size:.35,height:.70,spread:.44}),
  cozy:mark('bubble','hold',{size:1.35,opacity:.76}),
  crumb:mark('button','orbit',{count:3,size:.18,spread:.43}),
  riposte:mark('tray','orbit',{size:.42,spread:.49}),
  link:mark('bow','hold',{size:.43,offset:[.45,0,0]}),
  sprout:mark('sprout','hold',{size:.48,offset:[-.45,0,0]}),
  decoy:mark('knot','hold',{size:.50,offset:[.48,0,0]}),
  glaze:mark('bubble','hold',{size:1.40,opacity:.76}),
  shelter:mark('roof','hold',{size:.45}),
};
export const CARD_STATUS_LOOKS = Object.fromEntries(Object.entries(layers).map(([id,layer])=>[id,{
  color:STATUS_IDENTITIES[id as VisualStatusId].color,layer,
  crown:['scent','drowsy','hush','rattled','shelter'].includes(id),
  apply:{...layer,primitive:id==='snag'?'seam':id==='bitter'?'droplet':layer.primitive,motion:'projectile' as const,count:1,size:.36,height:.50,opacity:.80},
  flight:{...layer,motion:'projectile' as const,count:1,size:.34,height:.95,spread:.25,turns:.65,opacity:.80},
  tick:{...layer,primitive:id==='snag'?'droplet':layer.primitive,motion:id==='snag'?'fall' as const:'expand' as const,count:id==='snag'?3:1,size:id==='snag'?.22:.65,height:id==='snag'?.6:layer.height,opacity:.80},
  expire:{...layer,motion:'fall' as const,count:1,size:.30,height:.28,opacity:.65},
}])) as Record<VisualStatusId,{color:string;layer:CardEffectLayer;crown:boolean;apply:CardEffectLayer;flight:CardEffectLayer;tick:CardEffectLayer;expire:CardEffectLayer}>;
export const CRUMB_BURST_LAYER=mark('button','burst',{count:9,size:.25,spread:1.0,height:.4,opacity:.80});

// Reuse the prepared B2 primitive pools, with no new textures or lights.
export const V5_CUE_LAYERS = {
  fire:mark('flame','projectile',{size:.48,height:.08,spread:.50,opacity:.78}),
  ember:mark('spark','projectile',{size:.16,height:.30,spread:.48,opacity:.75}),
  tension:mark('seam','hold',{size:.58,aspect:[1.8,.5,1],height:.2,spread:.18,opacity:.80}),
  consumed:mark('droplet','burst',{count:4,size:.19,height:.28,spread:.95,opacity:.80}),
  thread:mark('seam','burst',{count:2,size:.55,spread:.62,opacity:.78}),
  drops:mark('droplet','fall',{count:4,size:.20,height:.65,spread:.48,opacity:.78}),
  arc:mark('spark','projectile',{size:.28,height:.35,opacity:.78}),
  strike:mark('seam','cross',{count:2,size:.55,spread:.32,opacity:.78}),
  splash:mark('knock-ring','expand',{size:1.25,ground:true,height:.08,opacity:.76}),
};
