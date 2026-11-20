import type { Actor, Battle, Skill } from '../contract';
import { CORE_STATUS_RULES_V5 } from './statuses';
import { shapeV5, type EffectV5, type ShapeV5, type SkillV5 } from './shapes';

export const COMBO_ROLES_V5: Record<string,string> = {
  mochi:'Protects primers',soot:'Primes and triggers Crumb Burst',clover:'Answers enemy Burn and Bleed',
  panko:'Primes Shred for Rupture',mallow:'Primes Burn; triggers Wildfire',sorrel:'Bitter answers healers',
  biscuit:'Primes Bleed; triggers Rupture',inkcap:'Daze stops boss signatures',cinnamon:'Sustains Burn crews',
  brioche:'Shred triggers Rupture from the front row',velvet:'Mark and Bleed prime Spread',marigold:'Primes Burn and Crumb Burst',
};
export const CREWS_V5 = [
  {id:'oven',name:'Oven',cats:['mallow','cinnamon','mochi'],reaction:'wildfire'},
  {id:'thread',name:'Thread',cats:['velvet','biscuit','brioche'],reaction:'rupture'},
  {id:'night-lamp',name:'Night lamp',cats:['soot','marigold','inkcap'],reaction:'crumb-burst'},
  {id:'afternoon-tea',name:'Afternoon tea',cats:['clover','sorrel','panko'],reaction:null},
] as const;
type Patch = {shape?:ShapeV5;cooldown?:number;effects?:EffectV5[]};
const patches:Record<string,Patch> = {
  'mochi-1':{cooldown:1,shape:'splash'},
  'mochi-2':{shape:'weakest'},
  'mochi-4':{shape:'team',effects:[{kind:'cleanse',cleanseCount:1},{kind:'shield',power:130},{kind:'rally',status:'cozy',stacks:2}]},
  'soot-1':{cooldown:1,shape:'pierce'},
  'soot-4':{shape:'all',effects:[{kind:'hit',power:125},{kind:'detonate',power:125},{kind:'rally',status:'drowsy'}]},
  'clover-1':{effects:[{kind:'hit',power:80},{kind:'heal',power:18,recipient:'weakest'}]},
  'clover-2':{shape:'ally-row'},
  'panko-1':{cooldown:1,effects:[{kind:'hit',power:85},{kind:'rally',status:'riposte',self:true},{kind:'rally',status:'brittle'}]},
  'mallow-1':{shape:'splash',effects:[{kind:'hit',power:100},{kind:'rally',status:'scald',recipient:'main'}]},
  'mallow-2':{shape:'row',effects:[{kind:'hit',power:100},{kind:'rally',status:'scald'}]},
  'mallow-3':{effects:[{kind:'hit',power:120,burnScaling:.3}]},
  'mallow-4':{shape:'all',effects:[{kind:'hit',power:130},{kind:'rally',status:'scald',stacks:3}]},
  'sorrel-1':{effects:[{kind:'hit',power:70},{kind:'rally',status:'bitter'}]},
  'sorrel-2':{shape:'pierce',effects:[{kind:'hit',power:50},{kind:'rally',status:'drowsy'}]},
  'sorrel-3':{effects:[{kind:'transfer'},{kind:'shield',power:45},{kind:'rally',status:'glaze'}]},
  'sorrel-4':{shape:'team',effects:[{kind:'heal',power:50},{kind:'rally',status:'glaze'}]},
  'biscuit-1':{shape:'multi-hit',effects:[{kind:'hit',power:95},{kind:'rally',status:'snag'}]},
  'biscuit-2':{effects:[{kind:'swap'},{kind:'shield',power:55},{kind:'rally',status:'cozy'}]},
  'biscuit-3':{shape:'pierce'},
  'biscuit-4':{shape:'bounce',effects:[{kind:'hit',power:130},{kind:'rally',status:'brittle'}]},
  'inkcap-1':{cooldown:1,shape:'pierce',effects:[{kind:'hit',power:70},{kind:'rally',status:'brittle'}]},
  'inkcap-2':{shape:'pierce',effects:[{kind:'hit',power:45},{kind:'rally',status:'drowsy'}]},
  'inkcap-4':{shape:'all',effects:[{kind:'hit',power:65},{kind:'rally',status:'drowsy'},{kind:'rally',status:'brittle',stacks:2}]},
  'cinnamon-1':{effects:[{kind:'hit',power:75},{kind:'drain',power:40},{kind:'rally',status:'scald'}]},
  'cinnamon-2':{shape:'ally-splash',cooldown:1,effects:[{kind:'heal',power:80},{kind:'rally',status:'cozy',recipient:'main'}]},
  'brioche-3':{effects:[{kind:'dispel'},{kind:'rally',status:'brittle'},{kind:'hit',power:110}]},
  'velvet-1':{cooldown:1,shape:'pierce',effects:[{kind:'hit',power:95},{kind:'rally',status:'scent'},{kind:'rally',status:'snag',stacks:2}]},
  'velvet-2':{shape:'bounce',effects:[{kind:'hit',power:65}]},
  'velvet-3':{effects:[{kind:'dispel'},{kind:'hit',power:90}]},
};
export const SHAPE_LABELS_V5:Record<ShapeV5,string>={single:'Single',pierce:'Pierce',row:'Row · 60% each',splash:'Splash · 100/40%',bounce:'Bounce · 100/70/50%',all:'All · 60% each','multi-hit':'Three hits · 40% each',one:'One ally',weakest:'Weakest ally','ally-row':'Ally row','ally-splash':'Weakest ally + adjacent allies · 100/40% healing',team:'Team',self:'Self',fallen:'Fallen ally'};
function describeEffect(e:EffectV5):string {
  const status=e.status ? CORE_STATUS_RULES_V5.find(s=>s.id===e.status)?.name ?? ({crumb:'Crumb',riposte:'Riposte',link:'Link',sprout:'Second sprout',decoy:'Decoy',glaze:'Glaze',shelter:'Shelter'} as Record<string,string>)[e.status] ?? e.status : '';
  const recipient=e.self?' on self':e.recipient==='weakest'?' on the weakest ally':e.recipient==='team'?' on the team':e.recipient==='main'?' on the main target':'';
  const power=e.power??0;
  const action=({hit:`${power}% attack${e.burnScaling?'; +30% per Burn stack':''}`,execute:`${power}% attack; doubles against a weakened foe`,shield:`${power} shield`,heal:`Heal ${power}`,cleanse:e.cleanseCount?'Remove one debuff':'Cleanse debuffs',dispel:'Dispel buffs',detonate:'Trigger Crumb Burst',transfer:'Transfer your shield',revive:`Revive at ${power}% HP`,drain:`Drain ${power}% attack as healing`,swap:'Swap rows',energy:'Shield the weakest ally',rally:'',chain:'Bounce through three foes',consume:'Consume Warm for damage',break:'Apply Daze'} as const)[e.kind];
  return [action,status?`${e.stacks??1} ${status}`:''].filter(Boolean).join('; ')+recipient;
}
export function describeSkillV5(skill:SkillV5):string {return skill.id==='cinnamon-4'?'Revive a fallen ally at 40% HP once per battle. Otherwise heal the team 35 and grant 1 Warm each.':`${SHAPE_LABELS_V5[shapeV5(skill)]}. ${skill.effects.map(describeEffect).filter(Boolean).join('. ')}.`;}
export function situationalSkillV5(b:Battle,actor:Actor,skill:Skill):SkillV5 {
  if(skill.id==='cinnamon-4'&&(actor.passiveUsed||!b.actors.some(a=>a.side===actor.side&&a.hp===0)))return {...skill,target:'allies',shape:'team',effects:[{kind:'heal',power:35},{kind:'rally',status:'cozy'}]};
  return skill;
}
const cache=new Map<Skill,SkillV5>();
export function kitSkillV5(original:Skill):SkillV5 {
  const prior=cache.get(original);if(prior)return prior;
  const patch=patches[original.id]??{};
  const skill:SkillV5={...original,...patch,shape:patch.shape??shapeV5(original),effects:(patch.effects??original.effects).map(e=>({...e}))};
  // Target rules continue to enforce front-row reach; shape changes only the affected group.
  if(skill.shape==='pierce')skill.target='pierce';
  if(skill.shape==='weakest'||skill.shape==='ally-row'||skill.shape==='ally-splash')skill.target='ally';
  skill.description=describeSkillV5(skill);cache.set(original,skill);return skill;
}
export function crewHintsV5(cats:string[]):string[] {
  return CREWS_V5.filter(c=>c.cats.filter(id=>cats.includes(id)).length>=2).map(c=>`${c.name}: ${c.reaction ? ({wildfire:'Burn primes Wildfire',rupture:'Bleed + Shred primes Rupture','crumb-burst':'Crumb primes Crumb Burst'} as const)[c.reaction] : 'Bitter and sustained care answer healers'}.`);
}
