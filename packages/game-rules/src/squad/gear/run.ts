import { TURN_CONFIG as C, HEROES } from '../turn/config';
import type { Hero, TurnBattle, TurnChoice, TurnOptions } from '../turn/types';
import { GEAR_SLOTS, ITEM_BY_ID, SQUAD_ITEMS, type GearSlot, type Loadout } from './catalog';
import { applyEquipment, bestLoadouts, initialLoadout, startingInventory, itemScore, gearBonuses } from './equipment';
export type GearMode='off'|'starter'|'high';
export type ConsumableId='healTonic'|'shieldBiscuit'|'quickenYarn'|'cleanseTea'|'ultimateTreat';
export type RunCommand={kind:'begin'}|{kind:'equip';hero:Hero;slot:GearSlot;itemId:string|null}|{kind:'loot';itemId:string}|{kind:'continue'}|{kind:'action';choice:TurnChoice};
export interface SquadRun {
  stage:'loadout'|'battle'|'loot'|'rest'|'complete';interactive:boolean;gearMode:GearMode;
  inventory:string[];loot:string[];itemsFound:string[];consumables:Record<ConsumableId,number>;
  commands:RunCommand[];nextWave:number|null;
}
export function createSquadRun(options:TurnOptions):SquadRun {
  const mode=options.gearMode??'off';
  return {stage:options.interactive?'loadout':'battle',interactive:!!options.interactive,gearMode:mode,
    inventory:mode==='off'?[]:mode==='high'?SQUAD_ITEMS.map(i=>i.id):startingInventory(),loot:[],itemsFound:[],
    consumables:{...C.consumables.counts},commands:[],nextWave:null};
}
export function outfitParty(b:TurnBattle):void {
  for(const a of b.actors.filter(a=>a.side==='party')){a.equipment=initialLoadout(a.role as Hero,b.run.gearMode);applyEquipment(a,b.preset,true)}
}
export function canEquip(b:TurnBattle,hero:Hero,slot:GearSlot,itemId:string|null):boolean {
  if(!['loadout','rest'].includes(b.run.stage)||b.result||!GEAR_SLOTS.includes(slot))return false;
  const a=b.actors.find(a=>a.id===hero);if(!a||a.hp<=0)return false;
  if(itemId===null)return true;
  const i=ITEM_BY_ID[itemId];
  return !!i&&i.slot===slot&&i.fit.includes(hero)&&b.run.inventory.includes(itemId)&&
    !b.actors.some(other=>other.id!==hero&&Object.values(other.equipment).includes(itemId));
}
export function changeEquipment(b:TurnBattle,hero:Hero,slot:GearSlot,itemId:string|null):boolean {
  if(!canEquip(b,hero,slot,itemId))return false;
  const a=b.actors.find(a=>a.id===hero)!;
  if(itemId===null)delete a.equipment[slot];else a.equipment[slot]=itemId;
  applyEquipment(a,b.preset,b.turn===0);b.run.commands.push({kind:'equip',hero,slot,itemId});return true;
}
export function equipBest(b:TurnBattle):boolean {
  if(!['loadout','rest'].includes(b.run.stage)||b.result)return false;
  const best=bestLoadouts(b.run.inventory);
  for(const hero of HEROES)for(const slot of GEAR_SLOTS)changeEquipment(b,hero,slot,null);
  for(const hero of HEROES)for(const slot of GEAR_SLOTS)if(best[hero][slot])changeEquipment(b,hero,slot,best[hero][slot]!);
  return true;
}
export function resetEquipment(b:TurnBattle):boolean {
  if(!['loadout','rest'].includes(b.run.stage)||b.result)return false;
  for(const hero of HEROES)for(const slot of GEAR_SLOTS)changeEquipment(b,hero,slot,null);
  for(const hero of HEROES){const loadout=initialLoadout(hero,b.run.gearMode);for(const slot of GEAR_SLOTS)if(loadout[slot])changeEquipment(b,hero,slot,loadout[slot]!)}
  return true;
}
/** Independent seeded draft stream, so inspecting loot cannot change damage rolls. */
export function offerLoot(b:TurnBattle):string[] {
  let seed=(b.seed^Math.imul(b.wave+1,0x9e3779b9))>>>0;
  const roll=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
  const pool=SQUAD_ITEMS.filter(i=>!b.run.inventory.includes(i.id)&&['Rare','Epic','Legendary'].includes(i.rarity));
  const ranked=pool.map(i=>({id:i.id,key:roll()})).sort((a,z)=>a.key-z.key||a.id.localeCompare(z.id));
  // High-gear review can already own everything: choices remain distinct, duplicate ownership is harmless.
  return (ranked.length>=3?ranked:SQUAD_ITEMS.map(i=>({id:i.id,key:roll()})).sort((a,z)=>a.key-z.key)).slice(0,3).map(i=>i.id);
}
export function takeLoot(b:TurnBattle,itemId:string):boolean {
  if(b.run.stage!=='loot'||!b.run.loot.includes(itemId)||b.result)return false;
  if(!b.run.inventory.includes(itemId))b.run.inventory.push(itemId);
  b.run.itemsFound.push(itemId);b.run.commands.push({kind:'loot',itemId});b.run.loot=[];b.run.stage='rest';return true;
}
export function runSummary(b:TurnBattle) {
  const cats=b.actors.filter(a=>a.side==='party').map(a=>({id:a.id,name:a.name,...b.totals[a.id]!}));
  const mvp=[...cats].sort((a,z)=>(z.damage+z.healing+z.shielding)-(a.damage+a.healing+a.shielding)||a.id.localeCompare(z.id))[0];
  return {rounds:b.round,actions:b.turn,itemsFound:[...b.run.itemsFound],mvp:mvp?.name??'—',cats};
}
export function loadouts(b:TurnBattle):Record<Hero,Loadout>{return Object.fromEntries(b.actors.filter(a=>a.side==='party').map(a=>[a.role,{...a.equipment}])) as Record<Hero,Loadout>}

/** Headless active-player proxy: inspect current inventory, stats and completed sets only. */
export function choosePolicyLoot(b:TurnBattle,policy:'auto'|'active'):string|undefined {
 if(b.run.stage!=='loot')return undefined;
 if(policy==='auto')return b.run.loot[0];
 const score=(id:string)=>{const builds=bestLoadouts([...b.run.inventory,id]);return HEROES.reduce((sum,hero)=>sum+C.policy.lootRole[hero]*(Object.values(builds[hero]).reduce((n,i)=>n+itemScore(i!,hero),0)+Object.values(gearBonuses(builds[hero]).sets).reduce((n,count)=>n+(count>=3?C.policy.lootThree:count>=2?C.policy.lootTwo:0),0)),0)};
 return [...b.run.loot].sort((a,z)=>score(z)-score(a)||a.localeCompare(z))[0];
}
