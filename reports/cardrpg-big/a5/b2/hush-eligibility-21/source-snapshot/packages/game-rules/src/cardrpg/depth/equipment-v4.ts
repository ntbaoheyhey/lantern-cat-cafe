import { computeCardStats } from '../equipment';
import { EQUIPMENT_SLOTS, RARITY_ORDER, type Stats } from '../contract';
import { clone } from '../internal';
import { crewStats } from './gameplay-v4';
import { SETS, GEAR_BY_ID, depthStats, equipmentEffects } from './equipment';
import type { DepthAccount, GearInstance } from './contract';

export const GEAR_CAP_V4 = 240;
export const RARITY_MULTIPLIERS_V4 = { common:1, rare:1.25, epic:1.5, legendary:1.75 };
export const SET_TEXT_V4: Record<string, {two:string;four:string}> = {
 hearthloom:{two:'Defend adds 12 shield.',four:'Defend links a weak ally; 15% of HP damage is shared.'},
 moonwick:{two:'Direct hits on marked foes add 3 raw damage.',four:'Your first marked hit each round restores 6 missing HP.'},
 mossbrew:{two:'Healing cleanses one debuff once per own turn.',four:'Your first Steep application each encounter adds one Cozy.'},
 rainlace:{two:'Row swaps grant both cats 12 shield.',four:'Rear cats restore 6 missing HP per round.'},
 crumbweave:{two:'Every third attack plants one Crumb.',four:'Detonation grants 8 shield once per own turn.'},
 bellsteel:{two:'Riposte deals 3 extra damage.',four:'Defend grants one Riposte and Shelter.'},
 emberfelt:{two:'Scald lasts one extra round, capped at four.',four:'Your first Scald application each round restores 6 HP.'},
 velvetrim:{two:'Single-foe skills can reach the rear.',four:'Start with 12 shield; Support focus prioritizes enemy utility.'},
};
export const UNIQUE_TEXT_V4: Record<string,string> = {
 doorstop:'Defend restores 8 missing HP.',nightglass:'First marked hit each round grants 6 shield.',
 seedcup:'First healing recipient gains 12 shield.',rainbell:'Swapping clears one of your debuffs.',
 crumbbook:'Detonation grants 10 shield once per turn.',panlid:'Defend grants one Riposte stack.',
 warmwick:'First Scald application each round restores 4 HP.',silkspool:'First ultimate grants 12 shield.',
 starladle:'First ultimate restores 12 missing HP.',softcollar:'Start with 15 shield.',
 tidetray:'Shield-bearing skills prefer a weak ally.',gardenkey:'First successful cleanse each turn restores 8 HP.',
};
export const AFFIX_TEXT_V4:Record<string,string>={openingCharge:'Opening shield',ultimateCharge:'Missing HP restored after an ultimate',brokenDamage:'Extra raw damage to marked foes',breakShield:'Shield after the first marked hit each round'};
export function setTextV4<T extends {id:string;two:string;four:string}>(set:T,enabled:boolean):T{return enabled?{...set,...SET_TEXT_V4[set.id]}:set;}
export function gearStoryV4(id:string):string{const t=GEAR_BY_ID[id]!;return t.unique?UNIQUE_TEXT_V4[t.unique]!:SET_TEXT_V4[t.setId]!.two;}
export const rawPowerV4=(s:Pick<Stats,'hp'|'attack'|'defense'>)=>s.hp/5+2*s.attack+1.5*s.defense;
export function nakedStatsV4(state:DepthAccount,cardId:string):Stats{
 const card=state.account.cards.find(c=>c.cardId===cardId)!;
 const stats=computeCardStats({...state.account,loadouts:{}},card.id),awakening=state.awakened[cardId]??0;
 stats.hp=Math.round(stats.hp*(1+awakening*.03));stats.attack=Math.round(stats.attack*(1+awakening*.03));return stats;
}
/** One shared common base across sets; full +12 main remains under 8% naked core. */
export function gearMainV4(state:DepthAccount,cardId:string,item:GearInstance):number{
 const t=GEAR_BY_ID[item.templateId]!,core=rawPowerV4(nakedStatsV4(state,cardId));
 const weight=t.main==='attack'?2:t.main==='defense'?1.5:.2;
 const common=Math.max(4,Math.ceil(core*.026/weight));
 return Math.floor(Math.min(core*.08/weight,common*RARITY_MULTIPLIERS_V4[t.rarity]*(1+.06*item.enhancement)));
}
/** Explicit three-round reference estimates. Not a win probability or calibrated promise. */
export const POWER_REFERENCE_V4={rounds:3,shieldValue:.2,healValue:.2,conditionalDamage:.36,counterDamage:.3,statusDuration:2,reach:5,criticalPerBp:.004,effectPerBp:.003};
const EFFECT_VALUE:Record<string,number>={
 'defend-shield':12/5,'defend-link':6,'marked-break':9/5,'ultimate-refund':18/5,
 'healing-cleanse':5,'steep-cozy':4,'swap-shield':24/5,'rear-heal':18/5,
 'third-crumb':4,'detonate-energy':8/5,'counter-plus':9/5,'defend-riposte':6,
 'long-scald':4,'scald-charge':18/5,'pierce-row':5,'opening-decoy':12/5,
 'unique:doorstop':8/5,'unique:nightglass':18/5,'unique:seedcup':12/5,
 'unique:rainbell':3,'unique:crumbbook':10/5,'unique:panlid':3,
 'unique:warmwick':12/5,'unique:silkspool':12/5,'unique:starladle':12/5,
 'unique:softcollar':15/5,'unique:tidetray':2,'unique:gardenkey':8/5,
};
export function powerV4(state:DepthAccount,cardId:string){
 const stats=crewStats(depthStats(state,cardId),state.team),{bonuses,effects}=equipmentEffects(state,cardId);
 let utility=effects.reduce((n,id)=>n+(EFFECT_VALUE[id]??0),0);
 for(const [key,value] of Object.entries(bonuses)){
  if(['openingShield','openingCharge','cleanseShield','breakShield','shieldFlat','healFlat','ultimateCharge'].includes(key))utility+=value/5;
  else if(key==='roundHeal')utility+=value*3/5;
  else if(key.endsWith('Damage')||key==='dotPower')utility+=value*.36;
  else if(key==='counterPower')utility+=value*.3;
  else if(key==='statusDuration')utility+=value*2;
 }
 utility+=stats.critBp*.004+stats.critDamageBp*stats.critBp/10000*.001+(stats.effectHitBp+stats.effectResistBp)*.003+(stats.healingBp+stats.shieldBp)*.002;
 return {core:rawPowerV4(stats),utility,total:rawPowerV4(stats)+utility,reference:POWER_REFERENCE_V4};
}
export function teamPowerV4(state:DepthAccount){return state.team.reduce((sum,id)=>sum+powerV4(state,id).total,0);}
export function comparisonV4(state:DepthAccount,cardId:string,instanceId:string){
 const item=state.gear.find(g=>g.id===instanceId);if(!item)return null;
 const t=GEAR_BY_ID[item.templateId]!,next=clone(state);
 for(const loadout of Object.values(next.equipment))for(const slot of EQUIPMENT_SLOTS)if(loadout[slot]===instanceId)delete loadout[slot];
 next.equipment[cardId]??={};next.equipment[cardId]![t.slot]=instanceId;
 const before=equipmentEffects(state,cardId),after=equipmentEffects(next,cardId);
 const without=clone(next);delete without.equipment[cardId]![t.slot];
 return {before:powerV4(state,cardId),after:powerV4(next,cardId),teamBefore:teamPowerV4(state),teamAfter:teamPowerV4(next),
  share:Math.max(0,teamPowerV4(next)-teamPowerV4(without))/teamPowerV4(next),
  gained:after.effects.filter(e=>!before.effects.includes(e)),lost:before.effects.filter(e=>!after.effects.includes(e)),
  transfer:Object.entries(state.equipment).find(([id,slots])=>id!==cardId&&Object.values(slots).includes(instanceId))?.[0]??null};
}
export function gearCostV4(id:string){const g=GEAR_BY_ID[id]!;return g.rarity==='legendary'?{fish:500,threads:100,essence:20}:g.rarity==='epic'?{fish:120,threads:180,essence:5}:{fish:180,threads:30};}
export function rarityMeaningV4(rarity:string){return ['One main stat; readily replaceable.','One affix refines a role.','Two affixes; plan a targeted source.','Three affixes and one bounded unique behavior.'][RARITY_ORDER.indexOf(rarity as typeof RARITY_ORDER[number])]??'Cosmetic edition; no combat power.';}
export function itemUtilityV4(state:DepthAccount,cardId:string,item:GearInstance){
 const copy=clone(state);copy.equipment[cardId]={};const bare=powerV4(copy,cardId).total;
 copy.equipment[cardId]={[GEAR_BY_ID[item.templateId]!.slot]:item.id};
 return powerV4(copy,cardId).total-bare;
}

export function effectTextV4(effect:string):string {
 if(effect.startsWith('unique:'))return UNIQUE_TEXT_V4[effect.slice(7)]??effect;
 const set=SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect);return set?`${set.name}: ${SET_TEXT_V4[set.id]![set.twoEffect===effect?'two':'four']}`:effect;
}
