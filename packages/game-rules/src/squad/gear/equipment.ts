import { TURN_CONFIG as C } from '../turn/config';
import type { CardRpgCombatCard, Hero, Preset, TurnActor, TurnSkill } from '../turn/types';
import { GEAR_SLOTS, ITEM_BY_ID, SQUAD_ITEMS, type GearProperty, type GearSet, type GearStat, type Loadout } from './catalog';
export interface GearBonuses { stats:Record<GearStat,number>; properties:GearProperty[]; sets:Partial<Record<GearSet,number>> }
export function gearBonuses(equipment:Loadout,meta?:CardRpgCombatCard):GearBonuses {
  const stats:GearBonuses['stats']={attack:0,defense:0,hp:0,crit:0,healing:0,shield:0,initiative:0,cooldown:0,statusChance:0};
  const properties=new Set<GearProperty>(),sets:GearBonuses['sets']={};
  for(const id of Object.values(equipment)) {
    const i=ITEM_BY_ID[id!];if(!i)continue;
    for(const l of [i.main,...i.affixes])stats[l.stat]+=l.value;
    if(i.property)properties.add(i.property);if(i.set)sets[i.set]=(sets[i.set]??0)+1;
  }
  if((sets.hearthloom??0)>=2){stats.defense+=C.equipment.sets.hearthDefense;stats.shield+=C.equipment.sets.hearthShield}
  if((sets.hearthloom??0)>=3)properties.add('neighborShield');
  if((sets.moonwick??0)>=2){stats.attack+=C.equipment.sets.moonAttack;stats.crit+=C.equipment.sets.moonCrit}
  if((sets.moonwick??0)>=3)properties.add('efficient');
  if((sets.mossbrew??0)>=2){stats.healing+=C.equipment.sets.mossHealing;stats.hp+=C.equipment.sets.mossHp}
  if((sets.mossbrew??0)>=3)properties.add('renew');
  if(meta){stats.healing+=meta.stats.healingBp/10000;stats.shield+=meta.stats.shieldBp/10000;for(const property of meta.properties)properties.add(property);}
  return {stats,sets,properties:[...properties]};
}
export function hasProperty(a:TurnActor,p:GearProperty):boolean{return gearBonuses(a.equipment,a.cardRpg).properties.includes(p)}
export function applyEquipment(a:TurnActor,preset:Preset,fill=false):void {
  if(a.side!=='party')return;
  const base=a.cardRpg?{...a.cardRpg.stats,crit:a.cardRpg.stats.critBp/10000}:C.stats[a.role],squad=C.presets[preset],g=gearBonuses(a.equipment,a.cardRpg),before=a.hp;
  a.maxHp=Math.round(base.hp*squad.hp+g.stats.hp*C.equipment.statScale);a.hp=fill?a.maxHp:Math.min(before,a.maxHp);
  a.attack=Math.round(base.attack*squad.attack+g.stats.attack*C.equipment.statScale);
  a.defense=base.defense+g.stats.defense*C.equipment.statScale;a.crit=Math.min(C.caps.crit,base.crit+g.stats.crit);
  a.initiative=Math.min(C.initiative.maxRank,base.initiative+squad.initiative+g.stats.initiative);
  a.setBonuses=[...(a.cardRpg?.sets??[]),...Object.entries(g.sets).filter(([,n])=>n>=2).map(([set,n])=>`${set}:${Math.min(3,n)}`)];
}
export function effectiveSkill(a:TurnActor,skill:TurnSkill):TurnSkill {
  const g=gearBonuses(a.equipment,a.cardRpg);
  return {...skill,cooldown:skill.cooldown?Math.max(1,skill.cooldown-Math.min(C.equipment.maxCooldownReduction,g.stats.cooldown)):0,
    chargeCost:skill.chargeCost?Math.max(C.equipment.minUltimateCost,skill.chargeCost-(g.properties.includes('efficient')?C.equipment.costReduction:0)):0,
    duration:skill.duration===undefined?undefined:skill.duration+(skill.id==='emberOrb'&&g.properties.includes('longBurn')?C.equipment.extraBurnRounds:0),
    heal:skill.heal===undefined?undefined:skill.heal+(g.properties.includes('renew')?C.equipment.renew:0),
    cleanse:skill.cleanse||(g.properties.includes('cleanseGuard')&&['rally','hearthwall','mossFlask'].includes(skill.id))||((g.sets.mossbrew??0)>=3&&!!skill.heal),
  };
}
export function itemScore(id:string,hero:Hero):number {
  const i=ITEM_BY_ID[id];if(!i||!i.fit.includes(hero))return -Infinity;
  const weights:Record<GearStat,number>={attack:hero==='witch'?3:1.8,defense:hero==='guardian'?3:1.5,hp:.25,crit:100,healing:hero==='alchemist'?180:20,shield:hero==='guardian'?120:60,initiative:8,cooldown:12,statusChance:50};
  return [i.main,...i.affixes].reduce((n,l)=>n+l.value*weights[l.stat],i.property?12:0);
}
export function initialLoadout(hero:Hero,mode:'off'|'starter'|'high'):Loadout {
  if(mode==='off')return {};
  const prefix={guardian:'g',witch:'w',alchemist:'a'}[hero];
  const ids=mode==='high'?{guardian:['g-sun','g-coat','c-bell','r-cup'],witch:['w-orbit','w-cloak','c-button','r-wick'],alchemist:['a-garden','a-coat','c-leaf','r-snow']}[hero]
    :{guardian:['g-pan','g-apron','c-button'],witch:['w-needle','w-shawl'],alchemist:['a-kettle','a-vest']}[hero];
  if(!prefix)return {};
  return Object.fromEntries(ids.map(id=>[ITEM_BY_ID[id]!.slot,id]));
}
export const startingInventory=()=>SQUAD_ITEMS.filter(i=>['Common','Uncommon'].includes(i.rarity)||['w-needle','a-kettle'].includes(i.id)).map(i=>i.id);
export function bestLoadouts(owned:readonly string[]):Record<Hero,Loadout> {
  const used=new Set<string>(),out:Record<Hero,Loadout>={guardian:{},witch:{},alchemist:{}};
  for(const hero of ['alchemist','guardian','witch'] as const)for(const slot of GEAR_SLOTS){
    const best=owned.filter(id=>!used.has(id)&&ITEM_BY_ID[id]?.slot===slot&&ITEM_BY_ID[id]!.fit.includes(hero))
      .sort((a,b)=>itemScore(b,hero)-itemScore(a,hero)||a.localeCompare(b))[0];
    if(best){out[hero][slot]=best;used.add(best)}
  }
  return out;
}
