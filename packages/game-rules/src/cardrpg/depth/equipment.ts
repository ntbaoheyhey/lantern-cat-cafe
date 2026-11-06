import { Rng, deriveSeed } from '../../rng';
import { ITEMS as LEGACY_ITEMS } from '../catalog';
import { CARD_RPG_CONFIG } from '../config';
import { EQUIPMENT_SLOTS, RARITY_ORDER, type Slot, type Stats } from '../contract';
import { computeCardStats } from '../equipment';
import { requireRule, spend } from '../internal';
import { requireHome, transactDepth } from './state';
import type { AffixRule, DepthAccount, GearInstance, GearTemplate } from './contract';

export const SETS = [
  {id:'hearthloom',name:'Hearthloom',two:'Defend adds 25 shield.',four:'Defend links your weakest ally to you.',twoEffect:'defend-shield',fourEffect:'defend-link'},
  {id:'moonwick',name:'Moonwick',two:'Hits on Scented foes add 1 break.',four:'Ultimates refund 20 charge.',twoEffect:'marked-break',fourEffect:'ultimate-refund'},
  {id:'mossbrew',name:'Mossbrew',two:'Healing skills cleanse one debuff.',four:'Applying Steep also grants Cozy.',twoEffect:'healing-cleanse',fourEffect:'steep-cozy'},
  {id:'rainlace',name:'Rainlace',two:'Row swaps grant 25 shield to both cats.',four:'Rear-row cats heal 16 HP each round.',twoEffect:'swap-shield',fourEffect:'rear-heal'},
  {id:'crumbweave',name:'Crumbweave',two:'Every third attack plants a Crumb trail.',four:'A successful detonation restores 1 energy.',twoEffect:'third-crumb',fourEffect:'detonate-energy'},
  {id:'bellsteel',name:'Bellsteel',two:'Saucer riposte deals 8 extra damage.',four:'Defend grants Shelter and one Riposte stack.',twoEffect:'counter-plus',fourEffect:'defend-riposte'},
  {id:'emberfelt',name:'Emberfelt',two:'Scald lasts one extra round.',four:'Your Scald ticks grant you 3 charge.',twoEffect:'long-scald',fourEffect:'scald-charge'},
  {id:'velvetrim',name:'Velvetrim',two:'Your single-foe skills can target the rear.',four:'Begin each encounter with a Yarn decoy.',twoEffect:'pierce-row',fourEffect:'opening-decoy'},
];
export const UNIQUES = [
  {id:'doorstop',name:'The patient doorstop',description:'Defend also heals you for 25 HP.'},
  {id:'nightglass',name:'The nightglass needle',description:'First hit each round on a marked foe restores 1 energy.'},
  {id:'seedcup',name:'The first seedcup',description:'Your first healing skill each battle grants Second sprout.'},
  {id:'rainbell',name:'The rain bell',description:'Row swapping clears your debuffs.'},
  {id:'crumbbook',name:'The crumb ledger',description:'Detonation grants you 35 shield.'},
  {id:'panlid',name:'The returning pan lid',description:'Defend grants two Riposte stacks.'},
  {id:'warmwick',name:'The unfading wick',description:'Applying Scald restores 6 HP to you.'},
  {id:'silkspool',name:'The hidden silk spool',description:'Your first ultimate grants a Yarn decoy.'},
  {id:'starladle',name:'The star ladle',description:'Your first ultimate refunds 25 charge.'},
  {id:'softcollar',name:'The soft collar',description:'Start each battle with Second sprout.'},
  {id:'tidetray',name:'The tide tray',description:'Pour energy also gives the weakest ally 30 shield.'},
  {id:'gardenkey',name:'The garden key',description:'Cleansing a debuff heals its patient for 25 HP.'},
];
const allSlots: Slot[]=[...EQUIPMENT_SLOTS];
const affixSpecs: Array<[string,string,Slot[],number,number,string]> = [
  ['hp','Sturdy seams',allSlots,8,18,'Maximum HP'],['attack','Keen edge',['weapon','relic'],2,5,'Attack'],['defense','Quilted lining',['outfit','charm'],2,4,'Defense'],
  ['critBp','Precise stitch',['weapon','charm'],80,160,'Critical chance in basis points'],['critDamageBp','Sharp finish',['weapon','relic'],150,300,'Critical bonus in basis points'],
  ['effectHitBp','Clear aroma',['weapon','charm'],100,240,'Effect Hit in basis points'],['effectResistBp','Firm handle',['outfit','relic'],100,240,'Effect Resist in basis points'],
  ['healingBp','Gentle steep',['charm','relic'],100,220,'Healing bonus in basis points'],['shieldBp','Warm lining',['outfit','charm'],100,220,'Shield bonus in basis points'],
  ['frontDamage','Doorway edge',['weapon','outfit'],2,5,'Extra raw damage from the front row'],['rearDamage','Back shelf',['weapon','charm'],2,5,'Extra raw damage from the rear row'],
  ['bossDamage','Giant stitch',['weapon','relic'],3,6,'Extra raw damage against bosses'],['eliteDamage','Brass point',['weapon','charm'],3,6,'Extra raw damage against elites'],
  ['scaldDamage','Hot finish',['weapon','relic'],2,5,'Extra raw damage against Scalded foes'],['markedDamage','Scent thread',['weapon','charm'],2,5,'Extra raw damage against Scented foes'],
  ['brokenDamage','Split glaze',['weapon','relic'],3,6,'Extra raw damage against broken foes'],['shieldedDamage','Covered paw',['weapon','outfit'],2,5,'Extra raw damage while shielded'],
  ['lowHpDamage','Last crumb',['weapon','relic'],3,6,'Extra raw damage below half HP'],['healFlat','Full cup',['charm','relic'],3,6,'Extra skill healing'],
  ['shieldFlat','Thick fold',['outfit','charm'],3,6,'Extra skill shielding'],['openingShield','Door cushion',['outfit','relic'],5,10,'Opening shield'],
  ['openingCharge','Late glow',['charm','relic'],2,5,'Opening ultimate charge'],['dotPower','Slow ember',['weapon','charm'],1,3,'Extra Scald damage per stack'],
  ['roundHeal','Mending thread',['outfit','relic'],2,4,'Heal each round'],['cleanseShield','Clear cloth',['charm','relic'],4,8,'Shield after cleansing a debuff'],
  ['ultimateCharge','Cup reserve',['weapon','relic'],2,4,'Charge refunded after an ultimate'],['counterPower','Ringing rim',['weapon','outfit'],2,5,'Extra Riposte damage'],
  ['executeThreshold','Fine recipe',['weapon','charm'],1,2,'Raise execute HP threshold by percentage points'],['statusDuration','Slow steep',['charm','relic'],1,1,'Extend your Steep by rounds, capped at 2'],
  ['breakShield','Soft landing',['outfit','relic'],4,9,'Gain shield after breaking a foe'],
];
export const AFFIXES: AffixRule[]=affixSpecs.map(([stat,name,slots,min,max])=>({id:`affix-${stat}`,name,slots,stat,tiers:[[min,max],[min*2,max*2],[min*3,max*3]],description:affixSpecs.find(row=>row[0]===stat)![5]}));
export const AFFIX_BY_ID=Object.fromEntries(AFFIXES.map(a=>[a.id,a])) as Record<string,AffixRule>;
const pieceNames:Record<Slot,string>={weapon:'Utensil',outfit:'Apron',charm:'Clasp',relic:'Keepsake'};
export const GEAR: GearTemplate[]=SETS.flatMap((set,si)=>RARITY_ORDER.flatMap((rarity,ri)=>EQUIPMENT_SLOTS.map((slot,sl)=>{
  const id=`${set.id}-${slot}-${rarity}`,old=LEGACY_ITEMS.find(i=>i.id===id),legendary=rarity==='legendary';
  const unique=legendary?UNIQUES[(si*4+sl)%UNIQUES.length]!:undefined;
  return {id,name:unique?`${unique.name} · ${set.name} ${pieceNames[slot]}`:old?.name??`${rarity[0]!.toUpperCase()+rarity.slice(1)} ${set.name} ${pieceNames[slot]}`,slot,rarity,setId:set.id,level:1+ri*8+Math.floor(si/3)*4,chapter:si<3?1:si<6?2:3,source:legendary?'Chapter bosses, elites and mastery tailoring':si<3?'Tangled Cafe and chosen tailoring':si<6?'Rooftop Orchard and chosen tailoring':'Midnight Pantry and chosen tailoring',main:old?.main.stat??(['attack','hp','defense','hp'] as const)[sl]!,value:old?.main.value??[12+ri*4,45+ri*12,6+ri*2,25+ri*8][sl]!,affixes:AFFIXES.filter(a=>a.slots.includes(slot)).slice(si%5,si%5+ri).map(a=>a.id),unique:unique?.id,story:unique?unique.description:`${set.name} changes your ${set.two.toLowerCase()} Collect two or four matching pieces.`};
})));
export const GEAR_BY_ID=Object.fromEntries(GEAR.map(g=>[g.id,g])) as Record<string,GearTemplate>;
export function makeGear(state:DepthAccount,id:string,seed:number):GearInstance {
  const template=GEAR_BY_ID[id];requireRule(template,'UNKNOWN_ID','Unknown equipment template.');
  const rng=new Rng(seed),tier=Math.min(3,Math.max(1,Math.floor(template.level/10)+1)) as 1|2|3;
  const rolls=Object.fromEntries(template.affixes.map(id=>{const range=AFFIX_BY_ID[id]!.tiers[tier-1]!;return [id,rng.int(range[0],range[1])];}));
  return {id:`depth-gear-${state.account.nextId++}`,templateId:id,enhancement:0,tier,affixes:[...template.affixes],rolls};
}
export function initializeEquipment(state:DepthAccount) {
  if(state.gear.length)return;
  for(const item of state.account.inventory.items){
    const g=makeGear(state,item.itemId,deriveSeed(state.account.seed,state.gear.length));g.enhancement=item.enhancement;state.gear.push(g);
    for(const card of state.account.cards)for(const [slot,id] of Object.entries(state.account.loadouts[card.id]??{}))if(id===item.id){state.equipment[card.cardId]??={};state.equipment[card.cardId]![slot as Slot]=g.id;}
  }
}
export function equippedItems(state:DepthAccount,cardId:string){return Object.entries(state.equipment[cardId]??{}).filter(([slot]) => !(slot === 'relic' && cardId === state.team[0] && state.relics.includes(state.selectedRelic ?? 0))).map(([,id])=>state.gear.find(g=>g.id===id)).filter((g):g is GearInstance=>!!g);}
export function equipmentEffects(state:DepthAccount,cardId:string) {
  const items=equippedItems(state,cardId),counts:Record<string,number>={},effects:string[]=[],bonuses:Record<string,number>={};
  for(const item of items){const template=GEAR_BY_ID[item.templateId]!;counts[template.setId]=(counts[template.setId]??0)+1;if(template.unique)effects.push('unique:'+template.unique);for(const id of item.affixes){const a=AFFIX_BY_ID[id]!;bonuses[a.stat]=(bonuses[a.stat]??0)+(item.rolls[id]??a.tiers[item.tier-1]![0]);}}
  for(const set of SETS){if((counts[set.id]??0)>=2)effects.push(set.twoEffect);if((counts[set.id]??0)>=4)effects.push(set.fourEffect);}
  return {effects:[...new Set(effects)],bonuses,counts};
}
export function depthStats(state:DepthAccount,cardId:string):Stats {
  const card=state.account.cards.find(c=>c.cardId===cardId);requireRule(card,'UNKNOWN_ID','Cat is not collected.');
  const stats=computeCardStats({...state.account,loadouts:{}},card.id),items=equippedItems(state,cardId),bonus=equipmentEffects(state,cardId).bonuses;
  for(const item of items){const template=GEAR_BY_ID[item.templateId]!;stats[template.main]+=Math.round(template.value*(1+item.enhancement*.06));}
  for(const key of Object.keys(stats) as Array<keyof Stats>)stats[key]=Math.min(CARD_RPG_CONFIG.statCaps[key],stats[key]+(bonus[key]??0));
  const awakening=state.awakened[cardId]??0;stats.hp=Math.round(stats.hp*(1+awakening*.03));stats.attack=Math.round(stats.attack*(1+awakening*.03));
  return stats;
}
export function equipGear(state:DepthAccount,cardId:string,instanceId:string|null,slot?:Slot){
  return transactDepth(state,s=>{
    requireHome(s);requireRule(s.account.cards.some(c=>c.cardId===cardId),'UNKNOWN_ID','Collect this cat first.');s.equipment[cardId]??={};
    if(instanceId===null){requireRule(slot&&EQUIPMENT_SLOTS.includes(slot),'WRONG_SLOT','Choose a valid slot.');delete s.equipment[cardId]![slot];return;}
    const item=s.gear.find(g=>g.id===instanceId);requireRule(item,'UNKNOWN_ID','Equipment is missing.');const template=GEAR_BY_ID[item.templateId]!;
    for(const loadout of Object.values(s.equipment))for(const [slot,id] of Object.entries(loadout))if(id===instanceId)delete loadout[slot as Slot];
    s.equipment[cardId]![template.slot]=instanceId;
  });
}
export function enhancementPreview(item:GearInstance){const g=GEAR_BY_ID[item.templateId]!;return {before:Math.round(g.value*(1+.06*item.enhancement)),after:Math.round(g.value*(1+.06*(item.enhancement+1))),cost:{fish:30*(item.enhancement+1)**2,threads:3*(item.enhancement+1)}};}
export function enhanceGear(state:DepthAccount,id:string){return transactDepth(state,s=>{requireHome(s);const item=s.gear.find(g=>g.id===id);requireRule(item,'UNKNOWN_ID','Equipment is missing.');requireRule(item.enhancement<12,'MAX_LEVEL','Enhancement is capped at +12.');spend(s.account,enhancementPreview(item).cost);item.enhancement++;progressEnhance(s);});}
function progressEnhance(s:DepthAccount){const p=s.account.quests.mender;if(p)p.progress=Math.min(6,p.progress+1);}
export function reforgeGear(state:DepthAccount,id:string,index:number,affixId:string){return transactDepth(state,s=>{requireHome(s);const item=s.gear.find(g=>g.id===id),affix=AFFIX_BY_ID[affixId];requireRule(item&&Number.isInteger(index)&&index>=0&&index<item.affixes.length&&affix,'INVALID_AMOUNT','Choose an existing affix to replace.');requireRule(affix.slots.includes(GEAR_BY_ID[item.templateId]!.slot)&&!item.affixes.includes(affixId),'WRONG_SLOT','Choose a compatible different affix.');spend(s.account,{fish:90,threads:15});delete item.rolls[item.affixes[index]!];item.affixes[index]=affixId;item.rolls[affixId]=affix.tiers[item.tier-1]![0];});}
export function salvageGear(state:DepthAccount,id:string){return transactDepth(state,s=>{requireHome(s);const item=s.gear.find(g=>g.id===id);requireRule(item,'UNKNOWN_ID','Equipment is missing.');requireRule(!Object.values(s.equipment).some(l=>Object.values(l).includes(id)),'EQUIPPED','Unequip before salvaging.');s.gear=s.gear.filter(g=>g.id!==id);s.account.currencies.threads+=CARD_RPG_CONFIG.rarity[GEAR_BY_ID[item.templateId]!.rarity].salvage;});}
export function craftGear(state:DepthAccount,id:string){return transactDepth(state,s=>{requireHome(s);const g=GEAR_BY_ID[id];requireRule(g,'UNKNOWN_ID','Choose a template.');requireRule(s.account.chapter>=g.chapter,'LOCKED','Reach the item source chapter first.');const cost=g.rarity==='legendary'?{fish:500,threads:100,essence:20}:g.rarity==='epic'?{fish:120,threads:180,essence:5}:{fish:180,threads:30};if(g.rarity==='legendary'){requireRule(s.cleared.includes(3)&&s.materials>=20&&s.seals>=1,'LOCKED','Legendary tailoring needs a Pantry clear, 20 materials and one boss seal.');s.materials-=20;s.seals--;}spend(s.account,cost);s.gear.push(makeGear(s,id,deriveSeed(s.account.seed,s.account.nextId)));});}
export function awakenCat(state:DepthAccount,id:string){return transactDepth(state,s=>{requireHome(s);const c=s.account.cards.find(c=>c.cardId===id),rank=s.awakened[id]??0;requireRule(c&&c.level>=10&&c.stars>=2,'LOCKED','Awakening needs level 10 and two stars.');requireRule(rank<3,'MAX_LEVEL','Awakening is capped at three.');const materials=30*(rank+1);requireRule(s.materials>=materials,'INSUFFICIENT_FUNDS',`Need ${materials} mastery materials.`);spend(s.account,{fish:300*(rank+1),threads:40*(rank+1),essence:5*(rank+1)});s.materials-=materials;s.awakened[id]=rank+1;});}
export function dropGear(state:DepthAccount,kind:'battle'|'elite'|'boss',seed:number,chapter:number):string|null {
  const dayKey=`depth-drops-${state.account.day}`,count=state.account.inventory.stacks[dayKey]??0;
  if(count>=6)return null;
  const rng=new Rng(seed),roll=rng.int(0,9999),rarity=kind==='boss'?(roll<1000?'legendary':roll<8000?'epic':'rare'):kind==='elite'?(roll<300?'legendary':roll<3000?'epic':'rare'):(roll<500?'epic':roll<3500?'rare':'common');
  const pool=GEAR.filter(g=>g.chapter<=chapter&&g.rarity===rarity),template=pool[rng.int(0,pool.length-1)]!;
  state.gear.push(makeGear(state,template.id,deriveSeed(seed,7)));state.account.inventory.stacks[dayKey]=count+1;return template.id;
}
