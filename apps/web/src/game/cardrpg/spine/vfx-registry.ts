import { CARD_EFFECT_RECIPES, type CardEffectLayer } from '../../squad/turn3d/card-effect-data';
import { STATUS_IDENTITIES } from '../../squad/turn3d/card-status-data';
import { SPINE_SKILLS, SPINE_UNITS, type SpineSocket } from './config';
import { PAINT } from './style';
import type { EffectPlan } from '../../squad/turn3d/effects';
import { chargeEvent } from '../depth/card-action-plan';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
export type Glyph='spark'|'leaf'|'flame'|'drop'|'ring'|'arc'|'shield'|'lantern'|'door'|'cup'|'thread'|'star'|'crown'|'petal'|'moon'|'bell'|'wave'|'sprout'|'slice'|'spore'|'bread'|'wing'|'button'|'teapot'|'heart'|'ink'|'wind'|'apron'|'needle'|'bow'|'oven'|'whisk'|'bobbin';
export const GLYPHS:Glyph[]=['spark','leaf','flame','drop','ring','arc','shield','lantern','door','cup','thread','star','crown','petal','moon','bell','wave','sprout','slice','spore','bread','wing','button','teapot','heart','ink','wind','apron','needle','bow','oven','whisk','bobbin'];
export const FX_COLORS=[PAINT.honey,PAINT.ember,PAINT.rose,PAINT.sage,PAINT.sky,PAINT.iris,PAINT.cream];
const ownerColors:Record<string,string>={mochi:PAINT.honey,soot:PAINT.iris,clover:PAINT.sage,panko:PAINT.honey,mallow:PAINT.ember,sorrel:PAINT.sky,biscuit:PAINT.rose,inkcap:PAINT.iris,cinnamon:PAINT.ember,brioche:PAINT.honey,velvet:PAINT.rose,marigold:PAINT.sage};
const ownerGlyph:Record<string,Glyph>={mochi:'lantern',soot:'moon',clover:'leaf',panko:'bread',mallow:'flame',sorrel:'teapot',biscuit:'needle',inkcap:'spore',cinnamon:'cup',brioche:'shield',velvet:'thread',marigold:'petal'};
const ultimateGlyph:Record<string,Glyph>={mochi:'door',soot:'lantern',clover:'door',panko:'oven',mallow:'oven',sorrel:'teapot',biscuit:'crown',inkcap:'spore',cinnamon:'bell',brioche:'star',velvet:'wind',marigold:'bell'};
const aliases:Record<string,Glyph>={door:'door','knock-ring':'ring',handle:'ring',lantern:'lantern','light-pool':'ring',apron:'apron',bow:'bow',roof:'door',window:'door',ember:'flame',spark:'spark',cup:'cup',steam:'wind','ink-drop':'ink','ink-stain':'ink',wick:'flame',flame:'flame',tray:'ring',star:'star',comet:'arc',leaf:'leaf',stem:'sprout',droplet:'drop',wave:'wave',wreath:'ring',greenhouse:'door',sprout:'sprout',button:'button',seam:'thread',sock:'apron',spool:'thread',needle:'needle',wing:'wing',knot:'thread','yarn-fan':'thread',cushion:'bread','shield-facet':'shield',petal:'petal',crescent:'moon',bubble:'ring',bread:'bread',oven:'oven',pan:'ring',spoon:'needle',teapot:'teapot',whisk:'whisk','spice-star':'star','crumb-crown':'crown','seed-pod':'sprout',constellation:'star',spindle:'needle','paper-cat':'heart','apron-cloth':'apron',blanket:'apron',collar:'bow','flower-bell':'bell',veil:'wind','night-bell':'bell','serving-bell':'bell','watering-can':'teapot','ink-cap':'spore',shears:'slice','painted-light':'spark','soft-particle':'spark','motif-particle':'star'};
export const glyphFor=(primitive:string,owner=''):Glyph=>aliases[primitive]??ownerGlyph[owner]??'spark';
export interface PaintedLayer {glyph:Glyph;motion:CardEffectLayer['motion'];anchor:CardEffectLayer['anchor'];phase:'windup'|'contact';socket:SpineSocket;count:number;size:number;spread:number;opacity:number;accent:boolean;ground:boolean;turns:number;delay:number;life:number;recipients?:'heal'|'shield';core?:boolean}
export interface PaintedRecipe {id:string;name:string;owner:string;color:string;ultimate:boolean;friendly:boolean;origin:SpineSocket;layers:PaintedLayer[];overrideKey:string;preparation?:PaintedRecipe}
export const PAINTED_VFX=new Map<string,PaintedRecipe>();
for(const unit of SPINE_UNITS)for(const skill of unit.skills){
 // The current Kettle signature is a strike, not the legacy Mirror polish buff.
 // Reuse its painted spout/steam vocabulary with the longer skill contact life.
 const old=CARD_EFFECT_RECIPES[skill.id==='enemy:kettle-knight'?'enemy:kettle-knight:basic':skill.id],basic=skill.animation==='attack',ultimate=skill.animation==='ult';
 const layers:PaintedLayer[]=(old?.layers??[]).map(layer=>{
  // A caster anchor says where the paint belongs, not when it appears. Late
  // self-shields and return accents belong to contact, just like target effects.
  const phase=layer.anchor==='caster'&&layer.start<PAINT.windupStartLimit?'windup':'contact';
  return{glyph:glyphFor(layer.primitive,unit.id),motion:layer.motion,anchor:layer.anchor,phase,socket:layer.ground?'feet':phase==='windup'?'mainHand':'vfxOrigin',count:Math.min(12,layer.count),size:Math.min(1.5,Math.max(.13,layer.size))*.67,spread:Math.min(1.2,layer.spread)*.55,opacity:Math.min(.88,layer.opacity),accent:layer.accent,ground:layer.ground,turns:layer.turns,delay:Math.max(0,layer.start-.5)*.38,life:ultimate?.60:basic?.28:.44};
 });
 if(!layers.length)layers.push({glyph:ownerGlyph[unit.id]??'arc',motion:'burst',anchor:'target',phase:'contact',socket:'vfxOrigin',count:basic?3:7,size:basic?.4:.7,spread:.4,opacity:.85,accent:false,ground:false,turns:.2,delay:0,life:.45});
 if(ultimate){
  // Give the ultimate one readable cafe silhouette. Keep the same socket and
  // outcome routing; its surrounding small paint remains secondary.
  const core=layers.find(layer=>layer.phase==='contact'&&!layer.ground&&layer.glyph===ultimateGlyph[unit.id]);
  if(core){core.core=true;core.size=Math.min(PAINT.ultimatePaint.maxCore,Math.max(PAINT.ultimatePaint.minCore,core.size*PAINT.ultimatePaint.coreScale));core.count=1;core.spread=0;core.opacity=PAINT.ultimatePaint.opacity;core.life=PAINT.ultimatePaint.life;if(core.glyph==='door'||core.glyph==='oven')core.motion='hold';}
  for(const layer of layers)if(layer.phase==='contact'&&layer.ground)layer.size*=PAINT.ultimatePaint.groundScale;
 }
 if(unit.side==='party'&&old?.target==='hostile'){
  // Clover now heals the weakest ally; Cinnamon's drain heals the caster.
  // Keep their authored recovery shapes, but attach them to the actual event.
  for(const layer of layers)if(layer.phase==='contact'&&layer.anchor==='caster'&&
   (skill.id==='clover-1'&&layer.glyph==='sprout'||skill.id==='cinnamon-1'&&layer.glyph==='drop')){
   layer.anchor='target';layer.recipients='heal';layer.motion='rise';layer.socket='feet';
  }
  const support:PaintedLayer={glyph:'shield',motion:'pulse',anchor:'target',phase:'contact',socket:'vfxOrigin',count:1,size:.52,spread:0,opacity:.8,accent:false,ground:false,turns:0,delay:0,life:.44,recipients:'shield'};
  layers.push(support);
  if(!layers.some(layer=>layer.recipients==='heal'))layers.push({...support,glyph:'heart',motion:'rise',count:2,size:.24,spread:.2,delay:.06,recipients:'heal'});
 }
 PAINTED_VFX.set(skill.id,{id:skill.id,name:skill.name,owner:unit.id,color:ownerColors[unit.id]??(unit.tier==='boss'?PAINT.rose:PAINT.honey),ultimate,friendly:old?.target==='friendly',origin:'mainHand',layers,overrideKey:skill.id.replaceAll(':','-')});
}
// Both identities can prepare when rage and the two-turn charge cycle differ.
// Cache this variant once; a designer strike override must not play on preparation.
for(const id of ['enemy:spool-ram:basic','enemy:spool-ram']){
 const recipe=PAINTED_VFX.get(id)!;
 const thread:PaintedLayer={glyph:'thread',motion:'orbit',anchor:'caster',phase:'windup',socket:'mainHand',count:2,size:.36,spread:.44,opacity:.8,accent:true,ground:false,turns:.6,delay:0,life:.65};
 recipe.preparation={...recipe,name:'Charging a row strike',friendly:true,color:PAINT.iris,overrideKey:'',layers:[{...thread,glyph:'bobbin',motion:'pulse',count:1,size:.45,accent:false},
  {...thread,glyph:'bobbin',motion:'pulse',phase:'contact',socket:'vfxOrigin',count:1,size:.62,accent:false},
  {...thread,phase:'contact',socket:'vfxOrigin',count:4},
  {...thread,glyph:'ring',motion:'shrink',phase:'contact',socket:'feet',count:1,size:1.1,spread:0,ground:true,accent:true,opacity:.55,life:.65}]};
}
export const PAINTED_STATUSES=Object.entries(STATUS_IDENTITIES).map(([id,spec])=>({id,name:spec.name,path:spec.path,color:['scald','cozy','riposte','shelter','crumb'].includes(id)?PAINT.honey:['snag','scent'].includes(id)?PAINT.rose:['steep','sprout'].includes(id)?PAINT.sage:['bitter','drowsy','hush','rattled'].includes(id)?PAINT.iris:PAINT.sky}));
export const paintedRecipe=(id:string,plan?:EffectPlan)=>{const recipe=PAINTED_VFX.get(id);return plan&&chargeEvent(plan)?recipe?.preparation??recipe:recipe;};
export type PaintedRecipients='hostile'|'friendly'|'damage'|'heal'|'shield';
/** Resolve outcome and side independently: a debuff is visible without pretending to damage. */
export function paintedTargets(plan:EffectPlan,kind:PaintedRecipients,actors:readonly Pick<TurnActor,'id'|'side'>[],targets:string[]):void {
 targets.length=0;
 const side=actors.find(actor=>actor.id===plan.actorId)?.side;
 if(!side)return;
 for(const event of plan.events){
  if(event.actorId!==plan.actorId)continue;
  const matches=kind==='hostile'?['damage','status_apply','status_expire','fizzle'].includes(event.type)
   :kind==='friendly'?['heal','shield','status_apply','status_expire'].includes(event.type):event.type===kind;
  if(!matches)continue;
  for(const id of event.targetIds){const target=actors.find(actor=>actor.id===id);if(!target)continue;
   const friendly=kind==='friendly'||kind==='heal'||kind==='shield';
   if((target.side===side)===friendly&&!targets.includes(id))targets.push(id);
  }
 }
}
export const paintedCoverage=()=>({skills:PAINTED_VFX.size,statuses:PAINTED_STATUSES.length,missing:[...SPINE_SKILLS.keys()].filter(id=>!PAINTED_VFX.has(id))});
