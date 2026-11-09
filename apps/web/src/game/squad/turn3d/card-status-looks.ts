import type { CardEffectLayer } from './card-effect-data';
import type { StatusId } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import { STATUS_IDENTITIES } from './card-status-data';

function mark(primitive:CardEffectLayer['primitive'],motion:CardEffectLayer['motion'], options:Partial<CardEffectLayer>={}):CardEffectLayer {
  return {primitive,motion,anchor:'target',start:0,end:1,count:1,size:.36,spread:.46,height:0,turns:.35,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.74,...options};
}
const layers:Record<StatusId,CardEffectLayer>={
  scald:mark('flame','orbit',{size:.29,spread:.47}),
  scent:mark('cup','orbit',{size:.42}),
  brittle:mark('seam','cross',{count:2,size:.52,spread:.30,turns:0}),
  tangle:mark('knot','orbit',{count:2,size:.30,spread:.46}),
  drowsy:mark('steam','orbit',{count:3,size:.31,spread:.48}),
  hush:mark('steam','orbit',{count:3,size:.26,spread:.48}),
  rattled:mark('star','orbit',{count:3,size:.25,spread:.48}),
  steep:mark('leaf','fall',{count:2,size:.35,height:.70,spread:.44}),
  cozy:mark('shield-facet','hold',{size:1.05,opacity:.66}),
  crumb:mark('button','orbit',{count:3,size:.18,spread:.43}),
  riposte:mark('tray','orbit',{size:.42,spread:.49}),
  link:mark('bow','hold',{size:.43,offset:[.45,0,0]}),
  sprout:mark('sprout','hold',{size:.48,offset:[-.45,0,0]}),
  decoy:mark('knot','hold',{size:.50,offset:[.48,0,0]}),
  glaze:mark('droplet','orbit',{size:.36,spread:.50}),
  shelter:mark('roof','hold',{size:.58}),
};
export const CARD_STATUS_LOOKS = Object.fromEntries(Object.entries(layers).map(([id,layer])=>[id,{
  color:STATUS_IDENTITIES[id as StatusId].color,layer,
  crown:['scent','drowsy','hush','rattled','shelter'].includes(id),
  apply:{...layer,motion:'projectile' as const,count:1,size:.36,height:.50,opacity:.80},
  tick:{...layer,motion:'expand' as const,count:1,size:.65,opacity:.80},
  expire:{...layer,motion:'fall' as const,count:1,size:.30,height:.28,opacity:.65},
}])) as Record<StatusId,{color:string;layer:CardEffectLayer;crown:boolean;apply:CardEffectLayer;tick:CardEffectLayer;expire:CardEffectLayer}>;
export const CRUMB_BURST_LAYER=mark('button','burst',{count:9,size:.25,spread:1.0,height:.4,opacity:.80});
