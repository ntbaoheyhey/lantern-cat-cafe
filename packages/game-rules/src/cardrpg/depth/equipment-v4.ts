import { gameplayA6 } from './gameplay-a6';
import { powerScoreA6 } from './power-a6';
import { computeCardStats } from '../equipment';
import { EQUIPMENT_SLOTS, RARITY_ORDER, type Stats } from '../contract';
import { clone } from '../internal';
import { crewStats } from './gameplay-v4';
import { SETS, GEAR_BY_ID, depthStats, equipmentEffects } from './equipment';
import type { DepthAccount, GearInstance } from './contract';
import { ECONOMY_C2 } from './economy-c2';

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
export function setTextV4<T extends {id:string;two:string;four:string}>(set:T,enabled:boolean,c2=false):T{
 const text=enabled?{...set,...SET_TEXT_V4[set.id]}:set;
 if(c2&&enabled&&set.id==='hearthloom')return {...text,four:`Defend links a weak ally; ${ECONOMY_C2.sets.hearthloomShareBp/100}% of HP damage is shared.`};
 if(c2&&enabled&&set.id==='bellsteel'){
  const triggers=([['Riposte',ECONOMY_C2.sets.bellsteelRipostesPerBattle],['Shelter',ECONOMY_C2.sets.bellsteelSheltersPerBattle]] as const)
   .filter(([,count])=>count>0).map(([name,count])=>`${name} ${count}×`).join(', ');
  return {...text,four:`Defend: ${triggers} per battle.`};
 }
 return text;
}
export function uniqueTextV4(id:string,c2=false):string{
 if(c2&&id==='softcollar')return `Start with ${ECONOMY_C2.uniques.softcollarShield} shield.`;
 if(c2&&id==='rainbell')return `Swapping clears ${ECONOMY_C2.uniques.rainbellCleanseStacks} debuff stack.`;
 return UNIQUE_TEXT_V4[id]??id;
}
export function gearStoryV4(id:string,c2=false):string{const t=GEAR_BY_ID[id]!;return t.unique?uniqueTextV4(t.unique,c2):SET_TEXT_V4[t.setId]!.two;}
export const rawPowerV4=(s:Pick<Stats,'hp'|'attack'|'defense'>)=>s.hp/5+2*s.attack+1.5*s.defense;
export function nakedStatsV4(state:DepthAccount,cardId:string):Stats{
 const card=state.account.cards.find(c=>c.cardId===cardId)!;
 const stats=computeCardStats({...state.account,loadouts:{}},card.id),awakening=state.awakened[cardId]??0;
 // Early A6 levels should change a rematch; the existing 1.2% curve barely moved team Power.
 if(gameplayA6(state))for(const key of ['hp','attack','defense'] as const)
  stats[key]=Math.round(stats[key]*(1+Math.min(9,card.level-1)*.04));
 stats.hp=Math.round(stats.hp*(1+awakening*.03));stats.attack=Math.round(stats.attack*(1+awakening*.03));return stats;
}
/** One shared common base across sets; full +12 main remains under 8% naked core. */
export function gearMainV4(state:DepthAccount,cardId:string,item:GearInstance):number{
 const t=GEAR_BY_ID[item.templateId]!,core=rawPowerV4(nakedStatsV4(state,cardId));
 const weight=t.main==='attack'?2:t.main==='defense'?(state.formationC2?ECONOMY_C2.equipment.defenseWeight:1.5):(state.formationC2?ECONOMY_C2.equipment.hpWeight:.2);
 const budget=state.formationC2?ECONOMY_C2.equipment:{commonPower:.026,maximumPower:.08,minimumMain:4};
 const common=Math.max(budget.minimumMain,Math.ceil(core*budget.commonPower/weight));
 return Math.floor(Math.min(core*budget.maximumPower/weight,common*RARITY_MULTIPLIERS_V4[t.rarity]*(1+.06*item.enhancement)));
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
 if(gameplayA6(state)){const total=powerScoreA6(stats);return {core:Math.round(rawPowerV4(stats)*10),utility:total-Math.round(rawPowerV4(stats)*10),total,reference:POWER_REFERENCE_V4};}
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
 const transfer=Object.entries(state.equipment).find(([id,slots])=>id!==cardId&&Object.values(slots).includes(instanceId))?.[0]??null;
 const t=GEAR_BY_ID[item.templateId]!,next=clone(state);
 for(const loadout of Object.values(next.equipment))for(const slot of EQUIPMENT_SLOTS)if(loadout[slot]===instanceId)delete loadout[slot];
 next.equipment[cardId]??={};next.equipment[cardId]![t.slot]=instanceId;
 const before=equipmentEffects(state,cardId),after=equipmentEffects(next,cardId);
 const donorAfter=transfer?equipmentEffects(next,transfer).effects:[];
 const without=clone(next);delete without.equipment[cardId]![t.slot];
 return {before:powerV4(state,cardId),after:powerV4(next,cardId),teamBefore:teamPowerV4(state),teamAfter:teamPowerV4(next),
  share:Math.max(0,teamPowerV4(next)-teamPowerV4(without))/teamPowerV4(next),
  gained:after.effects.filter(e=>!before.effects.includes(e)),lost:before.effects.filter(e=>!after.effects.includes(e)),
  transfer,transferLost:transfer?equipmentEffects(state,transfer).effects.filter(e=>!donorAfter.includes(e)):[]};
}
export function gearCostV4(id:string,state?:DepthAccount){const g=GEAR_BY_ID[id]!;return state?.formationC2?ECONOMY_C2.tailoring[g.rarity]:g.rarity==='legendary'?{fish:500,threads:100,essence:20}:g.rarity==='epic'?{fish:120,threads:180,essence:5}:{fish:180,threads:30};}
export function legendaryTailoringRequirements(state:DepthAccount){return state.formationC2?{materials:ECONOMY_C2.legendary.materials,seals:ECONOMY_C2.legendary.seals}:{materials:20,seals:1};}
export function rarityMeaningV4(rarity:string){return ['One main stat; readily replaceable.','One affix refines a role.','Two affixes; plan a targeted source.','Three affixes and one bounded unique behavior.'][RARITY_ORDER.indexOf(rarity as typeof RARITY_ORDER[number])]??'Cosmetic edition; no combat power.';}
export function itemUtilityV4(state:DepthAccount,cardId:string,item:GearInstance){
 // A6 previews change only this loadout; avoid copying retained battle logs per item.
 const copy=gameplayA6(state)?{...state,equipment:{...state.equipment,[cardId]:{}}}:clone(state);
 copy.equipment[cardId]={};const bare=powerV4(copy,cardId).total;
 copy.equipment[cardId]={[GEAR_BY_ID[item.templateId]!.slot]:item.id};
 return powerV4(copy,cardId).total-bare;
}

export function effectTextV4(effect:string,c2=false):string {
 if(effect.startsWith('unique:'))return uniqueTextV4(effect.slice(7),c2);
 const set=SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect);return set?`${set.name}: ${setTextV4(set,true,c2)[set.twoEffect===effect?'two':'four']}`:effect;
}
